var s = require("../compressions");
var o = require("./ZipFileWorker");
exports.generateWorker = function (l, c, d) {
  var u = new o(c.streamFiles, d, c.platform, c.encodeFileName);
  var h = 0;
  try {
    l.forEach(function (m, g) {
      h++;
      var x = function (E, C) {
        var k = E || C;
        var F = s[k];
        if (!F) {
          throw new Error(k + " is not a valid compression method !");
        }
        return F;
      }(g.options.compression, c.compression);
      var y = g.options.compressionOptions || c.compressionOptions || {};
      var _ = g.dir;
      var S = g.date;
      g._compressWorker(x, y).withStreamInfo("file", {
        name: m,
        dir: _,
        date: S,
        comment: g.comment || "",
        unixPermissions: g.unixPermissions,
        dosPermissions: g.dosPermissions
      }).pipe(u);
    });
    u.entriesCount = h;
  } catch (m) {
    u.error(m);
  }
  return u;
};