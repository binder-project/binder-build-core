var schema = require('../util/schema.js')

/**
 * The JSONSchema object for a binder.yml file
 * @constructor
 */
var BinderYml = function () {}
BinderYml.prototype = new schema.JSONSchema()
BinderYml.prototype.schema = {
  type: "object",
  properties: {

    "language": {
      type: "array",
      items: {
        type: "object",
        additionalProperties: {
          type: "string"
        }
      }
    },

    "env": {
      type: "array",
      items: {
        type: "object",
        patternProperties: {
          "^[A-Z]+$": {
            type: "string"
          }
        }
      }
    },

    "apt": {
      type: "array",
      items: {
        type: "string"
      }
    },

    "install": {
      type: "array",
      items: {
        type: "string"
      }
    },

    "application": {
      type: "string"
    }
  },
  required: ["language", "application"]
}

module.exports = new BinderYml()


