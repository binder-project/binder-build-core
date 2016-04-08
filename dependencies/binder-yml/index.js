var _ = require('lodash')
var format = require('string-format')
format.extend(String.prototype)

var DepHandler = require('../../lib/dep-handler.js')
var BinderYmlSchema = require('./schema/binder-yml.js')

/**
 * @constructor
 */
function BinderYml() {
  if (!(this instanceof BinderYml)) return new BinderYml()
}
BinderYml.prototype = new DepHandler()
BinderYml.prototype.precedence = 0
BinderYml.prototype.schema = BinderYmlSchema

BinderYml.prototype._getBaseImage = function (name, contents) {
  if (contents.language) {
    if (contents.language === 'python') {
      if (contents.version === 2.7) {
        return 'andrewosh/binder-mini-python-2.7'
      } else if (contents.version === 3.5) {
        return 'andrewosh/binder-mini-python-3.5'
      }
    }
  }
  return DepHandler._getBaseImage(this, name, contents)
}

BinderYml.prototype._generateString = function (name, contents) {
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
      // yes this is not secure -- but the .binder.yml is NOT designed to be a secure
      // replacement for Docekrfile
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
    // TODO: make this more modular: extract field handling to submodules
    var fullString = ''
    var install = function (pm, field) {
      var strings = _.map(field, function (cmd) {
        return 'RUN {0} {1}\n'.format(pm, cmd)
      })
      return strings.join('')
    }
    if (contents.pip) {
      fullString += install('pip install', contents.pip)
    }
    if (contents.conda) {
      fullString += install('conda install', contents.conda)
    }
    return fullString
  }

  return [
    'USER root\n',
    handleApt(),
    'USER main\n',
    handleEnv(),
    handleInstall()
  ].join('\n')
}

module.exports = BinderYml

