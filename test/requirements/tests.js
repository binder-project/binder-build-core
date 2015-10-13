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
  var res = builder.build('./test/requirements/repo/', callback)
  var status = res[0]
  status.onAny(function (msg) {
    console.log(msg)
  })
  var execute = res[1]
  execute()
}

module.exports = [
  fileCreation
]

