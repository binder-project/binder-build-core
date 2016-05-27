var _ = require('lodash')
var DepHandler = require('../../lib/dep-handler.js'),
    DockerfileSchema = require('./schema/dockerfile.js')

/**
 * @constructor
 */
function Dockerfile() {
  if (!(this instanceof Dockerfile)) return new Dockerfile()
}
Dockerfile.prototype = new DepHandler()
Dockerfile.prototype.precedence = 0
Dockerfile.prototype.schema = DockerfileSchema
Dockerfile.prototype._generateString = function (name, contents) {
  var lines = contents.split('\n')
  var isFromLine = function (line) {
    return _.startsWith(_.trim(line), "FROM")
  }
  // remove the FROM line from the Dockerfile (this will be added later)
  _.remove(lines, isFromLine)
  return lines.join('\n')
}

module.exports = Dockerfile
