var s = require("./external");
var o = require("./stream/DataWorker");
var l = require("./stream/Crc32Probe");
var c = require("./stream/DataLengthProbe");
function d(u, h, m, g, x) {
  this.compressedSize = u;
  this.uncompressedSize = h;
  this.crc32 = m;
  this.compression = g;
  this.compressedContent = x;
}
d.prototype = {
  getContentWorker: function () {
    var u = new o(s.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new c("data_length"));
    var h = this;
    u.on("end", function () {
      if (this.streamInfo.data_length !== h.uncompressedSize) {
        throw new Error("Bug : uncompressed data size mismatch");
      }
    });
    return u;
  },
  getCompressedWorker: function () {
    return new o(s.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
  }
};
d.createWorkerFrom = function (u, h, m) {
  return u.pipe(new l()).pipe(new c("uncompressedSize")).pipe(h.compressWorker(m)).pipe(new c("compressedSize")).withStreamInfo("compression", h);
};
module.exports = d;