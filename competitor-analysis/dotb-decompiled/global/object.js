function s(F, N, A) {
  var R;
  var D = l.getTypeOf(N);
  var O = l.extend(A || {}, u);
  O.date = O.date || new Date();
  if (O.compression !== null) {
    O.compression = O.compression.toUpperCase();
  }
  if (typeof O.unixPermissions == "string") {
    O.unixPermissions = parseInt(O.unixPermissions, 8);
  }
  if (O.unixPermissions && O.unixPermissions & 16384) {
    O.dir = true;
  }
  if (O.dosPermissions && O.dosPermissions & 16) {
    O.dir = true;
  }
  if (O.dir) {
    F = S(F);
  }
  if (O.createFolders && (R = _(F))) {
    E.call(this, R, true);
  }
  var K = D === "string" && O.binary === false && O.base64 === false;
  if (!A || A.binary === undefined) {
    O.binary = !K;
  }
  if (N instanceof h && N.uncompressedSize === 0 || O.dir || !N || N.length === 0) {
    O.base64 = false;
    O.binary = true;
    N = "";
    O.compression = "STORE";
    D = "string";
  }
  var B = null;
  B = N instanceof h || N instanceof c ? N : x.isNode && x.isStream(N) ? new y(F, N) : l.prepareContent(F, N, O.binary, O.optimizedBinaryString, O.base64);
  var z = new m(F, B, O);
  this.files[F] = z;
}
var o = require("./utf8");
var l = require("./utils");
var c = require("./stream/GenericWorker");
var d = require("./stream/StreamHelper");
var u = require("./defaults");
var h = require("./compressedObject");
var m = require("./zipObject");
var g = require("./generate");
var x = require("./nodejsUtils");
var y = require("./nodejs/NodejsStreamInputAdapter");
function _(F) {
  if (F.slice(-1) === "/") {
    F = F.substring(0, F.length - 1);
  }
  var N = F.lastIndexOf("/");
  if (N > 0) {
    return F.substring(0, N);
  } else {
    return "";
  }
}
function S(F) {
  if (F.slice(-1) !== "/") {
    F += "/";
  }
  return F;
}
function E(F, N) {
  N = N !== undefined ? N : u.createFolders;
  F = S(F);
  if (!this.files[F]) {
    s.call(this, F, null, {
      dir: true,
      createFolders: N
    });
  }
  return this.files[F];
}
function C(F) {
  return Object.prototype.toString.call(F) === "[object RegExp]";
}
var k = {
  load: function () {
    throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
  },
  forEach: function (F) {
    var N;
    var A;
    var R;
    for (N in this.files) {
      R = this.files[N];
      if ((A = N.slice(this.root.length, N.length)) && N.slice(0, this.root.length) === this.root) {
        F(A, R);
      }
    }
  },
  filter: function (F) {
    var N = [];
    this.forEach(function (A, R) {
      if (F(A, R)) {
        N.push(R);
      }
    });
    return N;
  },
  file: function (F, N, A) {
    if (arguments.length !== 1) {
      F = this.root + F;
      s.call(this, F, N, A);
      return this;
    }
    if (C(F)) {
      var R = F;
      return this.filter(function (O, K) {
        return !K.dir && R.test(O);
      });
    }
    var D = this.files[this.root + F];
    if (D && !D.dir) {
      return D;
    } else {
      return null;
    }
  },
  folder: function (F) {
    if (!F) {
      return this;
    }
    if (C(F)) {
      return this.filter(function (D, O) {
        return O.dir && F.test(D);
      });
    }
    var N = this.root + F;
    var A = E.call(this, N);
    var R = this.clone();
    R.root = A.name;
    return R;
  },
  remove: function (F) {
    F = this.root + F;
    var N = this.files[F];
    if (!N) {
      if (F.slice(-1) !== "/") {
        F += "/";
      }
      N = this.files[F];
    }
    if (N && !N.dir) {
      delete this.files[F];
    } else {
      for (var A = this.filter(function (D, O) {
          return O.name.slice(0, F.length) === F;
        }), R = 0; R < A.length; R++) {
        delete this.files[A[R].name];
      }
    }
    return this;
  },
  generate: function () {
    throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
  },
  generateInternalStream: function (F) {
    var N;
    var A = {};
    try {
      (A = l.extend(F || {}, {
        streamFiles: false,
        compression: "STORE",
        compressionOptions: null,
        type: "",
        platform: "DOS",
        comment: null,
        mimeType: "application/zip",
        encodeFileName: o.utf8encode
      })).type = A.type.toLowerCase();
      A.compression = A.compression.toUpperCase();
      if (A.type === "binarystring") {
        A.type = "string";
      }
      if (!A.type) {
        throw new Error("No output type specified.");
      }
      l.checkSupport(A.type);
      if (A.platform === "darwin" || A.platform === "freebsd" || A.platform === "linux" || A.platform === "sunos") {
        A.platform = "UNIX";
      }
      if (A.platform === "win32") {
        A.platform = "DOS";
      }
      var R = A.comment || this.comment || "";
      N = g.generateWorker(this, A, R);
    } catch (D) {
      (N = new c("error")).error(D);
    }
    return new d(N, A.type || "string", A.mimeType);
  },
  generateAsync: function (F, N) {
    return this.generateInternalStream(F).accumulate(N);
  },
  generateNodeStream: function (F, N) {
    if (!(F = F || {}).type) {
      F.type = "nodebuffer";
    }
    return this.generateInternalStream(F).toNodejsStream(N);
  }
};
module.exports = k;