var s = require("./utils");
var o = require("./external");
var l = require("./utf8");
var c = require("./zipEntries");
var d = require("./stream/Crc32Probe");
var u = require("./nodejsUtils");
function h(m) {
  return new o.Promise(function (g, x) {
    var y = m.decompressed.getContentWorker().pipe(new d());
    y.on("error", function (_) {
      x(_);
    }).on("end", function () {
      if (y.streamInfo.crc32 !== m.decompressed.crc32) {
        x(new Error("Corrupted zip : CRC32 mismatch"));
      } else {
        g();
      }
    }).resume();
  });
}
module.exports = function (m, g) {
  var x = this;
  g = s.extend(g || {}, {
    base64: false,
    checkCRC32: false,
    optimizedBinaryString: false,
    createFolders: false,
    decodeFileName: l.utf8decode
  });
  if (u.isNode && u.isStream(m)) {
    return o.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file."));
  } else {
    return s.prepareContent("the loaded zip file", m, true, g.optimizedBinaryString, g.base64).then(function (y) {
      var _ = new c(g);
      _.load(y);
      return _;
    }).then(function (y) {
      var _ = [o.Promise.resolve(y)];
      var S = y.files;
      if (g.checkCRC32) {
        for (var E = 0; E < S.length; E++) {
          _.push(h(S[E]));
        }
      }
      return o.Promise.all(_);
    }).then(function (y) {
      var _ = y.shift();
      for (var S = _.files, E = 0; E < S.length; E++) {
        var C = S[E];
        var k = C.fileNameStr;
        var F = s.resolve(C.fileNameStr);
        x.file(F, C.decompressed, {
          binary: true,
          optimizedBinaryString: true,
          date: C.date,
          dir: C.dir,
          comment: C.fileCommentStr.length ? C.fileCommentStr : null,
          unixPermissions: C.unixPermissions,
          dosPermissions: C.dosPermissions,
          createFolders: g.createFolders
        });
        if (!C.dir) {
          x.file(F).unsafeOriginalName = k;
        }
      }
      if (_.zipComment.length) {
        x.comment = _.zipComment;
      }
      return x;
    });
  }
};