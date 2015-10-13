var DepHandler = require('../../lib/dep-handler.js')
var BinderYmlSchema = require('./schema/binder-yml.js')

/**
 * @constructor
 */
function BinderYml() {}
BinderYml.prototype = new DepHandler()
BinderYml.prototype.schema = BinderYmlSchema
BinderYml.prototype.generateString = function (name, contents) {
  return '\n'
}

module.exports = BinderYml

