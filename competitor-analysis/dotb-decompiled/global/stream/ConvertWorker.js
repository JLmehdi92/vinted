var s = require("./GenericWorker");
var o = require("../utils");
function l(c) {
  s.call(this, "ConvertWorker to " + c);
  this.destType = c;
}
o.inherits(l, s);
l.prototype.processChunk = function (c) {
  this.push({
    data: o.transformTo(this.destType, c.data),
    meta: c.meta
  });
};
module.exports = l;