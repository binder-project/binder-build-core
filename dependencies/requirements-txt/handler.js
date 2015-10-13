var path = require('path')

var DepHandler = require('../../lib/dep-handler.js'),
    root = require('app-root-path'),
    format = require('string-format')
format.extend(String.prototype)

/**
 * @constructor
 */
function RequirementsTxt() {}
RequirementsTxt.prototype = new DepHandler()
RequirementsTxt.prototype.context = root.resolve('/dependencies/requirements-txt/context').toString()
RequirementsTxt.prototype._generateString = function (name, contents) {
  str = '' +
  'ADD {0} requirements.txt\n'.format(name) +
  'ADD handle-requirements.py handle-requirements.py\n' +
  'RUN python handle-requirements.py\n'
  return str
}

module.exports = RequirementsTxt


