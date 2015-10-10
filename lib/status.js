var EventEmitter = require('eventemitter2').EventEmitter2,
    util = require('util')

/*
 * Maintains the statuses associated with all stages of the Binder
 * build process.
 *
 * BuildStatus could be extended to support more extensive logging, or
 * that could be added by an event listener
 * @constructor
 */
function BuildStatus() {
  EventEmitter.call(this)
}
util.inherits(BuildStatus, EventEmitter)

BuildStatus.prototype.start = function (phase) {
  this.emit('start', phase)
}

BuildStatus.prototype.stop = function (phase) {
  this.emit('stop', phase)
}

BuildStatus.prototype.progress = function (phase, msg) {
  this.emit('progress', msg)
}

BuildStatus.prototype.error = function (phase, err) {
  this.emit('error', err)
}

module.exports = BuildStatus
