var s = require("../utils");
var o = require("../support");
var l = require("./ArrayReader");
var c = require("./StringReader");
var d = require("./NodeBufferReader");
var u = require("./Uint8ArrayReader");
module.exports = function (h) {
  var m = s.getTypeOf(h);
  s.checkSupport(m);
  if (m !== "string" || o.uint8array) {
    if (m === "nodebuffer") {
      return new d(h);
    } else if (o.uint8array) {
      return new u(s.transformTo("uint8array", h));
    } else {
      return new l(s.transformTo("array", h));
    }
  } else {
    return new c(h);
  }
};