var _ = require('lodash')
var fs = require('fs')
var path = require('path')

var format = require('string-format')
format.extend(String.prototype)

var runTests = function () {
  var testDir = './test'
  fs.readdir(testDir, function (err, files) {
    if (err) {
      return err
    }
    var dirs = files.filter(function (element, index, array) {
      var file = path.join(testDir, element)
      return fs.statSync(file).isDirectory()
    })
    _.forEach(dirs, function (dir) {
      var tests = require('./{0}/tests.js'.format(dir))
      _.forEach(tests, function (test) {
        test()
      })
    })
  })
}

runTests()
