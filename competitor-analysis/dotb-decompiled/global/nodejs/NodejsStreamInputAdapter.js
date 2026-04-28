var s = require("../utils");
var o = require("../stream/GenericWorker");
function l(c, d) {
  o.call(this, "Nodejs stream input adapter for " + c);
  this._upstreamEnded = false;
  this._bindStream(d);
}
s.inherits(l, o);
l.prototype._bindStream = function (c) {
  var d = this;
  (this._stream = c).pause();
  c.on("data", function (u) {
    d.push({
      data: u,
      meta: {
        percent: 0
      }
    });
  }).on("error", function (u) {
    if (d.isPaused) {
      this.generatedError = u;
    } else {
      d.error(u);
    }
  }).on("end", function () {
    if (d.isPaused) {
      d._upstreamEnded = true;
    } else {
      d.end();
    }
  });
};
l.prototype.pause = function () {
  return !!o.prototype.pause.call(this) && (this._stream.pause(), true);
};
l.prototype.resume = function () {
  return !!o.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), true);
};
module.exports = l;