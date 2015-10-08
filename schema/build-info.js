var Schema = require('../util/schema.js')

var BuildInfo = function () {}
BuildInfo.prototype = new Schema()
BuildInfo.prototype.schema = {
  type: "object"
}

module.exports = BuildInfo()


