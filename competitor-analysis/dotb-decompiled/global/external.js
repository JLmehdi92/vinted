var s = null;
s = typeof Promise !== "undefined" ? Promise : require("lie");
module.exports = {
  Promise: s
};