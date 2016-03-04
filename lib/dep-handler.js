var schema = require('../util/schema.js')

/**
 * Base prototype for an object that generates Dockerfile lines
 * according to the contents of a dependency file (that it's
 * responsible for validating).
 * @constructor
 */
function DepHandler() {
  if (!(this instanceof DepHandler)) return new DepHandler()
}

/**
 * The schema with which all instances of this handler will be validated
 * against.
 */
DepHandler.prototype.schema = new schema.Schema()

/**
 * The dependency-specific files that will be added to the Docker image.
 */
DepHandler.prototype.context = null

DepHandler.prototype.generateString = function (name, contents, cb) {
  var self  = this
  var _load = function (err, parsed) {
    if (err) {
      return cb(err)
    }
    return cb(null, self._generateString(name, parsed))
  }
  this.schema.load(contents, _load)
}


module.exports = DepHandler
