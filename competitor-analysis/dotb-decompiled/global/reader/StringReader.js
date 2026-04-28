var s = require("./DataReader");
function o(l) {
  s.call(this, l);
}
require("../utils").inherits(o, s);
o.prototype.byteAt = function (l) {
  return this.data.charCodeAt(this.zero + l);
};
o.prototype.lastIndexOfSignature = function (l) {
  return this.data.lastIndexOf(l) - this.zero;
};
o.prototype.readAndCheckSignature = function (l) {
  return l === this.readData(4);
};
o.prototype.readData = function (l) {
  this.checkOffset(l);
  var c = this.data.slice(this.zero + this.index, this.zero + this.index + l);
  this.index += l;
  return c;
};
module.exports = o;