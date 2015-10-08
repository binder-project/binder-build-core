var tar = require('tar-fs')
var fs = require('fs')

var _ = require('lodash')
var tmp = require('tmp')
var async = require('async')
var tar = require('tar-fs')
var Docker = require('dockerode')

var status = require('./status.js')
var dependencies = require('./dependencies.js')

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
      next(err)
    }

    // get all files with matching DepHandlers
    var depNames = _.intersection(_.keys(deps), files)

    // extract file contents and continue
    var deps = _.zipObject(_.map(depNames, function (dep) {
      fs.readFile(dep, function (err, data) {
        if (err) {
          next(err)
        }
        return [dep, data]
      })
    }))

    next(null, dir, deps)
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
  var depStrings = _.mapKeys(contents, function (depName) {
    var dep = dependencies[depName]
    var name = "${config.repoString}/${depName}"
    var maybeString = dep.generateString(name, contents[depName])
    if (maybeString.errors) {
      next(maybeString.errors)
      return
    }
    return maybeString.string
  })

  var prefix = "FROM ${config.baseImage}"

  var suffix = \
  'USER root\n' +
  'RUN chown -R main:main $HOME/notebooks\n' +
  'USER main\n\n' +
  'RUN find $HOME/notebooks -name '*.ipynb' -exec ipython trust {} \;\n\n' +
  'WORKDIR $HOME/notebooks\n'

  next(null, [prefix, depStrings.join('\n'), suffix].join('\n'))
}

/**
 * Builds a Docker image and optionally sends it to a registry
 * @callback _buildDockerfile
 * @param {string} dir - Directory containing the Dockerfile
 * @param {function} next - Callback to call after Docker build/push
 */
Builder.prototype._buildDockerfile = function (dir, next) {

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
    this._findDependencies,
    this._makeDockerfile,
    this._buildDockerfile
  ], function (err, imageName) {
    if (err) {
      this._onError(imageName, err)
      failure(imageName, err)
    } else {
      this._onComplete(imageName)
      success(imageName)
    }
  })

  // Search for dependency files
  var deps = this._find_dependencies(dir)
  console.log(deps)

  // Generate the Binder Dockerfile
  // Package the Docker context into a tarball
  // Do the Docker build
  // When the build has completed, update BuildInfo
}


