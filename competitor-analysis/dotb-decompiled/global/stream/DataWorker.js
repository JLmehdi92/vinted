var s = require("../utils");
var o = require("./GenericWorker");
function l(c) {
  o.call(this, "DataWorker");
  var d = this;
  this.dataIsReady = false;
  this.index = 0;
  this.max = 0;
  this.data = null;
  this.type = "";
  this._tickScheduled = false;
  c.then(function (u) {
    d.dataIsReady = true;
    d.data = u;
    d.max = u && u.length || 0;
    d.type = s.getTypeOf(u);
    if (!d.isPaused) {
      d._tickAndRepeat();
    }
  }, function (u) {
    d.error(u);
  });
}
s.inherits(l, o);
l.prototype.cleanUp = function () {
  o.prototype.cleanUp.call(this);
  this.data = null;
};
l.prototype.resume = function () {
  return !!o.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = true, s.delay(this._tickAndRepeat, [], this)), true);
};
l.prototype._tickAndRepeat = function () {
  this._tickScheduled = false;
  if (!this.isPaused && !this.isFinished) {
    this._tick();
    if (!this.isFinished) {
      s.delay(this._tickAndRepeat, [], this);
      this._tickScheduled = true;
    }
  }
};
l.prototype._tick = function () {
  if (this.isPaused || this.isFinished) {
    return false;
  }
  var c = null;
  var d = Math.min(this.max, this.index + 16384);
  if (this.index >= this.max) {
    return this.end();
  }
  switch (this.type) {
    case "string":
      c = this.data.substring(this.index, d);
      break;
    case "uint8array":
      c = this.data.subarray(this.index, d);
      break;
    case "array":
    case "nodebuffer":
      c = this.data.slice(this.index, d);
  }
  this.index = d;
  return this.push({
    data: c,
    meta: {
      percent: this.max ? this.index / this.max * 100 : 0
    }
  });
};
module.exports = l;