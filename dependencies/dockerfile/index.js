var _ = require('lodash')
var DepHandler = require('../../lib/dep-handler.js')
var DockerfileSchema = require('./schema/dockerfile.js')

var config = require('../../lib/settings')

var acceptableImages = [
  'andrewosh/binder-python-3.5-mini',
  'andrewosh/binder-python-2.7-mini',
  'andrewosh/binder-python-2.7',
  'andrewosh/binder-python-3.5',
  'andrewosh/binder-base'
]
/**
 * @constructor
 */
function Dockerfile () {
  if (!(this instanceof Dockerfile)) return new Dockerfile()
}
Dockerfile.prototype = new DepHandler()
Dockerfile.prototype.precedence = 0
Dockerfile.prototype.schema = DockerfileSchema
Dockerfile.prototype._generateString = function (name, contents) {
  var lines = contents.split('\n')
  var isFromLine = function (line) {
    return _.startsWith(_.trim(line), 'FROM')
  }
  // remove the FROM line from the Dockerfile (this will be added later)
  _.remove(lines, isFromLine)
  return lines.join('\n')
}

Dockerfile.prototype._getBaseImage = function (name, contents) {
  var lines = contents.split('\n')
  var isFromLine = function (line) {
    return _.startsWith(_.trim(line), 'FROM')
  }
  var baseImage = config.baseImage
  lines.forEach(function (line) {
    if (isFromLine(line)) {
      var newBase = line.split(/ +/)[1]
      if (acceptableImages.indexOf(newBase) !== -1) baseImage = newBase
    }
  })
  return baseImage
}

module.exports = Dockerfile
