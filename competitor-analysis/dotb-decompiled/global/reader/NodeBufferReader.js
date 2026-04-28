var s = require("./Uint8ArrayReader");
function o(l) {
  s.call(this, l);
}
require("../utils").inherits(o, s);
o.prototype.readData = function (l) {
  this.checkOffset(l);
  var c = this.data.slice(this.zero + this.index, this.zero + this.index + l);
  this.index += l;
  return c;
};
module.exports = o;