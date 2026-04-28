var s = require("./utils");
var o = require("./support");
var l = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
exports.encode = function (c) {
  var d;
  var u;
  var h;
  var m;
  var g;
  var x;
  var y;
  var _ = [];
  for (var S = 0, E = c.length, C = E, k = s.getTypeOf(c) !== "string"; S < c.length;) {
    C = E - S;
    h = k ? (d = c[S++], u = S < E ? c[S++] : 0, S < E ? c[S++] : 0) : (d = c.charCodeAt(S++), u = S < E ? c.charCodeAt(S++) : 0, S < E ? c.charCodeAt(S++) : 0);
    m = d >> 2;
    g = (d & 3) << 4 | u >> 4;
    x = C > 1 ? (u & 15) << 2 | h >> 6 : 64;
    y = C > 2 ? h & 63 : 64;
    _.push(l.charAt(m) + l.charAt(g) + l.charAt(x) + l.charAt(y));
  }
  return _.join("");
};
exports.decode = function (c) {
  var d;
  var u;
  var h;
  var m;
  var g;
  var x;
  var y = 0;
  var _ = 0;
  var S = "data:";
  if (c.substr(0, S.length) === S) {
    throw new Error("Invalid base64 input, it looks like a data url.");
  }
  var E;
  var C = (c = c.replace(/[^A-Za-z0-9+/=]/g, "")).length * 3 / 4;
  if (c.charAt(c.length - 1) === l.charAt(64)) {
    C--;
  }
  if (c.charAt(c.length - 2) === l.charAt(64)) {
    C--;
  }
  if (C % 1 != 0) {
    throw new Error("Invalid base64 input, bad content length.");
  }
  for (E = o.uint8array ? new Uint8Array(C | 0) : new Array(C | 0); y < c.length;) {
    d = l.indexOf(c.charAt(y++)) << 2 | (m = l.indexOf(c.charAt(y++))) >> 4;
    u = (m & 15) << 4 | (g = l.indexOf(c.charAt(y++))) >> 2;
    h = (g & 3) << 6 | (x = l.indexOf(c.charAt(y++)));
    E[_++] = d;
    if (g !== 64) {
      E[_++] = u;
    }
    if (x !== 64) {
      E[_++] = h;
    }
  }
  return E;
};