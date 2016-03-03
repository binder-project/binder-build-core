var path = require('path')

var DepHandler = require('../../lib/dep-handler.js'),
    format = require('string-format')
    path = require('path')
format.extend(String.prototype)

/**
 * @constructor
 */
function RequirementsTxt() {}
RequirementsTxt.prototype = new DepHandler()
RequirementsTxt.prototype.context = path.join(__dirname, 'context')
RequirementsTxt.prototype.precedence = 1
RequirementsTxt.prototype._generateString = function (name, contents) {
  str = '' +
  'ADD {0} requirements.txt\n'.format(name) +
  'ADD handle-requirements.py handle-requirements.py\n' +
  'RUN python handle-requirements.py\n'
  return str
}

module.exports = RequirementsTxt


