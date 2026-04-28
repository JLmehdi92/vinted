var s = require("../utils");
function o(l) {
  this.data = l;
  this.length = l.length;
  this.index = 0;
  this.zero = 0;
}
o.prototype = {
  checkOffset: function (l) {
    this.checkIndex(this.index + l);
  },
  checkIndex: function (l) {
    if (this.length < this.zero + l || l < 0) {
      throw new Error("End of data reached (data length = " + this.length + ", asked index = " + l + "). Corrupted zip ?");
    }
  },
  setIndex: function (l) {
    this.checkIndex(l);
    this.index = l;
  },
  skip: function (l) {
    this.setIndex(this.index + l);
  },
  byteAt: function () {},
  readInt: function (l) {
    var c;
    var d = 0;
    this.checkOffset(l);
    c = this.index + l - 1;
    for (; c >= this.index; c--) {
      d = (d << 8) + this.byteAt(c);
    }
    this.index += l;
    return d;
  },
  readString: function (l) {
    return s.transformTo("string", this.readData(l));
  },
  readData: function () {},
  lastIndexOfSignature: function () {},
  readAndCheckSignature: function () {},
  readDate: function () {
    var l = this.readInt(4);
    return new Date(Date.UTC(1980 + (l >> 25 & 127), (l >> 21 & 15) - 1, l >> 16 & 31, l >> 11 & 31, l >> 5 & 63, (l & 31) << 1));
  }
};
module.exports = o;