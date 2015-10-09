var assert = require('assert')

var Builder = require('../../lib/builder.js')

// Begin tests

var fileCreation = function () {
  var builder = new Builder()
  var success = function () {}
  var failure = function () {
    assert.fail()
  }
  builder.build('./test/requirements/repo/', success, failure)
}

module.exports = [
  fileCreation
]

