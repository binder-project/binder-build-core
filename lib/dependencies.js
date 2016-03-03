var fs = require('fs-extra')
var _ = require('lodash')
var path = require('path')
var format = require('string-format')
format.extend(String.prototype)

/*
 * The set of supported dependency files along with their handlers.
 */
module.exports = require('../dependencies')
