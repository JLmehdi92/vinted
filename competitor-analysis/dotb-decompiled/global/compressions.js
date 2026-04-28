var s = require("./stream/GenericWorker");
exports.STORE = {
  magic: "\0\0",
  compressWorker: function () {
    return new s("STORE compression");
  },
  uncompressWorker: function () {
    return new s("STORE decompression");
  }
};
exports.DEFLATE = require("./flate");