var tar = require('tar-fs'),
    path = require('path')

var _ = require('lodash'),
    fs = require('fs-extra')
    tmp = require('tmp'),
    async = require('async'),
    tar = require('tar-fs'),
    Docker = require('dockerode'),
    format = require('string-format')
format.extend(String.prototype)

var config = require('../config/main.js'),
    dependencies = require('./dependencies.js'),
    BuildStatus = require('./status.js')

/**
 * The primary object responsible for Binder building
 * @constructor
 */
function Builder(opts) {
  this.opts = opts || {}
  this.status = new BuildStatus()
  this.status.onAny(function (msg) {
    console.log(this.event, msg)
  })
}

/**
 * Find/validate all possible dependency files in the directory.
 * @callback _findDependencies
 * @param {string} dir - Directory containing dependencies
 * @param {function} next - Callback to call with validated deps
 */
Builder.prototype._findDependencies = function (phase, dir, next) {
  fs.readdir(dir, function (err, files) {
    if (err) {
      phase.error(err)
      return next(err)
    }

    // get all files with matching DepHandlers
    phase.progress("finding dependency files")
    var depNames = _.intersection(_.keys(dependencies), files)

    // extract file contents and continue
    phase.progress("extracting dependency contents")
    var extractFile = function (fileName, cb) {
      var nameAndContents = function (err, data) {
        cb(err, [fileName, data])
      }
      fs.readFile(path.join(dir, fileName), nameAndContents)
    }
    async.map(depNames, extractFile, function (err, results) {
      if (err) {
        phase.error(err)
        return next(err)
      }
      next(null, dir, _.zipObject(results))
    })
  })
}

/**
 * Constructs a Dockerfile out of dependencies and a directory
 * containing contents.
 * @callback _makeDockerfile
 * @param {string} dir - Directory containing contents
 * @param {object} contents - Mapping from dep name to parsed dep
 * @param {function} next - Callback to call with Dockerfile name
 */
Builder.prototype._makeDockerfile = function (phase, dir, contents, next) {
  phase.progress("generating dependency strings")
  var depStrings = _.map(contents, function (content, depName) {
    var dep = dependencies[depName]
    var name = "{0}/{1}".format(config.repoString, depName)
    var maybeString = dep.generateString(name, content)
    if (maybeString.errors) {
      phase.error(maybeString.errors)
      return next(maybeString.errors)
    }
    return maybeString.string
  })

  phase.progress("making dockerfile string from dependencies")

  var prefix = "FROM {0}\n".format(config.baseImage)

  var suffix = '' +
  'USER root\n' +
  'RUN chown -R main:main $HOME/notebooks\n' +
  'USER main\n\n' +
  'RUN find $HOME/notebooks -name \'*.ipynb\' -exec ipython trust {} \;\n\n' +
  'WORKDIR $HOME/notebooks\n'

  next(null, dir, [prefix, depStrings.join('\n'), suffix].join('\n'))
}

/**
 * Builds a Docker image and optionally sends it to a registry
 * @callback _buildDockerfile
 * @param {string} dir - Directory containing the Dockerfile
 * @param {string} contents - Dockerfile contents
 * @param {function} next - Callback to call after Docker build/push
 */
Builder.prototype._buildDockerfile = function (phase, dir, contents, next) {
  var builder = this

  // make temporary directory
  var makeTempDir = function (innerNext) {
    phase.progress("creating temporary directory")
    tmp.dir({unsafeCleanup: true}, function (err, tmpDir, dCleanup) {
      if (err) {
        phase.error(err)
        return innerNext(err)
      }
      innerNext(null, tmpDir, dCleanup)
    })
  }


  // copy repository
  var copyRepo = function (tmpDir, dCleanup, innerNext) {
    phase.progress({msg: "copying repo", dir: tmpDir})
    fs.copy(dir, path.join(tmpDir, config.repoString), function (err) {
      if (err) {
        phase.error(err)
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
        phase.error(err)
        return innerNext(err)
      }
      innerNext(null, tmpDir, dCleanup)
    })
  }
  
  // make temporary file for tarball and pack contents
  var makeTempFile = function (tmpDir, dCleanup, innerNext) {
    phase.progress("making temporary file for tarball")
    var fileOpts = {mode: 0644, prefix: 'binder-', postfix: '.tar'}
    tmp.file(fileOpts, function (err, fPath, fd, fCleanup) {
      if (err) {
        phase.error(err)
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
    var buildOpts = builder.opts.imageName ? {t: builder.opts.imageName} : {}
    phase.progress("calling docker build")
    docker.buildImage(ctxPath, buildOpts, function (err, response) {
      if (err) {
        phase.error(err)
        return innerNext(err)
      }
      response.pipe(process.stdout).on('finish', function () {
        phase.progress("docker build finished: {0}".format(response))
        innerNext(null, fCleanup, dCleanup)
      })
    })
  }

  // optionally push image
  
  // clean up
  var cleanUp = function (fCleanup, dCleanup, innerNext) {
    fCleanup()
    dCleanup()
    innerNext("finished")
  }

  async.waterfall([
    makeTempDir,
    copyRepo,
    writeDockerfile,
    makeTempFile,
    dockerBuild,
    cleanUp
  ], function (err, result) {
    if (err) {
      phase.error(err)
      return next(err)
    }
  })

}

/**
 * Wraps a build phase in logging/error-handling code.
 * @param {string} name - Name of the phase
 * @param {function} phase - Function that executes the build phase
 */
Builder.prototype.phase = function (name, func) {
  var builder = this
  var phase = {
    name: name,
    progress: function (msg) {
      var obj = msg
      if (typeof msg === "string") {
        obj = {msg: msg}
      }
      builder.status.progress(name, obj)
    },
    error: function (msg) {
      builder.status.error(name, msg)
    }
  }
  var wrapped = function () {
    var status = builder.status
    var numArgs = _.keys(arguments).length
    var cb = arguments[numArgs - 1]
    var asyncStop = function () {
      status.stop(name)
      cb.apply(builder, arguments)
    }
    arguments[numArgs - 1] = asyncStop
    status.start(name)
    _.partial(func, phase).apply(builder, arguments)
  }
  return wrapped
}

/**
 * Update the build status of imageName once building has completed.
 * @param {string} imageName - Name of the image that was built
 */
Builder.prototype._onComplete = function (imageName) {
  this.status.stop()
}

/**
 * Update the build status of imageName once building has failed.
 * @param {string} imageName - Name of the image that failed to build
 * @param {string} error - Error that was produced during building
 */
Builder.prototype._onError = function (imageName, error) {
  this.status.error(null, error)
  this.status.stop()
}

/**
 * Searches a directory for dependency files, constructs a Binder
 * Docker image from those dependencies and optionally pushes the image
 * to a Docker registry.
 * @param {string} dir - The Binder directory to build
 */
Builder.prototype.build = function (dir, success, failure) {
  var builder = this

  var phases= [
    _.partial(this.phase("finding dependencies", this._findDependencies), dir),
    this.phase("making dockerfile", this._makeDockerfile),
    this.phase("building dockerfile", this._buildDockerfile)
  ]

  async.waterfall(phases,
    function (err, imageName) {
      if (err) {
        builder._onError(imageName, err)
        failure(imageName, err)
      } else {
        builder._onComplete(imageName)
        success(imageName)
      }
  })
}

module.exports = Builder


