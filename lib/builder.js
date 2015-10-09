var tar = require('tar-fs'),
 fs = require('fs'),
 path = require('path')

var _ = require('lodash'),
 tmp = require('tmp'),
 async = require('async'),
 tar = require('tar-fs'),
 Docker = require('dockerode'),
 format = require('string-format')
format.extend(String.prototype)

var config = require('../config/main.js'),
 status = require('./status.js'),
 dependencies = require('./dependencies.js')

/**
 * The primary object responsible for Binder building
 * @constructor
 */
var Builder = function (opts) {
  this.opts = opts
}

/**
 * Find/validate all possible dependency files in the directory.
 * @callback _findDependencies
 * @param {string} dir - Directory containing dependencies
 * @param {function} next - Callback to call with validated deps
 */
Builder.prototype._findDependencies = function (dir, next) {
  fs.readdir(dir, function (err, files) {
    if (err) {
      return next(err)
    }

    // get all files with matching DepHandlers
    var depNames = _.intersection(_.keys(dependencies), files)

    // extract file contents and continue
    var extractFile = function (fileName, cb) {
      var nameAndContents = function (err, data) {
        cb(err, [fileName, data])
      }
      fs.readFile(path.join(dir, fileName), nameAndContents)
    }
    async.map(depNames, extractFile, function (err, results) {
      if (err) {
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
Builder.prototype._makeDockerfile = function (dir, contents, next) {
  var depStrings = _.map(contents, function (content, depName) {
    var dep = dependencies[depName]
    var name = "{0}/{1}".format(config.repoString, depName)
    var maybeString = dep.generateString(name, content)
    if (maybeString.errors) {
      return next(maybeString.errors)
    }
    return maybeString.string
  })

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
Builder.prototype._buildDockerfile = function (dir, contents, next) {
  next(null, "finished")
}

/**
 * Update the build status of imageName once building has completed.
 * @param {string} imageName - Name of the image that was built
 */
Builder.prototype._onComplete = function (imageName) {

}

/**
 * Update the build status of imageName once building has failed.
 * @param {string} imageName - Name of the image that failed to build
 * @param {string} error - Error that was produced during building
 */
Builder.prototype._onError = function (imageName, error) {

}

/**
 * Searches a directory for dependency files, constructs a Binder
 * Docker image from those dependencies and optionally pushes the image
 * to a Docker registry.
 * @param {string} dir - The Binder directory to build
 */
Builder.prototype.build = function (dir, success, failure) {
  var builder = this

  async.waterfall([
    _.partial(builder._findDependencies, dir),
    builder._makeDockerfile,
    builder._buildDockerfile
  ], function (err, imageName) {
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


