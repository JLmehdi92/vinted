var s = require("./utils");
var o = require("./support");
var l = require("./nodejsUtils");
var c = require("./stream/GenericWorker");
var d = new Array(256);
for (var u = 0; u < 256; u++) {
  d[u] = u >= 252 ? 6 : u >= 248 ? 5 : u >= 240 ? 4 : u >= 224 ? 3 : u >= 192 ? 2 : 1;
}
d[254] = d[254] = 1;
function h() {
  c.call(this, "utf-8 decode");
  this.leftOver = null;
}
function m() {
  c.call(this, "utf-8 encode");
}
exports.utf8encode = function (g) {
  if (o.nodebuffer) {
    return l.newBufferFrom(g, "utf-8");
  } else {
    return function (x) {
      var y;
      var _;
      var S;
      var E;
      var C;
      var k = x.length;
      var F = 0;
      for (E = 0; E < k; E++) {
        if (((_ = x.charCodeAt(E)) & 64512) == 55296 && E + 1 < k && ((S = x.charCodeAt(E + 1)) & 64512) == 56320) {
          _ = 65536 + (_ - 55296 << 10) + (S - 56320);
          E++;
        }
        F += _ < 128 ? 1 : _ < 2048 ? 2 : _ < 65536 ? 3 : 4;
      }
      y = o.uint8array ? new Uint8Array(F) : new Array(F);
      E = C = 0;
      for (; C < F; E++) {
        if (((_ = x.charCodeAt(E)) & 64512) == 55296 && E + 1 < k && ((S = x.charCodeAt(E + 1)) & 64512) == 56320) {
          _ = 65536 + (_ - 55296 << 10) + (S - 56320);
          E++;
        }
        if (_ < 128) {
          y[C++] = _;
        } else {
          if (_ < 2048) {
            y[C++] = _ >>> 6 | 192;
          } else {
            if (_ < 65536) {
              y[C++] = _ >>> 12 | 224;
            } else {
              y[C++] = _ >>> 18 | 240;
              y[C++] = _ >>> 12 & 63 | 128;
            }
            y[C++] = _ >>> 6 & 63 | 128;
          }
          y[C++] = _ & 63 | 128;
        }
      }
      return y;
    }(g);
  }
};
exports.utf8decode = function (g) {
  if (o.nodebuffer) {
    return s.transformTo("nodebuffer", g).toString("utf-8");
  } else {
    return function (x) {
      var y;
      var _;
      var S;
      var E;
      var C = x.length;
      var k = new Array(C * 2);
      for (y = _ = 0; y < C;) {
        if ((S = x[y++]) < 128) {
          k[_++] = S;
        } else if ((E = d[S]) > 4) {
          k[_++] = 65533;
          y += E - 1;
        } else {
          for (S &= E === 2 ? 31 : E === 3 ? 15 : 7; E > 1 && y < C;) {
            S = S << 6 | x[y++] & 63;
            E--;
          }
          if (E > 1) {
            k[_++] = 65533;
          } else if (S < 65536) {
            k[_++] = S;
          } else {
            S -= 65536;
            k[_++] = S >> 10 & 1023 | 55296;
            k[_++] = S & 1023 | 56320;
          }
        }
      }
      if (k.length !== _) {
        if (k.subarray) {
          k = k.subarray(0, _);
        } else {
          k.length = _;
        }
      }
      return s.applyFromCharCode(k);
    }(g = s.transformTo(o.uint8array ? "uint8array" : "array", g));
  }
};
s.inherits(h, c);
h.prototype.processChunk = function (g) {
  var x = s.transformTo(o.uint8array ? "uint8array" : "array", g.data);
  if (this.leftOver && this.leftOver.length) {
    if (o.uint8array) {
      var y = x;
      (x = new Uint8Array(y.length + this.leftOver.length)).set(this.leftOver, 0);
      x.set(y, this.leftOver.length);
    } else {
      x = this.leftOver.concat(x);
    }
    this.leftOver = null;
  }
  var _ = function (E, C) {
    var k;
    if ((C = C || E.length) > E.length) {
      C = E.length;
    }
    k = C - 1;
    while (k >= 0 && (E[k] & 192) == 128) {
      k--;
    }
    if (k < 0 || k === 0) {
      return C;
    } else if (k + d[E[k]] > C) {
      return k;
    } else {
      return C;
    }
  }(x);
  var S = x;
  if (_ !== x.length) {
    if (o.uint8array) {
      S = x.subarray(0, _);
      this.leftOver = x.subarray(_, x.length);
    } else {
      S = x.slice(0, _);
      this.leftOver = x.slice(_, x.length);
    }
  }
  this.push({
    data: exports.utf8decode(S),
    meta: g.meta
  });
};
h.prototype.flush = function () {
  if (this.leftOver && this.leftOver.length) {
    this.push({
      data: exports.utf8decode(this.leftOver),
      meta: {}
    });
    this.leftOver = null;
  }
};
exports.Utf8DecodeWorker = h;
s.inherits(m, c);
m.prototype.processChunk = function (g) {
  this.push({
    data: exports.utf8encode(g.data),
    meta: g.meta
  });
};
exports.Utf8EncodeWorker = m;