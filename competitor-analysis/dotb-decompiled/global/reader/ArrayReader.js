var s = require("./DataReader");
function o(l) {
  s.call(this, l);
  for (var c = 0; c < this.data.length; c++) {
    l[c] = l[c] & 255;
  }
}
require("../utils").inherits(o, s);
o.prototype.byteAt = function (l) {
  return this.data[this.zero + l];
};
o.prototype.lastIndexOfSignature = function (l) {
  var c = l.charCodeAt(0);
  var d = l.charCodeAt(1);
  var u = l.charCodeAt(2);
  var h = l.charCodeAt(3);
  for (var m = this.length - 4; m >= 0; --m) {
    if (this.data[m] === c && this.data[m + 1] === d && this.data[m + 2] === u && this.data[m + 3] === h) {
      return m - this.zero;
    }
  }
  return -1;
};
o.prototype.readAndCheckSignature = function (l) {
  var c = l.charCodeAt(0);
  var d = l.charCodeAt(1);
  var u = l.charCodeAt(2);
  var h = l.charCodeAt(3);
  var m = this.readData(4);
  return c === m[0] && d === m[1] && u === m[2] && h === m[3];
};
o.prototype.readData = function (l) {
  this.checkOffset(l);
  if (l === 0) {
    return [];
  }
  var c = this.data.slice(this.zero + this.index, this.zero + this.index + l);
  this.index += l;
  return c;
};
module.exports = o;