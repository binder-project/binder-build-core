var _ = require('lodash')
var format = require('string-format')
format.extend(String.prototype)

var DepHandler = require('../../lib/dep-handler.js')
var BinderYmlSchema = require('./schema/binder-yml.js')

/**
 * @constructor
 */
function BinderYml() {}
BinderYml.prototype = new DepHandler()
BinderYml.prototype.schema = BinderYmlSchema
BinderYml.prototype._generateString = function (name, contents) {
  // the current handling does not take the front-end OR language
  // into account

  var handleEnv = function () {
    var strings = _.map(contents.env, function (env) {
      return _.keys(env).map(function (key) {
        return 'ENV {0} {1}\n'.format(key, env[key])
      })
    })
    return _.flatten(strings)
  }

  var handleApt = function () {
    var strings = _.map(contents.apt, function (apt) {
      return 'RUN apt-get install {0}\n'.format(apt)
    })
    return strings
  }

  var handleInstall = function () {
    var strings = _.map(contents.install, function (install) {
      return 'RUN {0}\n'.format(install)
    })
    return strings
  }

  return [
    handleEnv(),
    handleApt(),
    handleInstall(),
    ["USER main\n"]
  ].join('\n')
}

module.exports = BinderYml

