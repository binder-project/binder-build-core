var fs = require('fs-extra'),
    _ = require('lodash'),
    path = require('path')
    format = require('string-format'),
    root = require('app-root-path')
format.extend(String.prototype)

/*
 * The set of supported dependency files along with their handlers.
 */
var depNames = fs.readdirSync(root +'/dependencies')
var dependencies = _.zipObject(depNames.map(function (name) {
  var handler = require('../dependencies/{0}/handler.js'.format(name))
  var fixedName = name.replace('-', '.')
  return [fixedName, new handler()]
}))

console.log("dependencies.keys: {0}".format(_.keys(dependencies)))

module.exports = dependencies
