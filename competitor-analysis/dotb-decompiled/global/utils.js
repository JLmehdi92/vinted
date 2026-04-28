var s = require("./support");
var o = require("./base64");
var l = require("./nodejsUtils");
var c = require("./external");
function d(y) {
  return y;
}
function u(y, _) {
  for (var S = 0; S < y.length; ++S) {
    _[S] = y.charCodeAt(S) & 255;
  }
  return _;
}
require("setimmediate");
exports.newBlob = function (y, _) {
  exports.checkSupport("blob");
  try {
    return new Blob([y], {
      type: _
    });
  } catch {
    try {
      var S = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
      S.append(y);
      return S.getBlob(_);
    } catch {
      throw new Error("Bug : can't construct the Blob.");
    }
  }
};
var h = {
  stringifyByChunk: function (y, _, S) {
    var E = [];
    var C = 0;
    var k = y.length;
    if (k <= S) {
      return String.fromCharCode.apply(null, y);
    }
    while (C < k) {
      if (_ === "array" || _ === "nodebuffer") {
        E.push(String.fromCharCode.apply(null, y.slice(C, Math.min(C + S, k))));
      } else {
        E.push(String.fromCharCode.apply(null, y.subarray(C, Math.min(C + S, k))));
      }
      C += S;
    }
    return E.join("");
  },
  stringifyByChar: function (y) {
    var _ = "";
    for (var S = 0; S < y.length; S++) {
      _ += String.fromCharCode(y[S]);
    }
    return _;
  },
  applyCanBeUsed: {
    uint8array: function () {
      try {
        return s.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
      } catch {
        return false;
      }
    }(),
    nodebuffer: function () {
      try {
        return s.nodebuffer && String.fromCharCode.apply(null, l.allocBuffer(1)).length === 1;
      } catch {
        return false;
      }
    }()
  }
};
function m(y) {
  var _ = 65536;
  var S = exports.getTypeOf(y);
  var E = true;
  if (S === "uint8array") {
    E = h.applyCanBeUsed.uint8array;
  } else if (S === "nodebuffer") {
    E = h.applyCanBeUsed.nodebuffer;
  }
  if (E) {
    while (_ > 1) {
      try {
        return h.stringifyByChunk(y, S, _);
      } catch {
        _ = Math.floor(_ / 2);
      }
    }
  }
  return h.stringifyByChar(y);
}
function g(y, _) {
  for (var S = 0; S < y.length; S++) {
    _[S] = y[S];
  }
  return _;
}
exports.applyFromCharCode = m;
var x = {};
x.string = {
  string: d,
  array: function (y) {
    return u(y, new Array(y.length));
  },
  arraybuffer: function (y) {
    return x.string.uint8array(y).buffer;
  },
  uint8array: function (y) {
    return u(y, new Uint8Array(y.length));
  },
  nodebuffer: function (y) {
    return u(y, l.allocBuffer(y.length));
  }
};
x.array = {
  string: m,
  array: d,
  arraybuffer: function (y) {
    return new Uint8Array(y).buffer;
  },
  uint8array: function (y) {
    return new Uint8Array(y);
  },
  nodebuffer: function (y) {
    return l.newBufferFrom(y);
  }
};
x.arraybuffer = {
  string: function (y) {
    return m(new Uint8Array(y));
  },
  array: function (y) {
    return g(new Uint8Array(y), new Array(y.byteLength));
  },
  arraybuffer: d,
  uint8array: function (y) {
    return new Uint8Array(y);
  },
  nodebuffer: function (y) {
    return l.newBufferFrom(new Uint8Array(y));
  }
};
x.uint8array = {
  string: m,
  array: function (y) {
    return g(y, new Array(y.length));
  },
  arraybuffer: function (y) {
    return y.buffer;
  },
  uint8array: d,
  nodebuffer: function (y) {
    return l.newBufferFrom(y);
  }
};
x.nodebuffer = {
  string: m,
  array: function (y) {
    return g(y, new Array(y.length));
  },
  arraybuffer: function (y) {
    return x.nodebuffer.uint8array(y).buffer;
  },
  uint8array: function (y) {
    return g(y, new Uint8Array(y.length));
  },
  nodebuffer: d
};
exports.transformTo = function (y, _) {
  _ = _ || "";
  if (!y) {
    return _;
  }
  exports.checkSupport(y);
  var S = exports.getTypeOf(_);
  return x[S][y](_);
};
exports.resolve = function (y) {
  for (var _ = y.split("/"), S = [], E = 0; E < _.length; E++) {
    var C = _[E];
    if (C !== "." && (C !== "" || E === 0 || E === _.length - 1)) {
      if (C === "..") {
        S.pop();
      } else {
        S.push(C);
      }
    }
  }
  return S.join("/");
};
exports.getTypeOf = function (y) {
  if (typeof y == "string") {
    return "string";
  } else if (Object.prototype.toString.call(y) === "[object Array]") {
    return "array";
  } else if (s.nodebuffer && l.isBuffer(y)) {
    return "nodebuffer";
  } else if (s.uint8array && y instanceof Uint8Array) {
    return "uint8array";
  } else if (s.arraybuffer && y instanceof ArrayBuffer) {
    return "arraybuffer";
  } else {
    return undefined;
  }
};
exports.checkSupport = function (y) {
  if (!s[y.toLowerCase()]) {
    throw new Error(y + " is not supported by this platform");
  }
};
exports.MAX_VALUE_16BITS = 65535;
exports.MAX_VALUE_32BITS = -1;
exports.pretty = function (y) {
  var _;
  var S;
  var E = "";
  for (S = 0; S < (y || "").length; S++) {
    E += "\\x" + ((_ = y.charCodeAt(S)) < 16 ? "0" : "") + _.toString(16).toUpperCase();
  }
  return E;
};
exports.delay = function (y, _, S) {
  setImmediate(function () {
    y.apply(S || null, _ || []);
  });
};
exports.inherits = function (y, _) {
  function S() {}
  S.prototype = _.prototype;
  y.prototype = new S();
};
exports.extend = function () {
  var y;
  var _;
  var S = {};
  for (y = 0; y < arguments.length; y++) {
    for (_ in arguments[y]) {
      if (Object.prototype.hasOwnProperty.call(arguments[y], _) && S[_] === undefined) {
        S[_] = arguments[y][_];
      }
    }
  }
  return S;
};
exports.prepareContent = function (y, _, S, E, C) {
  return c.Promise.resolve(_).then(function (k) {
    if (s.blob && (k instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(k)) !== -1) && typeof FileReader !== "undefined") {
      return new c.Promise(function (F, N) {
        var A = new FileReader();
        A.onload = function (R) {
          F(R.target.result);
        };
        A.onerror = function (R) {
          N(R.target.error);
        };
        A.readAsArrayBuffer(k);
      });
    } else {
      return k;
    }
  }).then(function (k) {
    var F = exports.getTypeOf(k);
    if (F) {
      if (F === "arraybuffer") {
        k = exports.transformTo("uint8array", k);
      } else if (F === "string") {
        if (C) {
          k = o.decode(k);
        } else if (S && E !== true) {
          k = function (N) {
            return u(N, s.uint8array ? new Uint8Array(N.length) : new Array(N.length));
          }(k);
        }
      }
      return k;
    } else {
      return c.Promise.reject(new Error("Can't read the data of '" + y + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
    }
  });
};