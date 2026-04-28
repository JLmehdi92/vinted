var s = require("./utils");
var o = function () {
  var l;
  var c = [];
  for (var d = 0; d < 256; d++) {
    l = d;
    for (var u = 0; u < 8; u++) {
      l = l & 1 ? l >>> 1 ^ -306674912 : l >>> 1;
    }
    c[d] = l;
  }
  return c;
}();
module.exports = function (l, c) {
  if (l !== undefined && l.length) {
    if (s.getTypeOf(l) !== "string") {
      return function (d, u, h, m) {
        var g = o;
        var x = m + h;
        d ^= -1;
        for (var y = m; y < x; y++) {
          d = d >>> 8 ^ g[(d ^ u[y]) & 255];
        }
        return d ^ -1;
      }(c | 0, l, l.length, 0);
    } else {
      return function (d, u, h, m) {
        var g = o;
        var x = m + h;
        d ^= -1;
        for (var y = m; y < x; y++) {
          d = d >>> 8 ^ g[(d ^ u.charCodeAt(y)) & 255];
        }
        return d ^ -1;
      }(c | 0, l, l.length, 0);
    }
  } else {
    return 0;
  }
};