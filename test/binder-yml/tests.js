var assert = require('assert')

var Builder = require('../../lib/builder.js')

// Begin tests

var build = function () {
  var builder = new Builder({imageName: "binder-project-example-binder-yml"})
  var callback = function (err) {
    if (err) {
      assert.fail()
    }
  }
  var res = builder.build('./test/binder-yml/repo/', callback)
  var status = res[0]
  status.onAny(function (msg) {
    console.log(msg)
  })
  var execute = res[1]
  execute()
}

module.exports = [
  build
]

