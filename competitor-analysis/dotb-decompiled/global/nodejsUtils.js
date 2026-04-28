module.exports = {
  isNode: typeof Buffer !== "undefined",
  newBufferFrom: function (s, o) {
    if (Buffer.from && Buffer.from !== Uint8Array.from) {
      return Buffer.from(s, o);
    }
    if (typeof s == "number") {
      throw new Error("The \"data\" argument must not be a number");
    }
    return new Buffer(s, o);
  },
  allocBuffer: function (s) {
    if (Buffer.alloc) {
      return Buffer.alloc(s);
    }
    var o = new Buffer(s);
    o.fill(0);
    return o;
  },
  isBuffer: function (s) {
    return Buffer.isBuffer(s);
  },
  isStream: function (s) {
    return s && typeof s.on == "function" && typeof s.pause == "function" && typeof s.resume == "function";
  }
};