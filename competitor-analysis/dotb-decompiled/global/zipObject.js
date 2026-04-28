function s(x, y, _) {
  this.name = x;
  this.dir = _.dir;
  this.date = _.date;
  this.comment = _.comment;
  this.unixPermissions = _.unixPermissions;
  this.dosPermissions = _.dosPermissions;
  this._data = y;
  this._dataBinary = _.binary;
  this.options = {
    compression: _.compression,
    compressionOptions: _.compressionOptions
  };
}
var o = require("./stream/StreamHelper");
var l = require("./stream/DataWorker");
var c = require("./utf8");
var d = require("./compressedObject");
var u = require("./stream/GenericWorker");
s.prototype = {
  internalStream: function (x) {
    var y = null;
    var _ = "string";
    try {
      if (!x) {
        throw new Error("No output type specified.");
      }
      var S = (_ = x.toLowerCase()) === "string" || _ === "text";
      if (_ === "binarystring" || _ === "text") {
        _ = "string";
      }
      y = this._decompressWorker();
      var E = !this._dataBinary;
      if (E && !S) {
        y = y.pipe(new c.Utf8EncodeWorker());
      }
      if (!E && S) {
        y = y.pipe(new c.Utf8DecodeWorker());
      }
    } catch (C) {
      (y = new u("error")).error(C);
    }
    return new o(y, _, "");
  },
  async: function (x, y) {
    return this.internalStream(x).accumulate(y);
  },
  nodeStream: function (x, y) {
    return this.internalStream(x || "nodebuffer").toNodejsStream(y);
  },
  _compressWorker: function (x, y) {
    if (this._data instanceof d && this._data.compression.magic === x.magic) {
      return this._data.getCompressedWorker();
    }
    var _ = this._decompressWorker();
    if (!this._dataBinary) {
      _ = _.pipe(new c.Utf8EncodeWorker());
    }
    return d.createWorkerFrom(_, x, y);
  },
  _decompressWorker: function () {
    if (this._data instanceof d) {
      return this._data.getContentWorker();
    } else if (this._data instanceof u) {
      return this._data;
    } else {
      return new l(this._data);
    }
  }
};
for (var h = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], m = function () {
    throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
  }, g = 0; g < h.length; g++) {
  s.prototype[h[g]] = m;
}
module.exports = s;