var tar = require('tar-fs')
var path = require('path')

var _ = require('lodash')
var fs = require("fs-extra")
var tmp = require('tmp')
var async = require('async')
var tar = require('tar-fs')
var shell = require('shelljs')
var Docker = require('dockerode')
var format = require('string-format')
format.extend(String.prototype)

var config = require('../config/main.js')
var dependencies = require('./dependencies.js')
var BuildStatus = require('./status.js')

/**
 * The primary object responsible for Binder building
 * @constructor
 */
function Builder(opts) {
  this.opts = opts || {}
  _.merge(this.opts, config)
  this.docker = this.opts.docker
  console.log('this.opts: ' + JSON.stringify(this.opts))
}

/**
 * Find/validate all possible dependency files in the directory.
 *
 * @callback _findDependencies
 * @param {string} dir - directory containing dependencies
 * @param {function} next - callback to call with validated deps
 */
Builder.prototype._findDependencies = function (phase, dir, next) {
  // get all files with matching DepHandlers
  phase.progress("finding dependency files")

  fs.readdir(dir, function (err, files) {
    if (err) {
      phase.error(err)
      return next(err)
    }

    var depNames = _.intersection(_.keys(dependencies), files)

    // extract file contents and continue
    phase.progress("extracting dependency contents")
    var extractFile = function (fileName, cb) {
      var nameAndContents = function (err, data) {
        if (err) return cb(err)
        return cb(null, [fileName, { 
          precedence: dependencies[fileName].precedence,
          contents: data
        }])
      }
      fs.readFile(path.join(dir, fileName), 'utf8', nameAndContents)
    }
    async.map(depNames, extractFile, function (err, results) {
      if (err) {
        phase.error(err)
        return next(err)
      }
      next(null, dir, _.fromPairs(results))
    })
  })
}

/**
 * Select which dependency will be used based on the order of precedence assigned to each 
 * dependency.
 *
 * @callback _selectDependency
 * @param {string} dir - directory containing contents
 * @param {object} contents - mapping from dep name to { precedence, contents } object
 * @param {function} next - callback to call with selected dependency name
 */
Builder.prototype._selectDependency = function (phase, dir, contents, next) {
  phase.progress('selecting dependency based on precedence')
  var selected = null
  _.forEach(contents, function (dep, name) {
    if (!selected || dep.precedence < selected.precedence) {
      selected = [name, dep.contents]
    }
  })
  return next(null, dir, selected)
}

/**
 * Constructs a Dockerfile out of dependencies and a directory
 * containing contents.
 *
 * @callback _makeDockerfile
 * @param {string} dir - directory containing contents
 * @param {object} dep - the parsed dependency file [name, contents]
 * @param {function} next - callback to call with Dockerfile name
 */
Builder.prototype._makeDockerfile = function (phase, dir, dep, next) {
  var name = dep[0]
  var contents = dep[1]
  var dep = dependencies[name]

  var _constructDockerfile = function (depString) {
    phase.progress('constructing dockerfile from dependency strings')

    var prefix = '' +
    'FROM {0}\n\n'.format(config.baseImage) +
    'RUN mkdir /home/main/notebooks\n' +
    'RUN chown main:main /home/main/notebooks\n' +
    'WORKDIR /home/main/notebooks\n'

    var suffix = '' +
    'USER root\n' +
    'ADD * /home/main/notebooks/\n' +
    'RUN chown -R main:main $HOME/notebooks\n' +
    'USER main\n\n' +
    'RUN find $HOME/notebooks -name \'*.ipynb\' -exec ipython trust {} \\;\n\n' +
    'WORKDIR $HOME/notebooks\n'

    return [prefix, depString, suffix].join('\n')
  }

  var _getContext = function (cb) {
    var context = dep.context
    phase.progress('getting dependency-specific build context')
    if (context) {
      fs.readdir(context, function (err, files) {
        if (err) {
          return cb(err)
        }
        cb(null, _.map(files, function (file) {
          return context + '/' + file
        }))
      })
    } else {
      cb(null, [])
    }
  }

  var _generateDockerfile = function (dep, cb) {
    phase.progress('generating dependency strings for dependency: {0}'.format(name))
    dep.generateString(name, contents, function (err, depString) {
      if (err) return cb(err)
      return cb(null, _constructDockerfile(depString))
    })
  }
  
  if (dep) {
    _generateDockerfile(dep, function (err, dockerfile) { 
      if (err) return next(err)
      _getContext(function (err, context) {
        if (err) return next(err)
        return next(null, dir, dockerfile, _.flatten(context))
      })
    })
  } else {
    return next(null, dir, _constructDockerfile('\n'), [])
  }
}

/**
 * Builds a Docker image and optionally sends it to a registry
 * @callback _buildDockerfile
 * @param {string} dir - Directory containing the Dockerfile
 * @param {string} contents - Dockerfile contents
 * @param {function} next - Callback to call after Docker build/push
 */
Builder.prototype._buildDockerfile = function (phase, dir, contents, context, next) {
  var self = this

  // make temporary directory
  var makeTempDir = function (innerNext) {
    phase.progress("creating temporary directory")
    tmp.dir({unsafeCleanup: false}, function (err, tmpDir, dCleanup) {
      if (err) {
        return innerNext(err)
      }
      innerNext(null, tmpDir, dCleanup)
    })
  }

  // copy repository
  var copyRepo = function (tmpDir, dCleanup, innerNext) {
    phase.progress({msg: "copying repo", dir: tmpDir})
    fs.copy(dir, tmpDir, function (err) {
      if (err) {
        return innerNext(err)
      }
      innerNext(null, tmpDir, dCleanup)
    })
  }

  // copy handler context (if it exists) into build directory
  var copyContext = function (tmpDir, dCleanup, innerNext) {
    phase.progress("copying dependency context into build directory")
    async.each(context, function (fPath, cb) {
      phase.progress("copying context file: {0} to {1}".format(fPath, path.join(tmpDir, fPath)))
      fs.copy(fPath, path.join(tmpDir, path.basename(fPath)), function (err) {
        if (err) {
          return cb(err)
        }
        cb()
      })
    },
    function (err) {
      if (err) {
        return innerNext(err)
      }
      innerNext(null, tmpDir, dCleanup)
    })
  }

  // write dockerfile
  var writeDockerfile = function (tmpDir, dCleanup, innerNext) {
    phase.progress({msg: "writing dockerfile", file: contents})
    fs.writeFile(path.join(tmpDir, "Dockerfile"), contents, function (err) {
      if (err) {
        return innerNext(err)
      }
      phase.progress("build context: {0}".format(fs.readdirSync(tmpDir)))
      innerNext(null, tmpDir, dCleanup)
    })
  }
  
  // make temporary file for tarball and pack contents
  var makeTempFile = function (tmpDir, dCleanup, innerNext) {
    phase.progress("making temporary file for tarball")
    var fileOpts = {mode: 0644, prefix: 'binder-', postfix: '.tar'}
    tmp.file(fileOpts, function (err, fPath, fd, fCleanup) {
      if (err) {
        return innerNext(err)
      }
      var msg = {msg: "packing build context into tarball", file: fPath}
      phase.progress(msg)
      tar.pack(tmpDir)
         .pipe(fs.createWriteStream(fPath))
         .on('finish', function () {
            innerNext(null, fPath, fCleanup, dCleanup)
         })
    })
  }

  // call Docker build
  var dockerBuild = function (ctxPath, fCleanup, dCleanup, innerNext) {
    var docker = new Docker()

    var params = (self.docker.registry === '') ? [self.docker.username] : [self.docker.registry]
    params.push(self.opts.imageName) 
    var name = params.join('/')

    var buildOpts = name ? {t: name} : {}
    console.log('buildOpts: ' + JSON.stringify(buildOpts))
    phase.progress("calling docker build")
    docker.buildImage(ctxPath, buildOpts, function (err, response) {
      if (err) {
        return innerNext(err)
      }
      response.on('end', function () {
        phase.progress("docker build finished")
        innerNext(null, name, fCleanup, dCleanup)
      })
      response.pipe(process.stdout)
    })
  }

  // optionally push image
  var pushImage = function (imageName, fCleanup, dCleanup, innerNext) {
    if (self.docker.enabled) {
      phase.progress("pushing image to registry")
      var registry = self.docker.registry
      if (_.startsWith(self.docker.registry, 'gcr.io')) {
        shell.exec('gcloud docker push {0}'.format(imageName), function (err) {
          if (err) return innerNext(err)
          return innerNext(null, fCleanup, dCleanup)
        })
      } else {
        var docker = new Docker()
        var img = docker.getImage(imageName)
        var authconfig = {
          user: self.docker.user,
          password: self.docker.password,
          email: self.docker.email,
          server: registry
        }
        img.push({authconfig: registry}, function(err, stream) {
          if (err) {
            return innerNext(err)
          }
          stream.on('end', function () {
            phase.progress("image uploaded to registry")
            return innerNext(null, fCleanup, dCleanup)
          })
          stream.pipe(process.stdout)
        })
      }
    } else{
      phase.progress("not pushing image to registry")
      return innerNext(null, fCleanup, dCleanup)
    }
  }
  
  // clean up
  var cleanUp = function (fCleanup, dCleanup, innerNext) {
    fCleanup()
    //dCleanup()
    phase.progress("finished clean up")
    innerNext(null, "finished")
  }

  async.waterfall([
    makeTempDir,
    copyRepo,
    copyContext,
    writeDockerfile,
    makeTempFile,
    dockerBuild,
    pushImage,
    cleanUp
  ], function (err, result) {
    if (err) {
      return next(err)
    }
    return next(null, result)
  })

}

/**
 * Wraps a build phase in logging/error-handling code.
 * @param {BuildStatus} status - BuildStatus for this build
 * @param {string} name - Name of the phase
 * @param {function} phase - Function that executes the build phase
 */
Builder.prototype.phase = function (status, name, func) {
  var self = this
  var phase = {
    name: name,
    progress: function (msg) {
      var obj = msg
      if (typeof msg === "string") {
        obj = {msg: msg}
      }
      status.progress(name, obj)
    },
    error: function (msg) {
      status.error(name, msg)
    }
  }
  var wrapped = function () {
    var numArgs = _.keys(arguments).length
    var cb = arguments[numArgs - 1]
    var asyncStop = function () {
      status.stop(name)
      cb.apply(self, arguments)
    }
    arguments[numArgs - 1] = asyncStop
    status.start(name)
    _.partial(func, phase).apply(self, arguments)
  }
  return wrapped
}

/**
 * Searches a directory for dependency files, constructs a Binder
 * Docker image from those dependencies and optionally pushes the image
 * to a Docker registry.
 * @param {string} dir - The Binder directory to build
 */
Builder.prototype.build = function (dir, callback) {

  var status = new BuildStatus()

  var firstPhase = this.phase(status, "finding dependencies", this._findDependencies)
  var phases= [
    _.partial(firstPhase, dir),
    this.phase(status, 'selecting dependencies', this._selectDependency),
    this.phase(status, "making dockerfile", this._makeDockerfile),
    this.phase(status, "building dockerfile", this._buildDockerfile)
  ]

  var execute = function () {
    status.start()
    async.waterfall(phases,
      function (err, imageName) {
        if (err) {
          status.error(err)
          if (callback) {
            callback(err)
          }
        } else {
          status.stop()
          if (callback) {
            callback()
          }
        }
    })
  }

  return [status, execute]
}

module.exports = Builder


