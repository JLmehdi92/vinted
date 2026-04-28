var s = require("./ArrayReader");
function o(l) {
  s.call(this, l);
}
require("../utils").inherits(o, s);
o.prototype.readData = function (l) {
  this.checkOffset(l);
  if (l === 0) {
    return new Uint8Array(0);
  }
  var c = this.data.subarray(this.zero + this.index, this.zero + this.index + l);
  this.index += l;
  return c;
};
module.exports = o;