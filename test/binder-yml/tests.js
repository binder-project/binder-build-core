var assert = require('assert')
var async = require('async')

var Builder = require('../../lib/builder.js')

// Begin tests

var build = function () {
  async.each(['repo1', 'repo2'], function (name, next) {
    var builder = new Builder({imageName: 'binder-project-example-binder-yml-' + name})
    var callback = function (err) {
      if (err) {
        assert.fail()
      }
    }
    var res = builder.build('./test/binder-yml/' + name, callback)
    var status = res[0]
    status.onAny(function (msg) {
      console.log(msg)
    })
    var execute = res[1]
    execute()
  }, function (err) {
  })
}

module.exports = [
  build
]

