var schema = require('../util/schema.js')

/**
 * Base prototype for an object that generates Dockerfile lines
 * according to the contents of a dependency file (that it's
 * responsible for validating).
 * @constructor
 */
function DepHandler() {}

/**
 * The schema with which all instances of this handler will be validated
 * against.
 */
DepHandler.prototype.schema = new schema.Schema()

/**
 * The dependency-specific files that will be added to the Docker image.
 */
DepHandler.prototype.context = null

DepHandler.prototype.generateString = function (name, contents) {
  var errors = this.schema.validate(contents).errors
  if (errors) {
    return {errors: errors}
  } else{
    return {string: this._generateString(name, contents)}
  }
}


module.exports = DepHandler
