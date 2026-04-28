var s = require("../utils");
var o = require("./ConvertWorker");
var l = require("./GenericWorker");
var c = require("../base64");
var d = require("../support");
var u = require("../external");
var h = null;
if (d.nodestream) {
  try {
    h = require("../nodejs/NodejsStreamOutputAdapter");
  } catch {}
}
function m(x, y) {
  return new u.Promise(function (_, S) {
    var E = [];
    var C = x._internalType;
    var k = x._outputType;
    var F = x._mimeType;
    x.on("data", function (N, A) {
      E.push(N);
      if (y) {
        y(A);
      }
    }).on("error", function (N) {
      E = [];
      S(N);
    }).on("end", function () {
      try {
        var N = function (A, R, D) {
          switch (A) {
            case "blob":
              return s.newBlob(s.transformTo("arraybuffer", R), D);
            case "base64":
              return c.encode(R);
            default:
              return s.transformTo(A, R);
          }
        }(k, function (A, R) {
          var D;
          var O = 0;
          var K = null;
          var B = 0;
          for (D = 0; D < R.length; D++) {
            B += R[D].length;
          }
          switch (A) {
            case "string":
              return R.join("");
            case "array":
              return Array.prototype.concat.apply([], R);
            case "uint8array":
              K = new Uint8Array(B);
              D = 0;
              for (; D < R.length; D++) {
                K.set(R[D], O);
                O += R[D].length;
              }
              return K;
            case "nodebuffer":
              return Buffer.concat(R);
            default:
              throw new Error("concat : unsupported type '" + A + "'");
          }
        }(C, E), F);
        _(N);
      } catch (A) {
        S(A);
      }
      E = [];
    }).resume();
  });
}
function g(x, y, _) {
  var S = y;
  switch (y) {
    case "blob":
    case "arraybuffer":
      S = "uint8array";
      break;
    case "base64":
      S = "string";
  }
  try {
    this._internalType = S;
    this._outputType = y;
    this._mimeType = _;
    s.checkSupport(S);
    this._worker = x.pipe(new o(S));
    x.lock();
  } catch (E) {
    this._worker = new l("error");
    this._worker.error(E);
  }
}
g.prototype = {
  accumulate: function (x) {
    return m(this, x);
  },
  on: function (x, y) {
    var _ = this;
    if (x === "data") {
      this._worker.on(x, function (S) {
        y.call(_, S.data, S.meta);
      });
    } else {
      this._worker.on(x, function () {
        s.delay(y, arguments, _);
      });
    }
    return this;
  },
  resume: function () {
    s.delay(this._worker.resume, [], this._worker);
    return this;
  },
  pause: function () {
    this._worker.pause();
    return this;
  },
  toNodejsStream: function (x) {
    s.checkSupport("nodestream");
    if (this._outputType !== "nodebuffer") {
      throw new Error(this._outputType + " is not supported by this method");
    }
    return new h(this, {
      objectMode: this._outputType !== "nodebuffer"
    }, x);
  }
};
module.exports = g;