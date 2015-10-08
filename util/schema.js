var Validator = require('jsonschema').Validator

/**
 * A small wrapper for a schema and its associated validation function
 * @constructor
 */
function Schema() {}
Schema.prototype.validate = function (obj) {
  return true
}

/**
 * A JSONSchema object
 * @constructor
 */
function JSONSchema() {}
JSONSchema.prototype = new Schema()
JSONSchema.prototype.schema = {}

/**
 * Validates a javascript object against this JSONSchema
 */
JSONSchema.prototype.validate = function (obj) {
  var v = new Validator()
  return v.validate(obj, this.schema)
}

module.exports = {
  Schema: Schema,
  JSONSchema: JSONSchema
}
