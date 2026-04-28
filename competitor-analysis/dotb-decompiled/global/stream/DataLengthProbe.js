var s = require("../utils");
var o = require("./GenericWorker");
function l(c) {
  o.call(this, "DataLengthProbe for " + c);
  this.propName = c;
  this.withStreamInfo(c, 0);
}
s.inherits(l, o);
l.prototype.processChunk = function (c) {
  if (c) {
    var d = this.streamInfo[this.propName] || 0;
    this.streamInfo[this.propName] = d + c.data.length;
  }
  o.prototype.processChunk.call(this, c);
};
module.exports = l;