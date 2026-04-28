var s = require("readable-stream").Readable;
function o(l, c, d) {
  s.call(this, c);
  this._helper = l;
  var u = this;
  l.on("data", function (h, m) {
    if (!u.push(h)) {
      u._helper.pause();
    }
    if (d) {
      d(m);
    }
  }).on("error", function (h) {
    u.emit("error", h);
  }).on("end", function () {
    u.push(null);
  });
}
require("../utils").inherits(o, s);
o.prototype._read = function () {
  this._helper.resume();
};
module.exports = o;