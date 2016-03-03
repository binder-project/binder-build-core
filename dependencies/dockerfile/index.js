var _ = require('lodash')
var DepHandler = require('../../lib/dep-handler.js'),
    DockerfileSchema = require('./schema/dockerfile.js')

/**
 * @constructor
 */
function Dockerfile() {}
Dockerfile.prototype = new DepHandler()
Dockerfile.prototype.schema = DockerfileSchema
Dockerfile.prototype.precedence = 3
Dockerfile.prototype._generateString = function (name, contents) {
  var lines = contents.split("\n")
  var fromLine = _.findIndex(lines, function (line) {
    return _.startsWith(line.strip, "FROM")
  })
  // remove the FROM line from the Dockerfile (this will be added later)
  return _.pullAt(lines, fromLine).join('\n')
}

module.exports = Dockerfile
