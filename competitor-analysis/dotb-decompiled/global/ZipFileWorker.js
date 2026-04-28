function s(g, x) {
  var y;
  var _ = "";
  for (y = 0; y < x; y++) {
    _ += String.fromCharCode(g & 255);
    g >>>= 8;
  }
  return _;
}
function o(g, x, y, _, S, E) {
  var C;
  var k;
  var F = g.file;
  var N = g.compression;
  var A = E !== d.utf8encode;
  var R = l.transformTo("string", E(F.name));
  var D = l.transformTo("string", d.utf8encode(F.name));
  var O = F.comment;
  var K = l.transformTo("string", E(O));
  var B = l.transformTo("string", d.utf8encode(O));
  var z = D.length !== F.name.length;
  var T = B.length !== O.length;
  var X = "";
  var Q = "";
  var q = "";
  var U = F.dir;
  var Y = F.date;
  var ce = {
    crc32: 0,
    compressedSize: 0,
    uncompressedSize: 0
  };
  if (!x || !!y) {
    ce.crc32 = g.crc32;
    ce.compressedSize = g.compressedSize;
    ce.uncompressedSize = g.uncompressedSize;
  }
  var G = 0;
  if (x) {
    G |= 8;
  }
  if (!A && (!!z || !!T)) {
    G |= 2048;
  }
  var V = 0;
  var ne = 0;
  if (U) {
    V |= 16;
  }
  if (S === "UNIX") {
    ne = 798;
    V |= function (Z, me) {
      var ue = Z;
      if (!Z) {
        ue = me ? 16893 : 33204;
      }
      return (ue & 65535) << 16;
    }(F.unixPermissions, U);
  } else {
    ne = 20;
    V |= function (Z) {
      return (Z || 0) & 63;
    }(F.dosPermissions);
  }
  C = Y.getUTCHours();
  C <<= 6;
  C |= Y.getUTCMinutes();
  C <<= 5;
  C |= Y.getUTCSeconds() / 2;
  k = Y.getUTCFullYear() - 1980;
  k <<= 4;
  k |= Y.getUTCMonth() + 1;
  k <<= 5;
  k |= Y.getUTCDate();
  if (z) {
    Q = s(1, 1) + s(u(R), 4) + D;
    X += "up" + s(Q.length, 2) + Q;
  }
  if (T) {
    q = s(1, 1) + s(u(K), 4) + B;
    X += "uc" + s(q.length, 2) + q;
  }
  var J = "";
  J += `
\0`;
  J += s(G, 2);
  J += N.magic;
  J += s(C, 2);
  J += s(k, 2);
  J += s(ce.crc32, 4);
  J += s(ce.compressedSize, 4);
  J += s(ce.uncompressedSize, 4);
  J += s(R.length, 2);
  J += s(X.length, 2);
  return {
    fileRecord: h.LOCAL_FILE_HEADER + J + R + X,
    dirRecord: h.CENTRAL_FILE_HEADER + s(ne, 2) + J + s(K.length, 2) + "\0\0\0\0" + s(V, 4) + s(_, 4) + R + X + K
  };
}
var l = require("../utils");
var c = require("../stream/GenericWorker");
var d = require("../utf8");
var u = require("../crc32");
var h = require("../signature");
function m(g, x, y, _) {
  c.call(this, "ZipFileWorker");
  this.bytesWritten = 0;
  this.zipComment = x;
  this.zipPlatform = y;
  this.encodeFileName = _;
  this.streamFiles = g;
  this.accumulate = false;
  this.contentBuffer = [];
  this.dirRecords = [];
  this.currentSourceOffset = 0;
  this.entriesCount = 0;
  this.currentFile = null;
  this._sources = [];
}
l.inherits(m, c);
m.prototype.push = function (g) {
  var x = g.meta.percent || 0;
  var y = this.entriesCount;
  var _ = this._sources.length;
  if (this.accumulate) {
    this.contentBuffer.push(g);
  } else {
    this.bytesWritten += g.data.length;
    c.prototype.push.call(this, {
      data: g.data,
      meta: {
        currentFile: this.currentFile,
        percent: y ? (x + (y - _ - 1) * 100) / y : 100
      }
    });
  }
};
m.prototype.openedSource = function (g) {
  this.currentSourceOffset = this.bytesWritten;
  this.currentFile = g.file.name;
  var x = this.streamFiles && !g.file.dir;
  if (x) {
    var y = o(g, x, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
    this.push({
      data: y.fileRecord,
      meta: {
        percent: 0
      }
    });
  } else {
    this.accumulate = true;
  }
};
m.prototype.closedSource = function (g) {
  this.accumulate = false;
  var x = this.streamFiles && !g.file.dir;
  var y = o(g, x, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
  this.dirRecords.push(y.dirRecord);
  if (x) {
    this.push({
      data: function (_) {
        return h.DATA_DESCRIPTOR + s(_.crc32, 4) + s(_.compressedSize, 4) + s(_.uncompressedSize, 4);
      }(g),
      meta: {
        percent: 100
      }
    });
  } else {
    for (this.push({
      data: y.fileRecord,
      meta: {
        percent: 0
      }
    }); this.contentBuffer.length;) {
      this.push(this.contentBuffer.shift());
    }
  }
  this.currentFile = null;
};
m.prototype.flush = function () {
  var g = this.bytesWritten;
  for (var x = 0; x < this.dirRecords.length; x++) {
    this.push({
      data: this.dirRecords[x],
      meta: {
        percent: 100
      }
    });
  }
  var y = this.bytesWritten - g;
  var _ = function (S, E, C, k, F) {
    var N = l.transformTo("string", F(k));
    return h.CENTRAL_DIRECTORY_END + "\0\0\0\0" + s(S, 2) + s(S, 2) + s(E, 4) + s(C, 4) + s(N.length, 2) + N;
  }(this.dirRecords.length, y, g, this.zipComment, this.encodeFileName);
  this.push({
    data: _,
    meta: {
      percent: 100
    }
  });
};
m.prototype.prepareNextSource = function () {
  this.previous = this._sources.shift();
  this.openedSource(this.previous.streamInfo);
  if (this.isPaused) {
    this.previous.pause();
  } else {
    this.previous.resume();
  }
};
m.prototype.registerPrevious = function (g) {
  this._sources.push(g);
  var x = this;
  g.on("data", function (y) {
    x.processChunk(y);
  });
  g.on("end", function () {
    x.closedSource(x.previous.streamInfo);
    if (x._sources.length) {
      x.prepareNextSource();
    } else {
      x.end();
    }
  });
  g.on("error", function (y) {
    x.error(y);
  });
  return this;
};
m.prototype.resume = function () {
  return !!c.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), true) : this.previous || this._sources.length || this.generatedError ? undefined : (this.end(), true));
};
m.prototype.error = function (g) {
  var x = this._sources;
  if (!c.prototype.error.call(this, g)) {
    return false;
  }
  for (var y = 0; y < x.length; y++) {
    try {
      x[y].error(g);
    } catch {}
  }
  return true;
};
m.prototype.lock = function () {
  c.prototype.lock.call(this);
  for (var g = this._sources, x = 0; x < g.length; x++) {
    g[x].lock();
  }
};
module.exports = m;