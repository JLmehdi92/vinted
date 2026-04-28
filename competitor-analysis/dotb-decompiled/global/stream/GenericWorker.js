function s(o) {
  this.name = o || "default";
  this.streamInfo = {};
  this.generatedError = null;
  this.extraStreamInfo = {};
  this.isPaused = true;
  this.isFinished = false;
  this.isLocked = false;
  this._listeners = {
    data: [],
    end: [],
    error: []
  };
  this.previous = null;
}
s.prototype = {
  push: function (o) {
    this.emit("data", o);
  },
  end: function () {
    if (this.isFinished) {
      return false;
    }
    this.flush();
    try {
      this.emit("end");
      this.cleanUp();
      this.isFinished = true;
    } catch (o) {
      this.emit("error", o);
    }
    return true;
  },
  error: function (o) {
    return !this.isFinished && (this.isPaused ? this.generatedError = o : (this.isFinished = true, this.emit("error", o), this.previous && this.previous.error(o), this.cleanUp()), true);
  },
  on: function (o, l) {
    this._listeners[o].push(l);
    return this;
  },
  cleanUp: function () {
    this.streamInfo = this.generatedError = this.extraStreamInfo = null;
    this._listeners = [];
  },
  emit: function (o, l) {
    if (this._listeners[o]) {
      for (var c = 0; c < this._listeners[o].length; c++) {
        this._listeners[o][c].call(this, l);
      }
    }
  },
  pipe: function (o) {
    return o.registerPrevious(this);
  },
  registerPrevious: function (o) {
    if (this.isLocked) {
      throw new Error("The stream '" + this + "' has already been used.");
    }
    this.streamInfo = o.streamInfo;
    this.mergeStreamInfo();
    this.previous = o;
    var l = this;
    o.on("data", function (c) {
      l.processChunk(c);
    });
    o.on("end", function () {
      l.end();
    });
    o.on("error", function (c) {
      l.error(c);
    });
    return this;
  },
  pause: function () {
    return !this.isPaused && !this.isFinished && (this.isPaused = true, this.previous && this.previous.pause(), true);
  },
  resume: function () {
    if (!this.isPaused || this.isFinished) {
      return false;
    }
    var o = this.isPaused = false;
    if (this.generatedError) {
      this.error(this.generatedError);
      o = true;
    }
    if (this.previous) {
      this.previous.resume();
    }
    return !o;
  },
  flush: function () {},
  processChunk: function (o) {
    this.push(o);
  },
  withStreamInfo: function (o, l) {
    this.extraStreamInfo[o] = l;
    this.mergeStreamInfo();
    return this;
  },
  mergeStreamInfo: function () {
    for (var o in this.extraStreamInfo) {
      if (Object.prototype.hasOwnProperty.call(this.extraStreamInfo, o)) {
        this.streamInfo[o] = this.extraStreamInfo[o];
      }
    }
  },
  lock: function () {
    if (this.isLocked) {
      throw new Error("The stream '" + this + "' has already been used.");
    }
    this.isLocked = true;
    if (this.previous) {
      this.previous.lock();
    }
  },
  toString: function () {
    var o = "Worker " + this.name;
    if (this.previous) {
      return this.previous + " -> " + o;
    } else {
      return o;
    }
  }
};
module.exports = s;