var s = require("./GenericWorker");
var o = require("../crc32");
function l() {
  s.call(this, "Crc32Probe");
  this.withStreamInfo("crc32", 0);
}
require("../utils").inherits(l, s);
l.prototype.processChunk = function (c) {
  this.streamInfo.crc32 = o(c.data, this.streamInfo.crc32 || 0);
  this.push(c);
};
module.exports = l;