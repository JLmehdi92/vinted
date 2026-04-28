var s = require("./reader/readerFor");
var o = require("./utils");
var l = require("./compressedObject");
var c = require("./crc32");
var d = require("./utf8");
var u = require("./compressions");
var h = require("./support");
function m(g, x) {
  this.options = g;
  this.loadOptions = x;
}
m.prototype = {
  isEncrypted: function () {
    return (this.bitFlag & 1) == 1;
  },
  useUTF8: function () {
    return (this.bitFlag & 2048) == 2048;
  },
  readLocalPart: function (g) {
    var x;
    var y;
    g.skip(22);
    this.fileNameLength = g.readInt(2);
    y = g.readInt(2);
    this.fileName = g.readData(this.fileNameLength);
    g.skip(y);
    if (this.compressedSize === -1 || this.uncompressedSize === -1) {
      throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
    }
    if ((x = function (_) {
      for (var S in u) {
        if (Object.prototype.hasOwnProperty.call(u, S) && u[S].magic === _) {
          return u[S];
        }
      }
      return null;
    }(this.compressionMethod)) === null) {
      throw new Error("Corrupted zip : compression " + o.pretty(this.compressionMethod) + " unknown (inner file : " + o.transformTo("string", this.fileName) + ")");
    }
    this.decompressed = new l(this.compressedSize, this.uncompressedSize, this.crc32, x, g.readData(this.compressedSize));
  },
  readCentralPart: function (g) {
    this.versionMadeBy = g.readInt(2);
    g.skip(2);
    this.bitFlag = g.readInt(2);
    this.compressionMethod = g.readString(2);
    this.date = g.readDate();
    this.crc32 = g.readInt(4);
    this.compressedSize = g.readInt(4);
    this.uncompressedSize = g.readInt(4);
    var x = g.readInt(2);
    this.extraFieldsLength = g.readInt(2);
    this.fileCommentLength = g.readInt(2);
    this.diskNumberStart = g.readInt(2);
    this.internalFileAttributes = g.readInt(2);
    this.externalFileAttributes = g.readInt(4);
    this.localHeaderOffset = g.readInt(4);
    if (this.isEncrypted()) {
      throw new Error("Encrypted zip are not supported");
    }
    g.skip(x);
    this.readExtraFields(g);
    this.parseZIP64ExtraField(g);
    this.fileComment = g.readData(this.fileCommentLength);
  },
  processAttributes: function () {
    this.unixPermissions = null;
    this.dosPermissions = null;
    var g = this.versionMadeBy >> 8;
    this.dir = !!(this.externalFileAttributes & 16);
    if (g == 0) {
      this.dosPermissions = this.externalFileAttributes & 63;
    }
    if (g == 3) {
      this.unixPermissions = this.externalFileAttributes >> 16 & 65535;
    }
    if (!this.dir && this.fileNameStr.slice(-1) === "/") {
      this.dir = true;
    }
  },
  parseZIP64ExtraField: function () {
    if (this.extraFields[1]) {
      var g = s(this.extraFields[1].value);
      if (this.uncompressedSize === o.MAX_VALUE_32BITS) {
        this.uncompressedSize = g.readInt(8);
      }
      if (this.compressedSize === o.MAX_VALUE_32BITS) {
        this.compressedSize = g.readInt(8);
      }
      if (this.localHeaderOffset === o.MAX_VALUE_32BITS) {
        this.localHeaderOffset = g.readInt(8);
      }
      if (this.diskNumberStart === o.MAX_VALUE_32BITS) {
        this.diskNumberStart = g.readInt(4);
      }
    }
  },
  readExtraFields: function (g) {
    var x;
    var y;
    var _;
    var S = g.index + this.extraFieldsLength;
    for (this.extraFields ||= {}; g.index + 4 < S;) {
      x = g.readInt(2);
      y = g.readInt(2);
      _ = g.readData(y);
      this.extraFields[x] = {
        id: x,
        length: y,
        value: _
      };
    }
    g.setIndex(S);
  },
  handleUTF8: function () {
    var g = h.uint8array ? "uint8array" : "array";
    if (this.useUTF8()) {
      this.fileNameStr = d.utf8decode(this.fileName);
      this.fileCommentStr = d.utf8decode(this.fileComment);
    } else {
      var x = this.findExtraFieldUnicodePath();
      if (x !== null) {
        this.fileNameStr = x;
      } else {
        var y = o.transformTo(g, this.fileName);
        this.fileNameStr = this.loadOptions.decodeFileName(y);
      }
      var _ = this.findExtraFieldUnicodeComment();
      if (_ !== null) {
        this.fileCommentStr = _;
      } else {
        var S = o.transformTo(g, this.fileComment);
        this.fileCommentStr = this.loadOptions.decodeFileName(S);
      }
    }
  },
  findExtraFieldUnicodePath: function () {
    var g = this.extraFields[28789];
    if (g) {
      var x = s(g.value);
      if (x.readInt(1) !== 1 || c(this.fileName) !== x.readInt(4)) {
        return null;
      } else {
        return d.utf8decode(x.readData(g.length - 5));
      }
    }
    return null;
  },
  findExtraFieldUnicodeComment: function () {
    var g = this.extraFields[25461];
    if (g) {
      var x = s(g.value);
      if (x.readInt(1) !== 1 || c(this.fileComment) !== x.readInt(4)) {
        return null;
      } else {
        return d.utf8decode(x.readData(g.length - 5));
      }
    }
    return null;
  }
};
module.exports = m;