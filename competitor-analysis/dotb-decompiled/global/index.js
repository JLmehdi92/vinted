function s() {
  if (!(this instanceof s)) {
    return new s();
  }
  if (arguments.length) {
    throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
  }
  this.files = Object.create(null);
  this.comment = null;
  this.root = "";
  this.clone = function () {
    var o = new s();
    for (var l in this) {
      if (typeof this[l] != "function") {
        o[l] = this[l];
      }
    }
    return o;
  };
}
(s.prototype = require("./object")).loadAsync = require("./load");
s.support = require("./support");
s.defaults = require("./defaults");
s.version = "3.10.1";
s.loadAsync = function (o, l) {
  return new s().loadAsync(o, l);
};
s.external = require("./external");
module.exports = s;