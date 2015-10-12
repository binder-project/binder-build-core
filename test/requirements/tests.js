var assert = require('assert')

var Builder = require('../../lib/builder.js')

// Begin tests

var fileCreation = function () {
  var builder = new Builder({imageName: "binder-project-example-requirements"})
  var callback = function (err) {
    if (err) {
      assert.fail()
    }
  }
  builder.build('./test/requirements/repo/', callback)
}

module.exports = [
  fileCreation
]

