var s = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Uint32Array !== "undefined";
var o = require("pako");
var l = require("./utils");
var c = require("./stream/GenericWorker");
var d = s ? "uint8array" : "array";
function u(h, m) {
  c.call(this, "FlateWorker/" + h);
  this._pako = null;
  this._pakoAction = h;
  this._pakoOptions = m;
  this.meta = {};
}
exports.magic = "\b\0";
l.inherits(u, c);
u.prototype.processChunk = function (h) {
  this.meta = h.meta;
  if (this._pako === null) {
    this._createPako();
  }
  this._pako.push(l.transformTo(d, h.data), false);
};
u.prototype.flush = function () {
  c.prototype.flush.call(this);
  if (this._pako === null) {
    this._createPako();
  }
  this._pako.push([], true);
};
u.prototype.cleanUp = function () {
  c.prototype.cleanUp.call(this);
  this._pako = null;
};
u.prototype._createPako = function () {
  this._pako = new o[this._pakoAction]({
    raw: true,
    level: this._pakoOptions.level || -1
  });
  var h = this;
  this._pako.onData = function (m) {
    h.push({
      data: m,
      meta: h.meta
    });
  };
};
exports.compressWorker = function (h) {
  return new u("Deflate", h);
};
exports.uncompressWorker = function () {
  return new u("Inflate", {});
};