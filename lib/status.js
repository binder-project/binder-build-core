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
  if (phase) {
    this.emit('start', phase)
  } else {
    this.emit('build start')
  }
}

BuildStatus.prototype.stop = function (phase) {
  if (phase) {
    this.emit('stop', phase)
  } else {
    this.emit('build stop')
  }
}

BuildStatus.prototype.progress = function (phase, msg) {
  this.emit('progress', msg)
}

BuildStatus.prototype.error = function (phase, err) {
  if (phase) {
    this.emit('error', phase, err)
  } else {
    this.emit('build error', err)
  }
}

module.exports = BuildStatus
