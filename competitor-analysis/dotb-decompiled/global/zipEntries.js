var s = require("./reader/readerFor");
var o = require("./utils");
var l = require("./signature");
var c = require("./zipEntry");
var d = require("./support");
function u(h) {
  this.files = [];
  this.loadOptions = h;
}
u.prototype = {
  checkSignature: function (h) {
    if (!this.reader.readAndCheckSignature(h)) {
      this.reader.index -= 4;
      var m = this.reader.readString(4);
      throw new Error("Corrupted zip or bug: unexpected signature (" + o.pretty(m) + ", expected " + o.pretty(h) + ")");
    }
  },
  isSignature: function (h, m) {
    var g = this.reader.index;
    this.reader.setIndex(h);
    var x = this.reader.readString(4) === m;
    this.reader.setIndex(g);
    return x;
  },
  readBlockEndOfCentral: function () {
    this.diskNumber = this.reader.readInt(2);
    this.diskWithCentralDirStart = this.reader.readInt(2);
    this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
    this.centralDirRecords = this.reader.readInt(2);
    this.centralDirSize = this.reader.readInt(4);
    this.centralDirOffset = this.reader.readInt(4);
    this.zipCommentLength = this.reader.readInt(2);
    var h = this.reader.readData(this.zipCommentLength);
    var m = d.uint8array ? "uint8array" : "array";
    var g = o.transformTo(m, h);
    this.zipComment = this.loadOptions.decodeFileName(g);
  },
  readBlockZip64EndOfCentral: function () {
    this.zip64EndOfCentralSize = this.reader.readInt(8);
    this.reader.skip(4);
    this.diskNumber = this.reader.readInt(4);
    this.diskWithCentralDirStart = this.reader.readInt(4);
    this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
    this.centralDirRecords = this.reader.readInt(8);
    this.centralDirSize = this.reader.readInt(8);
    this.centralDirOffset = this.reader.readInt(8);
    this.zip64ExtensibleData = {};
    var h;
    var m;
    var g;
    for (var x = this.zip64EndOfCentralSize - 44; x > 0;) {
      h = this.reader.readInt(2);
      m = this.reader.readInt(4);
      g = this.reader.readData(m);
      this.zip64ExtensibleData[h] = {
        id: h,
        length: m,
        value: g
      };
    }
  },
  readBlockZip64EndOfCentralLocator: function () {
    this.diskWithZip64CentralDirStart = this.reader.readInt(4);
    this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
    this.disksCount = this.reader.readInt(4);
    if (this.disksCount > 1) {
      throw new Error("Multi-volumes zip are not supported");
    }
  },
  readLocalFiles: function () {
    var h;
    var m;
    for (h = 0; h < this.files.length; h++) {
      m = this.files[h];
      this.reader.setIndex(m.localHeaderOffset);
      this.checkSignature(l.LOCAL_FILE_HEADER);
      m.readLocalPart(this.reader);
      m.handleUTF8();
      m.processAttributes();
    }
  },
  readCentralDir: function () {
    var h;
    for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(l.CENTRAL_FILE_HEADER);) {
      (h = new c({
        zip64: this.zip64
      }, this.loadOptions)).readCentralPart(this.reader);
      this.files.push(h);
    }
    if (this.centralDirRecords !== this.files.length && this.centralDirRecords !== 0 && this.files.length === 0) {
      throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
    }
  },
  readEndOfCentral: function () {
    var h = this.reader.lastIndexOfSignature(l.CENTRAL_DIRECTORY_END);
    if (h < 0) {
      throw this.isSignature(0, l.LOCAL_FILE_HEADER) ? new Error("Corrupted zip: can't find end of central directory") : new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
    }
    this.reader.setIndex(h);
    var m = h;
    this.checkSignature(l.CENTRAL_DIRECTORY_END);
    this.readBlockEndOfCentral();
    if (this.diskNumber === o.MAX_VALUE_16BITS || this.diskWithCentralDirStart === o.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === o.MAX_VALUE_16BITS || this.centralDirRecords === o.MAX_VALUE_16BITS || this.centralDirSize === o.MAX_VALUE_32BITS || this.centralDirOffset === o.MAX_VALUE_32BITS) {
      this.zip64 = true;
      if ((h = this.reader.lastIndexOfSignature(l.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) {
        throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
      }
      this.reader.setIndex(h);
      this.checkSignature(l.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
      this.readBlockZip64EndOfCentralLocator();
      if (!this.isSignature(this.relativeOffsetEndOfZip64CentralDir, l.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(l.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) {
        throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
      }
      this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
      this.checkSignature(l.ZIP64_CENTRAL_DIRECTORY_END);
      this.readBlockZip64EndOfCentral();
    }
    var g = this.centralDirOffset + this.centralDirSize;
    if (this.zip64) {
      g += 20;
      g += 12 + this.zip64EndOfCentralSize;
    }
    var x = m - g;
    if (x > 0) {
      if (!this.isSignature(m, l.CENTRAL_FILE_HEADER)) {
        this.reader.zero = x;
      }
    } else if (x < 0) {
      throw new Error("Corrupted zip: missing " + Math.abs(x) + " bytes.");
    }
  },
  prepareReader: function (h) {
    this.reader = s(h);
  },
  load: function (h) {
    this.prepareReader(h);
    this.readEndOfCentral();
    this.readCentralDir();
    this.readLocalFiles();
  }
};
module.exports = u;