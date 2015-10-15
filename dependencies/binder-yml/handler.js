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

  //console.log("binder.yml: {0}".format(JSON.stringify(contents)))
  var handleEnv = function () {
    var strings = _.map(contents.env, function (env) {
      return _.keys(env).map(function (key) {
        return 'ENV {0} {1}\n'.format(key, env[key])
      })
    })
    return _.flatten(strings).join('')
  }

  var handleApt = function () {
    if (contents.apt) {
      var packages = contents.apt.join(' ')
      var installString = '' +
        'RUN apt-get update -y && ' +
        'apt-get install -y {0} && ' +
        'apt-get clean && ' +
        'rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*tmp\n'
      return installString.format(packages)
    }
    return ''
  }

  var handleInstall = function () {
    var strings = _.map(contents.install, function (install) {
      return 'RUN {0}\n'.format(install)
    })
    return strings.join('')
  }

  return [
    'ADD * $HOME/notebooks/\n',
    'USER root\n',
    handleEnv(),
    handleApt(),
    'USER main\n',
    handleInstall()
  ].join('\n')
}

module.exports = BinderYml

