var _ = require('lodash')

var yaml = require('js-yaml')
var Validator = require('jsonschema').Validator

/**
 * A small wrapper for a schema and its associated validation function
 * @constructor
 */
function Schema() {}
Schema.prototype.validate = function (obj) {
  return true
}
Schema.prototype.parse = function (str) {
  return str
}
Schema.prototype.load = function (str, cb) {
  var parsed = this.parse(str)
  if (this.validate(parsed)) {
    return cb(null, parsed)
  }
  cb(new Error("Could not validate or parse string"))
}

/**
 * A JSONSchema object
 * @constructor
 */
function JSONSchema() {}
JSONSchema.prototype = new Schema()
JSONSchema.prototype.parse = function (str) {
  return JSON.parse(str)
}
JSONSchema.prototype.schema = {}

/**
 * Validates a javascript object against this JSONSchema
 */
JSONSchema.prototype.validate = function (obj) {
  var v = new Validator()
  return v.validate(obj, this.schema)
}

/**
 * A YAMLSchema object is a JSONSchema with a more specific parse function
 * @constructor
 */
function YAMLSchema() {}
YAMLSchema.prototype = new JSONSchema()
YAMLSchema.prototype.parse = function (str) {
  return yaml.safeLoad(str)
}

module.exports = {
  Schema: Schema,
  JSONSchema: JSONSchema,
  YAMLSchema: YAMLSchema
}
