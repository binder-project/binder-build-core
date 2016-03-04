var _ = require('lodash')

var schema = require('../../../util/schema.js')
var config = require('../../../config/main.js')

/**
 * The schema of a Binder-compatible Dockerfile
 */
var Dockerfile = function () {}
Dockerfile.prototype = new schema.Schema()
Dockerfile.prototype.validate = function (obj) {
  if (typeof obj !== "string") {
    return {errors: "Invalid type for Dockerfile"}
  }
  var lines = obj.split("\n")
  for (line in lines) {
    if (_.startsWith(line.strip, "FROM")) {
      var words = line.split(" ")
      if (words[1] !== config.baseImage) {
        return {errors: "Invalid base image"}
      }
    }
  }
  return true
}

module.exports = new Dockerfile()
