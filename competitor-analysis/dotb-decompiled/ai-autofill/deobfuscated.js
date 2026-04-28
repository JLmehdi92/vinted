var aiAutofill = function () {
  "use strict";

  function wm(r, o) {
    for (var i = 0; i < o.length; i++) {
      const l = o[i];
      if (typeof l != "string" && !Array.isArray(l)) {
        for (const c in l) {
          if (c !== "default" && !(c in r)) {
            const f = Object.getOwnPropertyDescriptor(l, c);
            if (f) {
              Object.defineProperty(r, c, f.get ? f : {
                enumerable: true,
                get: () => l[c]
              });
            }
          }
        }
      }
    }
    return Object.freeze(Object.defineProperty(r, Symbol.toStringTag, {
      value: "Module"
    }));
  }
  function go(r, ...o) {}
  const Ka = {
    debug: (...r) => go(console.debug, ...r),
    log: (...r) => go(console.log, ...r),
    warn: (...r) => go(console.warn, ...r),
    error: (...r) => go(console.error, ...r)
  };
  const Em = Symbol("null");
  let Sm = 0;
  class xm extends Map {
    constructor() {
      super();
      this._objectHashes = new WeakMap();
      this._symbolHashes = new Map();
      this._publicKeys = new Map();
      const [o] = arguments;
      if (o != null) {
        if (typeof o[Symbol.iterator] != "function") {
          throw new TypeError(typeof o + " is not iterable (cannot read property Symbol(Symbol.iterator))");
        }
        for (const [i, l] of o) {
          this.set(i, l);
        }
      }
    }
    _getPublicKeys(o, i = false) {
      if (!Array.isArray(o)) {
        throw new TypeError("The keys parameter must be an array");
      }
      const l = this._getPrivateKey(o, i);
      let c;
      if (l && this._publicKeys.has(l)) {
        c = this._publicKeys.get(l);
      } else if (i) {
        c = [...o];
        this._publicKeys.set(l, c);
      }
      return {
        privateKey: l,
        publicKey: c
      };
    }
    _getPrivateKey(o, i = false) {
      const l = [];
      for (let c of o) {
        if (c === null) {
          c = Em;
        }
        const f = typeof c == "object" || typeof c == "function" ? "_objectHashes" : typeof c == "symbol" ? "_symbolHashes" : false;
        if (!f) {
          l.push(c);
        } else if (this[f].has(c)) {
          l.push(this[f].get(c));
        } else if (i) {
          const p = `@@mkm-ref-${Sm++}@@`;
          this[f].set(c, p);
          l.push(p);
        } else {
          return false;
        }
      }
      return JSON.stringify(l);
    }
    set(o, i) {
      const {
        publicKey: l
      } = this._getPublicKeys(o, true);
      return super.set(l, i);
    }
    get(o) {
      const {
        publicKey: i
      } = this._getPublicKeys(o);
      return super.get(i);
    }
    has(o) {
      const {
        publicKey: i
      } = this._getPublicKeys(o);
      return super.has(i);
    }
    delete(o) {
      const {
        publicKey: i,
        privateKey: l
      } = this._getPublicKeys(o);
      return !!i && !!super.delete(i) && !!this._publicKeys.delete(l);
    }
    clear() {
      super.clear();
      this._symbolHashes.clear();
      this._publicKeys.clear();
    }
    get [Symbol.toStringTag]() {
      return "ManyKeysMap";
    }
    get size() {
      return super.size;
    }
  }
  function rs(r) {
    if (r === null || typeof r != "object") {
      return false;
    }
    const o = Object.getPrototypeOf(r);
    if (o !== null && o !== Object.prototype && Object.getPrototypeOf(o) !== null || Symbol.iterator in r) {
      return false;
    } else if (Symbol.toStringTag in r) {
      return Object.prototype.toString.call(r) === "[object Module]";
    } else {
      return true;
    }
  }
  function os(r, o, i = ".", l) {
    if (!rs(o)) {
      return os(r, {}, i, l);
    }
    const c = Object.assign({}, o);
    for (const f in r) {
      if (f === "__proto__" || f === "constructor") {
        continue;
      }
      const p = r[f];
      if (p != null) {
        if (!l || !l(c, f, p, i)) {
          if (Array.isArray(p) && Array.isArray(c[f])) {
            c[f] = [...p, ...c[f]];
          } else if (rs(p) && rs(c[f])) {
            c[f] = os(p, c[f], (i ? `${i}.` : "") + f.toString(), l);
          } else {
            c[f] = p;
          }
        }
      }
    }
    return c;
  }
  function km(r) {
    return (...o) => o.reduce((i, l) => os(i, l, "", r), {});
  }
  const Cm = km();
  const Ha = r => r !== null ? {
    isDetected: true,
    result: r
  } : {
    isDetected: false
  };
  const _m = r => r === null ? {
    isDetected: true,
    result: null
  } : {
    isDetected: false
  };
  const Tm = () => ({
    target: globalThis.document,
    unifyProcess: true,
    detector: Ha,
    observeConfigs: {
      childList: true,
      subtree: true,
      attributes: true
    },
    signal: undefined,
    customMatcher: undefined
  });
  const Rm = (r, o) => Cm(r, o);
  const is = new xm();
  function Pm(r) {
    const {
      defaultOptions: o
    } = r;
    return (i, l) => {
      const {
        target: c,
        unifyProcess: f,
        observeConfigs: p,
        detector: m,
        signal: w,
        customMatcher: v
      } = Rm(l, o);
      const g = [i, c, f, p, m, w, v];
      const T = is.get(g);
      if (f && T) {
        return T;
      }
      const L = new Promise(async (B, C) => {
        if (w?.aborted) {
          return C(w.reason);
        }
        const E = new MutationObserver(async _ => {
          for (const N of _) {
            if (w?.aborted) {
              E.disconnect();
              break;
            }
            const b = await qa({
              selector: i,
              target: c,
              detector: m,
              customMatcher: v
            });
            if (b.isDetected) {
              E.disconnect();
              B(b.result);
              break;
            }
          }
        });
        w?.addEventListener("abort", () => {
          E.disconnect();
          return C(w.reason);
        }, {
          once: true
        });
        const y = await qa({
          selector: i,
          target: c,
          detector: m,
          customMatcher: v
        });
        if (y.isDetected) {
          return B(y.result);
        }
        E.observe(c, p);
      }).finally(() => {
        is.delete(g);
      });
      is.set(g, L);
      return L;
    };
  }
  async function qa({
    target: r,
    selector: o,
    detector: i,
    customMatcher: l
  }) {
    const c = l ? l(o) : r.querySelector(o);
    return await i(c);
  }
  const Nm = Pm({
    defaultOptions: Tm()
  });
  function Om(r, o, i) {
    if (i.position !== "inline") {
      if (i.zIndex != null) {
        r.style.zIndex = String(i.zIndex);
      }
      r.style.overflow = "visible";
      r.style.position = "relative";
      r.style.width = "0";
      r.style.height = "0";
      r.style.display = "block";
    }
  }
  function ss(r) {
    if (r.anchor == null) {
      return document.body;
    }
    let o = typeof r.anchor == "function" ? r.anchor() : r.anchor;
    if (typeof o == "string") {
      if (o.startsWith("/")) {
        return document.evaluate(o, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue ?? undefined;
      } else {
        return document.querySelector(o) ?? undefined;
      }
    } else {
      return o ?? undefined;
    }
  }
  function Am(r, o) {
    const i = ss(o);
    if (i == null) {
      throw Error("Failed to mount content script UI: could not find anchor element");
    }
    switch (o.append) {
      case undefined:
      case "last":
        i.append(r);
        break;
      case "first":
        i.prepend(r);
        break;
      case "replace":
        i.replaceWith(r);
        break;
      case "after":
        i.parentElement?.insertBefore(r, i.nextElementSibling);
        break;
      case "before":
        i.parentElement?.insertBefore(r, i);
        break;
      default:
        o.append(i, r);
        break;
    }
  }
  function Im(r, o) {
    let i;
    const l = () => {
      i?.stopAutoMount();
      i = undefined;
    };
    const c = () => {
      r.mount();
    };
    const f = r.remove;
    return {
      mount: c,
      remove: () => {
        l();
        r.remove();
      },
      autoMount: w => {
        if (i) {
          Ka.warn("autoMount is already set.");
        }
        i = Lm({
          mount: c,
          unmount: f,
          stopAutoMount: l
        }, {
          ...o,
          ...w
        });
      }
    };
  }
  function Lm(r, o) {
    const i = new AbortController();
    const l = "explicit_stop_auto_mount";
    const c = () => {
      i.abort(l);
      o.onStop?.();
    };
    let f = typeof o.anchor == "function" ? o.anchor() : o.anchor;
    if (f instanceof Element) {
      throw Error("autoMount and Element anchor option cannot be combined. Avoid passing `Element` directly or `() => Element` to the anchor.");
    }
    async function p(m) {
      let w = !!ss(o);
      for (w && r.mount(); !i.signal.aborted;) {
        try {
          w = !!(await Nm(m ?? "body", {
            customMatcher: () => ss(o) ?? null,
            detector: w ? _m : Ha,
            signal: i.signal
          }));
          if (w) {
            r.mount();
          } else {
            r.unmount();
            if (o.once) {
              r.stopAutoMount();
            }
          }
        } catch (v) {
          if (i.signal.aborted && i.signal.reason === l) {
            break;
          }
          throw v;
        }
      }
    }
    p(f);
    return {
      stopAutoMount: c
    };
  }
  function Mm(r, o) {
    const i = document.createElement(o.tag || "div");
    let l;
    const c = () => {
      Om(i, undefined, o);
      Am(i, o);
      l = o.onMount?.(i);
    };
    const f = () => {
      o.onRemove?.(l);
      i.replaceChildren();
      i.remove();
      l = undefined;
    };
    const p = Im({
      mount: c,
      remove: f
    }, o);
    r.onInvalidated(f);
    return {
      get mounted() {
        return l;
      },
      wrapper: i,
      ...p
    };
  }
  function KE(r) {
    return r;
  }
  const Ht = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
  async function Dm(r, o) {
    const i = Ht.runtime.getURL(r);
    const l = document.createElement("script");
    if (Ht.runtime.getManifest().manifest_version === 2) {
      l.text = await fetch(i).then(f => f.text());
    } else {
      l.src = i;
    }
    const c = bm(l);
    await o?.modifyScript?.(l);
    (document.head ?? document.documentElement).append(l);
    if (!o?.keepInDom) {
      l.remove();
    }
    await c;
    return {
      script: l
    };
  }
  function bm(r) {
    return new Promise((o, i) => {
      const l = () => {
        o();
        f();
      };
      const c = () => {
        i(new Error(`Failed to load script: ${r.src}`));
        f();
      };
      const f = () => {
        r.removeEventListener("load", l);
        r.removeEventListener("error", c);
      };
      r.addEventListener("load", l);
      r.addEventListener("error", c);
    });
  }
  function ls(r) {
    if (r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default")) {
      return r.default;
    } else {
      return r;
    }
  }
  var as = {
    exports: {}
  };
  var gr = {};
  var us = {
    exports: {}
  };
  var ve = {};
  var Ga;
  function Fm() {
    if (Ga) {
      return ve;
    }
    Ga = 1;
    var r = Symbol.for("react.element");
    var o = Symbol.for("react.portal");
    var i = Symbol.for("react.fragment");
    var l = Symbol.for("react.strict_mode");
    var c = Symbol.for("react.profiler");
    var f = Symbol.for("react.provider");
    var p = Symbol.for("react.context");
    var m = Symbol.for("react.forward_ref");
    var w = Symbol.for("react.suspense");
    var v = Symbol.for("react.memo");
    var g = Symbol.for("react.lazy");
    var T = Symbol.iterator;
    function L(k) {
      if (k === null || typeof k != "object") {
        return null;
      } else {
        k = T && k[T] || k["@@iterator"];
        if (typeof k == "function") {
          return k;
        } else {
          return null;
        }
      }
    }
    var B = {
      isMounted: function () {
        return false;
      },
      enqueueForceUpdate: function () {},
      enqueueReplaceState: function () {},
      enqueueSetState: function () {}
    };
    var C = Object.assign;
    var E = {};
    function y(k, F, Z) {
      this.props = k;
      this.context = F;
      this.refs = E;
      this.updater = Z || B;
    }
    y.prototype.isReactComponent = {};
    y.prototype.setState = function (k, F) {
      if (typeof k != "object" && typeof k != "function" && k != null) {
        throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
      }
      this.updater.enqueueSetState(this, k, F, "setState");
    };
    y.prototype.forceUpdate = function (k) {
      this.updater.enqueueForceUpdate(this, k, "forceUpdate");
    };
    function _() {}
    _.prototype = y.prototype;
    function N(k, F, Z) {
      this.props = k;
      this.context = F;
      this.refs = E;
      this.updater = Z || B;
    }
    var b = N.prototype = new _();
    b.constructor = N;
    C(b, y.prototype);
    b.isPureReactComponent = true;
    var D = Array.isArray;
    var H = Object.prototype.hasOwnProperty;
    var W = {
      current: null
    };
    var q = {
      key: true,
      ref: true,
      __self: true,
      __source: true
    };
    function $(k, F, Z) {
      var ie;
      var he = {};
      var Ee = null;
      var pe = null;
      if (F != null) {
        if (F.ref !== undefined) {
          pe = F.ref;
        }
        if (F.key !== undefined) {
          Ee = "" + F.key;
        }
        for (ie in F) {
          if (H.call(F, ie) && !q.hasOwnProperty(ie)) {
            he[ie] = F[ie];
          }
        }
      }
      var ke = arguments.length - 2;
      if (ke === 1) {
        he.children = Z;
      } else if (ke > 1) {
        var Re = Array(ke);
        for (var $e = 0; $e < ke; $e++) {
          Re[$e] = arguments[$e + 2];
        }
        he.children = Re;
      }
      if (k && k.defaultProps) {
        ke = k.defaultProps;
        for (ie in ke) {
          if (he[ie] === undefined) {
            he[ie] = ke[ie];
          }
        }
      }
      return {
        $$typeof: r,
        type: k,
        key: Ee,
        ref: pe,
        props: he,
        _owner: W.current
      };
    }
    function de(k, F) {
      return {
        $$typeof: r,
        type: k.type,
        key: F,
        ref: k.ref,
        props: k.props,
        _owner: k._owner
      };
    }
    function ue(k) {
      return typeof k == "object" && k !== null && k.$$typeof === r;
    }
    function Te(k) {
      var F = {
        "=": "=0",
        ":": "=2"
      };
      return "$" + k.replace(/[=:]/g, function (Z) {
        return F[Z];
      });
    }
    var _e = /\/+/g;
    function xe(k, F) {
      if (typeof k == "object" && k !== null && k.key != null) {
        return Te("" + k.key);
      } else {
        return F.toString(36);
      }
    }
    function oe(k, F, Z, ie, he) {
      var Ee = typeof k;
      if (Ee === "undefined" || Ee === "boolean") {
        k = null;
      }
      var pe = false;
      if (k === null) {
        pe = true;
      } else {
        switch (Ee) {
          case "string":
          case "number":
            pe = true;
            break;
          case "object":
            switch (k.$$typeof) {
              case r:
              case o:
                pe = true;
            }
        }
      }
      if (pe) {
        pe = k;
        he = he(pe);
        k = ie === "" ? "." + xe(pe, 0) : ie;
        if (D(he)) {
          Z = "";
          if (k != null) {
            Z = k.replace(_e, "$&/") + "/";
          }
          oe(he, F, Z, "", function ($e) {
            return $e;
          });
        } else if (he != null) {
          if (ue(he)) {
            he = de(he, Z + (!he.key || pe && pe.key === he.key ? "" : ("" + he.key).replace(_e, "$&/") + "/") + k);
          }
          F.push(he);
        }
        return 1;
      }
      pe = 0;
      ie = ie === "" ? "." : ie + ":";
      if (D(k)) {
        for (var ke = 0; ke < k.length; ke++) {
          Ee = k[ke];
          var Re = ie + xe(Ee, ke);
          pe += oe(Ee, F, Z, Re, he);
        }
      } else {
        Re = L(k);
        if (typeof Re == "function") {
          k = Re.call(k);
          ke = 0;
          while (!(Ee = k.next()).done) {
            Ee = Ee.value;
            Re = ie + xe(Ee, ke++);
            pe += oe(Ee, F, Z, Re, he);
          }
        } else if (Ee === "object") {
          F = String(k);
          throw Error("Objects are not valid as a React child (found: " + (F === "[object Object]" ? "object with keys {" + Object.keys(k).join(", ") + "}" : F) + "). If you meant to render a collection of children, use an array instead.");
        }
      }
      return pe;
    }
    function we(k, F, Z) {
      if (k == null) {
        return k;
      }
      var ie = [];
      var he = 0;
      oe(k, ie, "", "", function (Ee) {
        return F.call(Z, Ee, he++);
      });
      return ie;
    }
    function se(k) {
      if (k._status === -1) {
        var F = k._result;
        F = F();
        F.then(function (Z) {
          if (k._status === 0 || k._status === -1) {
            k._status = 1;
            k._result = Z;
          }
        }, function (Z) {
          if (k._status === 0 || k._status === -1) {
            k._status = 2;
            k._result = Z;
          }
        });
        if (k._status === -1) {
          k._status = 0;
          k._result = F;
        }
      }
      if (k._status === 1) {
        return k._result.default;
      }
      throw k._result;
    }
    var me = {
      current: null
    };
    var M = {
      transition: null
    };
    var ne = {
      ReactCurrentDispatcher: me,
      ReactCurrentBatchConfig: M,
      ReactCurrentOwner: W
    };
    function G() {
      throw Error("act(...) is not supported in production builds of React.");
    }
    ve.Children = {
      map: we,
      forEach: function (k, F, Z) {
        we(k, function () {
          F.apply(this, arguments);
        }, Z);
      },
      count: function (k) {
        var F = 0;
        we(k, function () {
          F++;
        });
        return F;
      },
      toArray: function (k) {
        return we(k, function (F) {
          return F;
        }) || [];
      },
      only: function (k) {
        if (!ue(k)) {
          throw Error("React.Children.only expected to receive a single React element child.");
        }
        return k;
      }
    };
    ve.Component = y;
    ve.Fragment = i;
    ve.Profiler = c;
    ve.PureComponent = N;
    ve.StrictMode = l;
    ve.Suspense = w;
    ve.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ne;
    ve.act = G;
    ve.cloneElement = function (k, F, Z) {
      if (k == null) {
        throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + k + ".");
      }
      var ie = C({}, k.props);
      var he = k.key;
      var Ee = k.ref;
      var pe = k._owner;
      if (F != null) {
        if (F.ref !== undefined) {
          Ee = F.ref;
          pe = W.current;
        }
        if (F.key !== undefined) {
          he = "" + F.key;
        }
        if (k.type && k.type.defaultProps) {
          var ke = k.type.defaultProps;
        }
        for (Re in F) {
          if (H.call(F, Re) && !q.hasOwnProperty(Re)) {
            ie[Re] = F[Re] === undefined && ke !== undefined ? ke[Re] : F[Re];
          }
        }
      }
      var Re = arguments.length - 2;
      if (Re === 1) {
        ie.children = Z;
      } else if (Re > 1) {
        ke = Array(Re);
        for (var $e = 0; $e < Re; $e++) {
          ke[$e] = arguments[$e + 2];
        }
        ie.children = ke;
      }
      return {
        $$typeof: r,
        type: k.type,
        key: he,
        ref: Ee,
        props: ie,
        _owner: pe
      };
    };
    ve.createContext = function (k) {
      k = {
        $$typeof: p,
        _currentValue: k,
        _currentValue2: k,
        _threadCount: 0,
        Provider: null,
        Consumer: null,
        _defaultValue: null,
        _globalName: null
      };
      k.Provider = {
        $$typeof: f,
        _context: k
      };
      return k.Consumer = k;
    };
    ve.createElement = $;
    ve.createFactory = function (k) {
      var F = $.bind(null, k);
      F.type = k;
      return F;
    };
    ve.createRef = function () {
      return {
        current: null
      };
    };
    ve.forwardRef = function (k) {
      return {
        $$typeof: m,
        render: k
      };
    };
    ve.isValidElement = ue;
    ve.lazy = function (k) {
      return {
        $$typeof: g,
        _payload: {
          _status: -1,
          _result: k
        },
        _init: se
      };
    };
    ve.memo = function (k, F) {
      return {
        $$typeof: v,
        type: k,
        compare: F === undefined ? null : F
      };
    };
    ve.startTransition = function (k) {
      var F = M.transition;
      M.transition = {};
      try {
        k();
      } finally {
        M.transition = F;
      }
    };
    ve.unstable_act = G;
    ve.useCallback = function (k, F) {
      return me.current.useCallback(k, F);
    };
    ve.useContext = function (k) {
      return me.current.useContext(k);
    };
    ve.useDebugValue = function () {};
    ve.useDeferredValue = function (k) {
      return me.current.useDeferredValue(k);
    };
    ve.useEffect = function (k, F) {
      return me.current.useEffect(k, F);
    };
    ve.useId = function () {
      return me.current.useId();
    };
    ve.useImperativeHandle = function (k, F, Z) {
      return me.current.useImperativeHandle(k, F, Z);
    };
    ve.useInsertionEffect = function (k, F) {
      return me.current.useInsertionEffect(k, F);
    };
    ve.useLayoutEffect = function (k, F) {
      return me.current.useLayoutEffect(k, F);
    };
    ve.useMemo = function (k, F) {
      return me.current.useMemo(k, F);
    };
    ve.useReducer = function (k, F, Z) {
      return me.current.useReducer(k, F, Z);
    };
    ve.useRef = function (k) {
      return me.current.useRef(k);
    };
    ve.useState = function (k) {
      return me.current.useState(k);
    };
    ve.useSyncExternalStore = function (k, F, Z) {
      return me.current.useSyncExternalStore(k, F, Z);
    };
    ve.useTransition = function () {
      return me.current.useTransition();
    };
    ve.version = "18.3.1";
    return ve;
  }
  var Qa;
  function cs() {
    if (!Qa) {
      Qa = 1;
      us.exports = Fm();
    }
    return us.exports;
  }
  var Xa;
  function zm() {
    if (Xa) {
      return gr;
    }
    Xa = 1;
    var r = cs();
    var o = Symbol.for("react.element");
    var i = Symbol.for("react.fragment");
    var l = Object.prototype.hasOwnProperty;
    var c = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
    var f = {
      key: true,
      ref: true,
      __self: true,
      __source: true
    };
    function p(m, w, v) {
      var g;
      var T = {};
      var L = null;
      var B = null;
      if (v !== undefined) {
        L = "" + v;
      }
      if (w.key !== undefined) {
        L = "" + w.key;
      }
      if (w.ref !== undefined) {
        B = w.ref;
      }
      for (g in w) {
        if (l.call(w, g) && !f.hasOwnProperty(g)) {
          T[g] = w[g];
        }
      }
      if (m && m.defaultProps) {
        w = m.defaultProps;
        for (g in w) {
          if (T[g] === undefined) {
            T[g] = w[g];
          }
        }
      }
      return {
        $$typeof: o,
        type: m,
        key: L,
        ref: B,
        props: T,
        _owner: c.current
      };
    }
    gr.Fragment = i;
    gr.jsx = p;
    gr.jsxs = p;
    return gr;
  }
  var Ya;
  function jm() {
    if (!Ya) {
      Ya = 1;
      as.exports = zm();
    }
    return as.exports;
  }
  var K = jm();
  var yo = {};
  var fs = {
    exports: {}
  };
  var nt = {};
  var ds = {
    exports: {}
  };
  var ps = {};
  var Ja;
  function Um() {
    if (!Ja) {
      Ja = 1;
      (function (r) {
        function o(M, ne) {
          var G = M.length;
          M.push(ne);
          e: while (G > 0) {
            var k = G - 1 >>> 1;
            var F = M[k];
            if (c(F, ne) > 0) {
              M[k] = ne;
              M[G] = F;
              G = k;
            } else {
              break e;
            }
          }
        }
        function i(M) {
          if (M.length === 0) {
            return null;
          } else {
            return M[0];
          }
        }
        function l(M) {
          if (M.length === 0) {
            return null;
          }
          var ne = M[0];
          var G = M.pop();
          if (G !== ne) {
            M[0] = G;
            e: for (var k = 0, F = M.length, Z = F >>> 1; k < Z;) {
              var ie = (k + 1) * 2 - 1;
              var he = M[ie];
              var Ee = ie + 1;
              var pe = M[Ee];
              if (c(he, G) < 0) {
                if (Ee < F && c(pe, he) < 0) {
                  M[k] = pe;
                  M[Ee] = G;
                  k = Ee;
                } else {
                  M[k] = he;
                  M[ie] = G;
                  k = ie;
                }
              } else if (Ee < F && c(pe, G) < 0) {
                M[k] = pe;
                M[Ee] = G;
                k = Ee;
              } else {
                break e;
              }
            }
          }
          return ne;
        }
        function c(M, ne) {
          var G = M.sortIndex - ne.sortIndex;
          if (G !== 0) {
            return G;
          } else {
            return M.id - ne.id;
          }
        }
        if (typeof performance == "object" && typeof performance.now == "function") {
          var f = performance;
          r.unstable_now = function () {
            return f.now();
          };
        } else {
          var p = Date;
          var m = p.now();
          r.unstable_now = function () {
            return p.now() - m;
          };
        }
        var w = [];
        var v = [];
        var g = 1;
        var T = null;
        var L = 3;
        var B = false;
        var C = false;
        var E = false;
        var y = typeof setTimeout == "function" ? setTimeout : null;
        var _ = typeof clearTimeout == "function" ? clearTimeout : null;
        var N = typeof setImmediate !== "undefined" ? setImmediate : null;
        if (typeof navigator !== "undefined" && navigator.scheduling !== undefined && navigator.scheduling.isInputPending !== undefined) {
          navigator.scheduling.isInputPending.bind(navigator.scheduling);
        }
        function b(M) {
          for (var ne = i(v); ne !== null;) {
            if (ne.callback === null) {
              l(v);
            } else if (ne.startTime <= M) {
              l(v);
              ne.sortIndex = ne.expirationTime;
              o(w, ne);
            } else {
              break;
            }
            ne = i(v);
          }
        }
        function D(M) {
          E = false;
          b(M);
          if (!C) {
            if (i(w) !== null) {
              C = true;
              se(H);
            } else {
              var ne = i(v);
              if (ne !== null) {
                me(D, ne.startTime - M);
              }
            }
          }
        }
        function H(M, ne) {
          C = false;
          if (E) {
            E = false;
            _($);
            $ = -1;
          }
          B = true;
          var G = L;
          try {
            b(ne);
            T = i(w);
            while (T !== null && (!(T.expirationTime > ne) || M && !Te())) {
              var k = T.callback;
              if (typeof k == "function") {
                T.callback = null;
                L = T.priorityLevel;
                var F = k(T.expirationTime <= ne);
                ne = r.unstable_now();
                if (typeof F == "function") {
                  T.callback = F;
                } else if (T === i(w)) {
                  l(w);
                }
                b(ne);
              } else {
                l(w);
              }
              T = i(w);
            }
            if (T !== null) {
              var Z = true;
            } else {
              var ie = i(v);
              if (ie !== null) {
                me(D, ie.startTime - ne);
              }
              Z = false;
            }
            return Z;
          } finally {
            T = null;
            L = G;
            B = false;
          }
        }
        var W = false;
        var q = null;
        var $ = -1;
        var de = 5;
        var ue = -1;
        function Te() {
          return !(r.unstable_now() - ue < de);
        }
        function _e() {
          if (q !== null) {
            var M = r.unstable_now();
            ue = M;
            var ne = true;
            try {
              ne = q(true, M);
            } finally {
              if (ne) {
                xe();
              } else {
                W = false;
                q = null;
              }
            }
          } else {
            W = false;
          }
        }
        var xe;
        if (typeof N == "function") {
          xe = function () {
            N(_e);
          };
        } else if (typeof MessageChannel !== "undefined") {
          var oe = new MessageChannel();
          var we = oe.port2;
          oe.port1.onmessage = _e;
          xe = function () {
            we.postMessage(null);
          };
        } else {
          xe = function () {
            y(_e, 0);
          };
        }
        function se(M) {
          q = M;
          if (!W) {
            W = true;
            xe();
          }
        }
        function me(M, ne) {
          $ = y(function () {
            M(r.unstable_now());
          }, ne);
        }
        r.unstable_IdlePriority = 5;
        r.unstable_ImmediatePriority = 1;
        r.unstable_LowPriority = 4;
        r.unstable_NormalPriority = 3;
        r.unstable_Profiling = null;
        r.unstable_UserBlockingPriority = 2;
        r.unstable_cancelCallback = function (M) {
          M.callback = null;
        };
        r.unstable_continueExecution = function () {
          if (!C && !B) {
            C = true;
            se(H);
          }
        };
        r.unstable_forceFrameRate = function (M) {
          if (M < 0 || M > 125) {
            console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported");
          } else {
            de = M > 0 ? Math.floor(1000 / M) : 5;
          }
        };
        r.unstable_getCurrentPriorityLevel = function () {
          return L;
        };
        r.unstable_getFirstCallbackNode = function () {
          return i(w);
        };
        r.unstable_next = function (M) {
          switch (L) {
            case 1:
            case 2:
            case 3:
              var ne = 3;
              break;
            default:
              ne = L;
          }
          var G = L;
          L = ne;
          try {
            return M();
          } finally {
            L = G;
          }
        };
        r.unstable_pauseExecution = function () {};
        r.unstable_requestPaint = function () {};
        r.unstable_runWithPriority = function (M, ne) {
          switch (M) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
              break;
            default:
              M = 3;
          }
          var G = L;
          L = M;
          try {
            return ne();
          } finally {
            L = G;
          }
        };
        r.unstable_scheduleCallback = function (M, ne, G) {
          var k = r.unstable_now();
          if (typeof G == "object" && G !== null) {
            G = G.delay;
            G = typeof G == "number" && G > 0 ? k + G : k;
          } else {
            G = k;
          }
          switch (M) {
            case 1:
              var F = -1;
              break;
            case 2:
              F = 250;
              break;
            case 5:
              F = 1073741823;
              break;
            case 4:
              F = 10000;
              break;
            default:
              F = 5000;
          }
          F = G + F;
          M = {
            id: g++,
            callback: ne,
            priorityLevel: M,
            startTime: G,
            expirationTime: F,
            sortIndex: -1
          };
          if (G > k) {
            M.sortIndex = G;
            o(v, M);
            if (i(w) === null && M === i(v)) {
              if (E) {
                _($);
                $ = -1;
              } else {
                E = true;
              }
              me(D, G - k);
            }
          } else {
            M.sortIndex = F;
            o(w, M);
            if (!C && !B) {
              C = true;
              se(H);
            }
          }
          return M;
        };
        r.unstable_shouldYield = Te;
        r.unstable_wrapCallback = function (M) {
          var ne = L;
          return function () {
            var G = L;
            L = ne;
            try {
              return M.apply(this, arguments);
            } finally {
              L = G;
            }
          };
        };
      })(ps);
    }
    return ps;
  }
  var Za;
  function Bm() {
    if (!Za) {
      Za = 1;
      ds.exports = Um();
    }
    return ds.exports;
  }
  var eu;
  function Vm() {
    if (eu) {
      return nt;
    }
    eu = 1;
    var r = cs();
    var o = Bm();
    function i(e) {
      var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e;
      for (var n = 1; n < arguments.length; n++) {
        t += "&args[]=" + encodeURIComponent(arguments[n]);
      }
      return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
    }
    var l = new Set();
    var c = {};
    function f(e, t) {
      p(e, t);
      p(e + "Capture", t);
    }
    function p(e, t) {
      c[e] = t;
      e = 0;
      for (; e < t.length; e++) {
        l.add(t[e]);
      }
    }
    var m = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
    var w = Object.prototype.hasOwnProperty;
    var v = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/;
    var g = {};
    var T = {};
    function L(e) {
      if (w.call(T, e)) {
        return true;
      } else if (w.call(g, e)) {
        return false;
      } else if (v.test(e)) {
        return T[e] = true;
      } else {
        g[e] = true;
        return false;
      }
    }
    function B(e, t, n, s) {
      if (n !== null && n.type === 0) {
        return false;
      }
      switch (typeof t) {
        case "function":
        case "symbol":
          return true;
        case "boolean":
          if (s) {
            return false;
          } else if (n !== null) {
            return !n.acceptsBooleans;
          } else {
            e = e.toLowerCase().slice(0, 5);
            return e !== "data-" && e !== "aria-";
          }
        default:
          return false;
      }
    }
    function C(e, t, n, s) {
      if (t === null || typeof t === "undefined" || B(e, t, n, s)) {
        return true;
      }
      if (s) {
        return false;
      }
      if (n !== null) {
        switch (n.type) {
          case 3:
            return !t;
          case 4:
            return t === false;
          case 5:
            return isNaN(t);
          case 6:
            return isNaN(t) || t < 1;
        }
      }
      return false;
    }
    function E(e, t, n, s, a, u, d) {
      this.acceptsBooleans = t === 2 || t === 3 || t === 4;
      this.attributeName = s;
      this.attributeNamespace = a;
      this.mustUseProperty = n;
      this.propertyName = e;
      this.type = t;
      this.sanitizeURL = u;
      this.removeEmptyString = d;
    }
    var y = {};
    "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function (e) {
      y[e] = new E(e, 0, false, e, null, false, false);
    });
    [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function (e) {
      var t = e[0];
      y[t] = new E(t, 1, false, e[1], null, false, false);
    });
    ["contentEditable", "draggable", "spellCheck", "value"].forEach(function (e) {
      y[e] = new E(e, 2, false, e.toLowerCase(), null, false, false);
    });
    ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function (e) {
      y[e] = new E(e, 2, false, e, null, false, false);
    });
    "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function (e) {
      y[e] = new E(e, 3, false, e.toLowerCase(), null, false, false);
    });
    ["checked", "multiple", "muted", "selected"].forEach(function (e) {
      y[e] = new E(e, 3, true, e, null, false, false);
    });
    ["capture", "download"].forEach(function (e) {
      y[e] = new E(e, 4, false, e, null, false, false);
    });
    ["cols", "rows", "size", "span"].forEach(function (e) {
      y[e] = new E(e, 6, false, e, null, false, false);
    });
    ["rowSpan", "start"].forEach(function (e) {
      y[e] = new E(e, 5, false, e.toLowerCase(), null, false, false);
    });
    var _ = /[\-:]([a-z])/g;
    function N(e) {
      return e[1].toUpperCase();
    }
    "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function (e) {
      var t = e.replace(_, N);
      y[t] = new E(t, 1, false, e, null, false, false);
    });
    "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function (e) {
      var t = e.replace(_, N);
      y[t] = new E(t, 1, false, e, "http://www.w3.org/1999/xlink", false, false);
    });
    ["xml:base", "xml:lang", "xml:space"].forEach(function (e) {
      var t = e.replace(_, N);
      y[t] = new E(t, 1, false, e, "http://www.w3.org/XML/1998/namespace", false, false);
    });
    ["tabIndex", "crossOrigin"].forEach(function (e) {
      y[e] = new E(e, 1, false, e.toLowerCase(), null, false, false);
    });
    y.xlinkHref = new E("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
    ["src", "href", "action", "formAction"].forEach(function (e) {
      y[e] = new E(e, 1, false, e.toLowerCase(), null, true, true);
    });
    function b(e, t, n, s) {
      var a = y.hasOwnProperty(t) ? y[t] : null;
      if (a !== null ? a.type !== 0 : s || !(t.length > 2) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") {
        if (C(t, n, a, s)) {
          n = null;
        }
        if (s || a === null) {
          if (L(t)) {
            if (n === null) {
              e.removeAttribute(t);
            } else {
              e.setAttribute(t, "" + n);
            }
          }
        } else if (a.mustUseProperty) {
          e[a.propertyName] = n === null ? a.type === 3 ? false : "" : n;
        } else {
          t = a.attributeName;
          s = a.attributeNamespace;
          if (n === null) {
            e.removeAttribute(t);
          } else {
            a = a.type;
            n = a === 3 || a === 4 && n === true ? "" : "" + n;
            if (s) {
              e.setAttributeNS(s, t, n);
            } else {
              e.setAttribute(t, n);
            }
          }
        }
      }
    }
    var D = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    var H = Symbol.for("react.element");
    var W = Symbol.for("react.portal");
    var q = Symbol.for("react.fragment");
    var $ = Symbol.for("react.strict_mode");
    var de = Symbol.for("react.profiler");
    var ue = Symbol.for("react.provider");
    var Te = Symbol.for("react.context");
    var _e = Symbol.for("react.forward_ref");
    var xe = Symbol.for("react.suspense");
    var oe = Symbol.for("react.suspense_list");
    var we = Symbol.for("react.memo");
    var se = Symbol.for("react.lazy");
    var me = Symbol.for("react.offscreen");
    var M = Symbol.iterator;
    function ne(e) {
      if (e === null || typeof e != "object") {
        return null;
      } else {
        e = M && e[M] || e["@@iterator"];
        if (typeof e == "function") {
          return e;
        } else {
          return null;
        }
      }
    }
    var G = Object.assign;
    var k;
    function F(e) {
      if (k === undefined) {
        try {
          throw Error();
        } catch (n) {
          var t = n.stack.trim().match(/\n( *(at )?)/);
          k = t && t[1] || "";
        }
      }
      return `
${k}${e}`;
    }
    var Z = false;
    function ie(e, t) {
      if (!e || Z) {
        return "";
      }
      Z = true;
      var n = Error.prepareStackTrace;
      Error.prepareStackTrace = undefined;
      try {
        if (t) {
          t = function () {
            throw Error();
          };
          Object.defineProperty(t.prototype, "props", {
            set: function () {
              throw Error();
            }
          });
          if (typeof Reflect == "object" && Reflect.construct) {
            try {
              Reflect.construct(t, []);
            } catch (A) {
              var s = A;
            }
            Reflect.construct(e, [], t);
          } else {
            try {
              t.call();
            } catch (A) {
              s = A;
            }
            e.call(t.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (A) {
            s = A;
          }
          e();
        }
      } catch (A) {
        if (A && s && typeof A.stack == "string") {
          for (var a = A.stack.split(`
`), u = s.stack.split(`
`), d = a.length - 1, h = u.length - 1; d >= 1 && h >= 0 && a[d] !== u[h];) {
            h--;
          }
          for (; d >= 1 && h >= 0; d--, h--) {
            if (a[d] !== u[h]) {
              if (d !== 1 || h !== 1) {
                do {
                  d--;
                  h--;
                  if (h < 0 || a[d] !== u[h]) {
                    var S = `
${a[d].replace(" at new ", " at ")}`;
                    if (e.displayName && S.includes("<anonymous>")) {
                      S = S.replace("<anonymous>", e.displayName);
                    }
                    return S;
                  }
                } while (d >= 1 && h >= 0);
              }
              break;
            }
          }
        }
      } finally {
        Z = false;
        Error.prepareStackTrace = n;
      }
      if (e = e ? e.displayName || e.name : "") {
        return F(e);
      } else {
        return "";
      }
    }
    function he(e) {
      switch (e.tag) {
        case 5:
          return F(e.type);
        case 16:
          return F("Lazy");
        case 13:
          return F("Suspense");
        case 19:
          return F("SuspenseList");
        case 0:
        case 2:
        case 15:
          e = ie(e.type, false);
          return e;
        case 11:
          e = ie(e.type.render, false);
          return e;
        case 1:
          e = ie(e.type, true);
          return e;
        default:
          return "";
      }
    }
    function Ee(e) {
      if (e == null) {
        return null;
      }
      if (typeof e == "function") {
        return e.displayName || e.name || null;
      }
      if (typeof e == "string") {
        return e;
      }
      switch (e) {
        case q:
          return "Fragment";
        case W:
          return "Portal";
        case de:
          return "Profiler";
        case $:
          return "StrictMode";
        case xe:
          return "Suspense";
        case oe:
          return "SuspenseList";
      }
      if (typeof e == "object") {
        switch (e.$$typeof) {
          case Te:
            return (e.displayName || "Context") + ".Consumer";
          case ue:
            return (e._context.displayName || "Context") + ".Provider";
          case _e:
            var t = e.render;
            e = e.displayName;
            if (!e) {
              e = t.displayName || t.name || "";
              e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef";
            }
            return e;
          case we:
            t = e.displayName || null;
            if (t !== null) {
              return t;
            } else {
              return Ee(e.type) || "Memo";
            }
          case se:
            t = e._payload;
            e = e._init;
            try {
              return Ee(e(t));
            } catch {}
        }
      }
      return null;
    }
    function pe(e) {
      var t = e.type;
      switch (e.tag) {
        case 24:
          return "Cache";
        case 9:
          return (t.displayName || "Context") + ".Consumer";
        case 10:
          return (t._context.displayName || "Context") + ".Provider";
        case 18:
          return "DehydratedFragment";
        case 11:
          e = t.render;
          e = e.displayName || e.name || "";
          return t.displayName || (e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef");
        case 7:
          return "Fragment";
        case 5:
          return t;
        case 4:
          return "Portal";
        case 3:
          return "Root";
        case 6:
          return "Text";
        case 16:
          return Ee(t);
        case 8:
          if (t === $) {
            return "StrictMode";
          } else {
            return "Mode";
          }
        case 22:
          return "Offscreen";
        case 12:
          return "Profiler";
        case 21:
          return "Scope";
        case 13:
          return "Suspense";
        case 19:
          return "SuspenseList";
        case 25:
          return "TracingMarker";
        case 1:
        case 0:
        case 17:
        case 2:
        case 14:
        case 15:
          if (typeof t == "function") {
            return t.displayName || t.name || null;
          }
          if (typeof t == "string") {
            return t;
          }
      }
      return null;
    }
    function ke(e) {
      switch (typeof e) {
        case "boolean":
        case "number":
        case "string":
        case "undefined":
          return e;
        case "object":
          return e;
        default:
          return "";
      }
    }
    function Re(e) {
      var t = e.type;
      return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
    }
    function $e(e) {
      var t = Re(e) ? "checked" : "value";
      var n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
      var s = "" + e[t];
      if (!e.hasOwnProperty(t) && typeof n !== "undefined" && typeof n.get == "function" && typeof n.set == "function") {
        var a = n.get;
        var u = n.set;
        Object.defineProperty(e, t, {
          configurable: true,
          get: function () {
            return a.call(this);
          },
          set: function (d) {
            s = "" + d;
            u.call(this, d);
          }
        });
        Object.defineProperty(e, t, {
          enumerable: n.enumerable
        });
        return {
          getValue: function () {
            return s;
          },
          setValue: function (d) {
            s = "" + d;
          },
          stopTracking: function () {
            e._valueTracker = null;
            delete e[t];
          }
        };
      }
    }
    function Jt(e) {
      e._valueTracker ||= $e(e);
    }
    function Tn(e) {
      if (!e) {
        return false;
      }
      var t = e._valueTracker;
      if (!t) {
        return true;
      }
      var n = t.getValue();
      var s = "";
      if (e) {
        s = Re(e) ? e.checked ? "true" : "false" : e.value;
      }
      e = s;
      if (e !== n) {
        t.setValue(e);
        return true;
      } else {
        return false;
      }
    }
    function Go(e) {
      e = e || (typeof document !== "undefined" ? document : undefined);
      if (typeof e === "undefined") {
        return null;
      }
      try {
        return e.activeElement || e.body;
      } catch {
        return e.body;
      }
    }
    function Ys(e, t) {
      var n = t.checked;
      return G({}, t, {
        defaultChecked: undefined,
        defaultValue: undefined,
        value: undefined,
        checked: n ?? e._wrapperState.initialChecked
      });
    }
    function kf(e, t) {
      var n = t.defaultValue == null ? "" : t.defaultValue;
      var s = t.checked ?? t.defaultChecked;
      n = ke(t.value ?? n);
      e._wrapperState = {
        initialChecked: s,
        initialValue: n,
        controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null
      };
    }
    function Cf(e, t) {
      t = t.checked;
      if (t != null) {
        b(e, "checked", t, false);
      }
    }
    function Js(e, t) {
      Cf(e, t);
      var n = ke(t.value);
      var s = t.type;
      if (n != null) {
        if (s === "number") {
          if (n === 0 && e.value === "" || e.value != n) {
            e.value = "" + n;
          }
        } else if (e.value !== "" + n) {
          e.value = "" + n;
        }
      } else if (s === "submit" || s === "reset") {
        e.removeAttribute("value");
        return;
      }
      if (t.hasOwnProperty("value")) {
        Zs(e, t.type, n);
      } else if (t.hasOwnProperty("defaultValue")) {
        Zs(e, t.type, ke(t.defaultValue));
      }
      if (t.checked == null && t.defaultChecked != null) {
        e.defaultChecked = !!t.defaultChecked;
      }
    }
    function _f(e, t, n) {
      if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
        var s = t.type;
        if ((s === "submit" || s === "reset") && (t.value === undefined || t.value === null)) {
          return;
        }
        t = "" + e._wrapperState.initialValue;
        if (!n && t !== e.value) {
          e.value = t;
        }
        e.defaultValue = t;
      }
      n = e.name;
      if (n !== "") {
        e.name = "";
      }
      e.defaultChecked = !!e._wrapperState.initialChecked;
      if (n !== "") {
        e.name = n;
      }
    }
    function Zs(e, t, n) {
      if (t !== "number" || Go(e.ownerDocument) !== e) {
        if (n == null) {
          e.defaultValue = "" + e._wrapperState.initialValue;
        } else if (e.defaultValue !== "" + n) {
          e.defaultValue = "" + n;
        }
      }
    }
    var Or = Array.isArray;
    function Kn(e, t, n, s) {
      e = e.options;
      if (t) {
        t = {};
        for (var a = 0; a < n.length; a++) {
          t["$" + n[a]] = true;
        }
        for (n = 0; n < e.length; n++) {
          a = t.hasOwnProperty("$" + e[n].value);
          if (e[n].selected !== a) {
            e[n].selected = a;
          }
          if (a && s) {
            e[n].defaultSelected = true;
          }
        }
      } else {
        n = "" + ke(n);
        t = null;
        a = 0;
        for (; a < e.length; a++) {
          if (e[a].value === n) {
            e[a].selected = true;
            if (s) {
              e[a].defaultSelected = true;
            }
            return;
          }
          if (t === null && !e[a].disabled) {
            t = e[a];
          }
        }
        if (t !== null) {
          t.selected = true;
        }
      }
    }
    function el(e, t) {
      if (t.dangerouslySetInnerHTML != null) {
        throw Error(i(91));
      }
      return G({}, t, {
        value: undefined,
        defaultValue: undefined,
        children: "" + e._wrapperState.initialValue
      });
    }
    function Tf(e, t) {
      var n = t.value;
      if (n == null) {
        n = t.children;
        t = t.defaultValue;
        if (n != null) {
          if (t != null) {
            throw Error(i(92));
          }
          if (Or(n)) {
            if (n.length > 1) {
              throw Error(i(93));
            }
            n = n[0];
          }
          t = n;
        }
        if (t == null) {
          t = "";
        }
        n = t;
      }
      e._wrapperState = {
        initialValue: ke(n)
      };
    }
    function Rf(e, t) {
      var n = ke(t.value);
      var s = ke(t.defaultValue);
      if (n != null) {
        n = "" + n;
        if (n !== e.value) {
          e.value = n;
        }
        if (t.defaultValue == null && e.defaultValue !== n) {
          e.defaultValue = n;
        }
      }
      if (s != null) {
        e.defaultValue = "" + s;
      }
    }
    function Pf(e) {
      var t = e.textContent;
      if (t === e._wrapperState.initialValue && t !== "" && t !== null) {
        e.value = t;
      }
    }
    function Nf(e) {
      switch (e) {
        case "svg":
          return "http://www.w3.org/2000/svg";
        case "math":
          return "http://www.w3.org/1998/Math/MathML";
        default:
          return "http://www.w3.org/1999/xhtml";
      }
    }
    function tl(e, t) {
      if (e == null || e === "http://www.w3.org/1999/xhtml") {
        return Nf(t);
      } else if (e === "http://www.w3.org/2000/svg" && t === "foreignObject") {
        return "http://www.w3.org/1999/xhtml";
      } else {
        return e;
      }
    }
    var Qo;
    var Of = function (e) {
      if (typeof MSApp !== "undefined" && MSApp.execUnsafeLocalFunction) {
        return function (t, n, s, a) {
          MSApp.execUnsafeLocalFunction(function () {
            return e(t, n, s, a);
          });
        };
      } else {
        return e;
      }
    }(function (e, t) {
      if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) {
        e.innerHTML = t;
      } else {
        Qo = Qo || document.createElement("div");
        Qo.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>";
        t = Qo.firstChild;
        while (e.firstChild) {
          e.removeChild(e.firstChild);
        }
        while (t.firstChild) {
          e.appendChild(t.firstChild);
        }
      }
    });
    function Ar(e, t) {
      if (t) {
        var n = e.firstChild;
        if (n && n === e.lastChild && n.nodeType === 3) {
          n.nodeValue = t;
          return;
        }
      }
      e.textContent = t;
    }
    var Ir = {
      animationIterationCount: true,
      aspectRatio: true,
      borderImageOutset: true,
      borderImageSlice: true,
      borderImageWidth: true,
      boxFlex: true,
      boxFlexGroup: true,
      boxOrdinalGroup: true,
      columnCount: true,
      columns: true,
      flex: true,
      flexGrow: true,
      flexPositive: true,
      flexShrink: true,
      flexNegative: true,
      flexOrder: true,
      gridArea: true,
      gridRow: true,
      gridRowEnd: true,
      gridRowSpan: true,
      gridRowStart: true,
      gridColumn: true,
      gridColumnEnd: true,
      gridColumnSpan: true,
      gridColumnStart: true,
      fontWeight: true,
      lineClamp: true,
      lineHeight: true,
      opacity: true,
      order: true,
      orphans: true,
      tabSize: true,
      widows: true,
      zIndex: true,
      zoom: true,
      fillOpacity: true,
      floodOpacity: true,
      stopOpacity: true,
      strokeDasharray: true,
      strokeDashoffset: true,
      strokeMiterlimit: true,
      strokeOpacity: true,
      strokeWidth: true
    };
    var Qw = ["Webkit", "ms", "Moz", "O"];
    Object.keys(Ir).forEach(function (e) {
      Qw.forEach(function (t) {
        t = t + e.charAt(0).toUpperCase() + e.substring(1);
        Ir[t] = Ir[e];
      });
    });
    function Af(e, t, n) {
      if (t == null || typeof t == "boolean" || t === "") {
        return "";
      } else if (n || typeof t != "number" || t === 0 || Ir.hasOwnProperty(e) && Ir[e]) {
        return ("" + t).trim();
      } else {
        return t + "px";
      }
    }
    function If(e, t) {
      e = e.style;
      for (var n in t) {
        if (t.hasOwnProperty(n)) {
          var s = n.indexOf("--") === 0;
          var a = Af(n, t[n], s);
          if (n === "float") {
            n = "cssFloat";
          }
          if (s) {
            e.setProperty(n, a);
          } else {
            e[n] = a;
          }
        }
      }
    }
    var Xw = G({
      menuitem: true
    }, {
      area: true,
      base: true,
      br: true,
      col: true,
      embed: true,
      hr: true,
      img: true,
      input: true,
      keygen: true,
      link: true,
      meta: true,
      param: true,
      source: true,
      track: true,
      wbr: true
    });
    function nl(e, t) {
      if (t) {
        if (Xw[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) {
          throw Error(i(137, e));
        }
        if (t.dangerouslySetInnerHTML != null) {
          if (t.children != null) {
            throw Error(i(60));
          }
          if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) {
            throw Error(i(61));
          }
        }
        if (t.style != null && typeof t.style != "object") {
          throw Error(i(62));
        }
      }
    }
    function rl(e, t) {
      if (e.indexOf("-") === -1) {
        return typeof t.is == "string";
      }
      switch (e) {
        case "annotation-xml":
        case "color-profile":
        case "font-face":
        case "font-face-src":
        case "font-face-uri":
        case "font-face-format":
        case "font-face-name":
        case "missing-glyph":
          return false;
        default:
          return true;
      }
    }
    var ol = null;
    function il(e) {
      e = e.target || e.srcElement || window;
      if (e.correspondingUseElement) {
        e = e.correspondingUseElement;
      }
      if (e.nodeType === 3) {
        return e.parentNode;
      } else {
        return e;
      }
    }
    var sl = null;
    var Hn = null;
    var qn = null;
    function Lf(e) {
      if (e = eo(e)) {
        if (typeof sl != "function") {
          throw Error(i(280));
        }
        var t = e.stateNode;
        if (t) {
          t = vi(t);
          sl(e.stateNode, e.type, t);
        }
      }
    }
    function Mf(e) {
      if (Hn) {
        if (qn) {
          qn.push(e);
        } else {
          qn = [e];
        }
      } else {
        Hn = e;
      }
    }
    function Df() {
      if (Hn) {
        var e = Hn;
        var t = qn;
        qn = Hn = null;
        Lf(e);
        if (t) {
          for (e = 0; e < t.length; e++) {
            Lf(t[e]);
          }
        }
      }
    }
    function bf(e, t) {
      return e(t);
    }
    function Ff() {}
    var ll = false;
    function zf(e, t, n) {
      if (ll) {
        return e(t, n);
      }
      ll = true;
      try {
        return bf(e, t, n);
      } finally {
        ll = false;
        if (Hn !== null || qn !== null) {
          Ff();
          Df();
        }
      }
    }
    function Lr(e, t) {
      var n = e.stateNode;
      if (n === null) {
        return null;
      }
      var s = vi(n);
      if (s === null) {
        return null;
      }
      n = s[t];
      e: switch (t) {
        case "onClick":
        case "onClickCapture":
        case "onDoubleClick":
        case "onDoubleClickCapture":
        case "onMouseDown":
        case "onMouseDownCapture":
        case "onMouseMove":
        case "onMouseMoveCapture":
        case "onMouseUp":
        case "onMouseUpCapture":
        case "onMouseEnter":
          if (!(s = !s.disabled)) {
            e = e.type;
            s = e !== "button" && e !== "input" && e !== "select" && e !== "textarea";
          }
          e = !s;
          break e;
        default:
          e = false;
      }
      if (e) {
        return null;
      }
      if (n && typeof n != "function") {
        throw Error(i(231, t, typeof n));
      }
      return n;
    }
    var al = false;
    if (m) {
      try {
        var Mr = {};
        Object.defineProperty(Mr, "passive", {
          get: function () {
            al = true;
          }
        });
        window.addEventListener("test", Mr, Mr);
        window.removeEventListener("test", Mr, Mr);
      } catch {
        al = false;
      }
    }
    function Yw(e, t, n, s, a, u, d, h, S) {
      var A = Array.prototype.slice.call(arguments, 3);
      try {
        t.apply(n, A);
      } catch (j) {
        this.onError(j);
      }
    }
    var Dr = false;
    var Xo = null;
    var Yo = false;
    var ul = null;
    var Jw = {
      onError: function (e) {
        Dr = true;
        Xo = e;
      }
    };
    function Zw(e, t, n, s, a, u, d, h, S) {
      Dr = false;
      Xo = null;
      Yw.apply(Jw, arguments);
    }
    function e0(e, t, n, s, a, u, d, h, S) {
      Zw.apply(this, arguments);
      if (Dr) {
        if (Dr) {
          var A = Xo;
          Dr = false;
          Xo = null;
        } else {
          throw Error(i(198));
        }
        if (!Yo) {
          Yo = true;
          ul = A;
        }
      }
    }
    function Rn(e) {
      var t = e;
      var n = e;
      if (e.alternate) {
        while (t.return) {
          t = t.return;
        }
      } else {
        e = t;
        do {
          t = e;
          if ((t.flags & 4098) !== 0) {
            n = t.return;
          }
          e = t.return;
        } while (e);
      }
      if (t.tag === 3) {
        return n;
      } else {
        return null;
      }
    }
    function jf(e) {
      if (e.tag === 13) {
        var t = e.memoizedState;
        if (t === null) {
          e = e.alternate;
          if (e !== null) {
            t = e.memoizedState;
          }
        }
        if (t !== null) {
          return t.dehydrated;
        }
      }
      return null;
    }
    function Uf(e) {
      if (Rn(e) !== e) {
        throw Error(i(188));
      }
    }
    function t0(e) {
      var t = e.alternate;
      if (!t) {
        t = Rn(e);
        if (t === null) {
          throw Error(i(188));
        }
        if (t !== e) {
          return null;
        } else {
          return e;
        }
      }
      var n = e;
      var s = t;
      while (true) {
        var a = n.return;
        if (a === null) {
          break;
        }
        var u = a.alternate;
        if (u === null) {
          s = a.return;
          if (s !== null) {
            n = s;
            continue;
          }
          break;
        }
        if (a.child === u.child) {
          for (u = a.child; u;) {
            if (u === n) {
              Uf(a);
              return e;
            }
            if (u === s) {
              Uf(a);
              return t;
            }
            u = u.sibling;
          }
          throw Error(i(188));
        }
        if (n.return !== s.return) {
          n = a;
          s = u;
        } else {
          var d = false;
          for (var h = a.child; h;) {
            if (h === n) {
              d = true;
              n = a;
              s = u;
              break;
            }
            if (h === s) {
              d = true;
              s = a;
              n = u;
              break;
            }
            h = h.sibling;
          }
          if (!d) {
            for (h = u.child; h;) {
              if (h === n) {
                d = true;
                n = u;
                s = a;
                break;
              }
              if (h === s) {
                d = true;
                s = u;
                n = a;
                break;
              }
              h = h.sibling;
            }
            if (!d) {
              throw Error(i(189));
            }
          }
        }
        if (n.alternate !== s) {
          throw Error(i(190));
        }
      }
      if (n.tag !== 3) {
        throw Error(i(188));
      }
      if (n.stateNode.current === n) {
        return e;
      } else {
        return t;
      }
    }
    function Bf(e) {
      e = t0(e);
      if (e !== null) {
        return Vf(e);
      } else {
        return null;
      }
    }
    function Vf(e) {
      if (e.tag === 5 || e.tag === 6) {
        return e;
      }
      for (e = e.child; e !== null;) {
        var t = Vf(e);
        if (t !== null) {
          return t;
        }
        e = e.sibling;
      }
      return null;
    }
    var $f = o.unstable_scheduleCallback;
    var Wf = o.unstable_cancelCallback;
    var n0 = o.unstable_shouldYield;
    var r0 = o.unstable_requestPaint;
    var Fe = o.unstable_now;
    var o0 = o.unstable_getCurrentPriorityLevel;
    var cl = o.unstable_ImmediatePriority;
    var Kf = o.unstable_UserBlockingPriority;
    var Jo = o.unstable_NormalPriority;
    var i0 = o.unstable_LowPriority;
    var Hf = o.unstable_IdlePriority;
    var Zo = null;
    var It = null;
    function s0(e) {
      if (It && typeof It.onCommitFiberRoot == "function") {
        try {
          It.onCommitFiberRoot(Zo, e, undefined, (e.current.flags & 128) === 128);
        } catch {}
      }
    }
    var kt = Math.clz32 ? Math.clz32 : u0;
    var l0 = Math.log;
    var a0 = Math.LN2;
    function u0(e) {
      e >>>= 0;
      if (e === 0) {
        return 32;
      } else {
        return 31 - (l0(e) / a0 | 0) | 0;
      }
    }
    var ei = 64;
    var ti = 4194304;
    function br(e) {
      switch (e & -e) {
        case 1:
          return 1;
        case 2:
          return 2;
        case 4:
          return 4;
        case 8:
          return 8;
        case 16:
          return 16;
        case 32:
          return 32;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return e & 4194240;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          return e & 130023424;
        case 134217728:
          return 134217728;
        case 268435456:
          return 268435456;
        case 536870912:
          return 536870912;
        case 1073741824:
          return 1073741824;
        default:
          return e;
      }
    }
    function ni(e, t) {
      var n = e.pendingLanes;
      if (n === 0) {
        return 0;
      }
      var s = 0;
      var a = e.suspendedLanes;
      var u = e.pingedLanes;
      var d = n & 268435455;
      if (d !== 0) {
        var h = d & ~a;
        if (h !== 0) {
          s = br(h);
        } else {
          u &= d;
          if (u !== 0) {
            s = br(u);
          }
        }
      } else {
        d = n & ~a;
        if (d !== 0) {
          s = br(d);
        } else if (u !== 0) {
          s = br(u);
        }
      }
      if (s === 0) {
        return 0;
      }
      if (t !== 0 && t !== s && (t & a) === 0 && (a = s & -s, u = t & -t, a >= u || a === 16 && (u & 4194240) !== 0)) {
        return t;
      }
      if ((s & 4) !== 0) {
        s |= n & 16;
      }
      t = e.entangledLanes;
      if (t !== 0) {
        e = e.entanglements;
        t &= s;
        while (t > 0) {
          n = 31 - kt(t);
          a = 1 << n;
          s |= e[n];
          t &= ~a;
        }
      }
      return s;
    }
    function c0(e, t) {
      switch (e) {
        case 1:
        case 2:
        case 4:
          return t + 250;
        case 8:
        case 16:
        case 32:
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return t + 5000;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          return -1;
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
          return -1;
        default:
          return -1;
      }
    }
    function f0(e, t) {
      var n = e.suspendedLanes;
      var s = e.pingedLanes;
      var a = e.expirationTimes;
      for (var u = e.pendingLanes; u > 0;) {
        var d = 31 - kt(u);
        var h = 1 << d;
        var S = a[d];
        if (S === -1) {
          if ((h & n) === 0 || (h & s) !== 0) {
            a[d] = c0(h, t);
          }
        } else if (S <= t) {
          e.expiredLanes |= h;
        }
        u &= ~h;
      }
    }
    function fl(e) {
      e = e.pendingLanes & -1073741825;
      if (e !== 0) {
        return e;
      } else if (e & 1073741824) {
        return 1073741824;
      } else {
        return 0;
      }
    }
    function qf() {
      var e = ei;
      ei <<= 1;
      if ((ei & 4194240) === 0) {
        ei = 64;
      }
      return e;
    }
    function dl(e) {
      var t = [];
      for (var n = 0; n < 31; n++) {
        t.push(e);
      }
      return t;
    }
    function Fr(e, t, n) {
      e.pendingLanes |= t;
      if (t !== 536870912) {
        e.suspendedLanes = 0;
        e.pingedLanes = 0;
      }
      e = e.eventTimes;
      t = 31 - kt(t);
      e[t] = n;
    }
    function d0(e, t) {
      var n = e.pendingLanes & ~t;
      e.pendingLanes = t;
      e.suspendedLanes = 0;
      e.pingedLanes = 0;
      e.expiredLanes &= t;
      e.mutableReadLanes &= t;
      e.entangledLanes &= t;
      t = e.entanglements;
      var s = e.eventTimes;
      for (e = e.expirationTimes; n > 0;) {
        var a = 31 - kt(n);
        var u = 1 << a;
        t[a] = 0;
        s[a] = -1;
        e[a] = -1;
        n &= ~u;
      }
    }
    function pl(e, t) {
      var n = e.entangledLanes |= t;
      for (e = e.entanglements; n;) {
        var s = 31 - kt(n);
        var a = 1 << s;
        if (a & t | e[s] & t) {
          e[s] |= t;
        }
        n &= ~a;
      }
    }
    var Pe = 0;
    function Gf(e) {
      e &= -e;
      if (e > 1) {
        if (e > 4) {
          if ((e & 268435455) !== 0) {
            return 16;
          } else {
            return 536870912;
          }
        } else {
          return 4;
        }
      } else {
        return 1;
      }
    }
    var Qf;
    var ml;
    var Xf;
    var Yf;
    var Jf;
    var hl = false;
    var ri = [];
    var Zt = null;
    var en = null;
    var tn = null;
    var zr = new Map();
    var jr = new Map();
    var nn = [];
    var p0 = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
    function Zf(e, t) {
      switch (e) {
        case "focusin":
        case "focusout":
          Zt = null;
          break;
        case "dragenter":
        case "dragleave":
          en = null;
          break;
        case "mouseover":
        case "mouseout":
          tn = null;
          break;
        case "pointerover":
        case "pointerout":
          zr.delete(t.pointerId);
          break;
        case "gotpointercapture":
        case "lostpointercapture":
          jr.delete(t.pointerId);
      }
    }
    function Ur(e, t, n, s, a, u) {
      if (e === null || e.nativeEvent !== u) {
        e = {
          blockedOn: t,
          domEventName: n,
          eventSystemFlags: s,
          nativeEvent: u,
          targetContainers: [a]
        };
        if (t !== null) {
          t = eo(t);
          if (t !== null) {
            ml(t);
          }
        }
        return e;
      } else {
        e.eventSystemFlags |= s;
        t = e.targetContainers;
        if (a !== null && t.indexOf(a) === -1) {
          t.push(a);
        }
        return e;
      }
    }
    function m0(e, t, n, s, a) {
      switch (t) {
        case "focusin":
          Zt = Ur(Zt, e, t, n, s, a);
          return true;
        case "dragenter":
          en = Ur(en, e, t, n, s, a);
          return true;
        case "mouseover":
          tn = Ur(tn, e, t, n, s, a);
          return true;
        case "pointerover":
          var u = a.pointerId;
          zr.set(u, Ur(zr.get(u) || null, e, t, n, s, a));
          return true;
        case "gotpointercapture":
          u = a.pointerId;
          jr.set(u, Ur(jr.get(u) || null, e, t, n, s, a));
          return true;
      }
      return false;
    }
    function ed(e) {
      var t = Pn(e.target);
      if (t !== null) {
        var n = Rn(t);
        if (n !== null) {
          t = n.tag;
          if (t === 13) {
            t = jf(n);
            if (t !== null) {
              e.blockedOn = t;
              Jf(e.priority, function () {
                Xf(n);
              });
              return;
            }
          } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
            e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
            return;
          }
        }
      }
      e.blockedOn = null;
    }
    function oi(e) {
      if (e.blockedOn !== null) {
        return false;
      }
      for (var t = e.targetContainers; t.length > 0;) {
        var n = yl(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
        if (n === null) {
          n = e.nativeEvent;
          var s = new n.constructor(n.type, n);
          ol = s;
          n.target.dispatchEvent(s);
          ol = null;
        } else {
          t = eo(n);
          if (t !== null) {
            ml(t);
          }
          e.blockedOn = n;
          return false;
        }
        t.shift();
      }
      return true;
    }
    function td(e, t, n) {
      if (oi(e)) {
        n.delete(t);
      }
    }
    function h0() {
      hl = false;
      if (Zt !== null && oi(Zt)) {
        Zt = null;
      }
      if (en !== null && oi(en)) {
        en = null;
      }
      if (tn !== null && oi(tn)) {
        tn = null;
      }
      zr.forEach(td);
      jr.forEach(td);
    }
    function Br(e, t) {
      if (e.blockedOn === t) {
        e.blockedOn = null;
        if (!hl) {
          hl = true;
          o.unstable_scheduleCallback(o.unstable_NormalPriority, h0);
        }
      }
    }
    function Vr(e) {
      function t(a) {
        return Br(a, e);
      }
      if (ri.length > 0) {
        Br(ri[0], e);
        for (var n = 1; n < ri.length; n++) {
          var s = ri[n];
          if (s.blockedOn === e) {
            s.blockedOn = null;
          }
        }
      }
      if (Zt !== null) {
        Br(Zt, e);
      }
      if (en !== null) {
        Br(en, e);
      }
      if (tn !== null) {
        Br(tn, e);
      }
      zr.forEach(t);
      jr.forEach(t);
      n = 0;
      for (; n < nn.length; n++) {
        s = nn[n];
        if (s.blockedOn === e) {
          s.blockedOn = null;
        }
      }
      while (nn.length > 0 && (n = nn[0], n.blockedOn === null)) {
        ed(n);
        if (n.blockedOn === null) {
          nn.shift();
        }
      }
    }
    var Gn = D.ReactCurrentBatchConfig;
    var ii = true;
    function g0(e, t, n, s) {
      var a = Pe;
      var u = Gn.transition;
      Gn.transition = null;
      try {
        Pe = 1;
        gl(e, t, n, s);
      } finally {
        Pe = a;
        Gn.transition = u;
      }
    }
    function y0(e, t, n, s) {
      var a = Pe;
      var u = Gn.transition;
      Gn.transition = null;
      try {
        Pe = 4;
        gl(e, t, n, s);
      } finally {
        Pe = a;
        Gn.transition = u;
      }
    }
    function gl(e, t, n, s) {
      if (ii) {
        var a = yl(e, t, n, s);
        if (a === null) {
          Ml(e, t, s, si, n);
          Zf(e, s);
        } else if (m0(a, e, t, n, s)) {
          s.stopPropagation();
        } else {
          Zf(e, s);
          if (t & 4 && p0.indexOf(e) > -1) {
            while (a !== null) {
              var u = eo(a);
              if (u !== null) {
                Qf(u);
              }
              u = yl(e, t, n, s);
              if (u === null) {
                Ml(e, t, s, si, n);
              }
              if (u === a) {
                break;
              }
              a = u;
            }
            if (a !== null) {
              s.stopPropagation();
            }
          } else {
            Ml(e, t, s, null, n);
          }
        }
      }
    }
    var si = null;
    function yl(e, t, n, s) {
      si = null;
      e = il(s);
      e = Pn(e);
      if (e !== null) {
        t = Rn(e);
        if (t === null) {
          e = null;
        } else {
          n = t.tag;
          if (n === 13) {
            e = jf(t);
            if (e !== null) {
              return e;
            }
            e = null;
          } else if (n === 3) {
            if (t.stateNode.current.memoizedState.isDehydrated) {
              if (t.tag === 3) {
                return t.stateNode.containerInfo;
              } else {
                return null;
              }
            }
            e = null;
          } else if (t !== e) {
            e = null;
          }
        }
      }
      si = e;
      return null;
    }
    function nd(e) {
      switch (e) {
        case "cancel":
        case "click":
        case "close":
        case "contextmenu":
        case "copy":
        case "cut":
        case "auxclick":
        case "dblclick":
        case "dragend":
        case "dragstart":
        case "drop":
        case "focusin":
        case "focusout":
        case "input":
        case "invalid":
        case "keydown":
        case "keypress":
        case "keyup":
        case "mousedown":
        case "mouseup":
        case "paste":
        case "pause":
        case "play":
        case "pointercancel":
        case "pointerdown":
        case "pointerup":
        case "ratechange":
        case "reset":
        case "resize":
        case "seeked":
        case "submit":
        case "touchcancel":
        case "touchend":
        case "touchstart":
        case "volumechange":
        case "change":
        case "selectionchange":
        case "textInput":
        case "compositionstart":
        case "compositionend":
        case "compositionupdate":
        case "beforeblur":
        case "afterblur":
        case "beforeinput":
        case "blur":
        case "fullscreenchange":
        case "focus":
        case "hashchange":
        case "popstate":
        case "select":
        case "selectstart":
          return 1;
        case "drag":
        case "dragenter":
        case "dragexit":
        case "dragleave":
        case "dragover":
        case "mousemove":
        case "mouseout":
        case "mouseover":
        case "pointermove":
        case "pointerout":
        case "pointerover":
        case "scroll":
        case "toggle":
        case "touchmove":
        case "wheel":
        case "mouseenter":
        case "mouseleave":
        case "pointerenter":
        case "pointerleave":
          return 4;
        case "message":
          switch (o0()) {
            case cl:
              return 1;
            case Kf:
              return 4;
            case Jo:
            case i0:
              return 16;
            case Hf:
              return 536870912;
            default:
              return 16;
          }
        default:
          return 16;
      }
    }
    var rn = null;
    var vl = null;
    var li = null;
    function rd() {
      if (li) {
        return li;
      }
      var e;
      var t = vl;
      var n = t.length;
      var s;
      var a = "value" in rn ? rn.value : rn.textContent;
      var u = a.length;
      for (e = 0; e < n && t[e] === a[e]; e++);
      var d = n - e;
      for (s = 1; s <= d && t[n - s] === a[u - s]; s++);
      return li = a.slice(e, s > 1 ? 1 - s : undefined);
    }
    function ai(e) {
      var t = e.keyCode;
      if ("charCode" in e) {
        e = e.charCode;
        if (e === 0 && t === 13) {
          e = 13;
        }
      } else {
        e = t;
      }
      if (e === 10) {
        e = 13;
      }
      if (e >= 32 || e === 13) {
        return e;
      } else {
        return 0;
      }
    }
    function ui() {
      return true;
    }
    function od() {
      return false;
    }
    function ft(e) {
      function t(n, s, a, u, d) {
        this._reactName = n;
        this._targetInst = a;
        this.type = s;
        this.nativeEvent = u;
        this.target = d;
        this.currentTarget = null;
        for (var h in e) {
          if (e.hasOwnProperty(h)) {
            n = e[h];
            this[h] = n ? n(u) : u[h];
          }
        }
        this.isDefaultPrevented = u.defaultPrevented ?? u.returnValue === false ? ui : od;
        this.isPropagationStopped = od;
        return this;
      }
      G(t.prototype, {
        preventDefault: function () {
          this.defaultPrevented = true;
          var n = this.nativeEvent;
          if (n) {
            if (n.preventDefault) {
              n.preventDefault();
            } else if (typeof n.returnValue != "unknown") {
              n.returnValue = false;
            }
            this.isDefaultPrevented = ui;
          }
        },
        stopPropagation: function () {
          var n = this.nativeEvent;
          if (n) {
            if (n.stopPropagation) {
              n.stopPropagation();
            } else if (typeof n.cancelBubble != "unknown") {
              n.cancelBubble = true;
            }
            this.isPropagationStopped = ui;
          }
        },
        persist: function () {},
        isPersistent: ui
      });
      return t;
    }
    var Qn = {
      eventPhase: 0,
      bubbles: 0,
      cancelable: 0,
      timeStamp: function (e) {
        return e.timeStamp || Date.now();
      },
      defaultPrevented: 0,
      isTrusted: 0
    };
    var wl = ft(Qn);
    var $r = G({}, Qn, {
      view: 0,
      detail: 0
    });
    var v0 = ft($r);
    var El;
    var Sl;
    var Wr;
    var ci = G({}, $r, {
      screenX: 0,
      screenY: 0,
      clientX: 0,
      clientY: 0,
      pageX: 0,
      pageY: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      getModifierState: kl,
      button: 0,
      buttons: 0,
      relatedTarget: function (e) {
        if (e.relatedTarget === undefined) {
          if (e.fromElement === e.srcElement) {
            return e.toElement;
          } else {
            return e.fromElement;
          }
        } else {
          return e.relatedTarget;
        }
      },
      movementX: function (e) {
        if ("movementX" in e) {
          return e.movementX;
        } else {
          if (e !== Wr) {
            if (Wr && e.type === "mousemove") {
              El = e.screenX - Wr.screenX;
              Sl = e.screenY - Wr.screenY;
            } else {
              Sl = El = 0;
            }
            Wr = e;
          }
          return El;
        }
      },
      movementY: function (e) {
        if ("movementY" in e) {
          return e.movementY;
        } else {
          return Sl;
        }
      }
    });
    var id = ft(ci);
    var w0 = G({}, ci, {
      dataTransfer: 0
    });
    var E0 = ft(w0);
    var S0 = G({}, $r, {
      relatedTarget: 0
    });
    var xl = ft(S0);
    var x0 = G({}, Qn, {
      animationName: 0,
      elapsedTime: 0,
      pseudoElement: 0
    });
    var k0 = ft(x0);
    var C0 = G({}, Qn, {
      clipboardData: function (e) {
        if ("clipboardData" in e) {
          return e.clipboardData;
        } else {
          return window.clipboardData;
        }
      }
    });
    var _0 = ft(C0);
    var T0 = G({}, Qn, {
      data: 0
    });
    var sd = ft(T0);
    var R0 = {
      Esc: "Escape",
      Spacebar: " ",
      Left: "ArrowLeft",
      Up: "ArrowUp",
      Right: "ArrowRight",
      Down: "ArrowDown",
      Del: "Delete",
      Win: "OS",
      Menu: "ContextMenu",
      Apps: "ContextMenu",
      Scroll: "ScrollLock",
      MozPrintableKey: "Unidentified"
    };
    var P0 = {
      8: "Backspace",
      9: "Tab",
      12: "Clear",
      13: "Enter",
      16: "Shift",
      17: "Control",
      18: "Alt",
      19: "Pause",
      20: "CapsLock",
      27: "Escape",
      32: " ",
      33: "PageUp",
      34: "PageDown",
      35: "End",
      36: "Home",
      37: "ArrowLeft",
      38: "ArrowUp",
      39: "ArrowRight",
      40: "ArrowDown",
      45: "Insert",
      46: "Delete",
      112: "F1",
      113: "F2",
      114: "F3",
      115: "F4",
      116: "F5",
      117: "F6",
      118: "F7",
      119: "F8",
      120: "F9",
      121: "F10",
      122: "F11",
      123: "F12",
      144: "NumLock",
      145: "ScrollLock",
      224: "Meta"
    };
    var N0 = {
      Alt: "altKey",
      Control: "ctrlKey",
      Meta: "metaKey",
      Shift: "shiftKey"
    };
    function O0(e) {
      var t = this.nativeEvent;
      if (t.getModifierState) {
        return t.getModifierState(e);
      } else if (e = N0[e]) {
        return !!t[e];
      } else {
        return false;
      }
    }
    function kl() {
      return O0;
    }
    var A0 = G({}, $r, {
      key: function (e) {
        if (e.key) {
          var t = R0[e.key] || e.key;
          if (t !== "Unidentified") {
            return t;
          }
        }
        if (e.type === "keypress") {
          e = ai(e);
          if (e === 13) {
            return "Enter";
          } else {
            return String.fromCharCode(e);
          }
        } else if (e.type === "keydown" || e.type === "keyup") {
          return P0[e.keyCode] || "Unidentified";
        } else {
          return "";
        }
      },
      code: 0,
      location: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      repeat: 0,
      locale: 0,
      getModifierState: kl,
      charCode: function (e) {
        if (e.type === "keypress") {
          return ai(e);
        } else {
          return 0;
        }
      },
      keyCode: function (e) {
        if (e.type === "keydown" || e.type === "keyup") {
          return e.keyCode;
        } else {
          return 0;
        }
      },
      which: function (e) {
        if (e.type === "keypress") {
          return ai(e);
        } else if (e.type === "keydown" || e.type === "keyup") {
          return e.keyCode;
        } else {
          return 0;
        }
      }
    });
    var I0 = ft(A0);
    var L0 = G({}, ci, {
      pointerId: 0,
      width: 0,
      height: 0,
      pressure: 0,
      tangentialPressure: 0,
      tiltX: 0,
      tiltY: 0,
      twist: 0,
      pointerType: 0,
      isPrimary: 0
    });
    var ld = ft(L0);
    var M0 = G({}, $r, {
      touches: 0,
      targetTouches: 0,
      changedTouches: 0,
      altKey: 0,
      metaKey: 0,
      ctrlKey: 0,
      shiftKey: 0,
      getModifierState: kl
    });
    var D0 = ft(M0);
    var b0 = G({}, Qn, {
      propertyName: 0,
      elapsedTime: 0,
      pseudoElement: 0
    });
    var F0 = ft(b0);
    var z0 = G({}, ci, {
      deltaX: function (e) {
        if ("deltaX" in e) {
          return e.deltaX;
        } else if ("wheelDeltaX" in e) {
          return -e.wheelDeltaX;
        } else {
          return 0;
        }
      },
      deltaY: function (e) {
        if ("deltaY" in e) {
          return e.deltaY;
        } else if ("wheelDeltaY" in e) {
          return -e.wheelDeltaY;
        } else if ("wheelDelta" in e) {
          return -e.wheelDelta;
        } else {
          return 0;
        }
      },
      deltaZ: 0,
      deltaMode: 0
    });
    var j0 = ft(z0);
    var U0 = [9, 13, 27, 32];
    var Cl = m && "CompositionEvent" in window;
    var Kr = null;
    if (m && "documentMode" in document) {
      Kr = document.documentMode;
    }
    var B0 = m && "TextEvent" in window && !Kr;
    var ad = m && (!Cl || Kr && Kr > 8 && Kr <= 11);
    var ud = " ";
    var cd = false;
    function fd(e, t) {
      switch (e) {
        case "keyup":
          return U0.indexOf(t.keyCode) !== -1;
        case "keydown":
          return t.keyCode !== 229;
        case "keypress":
        case "mousedown":
        case "focusout":
          return true;
        default:
          return false;
      }
    }
    function dd(e) {
      e = e.detail;
      if (typeof e == "object" && "data" in e) {
        return e.data;
      } else {
        return null;
      }
    }
    var Xn = false;
    function V0(e, t) {
      switch (e) {
        case "compositionend":
          return dd(t);
        case "keypress":
          if (t.which !== 32) {
            return null;
          } else {
            cd = true;
            return ud;
          }
        case "textInput":
          e = t.data;
          if (e === ud && cd) {
            return null;
          } else {
            return e;
          }
        default:
          return null;
      }
    }
    function $0(e, t) {
      if (Xn) {
        if (e === "compositionend" || !Cl && fd(e, t)) {
          e = rd();
          li = vl = rn = null;
          Xn = false;
          return e;
        } else {
          return null;
        }
      }
      switch (e) {
        case "paste":
          return null;
        case "keypress":
          if (!t.ctrlKey && !t.altKey && !t.metaKey || t.ctrlKey && t.altKey) {
            if (t.char && t.char.length > 1) {
              return t.char;
            }
            if (t.which) {
              return String.fromCharCode(t.which);
            }
          }
          return null;
        case "compositionend":
          if (ad && t.locale !== "ko") {
            return null;
          } else {
            return t.data;
          }
        default:
          return null;
      }
    }
    var W0 = {
      color: true,
      date: true,
      datetime: true,
      "datetime-local": true,
      email: true,
      month: true,
      number: true,
      password: true,
      range: true,
      search: true,
      tel: true,
      text: true,
      time: true,
      url: true,
      week: true
    };
    function pd(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      if (t === "input") {
        return !!W0[e.type];
      } else {
        return t === "textarea";
      }
    }
    function md(e, t, n, s) {
      Mf(s);
      t = hi(t, "onChange");
      if (t.length > 0) {
        n = new wl("onChange", "change", null, n, s);
        e.push({
          event: n,
          listeners: t
        });
      }
    }
    var Hr = null;
    var qr = null;
    function K0(e) {
      Id(e, 0);
    }
    function fi(e) {
      var t = tr(e);
      if (Tn(t)) {
        return e;
      }
    }
    function H0(e, t) {
      if (e === "change") {
        return t;
      }
    }
    var hd = false;
    if (m) {
      var _l;
      if (m) {
        var Tl = "oninput" in document;
        if (!Tl) {
          var gd = document.createElement("div");
          gd.setAttribute("oninput", "return;");
          Tl = typeof gd.oninput == "function";
        }
        _l = Tl;
      } else {
        _l = false;
      }
      hd = _l && (!document.documentMode || document.documentMode > 9);
    }
    function yd() {
      if (Hr) {
        Hr.detachEvent("onpropertychange", vd);
        qr = Hr = null;
      }
    }
    function vd(e) {
      if (e.propertyName === "value" && fi(qr)) {
        var t = [];
        md(t, qr, e, il(e));
        zf(K0, t);
      }
    }
    function q0(e, t, n) {
      if (e === "focusin") {
        yd();
        Hr = t;
        qr = n;
        Hr.attachEvent("onpropertychange", vd);
      } else if (e === "focusout") {
        yd();
      }
    }
    function G0(e) {
      if (e === "selectionchange" || e === "keyup" || e === "keydown") {
        return fi(qr);
      }
    }
    function Q0(e, t) {
      if (e === "click") {
        return fi(t);
      }
    }
    function X0(e, t) {
      if (e === "input" || e === "change") {
        return fi(t);
      }
    }
    function Y0(e, t) {
      return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
    }
    var Ct = typeof Object.is == "function" ? Object.is : Y0;
    function Gr(e, t) {
      if (Ct(e, t)) {
        return true;
      }
      if (typeof e != "object" || e === null || typeof t != "object" || t === null) {
        return false;
      }
      var n = Object.keys(e);
      var s = Object.keys(t);
      if (n.length !== s.length) {
        return false;
      }
      for (s = 0; s < n.length; s++) {
        var a = n[s];
        if (!w.call(t, a) || !Ct(e[a], t[a])) {
          return false;
        }
      }
      return true;
    }
    function wd(e) {
      while (e && e.firstChild) {
        e = e.firstChild;
      }
      return e;
    }
    function Ed(e, t) {
      var n = wd(e);
      e = 0;
      var s;
      for (; n;) {
        if (n.nodeType === 3) {
          s = e + n.textContent.length;
          if (e <= t && s >= t) {
            return {
              node: n,
              offset: t - e
            };
          }
          e = s;
        }
        e: {
          while (n) {
            if (n.nextSibling) {
              n = n.nextSibling;
              break e;
            }
            n = n.parentNode;
          }
          n = undefined;
        }
        n = wd(n);
      }
    }
    function Sd(e, t) {
      if (e && t) {
        if (e === t) {
          return true;
        } else if (e && e.nodeType === 3) {
          return false;
        } else if (t && t.nodeType === 3) {
          return Sd(e, t.parentNode);
        } else if ("contains" in e) {
          return e.contains(t);
        } else if (e.compareDocumentPosition) {
          return !!(e.compareDocumentPosition(t) & 16);
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
    function xd() {
      for (var e = window, t = Go(); t instanceof e.HTMLIFrameElement;) {
        try {
          var n = typeof t.contentWindow.location.href == "string";
        } catch {
          n = false;
        }
        if (n) {
          e = t.contentWindow;
        } else {
          break;
        }
        t = Go(e.document);
      }
      return t;
    }
    function Rl(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
    }
    function J0(e) {
      var t = xd();
      var n = e.focusedElem;
      var s = e.selectionRange;
      if (t !== n && n && n.ownerDocument && Sd(n.ownerDocument.documentElement, n)) {
        if (s !== null && Rl(n)) {
          t = s.start;
          e = s.end;
          if (e === undefined) {
            e = t;
          }
          if ("selectionStart" in n) {
            n.selectionStart = t;
            n.selectionEnd = Math.min(e, n.value.length);
          } else {
            e = (t = n.ownerDocument || document) && t.defaultView || window;
            if (e.getSelection) {
              e = e.getSelection();
              var a = n.textContent.length;
              var u = Math.min(s.start, a);
              s = s.end === undefined ? u : Math.min(s.end, a);
              if (!e.extend && u > s) {
                a = s;
                s = u;
                u = a;
              }
              a = Ed(n, u);
              var d = Ed(n, s);
              if (a && d && (e.rangeCount !== 1 || e.anchorNode !== a.node || e.anchorOffset !== a.offset || e.focusNode !== d.node || e.focusOffset !== d.offset)) {
                t = t.createRange();
                t.setStart(a.node, a.offset);
                e.removeAllRanges();
                if (u > s) {
                  e.addRange(t);
                  e.extend(d.node, d.offset);
                } else {
                  t.setEnd(d.node, d.offset);
                  e.addRange(t);
                }
              }
            }
          }
        }
        t = [];
        e = n;
        while (e = e.parentNode) {
          if (e.nodeType === 1) {
            t.push({
              element: e,
              left: e.scrollLeft,
              top: e.scrollTop
            });
          }
        }
        if (typeof n.focus == "function") {
          n.focus();
        }
        n = 0;
        for (; n < t.length; n++) {
          e = t[n];
          e.element.scrollLeft = e.left;
          e.element.scrollTop = e.top;
        }
      }
    }
    var Z0 = m && "documentMode" in document && document.documentMode <= 11;
    var Yn = null;
    var Pl = null;
    var Qr = null;
    var Nl = false;
    function kd(e, t, n) {
      var s = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
      if (!Nl && Yn != null && Yn === Go(s)) {
        s = Yn;
        if ("selectionStart" in s && Rl(s)) {
          s = {
            start: s.selectionStart,
            end: s.selectionEnd
          };
        } else {
          s = (s.ownerDocument && s.ownerDocument.defaultView || window).getSelection();
          s = {
            anchorNode: s.anchorNode,
            anchorOffset: s.anchorOffset,
            focusNode: s.focusNode,
            focusOffset: s.focusOffset
          };
        }
        if (!Qr || !Gr(Qr, s)) {
          Qr = s;
          s = hi(Pl, "onSelect");
          if (s.length > 0) {
            t = new wl("onSelect", "select", null, t, n);
            e.push({
              event: t,
              listeners: s
            });
            t.target = Yn;
          }
        }
      }
    }
    function di(e, t) {
      var n = {};
      n[e.toLowerCase()] = t.toLowerCase();
      n["Webkit" + e] = "webkit" + t;
      n["Moz" + e] = "moz" + t;
      return n;
    }
    var Jn = {
      animationend: di("Animation", "AnimationEnd"),
      animationiteration: di("Animation", "AnimationIteration"),
      animationstart: di("Animation", "AnimationStart"),
      transitionend: di("Transition", "TransitionEnd")
    };
    var Ol = {};
    var Cd = {};
    if (m) {
      Cd = document.createElement("div").style;
      if (!("AnimationEvent" in window)) {
        delete Jn.animationend.animation;
        delete Jn.animationiteration.animation;
        delete Jn.animationstart.animation;
      }
      if (!("TransitionEvent" in window)) {
        delete Jn.transitionend.transition;
      }
    }
    function pi(e) {
      if (Ol[e]) {
        return Ol[e];
      }
      if (!Jn[e]) {
        return e;
      }
      var t = Jn[e];
      var n;
      for (n in t) {
        if (t.hasOwnProperty(n) && n in Cd) {
          return Ol[e] = t[n];
        }
      }
      return e;
    }
    var _d = pi("animationend");
    var Td = pi("animationiteration");
    var Rd = pi("animationstart");
    var Pd = pi("transitionend");
    var Nd = new Map();
    var Od = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
    function on(e, t) {
      Nd.set(e, t);
      f(t, [e]);
    }
    for (var Al = 0; Al < Od.length; Al++) {
      var Il = Od[Al];
      var eE = Il.toLowerCase();
      var tE = Il[0].toUpperCase() + Il.slice(1);
      on(eE, "on" + tE);
    }
    on(_d, "onAnimationEnd");
    on(Td, "onAnimationIteration");
    on(Rd, "onAnimationStart");
    on("dblclick", "onDoubleClick");
    on("focusin", "onFocus");
    on("focusout", "onBlur");
    on(Pd, "onTransitionEnd");
    p("onMouseEnter", ["mouseout", "mouseover"]);
    p("onMouseLeave", ["mouseout", "mouseover"]);
    p("onPointerEnter", ["pointerout", "pointerover"]);
    p("onPointerLeave", ["pointerout", "pointerover"]);
    f("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
    f("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
    f("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
    f("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
    f("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
    f("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
    var Xr = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" ");
    var nE = new Set("cancel close invalid load scroll toggle".split(" ").concat(Xr));
    function Ad(e, t, n) {
      var s = e.type || "unknown-event";
      e.currentTarget = n;
      e0(s, t, undefined, e);
      e.currentTarget = null;
    }
    function Id(e, t) {
      t = (t & 4) !== 0;
      for (var n = 0; n < e.length; n++) {
        var s = e[n];
        var a = s.event;
        s = s.listeners;
        e: {
          var u = undefined;
          if (t) {
            for (var d = s.length - 1; d >= 0; d--) {
              var h = s[d];
              var S = h.instance;
              var A = h.currentTarget;
              h = h.listener;
              if (S !== u && a.isPropagationStopped()) {
                break e;
              }
              Ad(a, h, A);
              u = S;
            }
          } else {
            for (d = 0; d < s.length; d++) {
              h = s[d];
              S = h.instance;
              A = h.currentTarget;
              h = h.listener;
              if (S !== u && a.isPropagationStopped()) {
                break e;
              }
              Ad(a, h, A);
              u = S;
            }
          }
        }
      }
      if (Yo) {
        e = ul;
        Yo = false;
        ul = null;
        throw e;
      }
    }
    function Ae(e, t) {
      var n = t[Ul];
      if (n === undefined) {
        n = t[Ul] = new Set();
      }
      var s = e + "__bubble";
      if (!n.has(s)) {
        Ld(t, e, 2, false);
        n.add(s);
      }
    }
    function Ll(e, t, n) {
      var s = 0;
      if (t) {
        s |= 4;
      }
      Ld(n, e, s, t);
    }
    var mi = "_reactListening" + Math.random().toString(36).slice(2);
    function Yr(e) {
      if (!e[mi]) {
        e[mi] = true;
        l.forEach(function (n) {
          if (n !== "selectionchange") {
            if (!nE.has(n)) {
              Ll(n, false, e);
            }
            Ll(n, true, e);
          }
        });
        var t = e.nodeType === 9 ? e : e.ownerDocument;
        if (t !== null && !t[mi]) {
          t[mi] = true;
          Ll("selectionchange", false, t);
        }
      }
    }
    function Ld(e, t, n, s) {
      switch (nd(t)) {
        case 1:
          var a = g0;
          break;
        case 4:
          a = y0;
          break;
        default:
          a = gl;
      }
      n = a.bind(null, t, n, e);
      a = undefined;
      if (!!al && (t === "touchstart" || t === "touchmove" || t === "wheel")) {
        a = true;
      }
      if (s) {
        if (a !== undefined) {
          e.addEventListener(t, n, {
            capture: true,
            passive: a
          });
        } else {
          e.addEventListener(t, n, true);
        }
      } else if (a !== undefined) {
        e.addEventListener(t, n, {
          passive: a
        });
      } else {
        e.addEventListener(t, n, false);
      }
    }
    function Ml(e, t, n, s, a) {
      var u = s;
      if ((t & 1) === 0 && (t & 2) === 0 && s !== null) {
        e: while (true) {
          if (s === null) {
            return;
          }
          var d = s.tag;
          if (d === 3 || d === 4) {
            var h = s.stateNode.containerInfo;
            if (h === a || h.nodeType === 8 && h.parentNode === a) {
              break;
            }
            if (d === 4) {
              for (d = s.return; d !== null;) {
                var S = d.tag;
                if ((S === 3 || S === 4) && (S = d.stateNode.containerInfo, S === a || S.nodeType === 8 && S.parentNode === a)) {
                  return;
                }
                d = d.return;
              }
            }
            while (h !== null) {
              d = Pn(h);
              if (d === null) {
                return;
              }
              S = d.tag;
              if (S === 5 || S === 6) {
                s = u = d;
                continue e;
              }
              h = h.parentNode;
            }
          }
          s = s.return;
        }
      }
      zf(function () {
        var A = u;
        var j = il(n);
        var U = [];
        e: {
          var z = Nd.get(e);
          if (z !== undefined) {
            var Q = wl;
            var ee = e;
            switch (e) {
              case "keypress":
                if (ai(n) === 0) {
                  break e;
                }
              case "keydown":
              case "keyup":
                Q = I0;
                break;
              case "focusin":
                ee = "focus";
                Q = xl;
                break;
              case "focusout":
                ee = "blur";
                Q = xl;
                break;
              case "beforeblur":
              case "afterblur":
                Q = xl;
                break;
              case "click":
                if (n.button === 2) {
                  break e;
                }
              case "auxclick":
              case "dblclick":
              case "mousedown":
              case "mousemove":
              case "mouseup":
              case "mouseout":
              case "mouseover":
              case "contextmenu":
                Q = id;
                break;
              case "drag":
              case "dragend":
              case "dragenter":
              case "dragexit":
              case "dragleave":
              case "dragover":
              case "dragstart":
              case "drop":
                Q = E0;
                break;
              case "touchcancel":
              case "touchend":
              case "touchmove":
              case "touchstart":
                Q = D0;
                break;
              case _d:
              case Td:
              case Rd:
                Q = k0;
                break;
              case Pd:
                Q = F0;
                break;
              case "scroll":
                Q = v0;
                break;
              case "wheel":
                Q = j0;
                break;
              case "copy":
              case "cut":
              case "paste":
                Q = _0;
                break;
              case "gotpointercapture":
              case "lostpointercapture":
              case "pointercancel":
              case "pointerdown":
              case "pointermove":
              case "pointerout":
              case "pointerover":
              case "pointerup":
                Q = ld;
            }
            var te = (t & 4) !== 0;
            var ze = !te && e === "scroll";
            var R = te ? z !== null ? z + "Capture" : null : z;
            te = [];
            for (var x = A, P; x !== null;) {
              P = x;
              var V = P.stateNode;
              if (P.tag === 5 && V !== null) {
                P = V;
                if (R !== null) {
                  V = Lr(x, R);
                  if (V != null) {
                    te.push(Jr(x, V, P));
                  }
                }
              }
              if (ze) {
                break;
              }
              x = x.return;
            }
            if (te.length > 0) {
              z = new Q(z, ee, null, n, j);
              U.push({
                event: z,
                listeners: te
              });
            }
          }
        }
        if ((t & 7) === 0) {
          e: {
            z = e === "mouseover" || e === "pointerover";
            Q = e === "mouseout" || e === "pointerout";
            if (z && n !== ol && (ee = n.relatedTarget || n.fromElement) && (Pn(ee) || ee[zt])) {
              break e;
            }
            if ((Q || z) && (z = j.window === j ? j : (z = j.ownerDocument) ? z.defaultView || z.parentWindow : window, Q ? (ee = n.relatedTarget || n.toElement, Q = A, ee = ee ? Pn(ee) : null, ee !== null && (ze = Rn(ee), ee !== ze || ee.tag !== 5 && ee.tag !== 6) && (ee = null)) : (Q = null, ee = A), Q !== ee)) {
              te = id;
              V = "onMouseLeave";
              R = "onMouseEnter";
              x = "mouse";
              if (e === "pointerout" || e === "pointerover") {
                te = ld;
                V = "onPointerLeave";
                R = "onPointerEnter";
                x = "pointer";
              }
              ze = Q == null ? z : tr(Q);
              P = ee == null ? z : tr(ee);
              z = new te(V, x + "leave", Q, n, j);
              z.target = ze;
              z.relatedTarget = P;
              V = null;
              if (Pn(j) === A) {
                te = new te(R, x + "enter", ee, n, j);
                te.target = P;
                te.relatedTarget = ze;
                V = te;
              }
              ze = V;
              if (Q && ee) {
                t: {
                  te = Q;
                  R = ee;
                  x = 0;
                  P = te;
                  for (; P; P = Zn(P)) {
                    x++;
                  }
                  P = 0;
                  V = R;
                  for (; V; V = Zn(V)) {
                    P++;
                  }
                  while (x - P > 0) {
                    te = Zn(te);
                    x--;
                  }
                  while (P - x > 0) {
                    R = Zn(R);
                    P--;
                  }
                  while (x--) {
                    if (te === R || R !== null && te === R.alternate) {
                      break t;
                    }
                    te = Zn(te);
                    R = Zn(R);
                  }
                  te = null;
                }
              } else {
                te = null;
              }
              if (Q !== null) {
                Md(U, z, Q, te, false);
              }
              if (ee !== null && ze !== null) {
                Md(U, ze, ee, te, true);
              }
            }
          }
          e: {
            z = A ? tr(A) : window;
            Q = z.nodeName && z.nodeName.toLowerCase();
            if (Q === "select" || Q === "input" && z.type === "file") {
              var re = H0;
            } else if (pd(z)) {
              if (hd) {
                re = X0;
              } else {
                re = G0;
                var le = q0;
              }
            } else if ((Q = z.nodeName) && Q.toLowerCase() === "input" && (z.type === "checkbox" || z.type === "radio")) {
              re = Q0;
            }
            if (re &&= re(e, A)) {
              md(U, re, n, j);
              break e;
            }
            if (le) {
              le(e, z, A);
            }
            if (e === "focusout" && (le = z._wrapperState) && le.controlled && z.type === "number") {
              Zs(z, "number", z.value);
            }
          }
          le = A ? tr(A) : window;
          switch (e) {
            case "focusin":
              if (pd(le) || le.contentEditable === "true") {
                Yn = le;
                Pl = A;
                Qr = null;
              }
              break;
            case "focusout":
              Qr = Pl = Yn = null;
              break;
            case "mousedown":
              Nl = true;
              break;
            case "contextmenu":
            case "mouseup":
            case "dragend":
              Nl = false;
              kd(U, n, j);
              break;
            case "selectionchange":
              if (Z0) {
                break;
              }
            case "keydown":
            case "keyup":
              kd(U, n, j);
          }
          var ae;
          if (Cl) {
            e: {
              switch (e) {
                case "compositionstart":
                  var fe = "onCompositionStart";
                  break e;
                case "compositionend":
                  fe = "onCompositionEnd";
                  break e;
                case "compositionupdate":
                  fe = "onCompositionUpdate";
                  break e;
              }
              fe = undefined;
            }
          } else if (Xn) {
            if (fd(e, n)) {
              fe = "onCompositionEnd";
            }
          } else if (e === "keydown" && n.keyCode === 229) {
            fe = "onCompositionStart";
          }
          if (fe) {
            if (ad && n.locale !== "ko") {
              if (Xn || fe !== "onCompositionStart") {
                if (fe === "onCompositionEnd" && Xn) {
                  ae = rd();
                }
              } else {
                rn = j;
                vl = "value" in rn ? rn.value : rn.textContent;
                Xn = true;
              }
            }
            le = hi(A, fe);
            if (le.length > 0) {
              fe = new sd(fe, e, null, n, j);
              U.push({
                event: fe,
                listeners: le
              });
              if (ae) {
                fe.data = ae;
              } else {
                ae = dd(n);
                if (ae !== null) {
                  fe.data = ae;
                }
              }
            }
          }
          if (ae = B0 ? V0(e, n) : $0(e, n)) {
            A = hi(A, "onBeforeInput");
            if (A.length > 0) {
              j = new sd("onBeforeInput", "beforeinput", null, n, j);
              U.push({
                event: j,
                listeners: A
              });
              j.data = ae;
            }
          }
        }
        Id(U, t);
      });
    }
    function Jr(e, t, n) {
      return {
        instance: e,
        listener: t,
        currentTarget: n
      };
    }
    function hi(e, t) {
      var n = t + "Capture";
      var s = [];
      for (; e !== null;) {
        var a = e;
        var u = a.stateNode;
        if (a.tag === 5 && u !== null) {
          a = u;
          u = Lr(e, n);
          if (u != null) {
            s.unshift(Jr(e, u, a));
          }
          u = Lr(e, t);
          if (u != null) {
            s.push(Jr(e, u, a));
          }
        }
        e = e.return;
      }
      return s;
    }
    function Zn(e) {
      if (e === null) {
        return null;
      }
      do {
        e = e.return;
      } while (e && e.tag !== 5);
      return e || null;
    }
    function Md(e, t, n, s, a) {
      var u = t._reactName;
      var d = [];
      for (; n !== null && n !== s;) {
        var h = n;
        var S = h.alternate;
        var A = h.stateNode;
        if (S !== null && S === s) {
          break;
        }
        if (h.tag === 5 && A !== null) {
          h = A;
          if (a) {
            S = Lr(n, u);
            if (S != null) {
              d.unshift(Jr(n, S, h));
            }
          } else if (!a) {
            S = Lr(n, u);
            if (S != null) {
              d.push(Jr(n, S, h));
            }
          }
        }
        n = n.return;
      }
      if (d.length !== 0) {
        e.push({
          event: t,
          listeners: d
        });
      }
    }
    var rE = /\r\n?/g;
    var oE = /\u0000|\uFFFD/g;
    function Dd(e) {
      return (typeof e == "string" ? e : "" + e).replace(rE, `
`).replace(oE, "");
    }
    function gi(e, t, n) {
      t = Dd(t);
      if (Dd(e) !== t && n) {
        throw Error(i(425));
      }
    }
    function yi() {}
    var Dl = null;
    var bl = null;
    function Fl(e, t) {
      return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
    }
    var zl = typeof setTimeout == "function" ? setTimeout : undefined;
    var iE = typeof clearTimeout == "function" ? clearTimeout : undefined;
    var bd = typeof Promise == "function" ? Promise : undefined;
    var sE = typeof queueMicrotask == "function" ? queueMicrotask : typeof bd !== "undefined" ? function (e) {
      return bd.resolve(null).then(e).catch(lE);
    } : zl;
    function lE(e) {
      setTimeout(function () {
        throw e;
      });
    }
    function jl(e, t) {
      var n = t;
      var s = 0;
      do {
        var a = n.nextSibling;
        e.removeChild(n);
        if (a && a.nodeType === 8) {
          n = a.data;
          if (n === "/$") {
            if (s === 0) {
              e.removeChild(a);
              Vr(t);
              return;
            }
            s--;
          } else if (n === "$" || n === "$?" || n === "$!") {
            s++;
          }
        }
        n = a;
      } while (n);
      Vr(t);
    }
    function sn(e) {
      for (; e != null; e = e.nextSibling) {
        var t = e.nodeType;
        if (t === 1 || t === 3) {
          break;
        }
        if (t === 8) {
          t = e.data;
          if (t === "$" || t === "$!" || t === "$?") {
            break;
          }
          if (t === "/$") {
            return null;
          }
        }
      }
      return e;
    }
    function Fd(e) {
      e = e.previousSibling;
      var t = 0;
      for (; e;) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === "$" || n === "$!" || n === "$?") {
            if (t === 0) {
              return e;
            }
            t--;
          } else if (n === "/$") {
            t++;
          }
        }
        e = e.previousSibling;
      }
      return null;
    }
    var er = Math.random().toString(36).slice(2);
    var Lt = "__reactFiber$" + er;
    var Zr = "__reactProps$" + er;
    var zt = "__reactContainer$" + er;
    var Ul = "__reactEvents$" + er;
    var aE = "__reactListeners$" + er;
    var uE = "__reactHandles$" + er;
    function Pn(e) {
      var t = e[Lt];
      if (t) {
        return t;
      }
      for (var n = e.parentNode; n;) {
        if (t = n[zt] || n[Lt]) {
          n = t.alternate;
          if (t.child !== null || n !== null && n.child !== null) {
            for (e = Fd(e); e !== null;) {
              if (n = e[Lt]) {
                return n;
              }
              e = Fd(e);
            }
          }
          return t;
        }
        e = n;
        n = e.parentNode;
      }
      return null;
    }
    function eo(e) {
      e = e[Lt] || e[zt];
      if (!e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) {
        return null;
      } else {
        return e;
      }
    }
    function tr(e) {
      if (e.tag === 5 || e.tag === 6) {
        return e.stateNode;
      }
      throw Error(i(33));
    }
    function vi(e) {
      return e[Zr] || null;
    }
    var Bl = [];
    var nr = -1;
    function ln(e) {
      return {
        current: e
      };
    }
    function Ie(e) {
      if (!(nr < 0)) {
        e.current = Bl[nr];
        Bl[nr] = null;
        nr--;
      }
    }
    function Ne(e, t) {
      nr++;
      Bl[nr] = e.current;
      e.current = t;
    }
    var an = {};
    var Xe = ln(an);
    var it = ln(false);
    var Nn = an;
    function rr(e, t) {
      var n = e.type.contextTypes;
      if (!n) {
        return an;
      }
      var s = e.stateNode;
      if (s && s.__reactInternalMemoizedUnmaskedChildContext === t) {
        return s.__reactInternalMemoizedMaskedChildContext;
      }
      var a = {};
      var u;
      for (u in n) {
        a[u] = t[u];
      }
      if (s) {
        e = e.stateNode;
        e.__reactInternalMemoizedUnmaskedChildContext = t;
        e.__reactInternalMemoizedMaskedChildContext = a;
      }
      return a;
    }
    function st(e) {
      e = e.childContextTypes;
      return e != null;
    }
    function wi() {
      Ie(it);
      Ie(Xe);
    }
    function zd(e, t, n) {
      if (Xe.current !== an) {
        throw Error(i(168));
      }
      Ne(Xe, t);
      Ne(it, n);
    }
    function jd(e, t, n) {
      var s = e.stateNode;
      t = t.childContextTypes;
      if (typeof s.getChildContext != "function") {
        return n;
      }
      s = s.getChildContext();
      for (var a in s) {
        if (!(a in t)) {
          throw Error(i(108, pe(e) || "Unknown", a));
        }
      }
      return G({}, n, s);
    }
    function Ei(e) {
      e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || an;
      Nn = Xe.current;
      Ne(Xe, e);
      Ne(it, it.current);
      return true;
    }
    function Ud(e, t, n) {
      var s = e.stateNode;
      if (!s) {
        throw Error(i(169));
      }
      if (n) {
        e = jd(e, t, Nn);
        s.__reactInternalMemoizedMergedChildContext = e;
        Ie(it);
        Ie(Xe);
        Ne(Xe, e);
      } else {
        Ie(it);
      }
      Ne(it, n);
    }
    var jt = null;
    var Si = false;
    var Vl = false;
    function Bd(e) {
      if (jt === null) {
        jt = [e];
      } else {
        jt.push(e);
      }
    }
    function cE(e) {
      Si = true;
      Bd(e);
    }
    function un() {
      if (!Vl && jt !== null) {
        Vl = true;
        var e = 0;
        var t = Pe;
        try {
          var n = jt;
          for (Pe = 1; e < n.length; e++) {
            var s = n[e];
            do {
              s = s(true);
            } while (s !== null);
          }
          jt = null;
          Si = false;
        } catch (a) {
          if (jt !== null) {
            jt = jt.slice(e + 1);
          }
          $f(cl, un);
          throw a;
        } finally {
          Pe = t;
          Vl = false;
        }
      }
      return null;
    }
    var or = [];
    var ir = 0;
    var xi = null;
    var ki = 0;
    var gt = [];
    var yt = 0;
    var On = null;
    var Ut = 1;
    var Bt = "";
    function An(e, t) {
      or[ir++] = ki;
      or[ir++] = xi;
      xi = e;
      ki = t;
    }
    function Vd(e, t, n) {
      gt[yt++] = Ut;
      gt[yt++] = Bt;
      gt[yt++] = On;
      On = e;
      var s = Ut;
      e = Bt;
      var a = 32 - kt(s) - 1;
      s &= ~(1 << a);
      n += 1;
      var u = 32 - kt(t) + a;
      if (u > 30) {
        var d = a - a % 5;
        u = (s & (1 << d) - 1).toString(32);
        s >>= d;
        a -= d;
        Ut = 1 << 32 - kt(t) + a | n << a | s;
        Bt = u + e;
      } else {
        Ut = 1 << u | n << a | s;
        Bt = e;
      }
    }
    function $l(e) {
      if (e.return !== null) {
        An(e, 1);
        Vd(e, 1, 0);
      }
    }
    function Wl(e) {
      while (e === xi) {
        xi = or[--ir];
        or[ir] = null;
        ki = or[--ir];
        or[ir] = null;
      }
      while (e === On) {
        On = gt[--yt];
        gt[yt] = null;
        Bt = gt[--yt];
        gt[yt] = null;
        Ut = gt[--yt];
        gt[yt] = null;
      }
    }
    var dt = null;
    var pt = null;
    var Le = false;
    var _t = null;
    function $d(e, t) {
      var n = St(5, null, null, 0);
      n.elementType = "DELETED";
      n.stateNode = t;
      n.return = e;
      t = e.deletions;
      if (t === null) {
        e.deletions = [n];
        e.flags |= 16;
      } else {
        t.push(n);
      }
    }
    function Wd(e, t) {
      switch (e.tag) {
        case 5:
          var n = e.type;
          t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t;
          if (t !== null) {
            e.stateNode = t;
            dt = e;
            pt = sn(t.firstChild);
            return true;
          } else {
            return false;
          }
        case 6:
          t = e.pendingProps === "" || t.nodeType !== 3 ? null : t;
          if (t !== null) {
            e.stateNode = t;
            dt = e;
            pt = null;
            return true;
          } else {
            return false;
          }
        case 13:
          t = t.nodeType !== 8 ? null : t;
          if (t !== null) {
            n = On !== null ? {
              id: Ut,
              overflow: Bt
            } : null;
            e.memoizedState = {
              dehydrated: t,
              treeContext: n,
              retryLane: 1073741824
            };
            n = St(18, null, null, 0);
            n.stateNode = t;
            n.return = e;
            e.child = n;
            dt = e;
            pt = null;
            return true;
          } else {
            return false;
          }
        default:
          return false;
      }
    }
    function Kl(e) {
      return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
    }
    function Hl(e) {
      if (Le) {
        var t = pt;
        if (t) {
          var n = t;
          if (!Wd(e, t)) {
            if (Kl(e)) {
              throw Error(i(418));
            }
            t = sn(n.nextSibling);
            var s = dt;
            if (t && Wd(e, t)) {
              $d(s, n);
            } else {
              e.flags = e.flags & -4097 | 2;
              Le = false;
              dt = e;
            }
          }
        } else {
          if (Kl(e)) {
            throw Error(i(418));
          }
          e.flags = e.flags & -4097 | 2;
          Le = false;
          dt = e;
        }
      }
    }
    function Kd(e) {
      for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13;) {
        e = e.return;
      }
      dt = e;
    }
    function Ci(e) {
      if (e !== dt) {
        return false;
      }
      if (!Le) {
        Kd(e);
        Le = true;
        return false;
      }
      var t;
      if ((t = e.tag !== 3) && !(t = e.tag !== 5)) {
        t = e.type;
        t = t !== "head" && t !== "body" && !Fl(e.type, e.memoizedProps);
      }
      if (t &&= pt) {
        if (Kl(e)) {
          Hd();
          throw Error(i(418));
        }
        while (t) {
          $d(e, t);
          t = sn(t.nextSibling);
        }
      }
      Kd(e);
      if (e.tag === 13) {
        e = e.memoizedState;
        e = e !== null ? e.dehydrated : null;
        if (!e) {
          throw Error(i(317));
        }
        e: {
          e = e.nextSibling;
          t = 0;
          while (e) {
            if (e.nodeType === 8) {
              var n = e.data;
              if (n === "/$") {
                if (t === 0) {
                  pt = sn(e.nextSibling);
                  break e;
                }
                t--;
              } else if (n === "$" || n === "$!" || n === "$?") {
                t++;
              }
            }
            e = e.nextSibling;
          }
          pt = null;
        }
      } else {
        pt = dt ? sn(e.stateNode.nextSibling) : null;
      }
      return true;
    }
    function Hd() {
      for (var e = pt; e;) {
        e = sn(e.nextSibling);
      }
    }
    function sr() {
      pt = dt = null;
      Le = false;
    }
    function ql(e) {
      if (_t === null) {
        _t = [e];
      } else {
        _t.push(e);
      }
    }
    var fE = D.ReactCurrentBatchConfig;
    function to(e, t, n) {
      e = n.ref;
      if (e !== null && typeof e != "function" && typeof e != "object") {
        if (n._owner) {
          n = n._owner;
          if (n) {
            if (n.tag !== 1) {
              throw Error(i(309));
            }
            var s = n.stateNode;
          }
          if (!s) {
            throw Error(i(147, e));
          }
          var a = s;
          var u = "" + e;
          if (t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === u) {
            return t.ref;
          } else {
            t = function (d) {
              var h = a.refs;
              if (d === null) {
                delete h[u];
              } else {
                h[u] = d;
              }
            };
            t._stringRef = u;
            return t;
          }
        }
        if (typeof e != "string") {
          throw Error(i(284));
        }
        if (!n._owner) {
          throw Error(i(290, e));
        }
      }
      return e;
    }
    function _i(e, t) {
      e = Object.prototype.toString.call(t);
      throw Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
    }
    function qd(e) {
      var t = e._init;
      return t(e._payload);
    }
    function Gd(e) {
      function t(R, x) {
        if (e) {
          var P = R.deletions;
          if (P === null) {
            R.deletions = [x];
            R.flags |= 16;
          } else {
            P.push(x);
          }
        }
      }
      function n(R, x) {
        if (!e) {
          return null;
        }
        while (x !== null) {
          t(R, x);
          x = x.sibling;
        }
        return null;
      }
      function s(R, x) {
        for (R = new Map(); x !== null;) {
          if (x.key !== null) {
            R.set(x.key, x);
          } else {
            R.set(x.index, x);
          }
          x = x.sibling;
        }
        return R;
      }
      function a(R, x) {
        R = yn(R, x);
        R.index = 0;
        R.sibling = null;
        return R;
      }
      function u(R, x, P) {
        R.index = P;
        if (e) {
          P = R.alternate;
          if (P !== null) {
            P = P.index;
            if (P < x) {
              R.flags |= 2;
              return x;
            } else {
              return P;
            }
          } else {
            R.flags |= 2;
            return x;
          }
        } else {
          R.flags |= 1048576;
          return x;
        }
      }
      function d(R) {
        if (e && R.alternate === null) {
          R.flags |= 2;
        }
        return R;
      }
      function h(R, x, P, V) {
        if (x === null || x.tag !== 6) {
          x = za(P, R.mode, V);
          x.return = R;
          return x;
        } else {
          x = a(x, P);
          x.return = R;
          return x;
        }
      }
      function S(R, x, P, V) {
        var re = P.type;
        if (re === q) {
          return j(R, x, P.props.children, V, P.key);
        } else if (x !== null && (x.elementType === re || typeof re == "object" && re !== null && re.$$typeof === se && qd(re) === x.type)) {
          V = a(x, P.props);
          V.ref = to(R, x, P);
          V.return = R;
          return V;
        } else {
          V = Qi(P.type, P.key, P.props, null, R.mode, V);
          V.ref = to(R, x, P);
          V.return = R;
          return V;
        }
      }
      function A(R, x, P, V) {
        if (x === null || x.tag !== 4 || x.stateNode.containerInfo !== P.containerInfo || x.stateNode.implementation !== P.implementation) {
          x = ja(P, R.mode, V);
          x.return = R;
          return x;
        } else {
          x = a(x, P.children || []);
          x.return = R;
          return x;
        }
      }
      function j(R, x, P, V, re) {
        if (x === null || x.tag !== 7) {
          x = jn(P, R.mode, V, re);
          x.return = R;
          return x;
        } else {
          x = a(x, P);
          x.return = R;
          return x;
        }
      }
      function U(R, x, P) {
        if (typeof x == "string" && x !== "" || typeof x == "number") {
          x = za("" + x, R.mode, P);
          x.return = R;
          return x;
        }
        if (typeof x == "object" && x !== null) {
          switch (x.$$typeof) {
            case H:
              P = Qi(x.type, x.key, x.props, null, R.mode, P);
              P.ref = to(R, null, x);
              P.return = R;
              return P;
            case W:
              x = ja(x, R.mode, P);
              x.return = R;
              return x;
            case se:
              var V = x._init;
              return U(R, V(x._payload), P);
          }
          if (Or(x) || ne(x)) {
            x = jn(x, R.mode, P, null);
            x.return = R;
            return x;
          }
          _i(R, x);
        }
        return null;
      }
      function z(R, x, P, V) {
        var re = x !== null ? x.key : null;
        if (typeof P == "string" && P !== "" || typeof P == "number") {
          if (re !== null) {
            return null;
          } else {
            return h(R, x, "" + P, V);
          }
        }
        if (typeof P == "object" && P !== null) {
          switch (P.$$typeof) {
            case H:
              if (P.key === re) {
                return S(R, x, P, V);
              } else {
                return null;
              }
            case W:
              if (P.key === re) {
                return A(R, x, P, V);
              } else {
                return null;
              }
            case se:
              re = P._init;
              return z(R, x, re(P._payload), V);
          }
          if (Or(P) || ne(P)) {
            if (re !== null) {
              return null;
            } else {
              return j(R, x, P, V, null);
            }
          }
          _i(R, P);
        }
        return null;
      }
      function Q(R, x, P, V, re) {
        if (typeof V == "string" && V !== "" || typeof V == "number") {
          R = R.get(P) || null;
          return h(x, R, "" + V, re);
        }
        if (typeof V == "object" && V !== null) {
          switch (V.$$typeof) {
            case H:
              R = R.get(V.key === null ? P : V.key) || null;
              return S(x, R, V, re);
            case W:
              R = R.get(V.key === null ? P : V.key) || null;
              return A(x, R, V, re);
            case se:
              var le = V._init;
              return Q(R, x, P, le(V._payload), re);
          }
          if (Or(V) || ne(V)) {
            R = R.get(P) || null;
            return j(x, R, V, re, null);
          }
          _i(x, V);
        }
        return null;
      }
      function ee(R, x, P, V) {
        var re = null;
        var le = null;
        for (var ae = x, fe = x = 0, He = null; ae !== null && fe < P.length; fe++) {
          if (ae.index > fe) {
            He = ae;
            ae = null;
          } else {
            He = ae.sibling;
          }
          var Ce = z(R, ae, P[fe], V);
          if (Ce === null) {
            if (ae === null) {
              ae = He;
            }
            break;
          }
          if (e && ae && Ce.alternate === null) {
            t(R, ae);
          }
          x = u(Ce, x, fe);
          if (le === null) {
            re = Ce;
          } else {
            le.sibling = Ce;
          }
          le = Ce;
          ae = He;
        }
        if (fe === P.length) {
          n(R, ae);
          if (Le) {
            An(R, fe);
          }
          return re;
        }
        if (ae === null) {
          for (; fe < P.length; fe++) {
            ae = U(R, P[fe], V);
            if (ae !== null) {
              x = u(ae, x, fe);
              if (le === null) {
                re = ae;
              } else {
                le.sibling = ae;
              }
              le = ae;
            }
          }
          if (Le) {
            An(R, fe);
          }
          return re;
        }
        for (ae = s(R, ae); fe < P.length; fe++) {
          He = Q(ae, R, fe, P[fe], V);
          if (He !== null) {
            if (e && He.alternate !== null) {
              ae.delete(He.key === null ? fe : He.key);
            }
            x = u(He, x, fe);
            if (le === null) {
              re = He;
            } else {
              le.sibling = He;
            }
            le = He;
          }
        }
        if (e) {
          ae.forEach(function (vn) {
            return t(R, vn);
          });
        }
        if (Le) {
          An(R, fe);
        }
        return re;
      }
      function te(R, x, P, V) {
        var re = ne(P);
        if (typeof re != "function") {
          throw Error(i(150));
        }
        P = re.call(P);
        if (P == null) {
          throw Error(i(151));
        }
        var le = re = null;
        for (var ae = x, fe = x = 0, He = null, Ce = P.next(); ae !== null && !Ce.done; fe++, Ce = P.next()) {
          if (ae.index > fe) {
            He = ae;
            ae = null;
          } else {
            He = ae.sibling;
          }
          var vn = z(R, ae, Ce.value, V);
          if (vn === null) {
            if (ae === null) {
              ae = He;
            }
            break;
          }
          if (e && ae && vn.alternate === null) {
            t(R, ae);
          }
          x = u(vn, x, fe);
          if (le === null) {
            re = vn;
          } else {
            le.sibling = vn;
          }
          le = vn;
          ae = He;
        }
        if (Ce.done) {
          n(R, ae);
          if (Le) {
            An(R, fe);
          }
          return re;
        }
        if (ae === null) {
          for (; !Ce.done; fe++, Ce = P.next()) {
            Ce = U(R, Ce.value, V);
            if (Ce !== null) {
              x = u(Ce, x, fe);
              if (le === null) {
                re = Ce;
              } else {
                le.sibling = Ce;
              }
              le = Ce;
            }
          }
          if (Le) {
            An(R, fe);
          }
          return re;
        }
        for (ae = s(R, ae); !Ce.done; fe++, Ce = P.next()) {
          Ce = Q(ae, R, fe, Ce.value, V);
          if (Ce !== null) {
            if (e && Ce.alternate !== null) {
              ae.delete(Ce.key === null ? fe : Ce.key);
            }
            x = u(Ce, x, fe);
            if (le === null) {
              re = Ce;
            } else {
              le.sibling = Ce;
            }
            le = Ce;
          }
        }
        if (e) {
          ae.forEach(function (WE) {
            return t(R, WE);
          });
        }
        if (Le) {
          An(R, fe);
        }
        return re;
      }
      function ze(R, x, P, V) {
        if (typeof P == "object" && P !== null && P.type === q && P.key === null) {
          P = P.props.children;
        }
        if (typeof P == "object" && P !== null) {
          switch (P.$$typeof) {
            case H:
              e: {
                var re = P.key;
                for (var le = x; le !== null;) {
                  if (le.key === re) {
                    re = P.type;
                    if (re === q) {
                      if (le.tag === 7) {
                        n(R, le.sibling);
                        x = a(le, P.props.children);
                        x.return = R;
                        R = x;
                        break e;
                      }
                    } else if (le.elementType === re || typeof re == "object" && re !== null && re.$$typeof === se && qd(re) === le.type) {
                      n(R, le.sibling);
                      x = a(le, P.props);
                      x.ref = to(R, le, P);
                      x.return = R;
                      R = x;
                      break e;
                    }
                    n(R, le);
                    break;
                  } else {
                    t(R, le);
                  }
                  le = le.sibling;
                }
                if (P.type === q) {
                  x = jn(P.props.children, R.mode, V, P.key);
                  x.return = R;
                  R = x;
                } else {
                  V = Qi(P.type, P.key, P.props, null, R.mode, V);
                  V.ref = to(R, x, P);
                  V.return = R;
                  R = V;
                }
              }
              return d(R);
            case W:
              e: {
                for (le = P.key; x !== null;) {
                  if (x.key === le) {
                    if (x.tag === 4 && x.stateNode.containerInfo === P.containerInfo && x.stateNode.implementation === P.implementation) {
                      n(R, x.sibling);
                      x = a(x, P.children || []);
                      x.return = R;
                      R = x;
                      break e;
                    } else {
                      n(R, x);
                      break;
                    }
                  } else {
                    t(R, x);
                  }
                  x = x.sibling;
                }
                x = ja(P, R.mode, V);
                x.return = R;
                R = x;
              }
              return d(R);
            case se:
              le = P._init;
              return ze(R, x, le(P._payload), V);
          }
          if (Or(P)) {
            return ee(R, x, P, V);
          }
          if (ne(P)) {
            return te(R, x, P, V);
          }
          _i(R, P);
        }
        if (typeof P == "string" && P !== "" || typeof P == "number") {
          P = "" + P;
          if (x !== null && x.tag === 6) {
            n(R, x.sibling);
            x = a(x, P);
            x.return = R;
            R = x;
          } else {
            n(R, x);
            x = za(P, R.mode, V);
            x.return = R;
            R = x;
          }
          return d(R);
        } else {
          return n(R, x);
        }
      }
      return ze;
    }
    var lr = Gd(true);
    var Qd = Gd(false);
    var Ti = ln(null);
    var Ri = null;
    var ar = null;
    var Gl = null;
    function Ql() {
      Gl = ar = Ri = null;
    }
    function Xl(e) {
      var t = Ti.current;
      Ie(Ti);
      e._currentValue = t;
    }
    function Yl(e, t, n) {
      while (e !== null) {
        var s = e.alternate;
        if ((e.childLanes & t) !== t) {
          e.childLanes |= t;
          if (s !== null) {
            s.childLanes |= t;
          }
        } else if (s !== null && (s.childLanes & t) !== t) {
          s.childLanes |= t;
        }
        if (e === n) {
          break;
        }
        e = e.return;
      }
    }
    function ur(e, t) {
      Ri = e;
      Gl = ar = null;
      e = e.dependencies;
      if (e !== null && e.firstContext !== null) {
        if ((e.lanes & t) !== 0) {
          lt = true;
        }
        e.firstContext = null;
      }
    }
    function vt(e) {
      var t = e._currentValue;
      if (Gl !== e) {
        e = {
          context: e,
          memoizedValue: t,
          next: null
        };
        if (ar === null) {
          if (Ri === null) {
            throw Error(i(308));
          }
          ar = e;
          Ri.dependencies = {
            lanes: 0,
            firstContext: e
          };
        } else {
          ar = ar.next = e;
        }
      }
      return t;
    }
    var In = null;
    function Jl(e) {
      if (In === null) {
        In = [e];
      } else {
        In.push(e);
      }
    }
    function Xd(e, t, n, s) {
      var a = t.interleaved;
      if (a === null) {
        n.next = n;
        Jl(t);
      } else {
        n.next = a.next;
        a.next = n;
      }
      t.interleaved = n;
      return Vt(e, s);
    }
    function Vt(e, t) {
      e.lanes |= t;
      var n = e.alternate;
      if (n !== null) {
        n.lanes |= t;
      }
      n = e;
      e = e.return;
      while (e !== null) {
        e.childLanes |= t;
        n = e.alternate;
        if (n !== null) {
          n.childLanes |= t;
        }
        n = e;
        e = e.return;
      }
      if (n.tag === 3) {
        return n.stateNode;
      } else {
        return null;
      }
    }
    var cn = false;
    function Zl(e) {
      e.updateQueue = {
        baseState: e.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: {
          pending: null,
          interleaved: null,
          lanes: 0
        },
        effects: null
      };
    }
    function Yd(e, t) {
      e = e.updateQueue;
      if (t.updateQueue === e) {
        t.updateQueue = {
          baseState: e.baseState,
          firstBaseUpdate: e.firstBaseUpdate,
          lastBaseUpdate: e.lastBaseUpdate,
          shared: e.shared,
          effects: e.effects
        };
      }
    }
    function $t(e, t) {
      return {
        eventTime: e,
        lane: t,
        tag: 0,
        payload: null,
        callback: null,
        next: null
      };
    }
    function fn(e, t, n) {
      var s = e.updateQueue;
      if (s === null) {
        return null;
      }
      s = s.shared;
      if ((Se & 2) !== 0) {
        var a = s.pending;
        if (a === null) {
          t.next = t;
        } else {
          t.next = a.next;
          a.next = t;
        }
        s.pending = t;
        return Vt(e, n);
      }
      a = s.interleaved;
      if (a === null) {
        t.next = t;
        Jl(s);
      } else {
        t.next = a.next;
        a.next = t;
      }
      s.interleaved = t;
      return Vt(e, n);
    }
    function Pi(e, t, n) {
      t = t.updateQueue;
      if (t !== null && (t = t.shared, (n & 4194240) !== 0)) {
        var s = t.lanes;
        s &= e.pendingLanes;
        n |= s;
        t.lanes = n;
        pl(e, n);
      }
    }
    function Jd(e, t) {
      var n = e.updateQueue;
      var s = e.alternate;
      if (s !== null && (s = s.updateQueue, n === s)) {
        var a = null;
        var u = null;
        n = n.firstBaseUpdate;
        if (n !== null) {
          do {
            var d = {
              eventTime: n.eventTime,
              lane: n.lane,
              tag: n.tag,
              payload: n.payload,
              callback: n.callback,
              next: null
            };
            if (u === null) {
              a = u = d;
            } else {
              u = u.next = d;
            }
            n = n.next;
          } while (n !== null);
          if (u === null) {
            a = u = t;
          } else {
            u = u.next = t;
          }
        } else {
          a = u = t;
        }
        n = {
          baseState: s.baseState,
          firstBaseUpdate: a,
          lastBaseUpdate: u,
          shared: s.shared,
          effects: s.effects
        };
        e.updateQueue = n;
        return;
      }
      e = n.lastBaseUpdate;
      if (e === null) {
        n.firstBaseUpdate = t;
      } else {
        e.next = t;
      }
      n.lastBaseUpdate = t;
    }
    function Ni(e, t, n, s) {
      var a = e.updateQueue;
      cn = false;
      var u = a.firstBaseUpdate;
      var d = a.lastBaseUpdate;
      var h = a.shared.pending;
      if (h !== null) {
        a.shared.pending = null;
        var S = h;
        var A = S.next;
        S.next = null;
        if (d === null) {
          u = A;
        } else {
          d.next = A;
        }
        d = S;
        var j = e.alternate;
        if (j !== null) {
          j = j.updateQueue;
          h = j.lastBaseUpdate;
          if (h !== d) {
            if (h === null) {
              j.firstBaseUpdate = A;
            } else {
              h.next = A;
            }
            j.lastBaseUpdate = S;
          }
        }
      }
      if (u !== null) {
        var U = a.baseState;
        d = 0;
        j = A = S = null;
        h = u;
        do {
          var z = h.lane;
          var Q = h.eventTime;
          if ((s & z) === z) {
            if (j !== null) {
              j = j.next = {
                eventTime: Q,
                lane: 0,
                tag: h.tag,
                payload: h.payload,
                callback: h.callback,
                next: null
              };
            }
            e: {
              var ee = e;
              var te = h;
              z = t;
              Q = n;
              switch (te.tag) {
                case 1:
                  ee = te.payload;
                  if (typeof ee == "function") {
                    U = ee.call(Q, U, z);
                    break e;
                  }
                  U = ee;
                  break e;
                case 3:
                  ee.flags = ee.flags & -65537 | 128;
                case 0:
                  ee = te.payload;
                  z = typeof ee == "function" ? ee.call(Q, U, z) : ee;
                  if (z == null) {
                    break e;
                  }
                  U = G({}, U, z);
                  break e;
                case 2:
                  cn = true;
              }
            }
            if (h.callback !== null && h.lane !== 0) {
              e.flags |= 64;
              z = a.effects;
              if (z === null) {
                a.effects = [h];
              } else {
                z.push(h);
              }
            }
          } else {
            Q = {
              eventTime: Q,
              lane: z,
              tag: h.tag,
              payload: h.payload,
              callback: h.callback,
              next: null
            };
            if (j === null) {
              A = j = Q;
              S = U;
            } else {
              j = j.next = Q;
            }
            d |= z;
          }
          h = h.next;
          if (h === null) {
            h = a.shared.pending;
            if (h === null) {
              break;
            }
            z = h;
            h = z.next;
            z.next = null;
            a.lastBaseUpdate = z;
            a.shared.pending = null;
          }
        } while (true);
        if (j === null) {
          S = U;
        }
        a.baseState = S;
        a.firstBaseUpdate = A;
        a.lastBaseUpdate = j;
        t = a.shared.interleaved;
        if (t !== null) {
          a = t;
          do {
            d |= a.lane;
            a = a.next;
          } while (a !== t);
        } else if (u === null) {
          a.shared.lanes = 0;
        }
        Dn |= d;
        e.lanes = d;
        e.memoizedState = U;
      }
    }
    function Zd(e, t, n) {
      e = t.effects;
      t.effects = null;
      if (e !== null) {
        for (t = 0; t < e.length; t++) {
          var s = e[t];
          var a = s.callback;
          if (a !== null) {
            s.callback = null;
            s = n;
            if (typeof a != "function") {
              throw Error(i(191, a));
            }
            a.call(s);
          }
        }
      }
    }
    var no = {};
    var Mt = ln(no);
    var ro = ln(no);
    var oo = ln(no);
    function Ln(e) {
      if (e === no) {
        throw Error(i(174));
      }
      return e;
    }
    function ea(e, t) {
      Ne(oo, t);
      Ne(ro, e);
      Ne(Mt, no);
      e = t.nodeType;
      switch (e) {
        case 9:
        case 11:
          t = (t = t.documentElement) ? t.namespaceURI : tl(null, "");
          break;
        default:
          e = e === 8 ? t.parentNode : t;
          t = e.namespaceURI || null;
          e = e.tagName;
          t = tl(t, e);
      }
      Ie(Mt);
      Ne(Mt, t);
    }
    function cr() {
      Ie(Mt);
      Ie(ro);
      Ie(oo);
    }
    function ep(e) {
      Ln(oo.current);
      var t = Ln(Mt.current);
      var n = tl(t, e.type);
      if (t !== n) {
        Ne(ro, e);
        Ne(Mt, n);
      }
    }
    function ta(e) {
      if (ro.current === e) {
        Ie(Mt);
        Ie(ro);
      }
    }
    var Me = ln(0);
    function Oi(e) {
      for (var t = e; t !== null;) {
        if (t.tag === 13) {
          var n = t.memoizedState;
          if (n !== null && (n = n.dehydrated, n === null || n.data === "$?" || n.data === "$!")) {
            return t;
          }
        } else if (t.tag === 19 && t.memoizedProps.revealOrder !== undefined) {
          if ((t.flags & 128) !== 0) {
            return t;
          }
        } else if (t.child !== null) {
          t.child.return = t;
          t = t.child;
          continue;
        }
        if (t === e) {
          break;
        }
        while (t.sibling === null) {
          if (t.return === null || t.return === e) {
            return null;
          }
          t = t.return;
        }
        t.sibling.return = t.return;
        t = t.sibling;
      }
      return null;
    }
    var na = [];
    function ra() {
      for (var e = 0; e < na.length; e++) {
        na[e]._workInProgressVersionPrimary = null;
      }
      na.length = 0;
    }
    var Ai = D.ReactCurrentDispatcher;
    var oa = D.ReactCurrentBatchConfig;
    var Mn = 0;
    var De = null;
    var Be = null;
    var We = null;
    var Ii = false;
    var io = false;
    var so = 0;
    var dE = 0;
    function Ye() {
      throw Error(i(321));
    }
    function ia(e, t) {
      if (t === null) {
        return false;
      }
      for (var n = 0; n < t.length && n < e.length; n++) {
        if (!Ct(e[n], t[n])) {
          return false;
        }
      }
      return true;
    }
    function sa(e, t, n, s, a, u) {
      Mn = u;
      De = t;
      t.memoizedState = null;
      t.updateQueue = null;
      t.lanes = 0;
      Ai.current = e === null || e.memoizedState === null ? gE : yE;
      e = n(s, a);
      if (io) {
        u = 0;
        do {
          io = false;
          so = 0;
          if (u >= 25) {
            throw Error(i(301));
          }
          u += 1;
          We = Be = null;
          t.updateQueue = null;
          Ai.current = vE;
          e = n(s, a);
        } while (io);
      }
      Ai.current = Di;
      t = Be !== null && Be.next !== null;
      Mn = 0;
      We = Be = De = null;
      Ii = false;
      if (t) {
        throw Error(i(300));
      }
      return e;
    }
    function la() {
      var e = so !== 0;
      so = 0;
      return e;
    }
    function Dt() {
      var e = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null
      };
      if (We === null) {
        De.memoizedState = We = e;
      } else {
        We = We.next = e;
      }
      return We;
    }
    function wt() {
      if (Be === null) {
        var e = De.alternate;
        e = e !== null ? e.memoizedState : null;
      } else {
        e = Be.next;
      }
      var t = We === null ? De.memoizedState : We.next;
      if (t !== null) {
        We = t;
        Be = e;
      } else {
        if (e === null) {
          throw Error(i(310));
        }
        Be = e;
        e = {
          memoizedState: Be.memoizedState,
          baseState: Be.baseState,
          baseQueue: Be.baseQueue,
          queue: Be.queue,
          next: null
        };
        if (We === null) {
          De.memoizedState = We = e;
        } else {
          We = We.next = e;
        }
      }
      return We;
    }
    function lo(e, t) {
      if (typeof t == "function") {
        return t(e);
      } else {
        return t;
      }
    }
    function aa(e) {
      var t = wt();
      var n = t.queue;
      if (n === null) {
        throw Error(i(311));
      }
      n.lastRenderedReducer = e;
      var s = Be;
      var a = s.baseQueue;
      var u = n.pending;
      if (u !== null) {
        if (a !== null) {
          var d = a.next;
          a.next = u.next;
          u.next = d;
        }
        s.baseQueue = a = u;
        n.pending = null;
      }
      if (a !== null) {
        u = a.next;
        s = s.baseState;
        var h = d = null;
        var S = null;
        var A = u;
        do {
          var j = A.lane;
          if ((Mn & j) === j) {
            if (S !== null) {
              S = S.next = {
                lane: 0,
                action: A.action,
                hasEagerState: A.hasEagerState,
                eagerState: A.eagerState,
                next: null
              };
            }
            s = A.hasEagerState ? A.eagerState : e(s, A.action);
          } else {
            var U = {
              lane: j,
              action: A.action,
              hasEagerState: A.hasEagerState,
              eagerState: A.eagerState,
              next: null
            };
            if (S === null) {
              h = S = U;
              d = s;
            } else {
              S = S.next = U;
            }
            De.lanes |= j;
            Dn |= j;
          }
          A = A.next;
        } while (A !== null && A !== u);
        if (S === null) {
          d = s;
        } else {
          S.next = h;
        }
        if (!Ct(s, t.memoizedState)) {
          lt = true;
        }
        t.memoizedState = s;
        t.baseState = d;
        t.baseQueue = S;
        n.lastRenderedState = s;
      }
      e = n.interleaved;
      if (e !== null) {
        a = e;
        do {
          u = a.lane;
          De.lanes |= u;
          Dn |= u;
          a = a.next;
        } while (a !== e);
      } else if (a === null) {
        n.lanes = 0;
      }
      return [t.memoizedState, n.dispatch];
    }
    function ua(e) {
      var t = wt();
      var n = t.queue;
      if (n === null) {
        throw Error(i(311));
      }
      n.lastRenderedReducer = e;
      var s = n.dispatch;
      var a = n.pending;
      var u = t.memoizedState;
      if (a !== null) {
        n.pending = null;
        var d = a = a.next;
        do {
          u = e(u, d.action);
          d = d.next;
        } while (d !== a);
        if (!Ct(u, t.memoizedState)) {
          lt = true;
        }
        t.memoizedState = u;
        if (t.baseQueue === null) {
          t.baseState = u;
        }
        n.lastRenderedState = u;
      }
      return [u, s];
    }
    function tp() {}
    function np(e, t) {
      var n = De;
      var s = wt();
      var a = t();
      var u = !Ct(s.memoizedState, a);
      if (u) {
        s.memoizedState = a;
        lt = true;
      }
      s = s.queue;
      ca(ip.bind(null, n, s, e), [e]);
      if (s.getSnapshot !== t || u || We !== null && We.memoizedState.tag & 1) {
        n.flags |= 2048;
        ao(9, op.bind(null, n, s, a, t), undefined, null);
        if (Ke === null) {
          throw Error(i(349));
        }
        if ((Mn & 30) === 0) {
          rp(n, t, a);
        }
      }
      return a;
    }
    function rp(e, t, n) {
      e.flags |= 16384;
      e = {
        getSnapshot: t,
        value: n
      };
      t = De.updateQueue;
      if (t === null) {
        t = {
          lastEffect: null,
          stores: null
        };
        De.updateQueue = t;
        t.stores = [e];
      } else {
        n = t.stores;
        if (n === null) {
          t.stores = [e];
        } else {
          n.push(e);
        }
      }
    }
    function op(e, t, n, s) {
      t.value = n;
      t.getSnapshot = s;
      if (sp(t)) {
        lp(e);
      }
    }
    function ip(e, t, n) {
      return n(function () {
        if (sp(t)) {
          lp(e);
        }
      });
    }
    function sp(e) {
      var t = e.getSnapshot;
      e = e.value;
      try {
        var n = t();
        return !Ct(e, n);
      } catch {
        return true;
      }
    }
    function lp(e) {
      var t = Vt(e, 1);
      if (t !== null) {
        Nt(t, e, 1, -1);
      }
    }
    function ap(e) {
      var t = Dt();
      if (typeof e == "function") {
        e = e();
      }
      t.memoizedState = t.baseState = e;
      e = {
        pending: null,
        interleaved: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: lo,
        lastRenderedState: e
      };
      t.queue = e;
      e = e.dispatch = hE.bind(null, De, e);
      return [t.memoizedState, e];
    }
    function ao(e, t, n, s) {
      e = {
        tag: e,
        create: t,
        destroy: n,
        deps: s,
        next: null
      };
      t = De.updateQueue;
      if (t === null) {
        t = {
          lastEffect: null,
          stores: null
        };
        De.updateQueue = t;
        t.lastEffect = e.next = e;
      } else {
        n = t.lastEffect;
        if (n === null) {
          t.lastEffect = e.next = e;
        } else {
          s = n.next;
          n.next = e;
          e.next = s;
          t.lastEffect = e;
        }
      }
      return e;
    }
    function up() {
      return wt().memoizedState;
    }
    function Li(e, t, n, s) {
      var a = Dt();
      De.flags |= e;
      a.memoizedState = ao(t | 1, n, undefined, s === undefined ? null : s);
    }
    function Mi(e, t, n, s) {
      var a = wt();
      s = s === undefined ? null : s;
      var u = undefined;
      if (Be !== null) {
        var d = Be.memoizedState;
        u = d.destroy;
        if (s !== null && ia(s, d.deps)) {
          a.memoizedState = ao(t, n, u, s);
          return;
        }
      }
      De.flags |= e;
      a.memoizedState = ao(t | 1, n, u, s);
    }
    function cp(e, t) {
      return Li(8390656, 8, e, t);
    }
    function ca(e, t) {
      return Mi(2048, 8, e, t);
    }
    function fp(e, t) {
      return Mi(4, 2, e, t);
    }
    function dp(e, t) {
      return Mi(4, 4, e, t);
    }
    function pp(e, t) {
      if (typeof t == "function") {
        e = e();
        t(e);
        return function () {
          t(null);
        };
      }
      if (t != null) {
        e = e();
        t.current = e;
        return function () {
          t.current = null;
        };
      }
    }
    function mp(e, t, n) {
      n = n != null ? n.concat([e]) : null;
      return Mi(4, 4, pp.bind(null, t, e), n);
    }
    function fa() {}
    function hp(e, t) {
      var n = wt();
      t = t === undefined ? null : t;
      var s = n.memoizedState;
      if (s !== null && t !== null && ia(t, s[1])) {
        return s[0];
      } else {
        n.memoizedState = [e, t];
        return e;
      }
    }
    function gp(e, t) {
      var n = wt();
      t = t === undefined ? null : t;
      var s = n.memoizedState;
      if (s !== null && t !== null && ia(t, s[1])) {
        return s[0];
      } else {
        e = e();
        n.memoizedState = [e, t];
        return e;
      }
    }
    function yp(e, t, n) {
      if ((Mn & 21) === 0) {
        if (e.baseState) {
          e.baseState = false;
          lt = true;
        }
        return e.memoizedState = n;
      } else {
        if (!Ct(n, t)) {
          n = qf();
          De.lanes |= n;
          Dn |= n;
          e.baseState = true;
        }
        return t;
      }
    }
    function pE(e, t) {
      var n = Pe;
      Pe = n !== 0 && n < 4 ? n : 4;
      e(true);
      var s = oa.transition;
      oa.transition = {};
      try {
        e(false);
        t();
      } finally {
        Pe = n;
        oa.transition = s;
      }
    }
    function vp() {
      return wt().memoizedState;
    }
    function mE(e, t, n) {
      var s = hn(e);
      n = {
        lane: s,
        action: n,
        hasEagerState: false,
        eagerState: null,
        next: null
      };
      if (wp(e)) {
        Ep(t, n);
      } else {
        n = Xd(e, t, n, s);
        if (n !== null) {
          var a = tt();
          Nt(n, e, s, a);
          Sp(n, t, s);
        }
      }
    }
    function hE(e, t, n) {
      var s = hn(e);
      var a = {
        lane: s,
        action: n,
        hasEagerState: false,
        eagerState: null,
        next: null
      };
      if (wp(e)) {
        Ep(t, a);
      } else {
        var u = e.alternate;
        if (e.lanes === 0 && (u === null || u.lanes === 0) && (u = t.lastRenderedReducer, u !== null)) {
          try {
            var d = t.lastRenderedState;
            var h = u(d, n);
            a.hasEagerState = true;
            a.eagerState = h;
            if (Ct(h, d)) {
              var S = t.interleaved;
              if (S === null) {
                a.next = a;
                Jl(t);
              } else {
                a.next = S.next;
                S.next = a;
              }
              t.interleaved = a;
              return;
            }
          } catch {}
        }
        n = Xd(e, t, a, s);
        if (n !== null) {
          a = tt();
          Nt(n, e, s, a);
          Sp(n, t, s);
        }
      }
    }
    function wp(e) {
      var t = e.alternate;
      return e === De || t !== null && t === De;
    }
    function Ep(e, t) {
      io = Ii = true;
      var n = e.pending;
      if (n === null) {
        t.next = t;
      } else {
        t.next = n.next;
        n.next = t;
      }
      e.pending = t;
    }
    function Sp(e, t, n) {
      if ((n & 4194240) !== 0) {
        var s = t.lanes;
        s &= e.pendingLanes;
        n |= s;
        t.lanes = n;
        pl(e, n);
      }
    }
    var Di = {
      readContext: vt,
      useCallback: Ye,
      useContext: Ye,
      useEffect: Ye,
      useImperativeHandle: Ye,
      useInsertionEffect: Ye,
      useLayoutEffect: Ye,
      useMemo: Ye,
      useReducer: Ye,
      useRef: Ye,
      useState: Ye,
      useDebugValue: Ye,
      useDeferredValue: Ye,
      useTransition: Ye,
      useMutableSource: Ye,
      useSyncExternalStore: Ye,
      useId: Ye,
      unstable_isNewReconciler: false
    };
    var gE = {
      readContext: vt,
      useCallback: function (e, t) {
        Dt().memoizedState = [e, t === undefined ? null : t];
        return e;
      },
      useContext: vt,
      useEffect: cp,
      useImperativeHandle: function (e, t, n) {
        n = n != null ? n.concat([e]) : null;
        return Li(4194308, 4, pp.bind(null, t, e), n);
      },
      useLayoutEffect: function (e, t) {
        return Li(4194308, 4, e, t);
      },
      useInsertionEffect: function (e, t) {
        return Li(4, 2, e, t);
      },
      useMemo: function (e, t) {
        var n = Dt();
        t = t === undefined ? null : t;
        e = e();
        n.memoizedState = [e, t];
        return e;
      },
      useReducer: function (e, t, n) {
        var s = Dt();
        t = n !== undefined ? n(t) : t;
        s.memoizedState = s.baseState = t;
        e = {
          pending: null,
          interleaved: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: e,
          lastRenderedState: t
        };
        s.queue = e;
        e = e.dispatch = mE.bind(null, De, e);
        return [s.memoizedState, e];
      },
      useRef: function (e) {
        var t = Dt();
        e = {
          current: e
        };
        return t.memoizedState = e;
      },
      useState: ap,
      useDebugValue: fa,
      useDeferredValue: function (e) {
        return Dt().memoizedState = e;
      },
      useTransition: function () {
        var e = ap(false);
        var t = e[0];
        e = pE.bind(null, e[1]);
        Dt().memoizedState = e;
        return [t, e];
      },
      useMutableSource: function () {},
      useSyncExternalStore: function (e, t, n) {
        var s = De;
        var a = Dt();
        if (Le) {
          if (n === undefined) {
            throw Error(i(407));
          }
          n = n();
        } else {
          n = t();
          if (Ke === null) {
            throw Error(i(349));
          }
          if ((Mn & 30) === 0) {
            rp(s, t, n);
          }
        }
        a.memoizedState = n;
        var u = {
          value: n,
          getSnapshot: t
        };
        a.queue = u;
        cp(ip.bind(null, s, u, e), [e]);
        s.flags |= 2048;
        ao(9, op.bind(null, s, u, n, t), undefined, null);
        return n;
      },
      useId: function () {
        var e = Dt();
        var t = Ke.identifierPrefix;
        if (Le) {
          var n = Bt;
          var s = Ut;
          n = (s & ~(1 << 32 - kt(s) - 1)).toString(32) + n;
          t = ":" + t + "R" + n;
          n = so++;
          if (n > 0) {
            t += "H" + n.toString(32);
          }
          t += ":";
        } else {
          n = dE++;
          t = ":" + t + "r" + n.toString(32) + ":";
        }
        return e.memoizedState = t;
      },
      unstable_isNewReconciler: false
    };
    var yE = {
      readContext: vt,
      useCallback: hp,
      useContext: vt,
      useEffect: ca,
      useImperativeHandle: mp,
      useInsertionEffect: fp,
      useLayoutEffect: dp,
      useMemo: gp,
      useReducer: aa,
      useRef: up,
      useState: function () {
        return aa(lo);
      },
      useDebugValue: fa,
      useDeferredValue: function (e) {
        var t = wt();
        return yp(t, Be.memoizedState, e);
      },
      useTransition: function () {
        var e = aa(lo)[0];
        var t = wt().memoizedState;
        return [e, t];
      },
      useMutableSource: tp,
      useSyncExternalStore: np,
      useId: vp,
      unstable_isNewReconciler: false
    };
    var vE = {
      readContext: vt,
      useCallback: hp,
      useContext: vt,
      useEffect: ca,
      useImperativeHandle: mp,
      useInsertionEffect: fp,
      useLayoutEffect: dp,
      useMemo: gp,
      useReducer: ua,
      useRef: up,
      useState: function () {
        return ua(lo);
      },
      useDebugValue: fa,
      useDeferredValue: function (e) {
        var t = wt();
        if (Be === null) {
          return t.memoizedState = e;
        } else {
          return yp(t, Be.memoizedState, e);
        }
      },
      useTransition: function () {
        var e = ua(lo)[0];
        var t = wt().memoizedState;
        return [e, t];
      },
      useMutableSource: tp,
      useSyncExternalStore: np,
      useId: vp,
      unstable_isNewReconciler: false
    };
    function Tt(e, t) {
      if (e && e.defaultProps) {
        t = G({}, t);
        e = e.defaultProps;
        for (var n in e) {
          if (t[n] === undefined) {
            t[n] = e[n];
          }
        }
        return t;
      }
      return t;
    }
    function da(e, t, n, s) {
      t = e.memoizedState;
      n = n(s, t);
      n = n == null ? t : G({}, t, n);
      e.memoizedState = n;
      if (e.lanes === 0) {
        e.updateQueue.baseState = n;
      }
    }
    var bi = {
      isMounted: function (e) {
        if (e = e._reactInternals) {
          return Rn(e) === e;
        } else {
          return false;
        }
      },
      enqueueSetState: function (e, t, n) {
        e = e._reactInternals;
        var s = tt();
        var a = hn(e);
        var u = $t(s, a);
        u.payload = t;
        if (n != null) {
          u.callback = n;
        }
        t = fn(e, u, a);
        if (t !== null) {
          Nt(t, e, a, s);
          Pi(t, e, a);
        }
      },
      enqueueReplaceState: function (e, t, n) {
        e = e._reactInternals;
        var s = tt();
        var a = hn(e);
        var u = $t(s, a);
        u.tag = 1;
        u.payload = t;
        if (n != null) {
          u.callback = n;
        }
        t = fn(e, u, a);
        if (t !== null) {
          Nt(t, e, a, s);
          Pi(t, e, a);
        }
      },
      enqueueForceUpdate: function (e, t) {
        e = e._reactInternals;
        var n = tt();
        var s = hn(e);
        var a = $t(n, s);
        a.tag = 2;
        if (t != null) {
          a.callback = t;
        }
        t = fn(e, a, s);
        if (t !== null) {
          Nt(t, e, s, n);
          Pi(t, e, s);
        }
      }
    };
    function xp(e, t, n, s, a, u, d) {
      e = e.stateNode;
      if (typeof e.shouldComponentUpdate == "function") {
        return e.shouldComponentUpdate(s, u, d);
      } else if (t.prototype && t.prototype.isPureReactComponent) {
        return !Gr(n, s) || !Gr(a, u);
      } else {
        return true;
      }
    }
    function kp(e, t, n) {
      var s = false;
      var a = an;
      var u = t.contextType;
      if (typeof u == "object" && u !== null) {
        u = vt(u);
      } else {
        a = st(t) ? Nn : Xe.current;
        s = t.contextTypes;
        u = (s = s != null) ? rr(e, a) : an;
      }
      t = new t(n, u);
      e.memoizedState = t.state ?? null;
      t.updater = bi;
      e.stateNode = t;
      t._reactInternals = e;
      if (s) {
        e = e.stateNode;
        e.__reactInternalMemoizedUnmaskedChildContext = a;
        e.__reactInternalMemoizedMaskedChildContext = u;
      }
      return t;
    }
    function Cp(e, t, n, s) {
      e = t.state;
      if (typeof t.componentWillReceiveProps == "function") {
        t.componentWillReceiveProps(n, s);
      }
      if (typeof t.UNSAFE_componentWillReceiveProps == "function") {
        t.UNSAFE_componentWillReceiveProps(n, s);
      }
      if (t.state !== e) {
        bi.enqueueReplaceState(t, t.state, null);
      }
    }
    function pa(e, t, n, s) {
      var a = e.stateNode;
      a.props = n;
      a.state = e.memoizedState;
      a.refs = {};
      Zl(e);
      var u = t.contextType;
      if (typeof u == "object" && u !== null) {
        a.context = vt(u);
      } else {
        u = st(t) ? Nn : Xe.current;
        a.context = rr(e, u);
      }
      a.state = e.memoizedState;
      u = t.getDerivedStateFromProps;
      if (typeof u == "function") {
        da(e, t, u, n);
        a.state = e.memoizedState;
      }
      if (typeof t.getDerivedStateFromProps != "function" && typeof a.getSnapshotBeforeUpdate != "function" && (typeof a.UNSAFE_componentWillMount == "function" || typeof a.componentWillMount == "function")) {
        t = a.state;
        if (typeof a.componentWillMount == "function") {
          a.componentWillMount();
        }
        if (typeof a.UNSAFE_componentWillMount == "function") {
          a.UNSAFE_componentWillMount();
        }
        if (t !== a.state) {
          bi.enqueueReplaceState(a, a.state, null);
        }
        Ni(e, n, a, s);
        a.state = e.memoizedState;
      }
      if (typeof a.componentDidMount == "function") {
        e.flags |= 4194308;
      }
    }
    function fr(e, t) {
      try {
        var n = "";
        var s = t;
        do {
          n += he(s);
          s = s.return;
        } while (s);
        var a = n;
      } catch (u) {
        a = `
Error generating stack: ${u.message}
${u.stack}`;
      }
      return {
        value: e,
        source: t,
        stack: a,
        digest: null
      };
    }
    function ma(e, t, n) {
      return {
        value: e,
        source: null,
        stack: n ?? null,
        digest: t ?? null
      };
    }
    function ha(e, t) {
      try {
        console.error(t.value);
      } catch (n) {
        setTimeout(function () {
          throw n;
        });
      }
    }
    var wE = typeof WeakMap == "function" ? WeakMap : Map;
    function _p(e, t, n) {
      n = $t(-1, n);
      n.tag = 3;
      n.payload = {
        element: null
      };
      var s = t.value;
      n.callback = function () {
        if (!$i) {
          $i = true;
          Oa = s;
        }
        ha(e, t);
      };
      return n;
    }
    function Tp(e, t, n) {
      n = $t(-1, n);
      n.tag = 3;
      var s = e.type.getDerivedStateFromError;
      if (typeof s == "function") {
        var a = t.value;
        n.payload = function () {
          return s(a);
        };
        n.callback = function () {
          ha(e, t);
        };
      }
      var u = e.stateNode;
      if (u !== null && typeof u.componentDidCatch == "function") {
        n.callback = function () {
          ha(e, t);
          if (typeof s != "function") {
            if (pn === null) {
              pn = new Set([this]);
            } else {
              pn.add(this);
            }
          }
          var d = t.stack;
          this.componentDidCatch(t.value, {
            componentStack: d !== null ? d : ""
          });
        };
      }
      return n;
    }
    function Rp(e, t, n) {
      var s = e.pingCache;
      if (s === null) {
        s = e.pingCache = new wE();
        var a = new Set();
        s.set(t, a);
      } else {
        a = s.get(t);
        if (a === undefined) {
          a = new Set();
          s.set(t, a);
        }
      }
      if (!a.has(n)) {
        a.add(n);
        e = LE.bind(null, e, t, n);
        t.then(e, e);
      }
    }
    function Pp(e) {
      do {
        var t;
        if (t = e.tag === 13) {
          t = e.memoizedState;
          t = t !== null ? t.dehydrated !== null : true;
        }
        if (t) {
          return e;
        }
        e = e.return;
      } while (e !== null);
      return null;
    }
    function Np(e, t, n, s, a) {
      if ((e.mode & 1) === 0) {
        if (e === t) {
          e.flags |= 65536;
        } else {
          e.flags |= 128;
          n.flags |= 131072;
          n.flags &= -52805;
          if (n.tag === 1) {
            if (n.alternate === null) {
              n.tag = 17;
            } else {
              t = $t(-1, 1);
              t.tag = 2;
              fn(n, t, 1);
            }
          }
          n.lanes |= 1;
        }
        return e;
      } else {
        e.flags |= 65536;
        e.lanes = a;
        return e;
      }
    }
    var EE = D.ReactCurrentOwner;
    var lt = false;
    function et(e, t, n, s) {
      t.child = e === null ? Qd(t, null, n, s) : lr(t, e.child, n, s);
    }
    function Op(e, t, n, s, a) {
      n = n.render;
      var u = t.ref;
      ur(t, a);
      s = sa(e, t, n, s, u, a);
      n = la();
      if (e !== null && !lt) {
        t.updateQueue = e.updateQueue;
        t.flags &= -2053;
        e.lanes &= ~a;
        return Wt(e, t, a);
      } else {
        if (Le && n) {
          $l(t);
        }
        t.flags |= 1;
        et(e, t, s, a);
        return t.child;
      }
    }
    function Ap(e, t, n, s, a) {
      if (e === null) {
        var u = n.type;
        if (typeof u == "function" && !Fa(u) && u.defaultProps === undefined && n.compare === null && n.defaultProps === undefined) {
          t.tag = 15;
          t.type = u;
          return Ip(e, t, u, s, a);
        } else {
          e = Qi(n.type, null, s, t, t.mode, a);
          e.ref = t.ref;
          e.return = t;
          return t.child = e;
        }
      }
      u = e.child;
      if ((e.lanes & a) === 0) {
        var d = u.memoizedProps;
        n = n.compare;
        n = n !== null ? n : Gr;
        if (n(d, s) && e.ref === t.ref) {
          return Wt(e, t, a);
        }
      }
      t.flags |= 1;
      e = yn(u, s);
      e.ref = t.ref;
      e.return = t;
      return t.child = e;
    }
    function Ip(e, t, n, s, a) {
      if (e !== null) {
        var u = e.memoizedProps;
        if (Gr(u, s) && e.ref === t.ref) {
          lt = false;
          t.pendingProps = s = u;
          if ((e.lanes & a) !== 0) {
            if ((e.flags & 131072) !== 0) {
              lt = true;
            }
          } else {
            t.lanes = e.lanes;
            return Wt(e, t, a);
          }
        }
      }
      return ga(e, t, n, s, a);
    }
    function Lp(e, t, n) {
      var s = t.pendingProps;
      var a = s.children;
      var u = e !== null ? e.memoizedState : null;
      if (s.mode === "hidden") {
        if ((t.mode & 1) === 0) {
          t.memoizedState = {
            baseLanes: 0,
            cachePool: null,
            transitions: null
          };
          Ne(pr, mt);
          mt |= n;
        } else {
          if ((n & 1073741824) === 0) {
            e = u !== null ? u.baseLanes | n : n;
            t.lanes = t.childLanes = 1073741824;
            t.memoizedState = {
              baseLanes: e,
              cachePool: null,
              transitions: null
            };
            t.updateQueue = null;
            Ne(pr, mt);
            mt |= e;
            return null;
          }
          t.memoizedState = {
            baseLanes: 0,
            cachePool: null,
            transitions: null
          };
          s = u !== null ? u.baseLanes : n;
          Ne(pr, mt);
          mt |= s;
        }
      } else {
        if (u !== null) {
          s = u.baseLanes | n;
          t.memoizedState = null;
        } else {
          s = n;
        }
        Ne(pr, mt);
        mt |= s;
      }
      et(e, t, a, n);
      return t.child;
    }
    function Mp(e, t) {
      var n = t.ref;
      if (e === null && n !== null || e !== null && e.ref !== n) {
        t.flags |= 512;
        t.flags |= 2097152;
      }
    }
    function ga(e, t, n, s, a) {
      var u = st(n) ? Nn : Xe.current;
      u = rr(t, u);
      ur(t, a);
      n = sa(e, t, n, s, u, a);
      s = la();
      if (e !== null && !lt) {
        t.updateQueue = e.updateQueue;
        t.flags &= -2053;
        e.lanes &= ~a;
        return Wt(e, t, a);
      } else {
        if (Le && s) {
          $l(t);
        }
        t.flags |= 1;
        et(e, t, n, a);
        return t.child;
      }
    }
    function Dp(e, t, n, s, a) {
      if (st(n)) {
        var u = true;
        Ei(t);
      } else {
        u = false;
      }
      ur(t, a);
      if (t.stateNode === null) {
        zi(e, t);
        kp(t, n, s);
        pa(t, n, s, a);
        s = true;
      } else if (e === null) {
        var d = t.stateNode;
        var h = t.memoizedProps;
        d.props = h;
        var S = d.context;
        var A = n.contextType;
        if (typeof A == "object" && A !== null) {
          A = vt(A);
        } else {
          A = st(n) ? Nn : Xe.current;
          A = rr(t, A);
        }
        var j = n.getDerivedStateFromProps;
        var U = typeof j == "function" || typeof d.getSnapshotBeforeUpdate == "function";
        if (!U && (typeof d.UNSAFE_componentWillReceiveProps == "function" || typeof d.componentWillReceiveProps == "function")) {
          if (h !== s || S !== A) {
            Cp(t, d, s, A);
          }
        }
        cn = false;
        var z = t.memoizedState;
        d.state = z;
        Ni(t, s, d, a);
        S = t.memoizedState;
        if (h !== s || z !== S || it.current || cn) {
          if (typeof j == "function") {
            da(t, n, j, s);
            S = t.memoizedState;
          }
          if (h = cn || xp(t, n, h, s, z, S, A)) {
            if (!U && (typeof d.UNSAFE_componentWillMount == "function" || typeof d.componentWillMount == "function")) {
              if (typeof d.componentWillMount == "function") {
                d.componentWillMount();
              }
              if (typeof d.UNSAFE_componentWillMount == "function") {
                d.UNSAFE_componentWillMount();
              }
            }
            if (typeof d.componentDidMount == "function") {
              t.flags |= 4194308;
            }
          } else {
            if (typeof d.componentDidMount == "function") {
              t.flags |= 4194308;
            }
            t.memoizedProps = s;
            t.memoizedState = S;
          }
          d.props = s;
          d.state = S;
          d.context = A;
          s = h;
        } else {
          if (typeof d.componentDidMount == "function") {
            t.flags |= 4194308;
          }
          s = false;
        }
      } else {
        d = t.stateNode;
        Yd(e, t);
        h = t.memoizedProps;
        A = t.type === t.elementType ? h : Tt(t.type, h);
        d.props = A;
        U = t.pendingProps;
        z = d.context;
        S = n.contextType;
        if (typeof S == "object" && S !== null) {
          S = vt(S);
        } else {
          S = st(n) ? Nn : Xe.current;
          S = rr(t, S);
        }
        var Q = n.getDerivedStateFromProps;
        if (!(j = typeof Q == "function" || typeof d.getSnapshotBeforeUpdate == "function") && (typeof d.UNSAFE_componentWillReceiveProps == "function" || typeof d.componentWillReceiveProps == "function")) {
          if (h !== U || z !== S) {
            Cp(t, d, s, S);
          }
        }
        cn = false;
        z = t.memoizedState;
        d.state = z;
        Ni(t, s, d, a);
        var ee = t.memoizedState;
        if (h !== U || z !== ee || it.current || cn) {
          if (typeof Q == "function") {
            da(t, n, Q, s);
            ee = t.memoizedState;
          }
          if (A = cn || xp(t, n, A, s, z, ee, S) || false) {
            if (!j && (typeof d.UNSAFE_componentWillUpdate == "function" || typeof d.componentWillUpdate == "function")) {
              if (typeof d.componentWillUpdate == "function") {
                d.componentWillUpdate(s, ee, S);
              }
              if (typeof d.UNSAFE_componentWillUpdate == "function") {
                d.UNSAFE_componentWillUpdate(s, ee, S);
              }
            }
            if (typeof d.componentDidUpdate == "function") {
              t.flags |= 4;
            }
            if (typeof d.getSnapshotBeforeUpdate == "function") {
              t.flags |= 1024;
            }
          } else {
            if (typeof d.componentDidUpdate == "function" && (h !== e.memoizedProps || z !== e.memoizedState)) {
              t.flags |= 4;
            }
            if (typeof d.getSnapshotBeforeUpdate == "function" && (h !== e.memoizedProps || z !== e.memoizedState)) {
              t.flags |= 1024;
            }
            t.memoizedProps = s;
            t.memoizedState = ee;
          }
          d.props = s;
          d.state = ee;
          d.context = S;
          s = A;
        } else {
          if (typeof d.componentDidUpdate == "function" && (h !== e.memoizedProps || z !== e.memoizedState)) {
            t.flags |= 4;
          }
          if (typeof d.getSnapshotBeforeUpdate == "function" && (h !== e.memoizedProps || z !== e.memoizedState)) {
            t.flags |= 1024;
          }
          s = false;
        }
      }
      return ya(e, t, n, s, u, a);
    }
    function ya(e, t, n, s, a, u) {
      Mp(e, t);
      var d = (t.flags & 128) !== 0;
      if (!s && !d) {
        if (a) {
          Ud(t, n, false);
        }
        return Wt(e, t, u);
      }
      s = t.stateNode;
      EE.current = t;
      var h = d && typeof n.getDerivedStateFromError != "function" ? null : s.render();
      t.flags |= 1;
      if (e !== null && d) {
        t.child = lr(t, e.child, null, u);
        t.child = lr(t, null, h, u);
      } else {
        et(e, t, h, u);
      }
      t.memoizedState = s.state;
      if (a) {
        Ud(t, n, true);
      }
      return t.child;
    }
    function bp(e) {
      var t = e.stateNode;
      if (t.pendingContext) {
        zd(e, t.pendingContext, t.pendingContext !== t.context);
      } else if (t.context) {
        zd(e, t.context, false);
      }
      ea(e, t.containerInfo);
    }
    function Fp(e, t, n, s, a) {
      sr();
      ql(a);
      t.flags |= 256;
      et(e, t, n, s);
      return t.child;
    }
    var va = {
      dehydrated: null,
      treeContext: null,
      retryLane: 0
    };
    function wa(e) {
      return {
        baseLanes: e,
        cachePool: null,
        transitions: null
      };
    }
    function zp(e, t, n) {
      var s = t.pendingProps;
      var a = Me.current;
      var u = false;
      var d = (t.flags & 128) !== 0;
      var h;
      if (!(h = d)) {
        h = e !== null && e.memoizedState === null ? false : (a & 2) !== 0;
      }
      if (h) {
        u = true;
        t.flags &= -129;
      } else if (e === null || e.memoizedState !== null) {
        a |= 1;
      }
      Ne(Me, a & 1);
      if (e === null) {
        Hl(t);
        e = t.memoizedState;
        if (e !== null && (e = e.dehydrated, e !== null)) {
          if ((t.mode & 1) === 0) {
            t.lanes = 1;
          } else if (e.data === "$!") {
            t.lanes = 8;
          } else {
            t.lanes = 1073741824;
          }
          return null;
        } else {
          d = s.children;
          e = s.fallback;
          if (u) {
            s = t.mode;
            u = t.child;
            d = {
              mode: "hidden",
              children: d
            };
            if ((s & 1) === 0 && u !== null) {
              u.childLanes = 0;
              u.pendingProps = d;
            } else {
              u = Xi(d, s, 0, null);
            }
            e = jn(e, s, n, null);
            u.return = t;
            e.return = t;
            u.sibling = e;
            t.child = u;
            t.child.memoizedState = wa(n);
            t.memoizedState = va;
            return e;
          } else {
            return Ea(t, d);
          }
        }
      }
      a = e.memoizedState;
      if (a !== null && (h = a.dehydrated, h !== null)) {
        return SE(e, t, d, s, h, a, n);
      }
      if (u) {
        u = s.fallback;
        d = t.mode;
        a = e.child;
        h = a.sibling;
        var S = {
          mode: "hidden",
          children: s.children
        };
        if ((d & 1) === 0 && t.child !== a) {
          s = t.child;
          s.childLanes = 0;
          s.pendingProps = S;
          t.deletions = null;
        } else {
          s = yn(a, S);
          s.subtreeFlags = a.subtreeFlags & 14680064;
        }
        if (h !== null) {
          u = yn(h, u);
        } else {
          u = jn(u, d, n, null);
          u.flags |= 2;
        }
        u.return = t;
        s.return = t;
        s.sibling = u;
        t.child = s;
        s = u;
        u = t.child;
        d = e.child.memoizedState;
        d = d === null ? wa(n) : {
          baseLanes: d.baseLanes | n,
          cachePool: null,
          transitions: d.transitions
        };
        u.memoizedState = d;
        u.childLanes = e.childLanes & ~n;
        t.memoizedState = va;
        return s;
      }
      u = e.child;
      e = u.sibling;
      s = yn(u, {
        mode: "visible",
        children: s.children
      });
      if ((t.mode & 1) === 0) {
        s.lanes = n;
      }
      s.return = t;
      s.sibling = null;
      if (e !== null) {
        n = t.deletions;
        if (n === null) {
          t.deletions = [e];
          t.flags |= 16;
        } else {
          n.push(e);
        }
      }
      t.child = s;
      t.memoizedState = null;
      return s;
    }
    function Ea(e, t) {
      t = Xi({
        mode: "visible",
        children: t
      }, e.mode, 0, null);
      t.return = e;
      return e.child = t;
    }
    function Fi(e, t, n, s) {
      if (s !== null) {
        ql(s);
      }
      lr(t, e.child, null, n);
      e = Ea(t, t.pendingProps.children);
      e.flags |= 2;
      t.memoizedState = null;
      return e;
    }
    function SE(e, t, n, s, a, u, d) {
      if (n) {
        if (t.flags & 256) {
          t.flags &= -257;
          s = ma(Error(i(422)));
          return Fi(e, t, d, s);
        } else if (t.memoizedState !== null) {
          t.child = e.child;
          t.flags |= 128;
          return null;
        } else {
          u = s.fallback;
          a = t.mode;
          s = Xi({
            mode: "visible",
            children: s.children
          }, a, 0, null);
          u = jn(u, a, d, null);
          u.flags |= 2;
          s.return = t;
          u.return = t;
          s.sibling = u;
          t.child = s;
          if ((t.mode & 1) !== 0) {
            lr(t, e.child, null, d);
          }
          t.child.memoizedState = wa(d);
          t.memoizedState = va;
          return u;
        }
      }
      if ((t.mode & 1) === 0) {
        return Fi(e, t, d, null);
      }
      if (a.data === "$!") {
        s = a.nextSibling && a.nextSibling.dataset;
        if (s) {
          var h = s.dgst;
        }
        s = h;
        u = Error(i(419));
        s = ma(u, s, undefined);
        return Fi(e, t, d, s);
      }
      h = (d & e.childLanes) !== 0;
      if (lt || h) {
        s = Ke;
        if (s !== null) {
          switch (d & -d) {
            case 4:
              a = 2;
              break;
            case 16:
              a = 8;
              break;
            case 64:
            case 128:
            case 256:
            case 512:
            case 1024:
            case 2048:
            case 4096:
            case 8192:
            case 16384:
            case 32768:
            case 65536:
            case 131072:
            case 262144:
            case 524288:
            case 1048576:
            case 2097152:
            case 4194304:
            case 8388608:
            case 16777216:
            case 33554432:
            case 67108864:
              a = 32;
              break;
            case 536870912:
              a = 268435456;
              break;
            default:
              a = 0;
          }
          a = (a & (s.suspendedLanes | d)) !== 0 ? 0 : a;
          if (a !== 0 && a !== u.retryLane) {
            u.retryLane = a;
            Vt(e, a);
            Nt(s, e, a, -1);
          }
        }
        ba();
        s = ma(Error(i(421)));
        return Fi(e, t, d, s);
      }
      if (a.data === "$?") {
        t.flags |= 128;
        t.child = e.child;
        t = ME.bind(null, e);
        a._reactRetry = t;
        return null;
      } else {
        e = u.treeContext;
        pt = sn(a.nextSibling);
        dt = t;
        Le = true;
        _t = null;
        if (e !== null) {
          gt[yt++] = Ut;
          gt[yt++] = Bt;
          gt[yt++] = On;
          Ut = e.id;
          Bt = e.overflow;
          On = t;
        }
        t = Ea(t, s.children);
        t.flags |= 4096;
        return t;
      }
    }
    function jp(e, t, n) {
      e.lanes |= t;
      var s = e.alternate;
      if (s !== null) {
        s.lanes |= t;
      }
      Yl(e.return, t, n);
    }
    function Sa(e, t, n, s, a) {
      var u = e.memoizedState;
      if (u === null) {
        e.memoizedState = {
          isBackwards: t,
          rendering: null,
          renderingStartTime: 0,
          last: s,
          tail: n,
          tailMode: a
        };
      } else {
        u.isBackwards = t;
        u.rendering = null;
        u.renderingStartTime = 0;
        u.last = s;
        u.tail = n;
        u.tailMode = a;
      }
    }
    function Up(e, t, n) {
      var s = t.pendingProps;
      var a = s.revealOrder;
      var u = s.tail;
      et(e, t, s.children, n);
      s = Me.current;
      if ((s & 2) !== 0) {
        s = s & 1 | 2;
        t.flags |= 128;
      } else {
        if (e !== null && (e.flags & 128) !== 0) {
          e: for (e = t.child; e !== null;) {
            if (e.tag === 13) {
              if (e.memoizedState !== null) {
                jp(e, n, t);
              }
            } else if (e.tag === 19) {
              jp(e, n, t);
            } else if (e.child !== null) {
              e.child.return = e;
              e = e.child;
              continue;
            }
            if (e === t) {
              break e;
            }
            while (e.sibling === null) {
              if (e.return === null || e.return === t) {
                break e;
              }
              e = e.return;
            }
            e.sibling.return = e.return;
            e = e.sibling;
          }
        }
        s &= 1;
      }
      Ne(Me, s);
      if ((t.mode & 1) === 0) {
        t.memoizedState = null;
      } else {
        switch (a) {
          case "forwards":
            n = t.child;
            a = null;
            while (n !== null) {
              e = n.alternate;
              if (e !== null && Oi(e) === null) {
                a = n;
              }
              n = n.sibling;
            }
            n = a;
            if (n === null) {
              a = t.child;
              t.child = null;
            } else {
              a = n.sibling;
              n.sibling = null;
            }
            Sa(t, false, a, n, u);
            break;
          case "backwards":
            n = null;
            a = t.child;
            t.child = null;
            while (a !== null) {
              e = a.alternate;
              if (e !== null && Oi(e) === null) {
                t.child = a;
                break;
              }
              e = a.sibling;
              a.sibling = n;
              n = a;
              a = e;
            }
            Sa(t, true, n, null, u);
            break;
          case "together":
            Sa(t, false, null, null, undefined);
            break;
          default:
            t.memoizedState = null;
        }
      }
      return t.child;
    }
    function zi(e, t) {
      if ((t.mode & 1) === 0 && e !== null) {
        e.alternate = null;
        t.alternate = null;
        t.flags |= 2;
      }
    }
    function Wt(e, t, n) {
      if (e !== null) {
        t.dependencies = e.dependencies;
      }
      Dn |= t.lanes;
      if ((n & t.childLanes) === 0) {
        return null;
      }
      if (e !== null && t.child !== e.child) {
        throw Error(i(153));
      }
      if (t.child !== null) {
        e = t.child;
        n = yn(e, e.pendingProps);
        t.child = n;
        n.return = t;
        while (e.sibling !== null) {
          e = e.sibling;
          n = n.sibling = yn(e, e.pendingProps);
          n.return = t;
        }
        n.sibling = null;
      }
      return t.child;
    }
    function xE(e, t, n) {
      switch (t.tag) {
        case 3:
          bp(t);
          sr();
          break;
        case 5:
          ep(t);
          break;
        case 1:
          if (st(t.type)) {
            Ei(t);
          }
          break;
        case 4:
          ea(t, t.stateNode.containerInfo);
          break;
        case 10:
          var s = t.type._context;
          var a = t.memoizedProps.value;
          Ne(Ti, s._currentValue);
          s._currentValue = a;
          break;
        case 13:
          s = t.memoizedState;
          if (s !== null) {
            if (s.dehydrated !== null) {
              Ne(Me, Me.current & 1);
              t.flags |= 128;
              return null;
            } else if ((n & t.child.childLanes) !== 0) {
              return zp(e, t, n);
            } else {
              Ne(Me, Me.current & 1);
              e = Wt(e, t, n);
              if (e !== null) {
                return e.sibling;
              } else {
                return null;
              }
            }
          }
          Ne(Me, Me.current & 1);
          break;
        case 19:
          s = (n & t.childLanes) !== 0;
          if ((e.flags & 128) !== 0) {
            if (s) {
              return Up(e, t, n);
            }
            t.flags |= 128;
          }
          a = t.memoizedState;
          if (a !== null) {
            a.rendering = null;
            a.tail = null;
            a.lastEffect = null;
          }
          Ne(Me, Me.current);
          if (s) {
            break;
          }
          return null;
        case 22:
        case 23:
          t.lanes = 0;
          return Lp(e, t, n);
      }
      return Wt(e, t, n);
    }
    var Bp;
    var xa;
    var Vp;
    var $p;
    Bp = function (e, t) {
      for (var n = t.child; n !== null;) {
        if (n.tag === 5 || n.tag === 6) {
          e.appendChild(n.stateNode);
        } else if (n.tag !== 4 && n.child !== null) {
          n.child.return = n;
          n = n.child;
          continue;
        }
        if (n === t) {
          break;
        }
        while (n.sibling === null) {
          if (n.return === null || n.return === t) {
            return;
          }
          n = n.return;
        }
        n.sibling.return = n.return;
        n = n.sibling;
      }
    };
    xa = function () {};
    Vp = function (e, t, n, s) {
      var a = e.memoizedProps;
      if (a !== s) {
        e = t.stateNode;
        Ln(Mt.current);
        var u = null;
        switch (n) {
          case "input":
            a = Ys(e, a);
            s = Ys(e, s);
            u = [];
            break;
          case "select":
            a = G({}, a, {
              value: undefined
            });
            s = G({}, s, {
              value: undefined
            });
            u = [];
            break;
          case "textarea":
            a = el(e, a);
            s = el(e, s);
            u = [];
            break;
          default:
            if (typeof a.onClick != "function" && typeof s.onClick == "function") {
              e.onclick = yi;
            }
        }
        nl(n, s);
        var d;
        n = null;
        for (A in a) {
          if (!s.hasOwnProperty(A) && a.hasOwnProperty(A) && a[A] != null) {
            if (A === "style") {
              var h = a[A];
              for (d in h) {
                if (h.hasOwnProperty(d)) {
                  n ||= {};
                  n[d] = "";
                }
              }
            } else if (A !== "dangerouslySetInnerHTML" && A !== "children" && A !== "suppressContentEditableWarning" && A !== "suppressHydrationWarning" && A !== "autoFocus") {
              if (c.hasOwnProperty(A)) {
                u ||= [];
              } else {
                (u = u || []).push(A, null);
              }
            }
          }
        }
        for (A in s) {
          var S = s[A];
          h = a?.[A];
          if (s.hasOwnProperty(A) && S !== h && (S != null || h != null)) {
            if (A === "style") {
              if (h) {
                for (d in h) {
                  if (!!h.hasOwnProperty(d) && (!S || !S.hasOwnProperty(d))) {
                    n ||= {};
                    n[d] = "";
                  }
                }
                for (d in S) {
                  if (S.hasOwnProperty(d) && h[d] !== S[d]) {
                    n ||= {};
                    n[d] = S[d];
                  }
                }
              } else {
                if (!n) {
                  u ||= [];
                  u.push(A, n);
                }
                n = S;
              }
            } else if (A === "dangerouslySetInnerHTML") {
              S = S ? S.__html : undefined;
              h = h ? h.__html : undefined;
              if (S != null && h !== S) {
                (u = u || []).push(A, S);
              }
            } else if (A === "children") {
              if (typeof S == "string" || typeof S == "number") {
                (u = u || []).push(A, "" + S);
              }
            } else if (A !== "suppressContentEditableWarning" && A !== "suppressHydrationWarning") {
              if (c.hasOwnProperty(A)) {
                if (S != null && A === "onScroll") {
                  Ae("scroll", e);
                }
                if (!u && h !== S) {
                  u = [];
                }
              } else {
                (u = u || []).push(A, S);
              }
            }
          }
        }
        if (n) {
          (u = u || []).push("style", n);
        }
        var A = u;
        if (t.updateQueue = A) {
          t.flags |= 4;
        }
      }
    };
    $p = function (e, t, n, s) {
      if (n !== s) {
        t.flags |= 4;
      }
    };
    function uo(e, t) {
      if (!Le) {
        switch (e.tailMode) {
          case "hidden":
            t = e.tail;
            var n = null;
            for (; t !== null;) {
              if (t.alternate !== null) {
                n = t;
              }
              t = t.sibling;
            }
            if (n === null) {
              e.tail = null;
            } else {
              n.sibling = null;
            }
            break;
          case "collapsed":
            n = e.tail;
            var s = null;
            for (; n !== null;) {
              if (n.alternate !== null) {
                s = n;
              }
              n = n.sibling;
            }
            if (s === null) {
              if (t || e.tail === null) {
                e.tail = null;
              } else {
                e.tail.sibling = null;
              }
            } else {
              s.sibling = null;
            }
        }
      }
    }
    function Je(e) {
      var t = e.alternate !== null && e.alternate.child === e.child;
      var n = 0;
      var s = 0;
      if (t) {
        for (var a = e.child; a !== null;) {
          n |= a.lanes | a.childLanes;
          s |= a.subtreeFlags & 14680064;
          s |= a.flags & 14680064;
          a.return = e;
          a = a.sibling;
        }
      } else {
        for (a = e.child; a !== null;) {
          n |= a.lanes | a.childLanes;
          s |= a.subtreeFlags;
          s |= a.flags;
          a.return = e;
          a = a.sibling;
        }
      }
      e.subtreeFlags |= s;
      e.childLanes = n;
      return t;
    }
    function kE(e, t, n) {
      var s = t.pendingProps;
      Wl(t);
      switch (t.tag) {
        case 2:
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
          Je(t);
          return null;
        case 1:
          if (st(t.type)) {
            wi();
          }
          Je(t);
          return null;
        case 3:
          s = t.stateNode;
          cr();
          Ie(it);
          Ie(Xe);
          ra();
          if (s.pendingContext) {
            s.context = s.pendingContext;
            s.pendingContext = null;
          }
          if (e === null || e.child === null) {
            if (Ci(t)) {
              t.flags |= 4;
            } else if (e !== null && (!e.memoizedState.isDehydrated || (t.flags & 256) !== 0)) {
              t.flags |= 1024;
              if (_t !== null) {
                La(_t);
                _t = null;
              }
            }
          }
          xa(e, t);
          Je(t);
          return null;
        case 5:
          ta(t);
          var a = Ln(oo.current);
          n = t.type;
          if (e !== null && t.stateNode != null) {
            Vp(e, t, n, s, a);
            if (e.ref !== t.ref) {
              t.flags |= 512;
              t.flags |= 2097152;
            }
          } else {
            if (!s) {
              if (t.stateNode === null) {
                throw Error(i(166));
              }
              Je(t);
              return null;
            }
            e = Ln(Mt.current);
            if (Ci(t)) {
              s = t.stateNode;
              n = t.type;
              var u = t.memoizedProps;
              s[Lt] = t;
              s[Zr] = u;
              e = (t.mode & 1) !== 0;
              switch (n) {
                case "dialog":
                  Ae("cancel", s);
                  Ae("close", s);
                  break;
                case "iframe":
                case "object":
                case "embed":
                  Ae("load", s);
                  break;
                case "video":
                case "audio":
                  for (a = 0; a < Xr.length; a++) {
                    Ae(Xr[a], s);
                  }
                  break;
                case "source":
                  Ae("error", s);
                  break;
                case "img":
                case "image":
                case "link":
                  Ae("error", s);
                  Ae("load", s);
                  break;
                case "details":
                  Ae("toggle", s);
                  break;
                case "input":
                  kf(s, u);
                  Ae("invalid", s);
                  break;
                case "select":
                  s._wrapperState = {
                    wasMultiple: !!u.multiple
                  };
                  Ae("invalid", s);
                  break;
                case "textarea":
                  Tf(s, u);
                  Ae("invalid", s);
              }
              nl(n, u);
              a = null;
              for (var d in u) {
                if (u.hasOwnProperty(d)) {
                  var h = u[d];
                  if (d === "children") {
                    if (typeof h == "string") {
                      if (s.textContent !== h) {
                        if (u.suppressHydrationWarning !== true) {
                          gi(s.textContent, h, e);
                        }
                        a = ["children", h];
                      }
                    } else if (typeof h == "number" && s.textContent !== "" + h) {
                      if (u.suppressHydrationWarning !== true) {
                        gi(s.textContent, h, e);
                      }
                      a = ["children", "" + h];
                    }
                  } else if (c.hasOwnProperty(d) && h != null && d === "onScroll") {
                    Ae("scroll", s);
                  }
                }
              }
              switch (n) {
                case "input":
                  Jt(s);
                  _f(s, u, true);
                  break;
                case "textarea":
                  Jt(s);
                  Pf(s);
                  break;
                case "select":
                case "option":
                  break;
                default:
                  if (typeof u.onClick == "function") {
                    s.onclick = yi;
                  }
              }
              s = a;
              t.updateQueue = s;
              if (s !== null) {
                t.flags |= 4;
              }
            } else {
              d = a.nodeType === 9 ? a : a.ownerDocument;
              if (e === "http://www.w3.org/1999/xhtml") {
                e = Nf(n);
              }
              if (e === "http://www.w3.org/1999/xhtml") {
                if (n === "script") {
                  e = d.createElement("div");
                  e.innerHTML = "<script></script>";
                  e = e.removeChild(e.firstChild);
                } else if (typeof s.is == "string") {
                  e = d.createElement(n, {
                    is: s.is
                  });
                } else {
                  e = d.createElement(n);
                  if (n === "select") {
                    d = e;
                    if (s.multiple) {
                      d.multiple = true;
                    } else if (s.size) {
                      d.size = s.size;
                    }
                  }
                }
              } else {
                e = d.createElementNS(e, n);
              }
              e[Lt] = t;
              e[Zr] = s;
              Bp(e, t, false, false);
              t.stateNode = e;
              e: {
                d = rl(n, s);
                switch (n) {
                  case "dialog":
                    Ae("cancel", e);
                    Ae("close", e);
                    a = s;
                    break;
                  case "iframe":
                  case "object":
                  case "embed":
                    Ae("load", e);
                    a = s;
                    break;
                  case "video":
                  case "audio":
                    for (a = 0; a < Xr.length; a++) {
                      Ae(Xr[a], e);
                    }
                    a = s;
                    break;
                  case "source":
                    Ae("error", e);
                    a = s;
                    break;
                  case "img":
                  case "image":
                  case "link":
                    Ae("error", e);
                    Ae("load", e);
                    a = s;
                    break;
                  case "details":
                    Ae("toggle", e);
                    a = s;
                    break;
                  case "input":
                    kf(e, s);
                    a = Ys(e, s);
                    Ae("invalid", e);
                    break;
                  case "option":
                    a = s;
                    break;
                  case "select":
                    e._wrapperState = {
                      wasMultiple: !!s.multiple
                    };
                    a = G({}, s, {
                      value: undefined
                    });
                    Ae("invalid", e);
                    break;
                  case "textarea":
                    Tf(e, s);
                    a = el(e, s);
                    Ae("invalid", e);
                    break;
                  default:
                    a = s;
                }
                nl(n, a);
                h = a;
                for (u in h) {
                  if (h.hasOwnProperty(u)) {
                    var S = h[u];
                    if (u === "style") {
                      If(e, S);
                    } else if (u === "dangerouslySetInnerHTML") {
                      S = S ? S.__html : undefined;
                      if (S != null) {
                        Of(e, S);
                      }
                    } else if (u === "children") {
                      if (typeof S == "string") {
                        if (n !== "textarea" || S !== "") {
                          Ar(e, S);
                        }
                      } else if (typeof S == "number") {
                        Ar(e, "" + S);
                      }
                    } else if (u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && u !== "autoFocus") {
                      if (c.hasOwnProperty(u)) {
                        if (S != null && u === "onScroll") {
                          Ae("scroll", e);
                        }
                      } else if (S != null) {
                        b(e, u, S, d);
                      }
                    }
                  }
                }
                switch (n) {
                  case "input":
                    Jt(e);
                    _f(e, s, false);
                    break;
                  case "textarea":
                    Jt(e);
                    Pf(e);
                    break;
                  case "option":
                    if (s.value != null) {
                      e.setAttribute("value", "" + ke(s.value));
                    }
                    break;
                  case "select":
                    e.multiple = !!s.multiple;
                    u = s.value;
                    if (u != null) {
                      Kn(e, !!s.multiple, u, false);
                    } else if (s.defaultValue != null) {
                      Kn(e, !!s.multiple, s.defaultValue, true);
                    }
                    break;
                  default:
                    if (typeof a.onClick == "function") {
                      e.onclick = yi;
                    }
                }
                switch (n) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    s = !!s.autoFocus;
                    break e;
                  case "img":
                    s = true;
                    break e;
                  default:
                    s = false;
                }
              }
              if (s) {
                t.flags |= 4;
              }
            }
            if (t.ref !== null) {
              t.flags |= 512;
              t.flags |= 2097152;
            }
          }
          Je(t);
          return null;
        case 6:
          if (e && t.stateNode != null) {
            $p(e, t, e.memoizedProps, s);
          } else {
            if (typeof s != "string" && t.stateNode === null) {
              throw Error(i(166));
            }
            n = Ln(oo.current);
            Ln(Mt.current);
            if (Ci(t)) {
              s = t.stateNode;
              n = t.memoizedProps;
              s[Lt] = t;
              if ((u = s.nodeValue !== n) && (e = dt, e !== null)) {
                switch (e.tag) {
                  case 3:
                    gi(s.nodeValue, n, (e.mode & 1) !== 0);
                    break;
                  case 5:
                    if (e.memoizedProps.suppressHydrationWarning !== true) {
                      gi(s.nodeValue, n, (e.mode & 1) !== 0);
                    }
                }
              }
              if (u) {
                t.flags |= 4;
              }
            } else {
              s = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(s);
              s[Lt] = t;
              t.stateNode = s;
            }
          }
          Je(t);
          return null;
        case 13:
          Ie(Me);
          s = t.memoizedState;
          if (e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
            if (Le && pt !== null && (t.mode & 1) !== 0 && (t.flags & 128) === 0) {
              Hd();
              sr();
              t.flags |= 98560;
              u = false;
            } else {
              u = Ci(t);
              if (s !== null && s.dehydrated !== null) {
                if (e === null) {
                  if (!u) {
                    throw Error(i(318));
                  }
                  u = t.memoizedState;
                  u = u !== null ? u.dehydrated : null;
                  if (!u) {
                    throw Error(i(317));
                  }
                  u[Lt] = t;
                } else {
                  sr();
                  if ((t.flags & 128) === 0) {
                    t.memoizedState = null;
                  }
                  t.flags |= 4;
                }
                Je(t);
                u = false;
              } else {
                if (_t !== null) {
                  La(_t);
                  _t = null;
                }
                u = true;
              }
            }
            if (!u) {
              if (t.flags & 65536) {
                return t;
              } else {
                return null;
              }
            }
          }
          if ((t.flags & 128) !== 0) {
            t.lanes = n;
            return t;
          } else {
            s = s !== null;
            if (s !== (e !== null && e.memoizedState !== null) && s) {
              t.child.flags |= 8192;
              if ((t.mode & 1) !== 0) {
                if (e === null || (Me.current & 1) !== 0) {
                  if (Ve === 0) {
                    Ve = 3;
                  }
                } else {
                  ba();
                }
              }
            }
            if (t.updateQueue !== null) {
              t.flags |= 4;
            }
            Je(t);
            return null;
          }
        case 4:
          cr();
          xa(e, t);
          if (e === null) {
            Yr(t.stateNode.containerInfo);
          }
          Je(t);
          return null;
        case 10:
          Xl(t.type._context);
          Je(t);
          return null;
        case 17:
          if (st(t.type)) {
            wi();
          }
          Je(t);
          return null;
        case 19:
          Ie(Me);
          u = t.memoizedState;
          if (u === null) {
            Je(t);
            return null;
          }
          s = (t.flags & 128) !== 0;
          d = u.rendering;
          if (d === null) {
            if (s) {
              uo(u, false);
            } else {
              if (Ve !== 0 || e !== null && (e.flags & 128) !== 0) {
                for (e = t.child; e !== null;) {
                  d = Oi(e);
                  if (d !== null) {
                    t.flags |= 128;
                    uo(u, false);
                    s = d.updateQueue;
                    if (s !== null) {
                      t.updateQueue = s;
                      t.flags |= 4;
                    }
                    t.subtreeFlags = 0;
                    s = n;
                    n = t.child;
                    while (n !== null) {
                      u = n;
                      e = s;
                      u.flags &= 14680066;
                      d = u.alternate;
                      if (d === null) {
                        u.childLanes = 0;
                        u.lanes = e;
                        u.child = null;
                        u.subtreeFlags = 0;
                        u.memoizedProps = null;
                        u.memoizedState = null;
                        u.updateQueue = null;
                        u.dependencies = null;
                        u.stateNode = null;
                      } else {
                        u.childLanes = d.childLanes;
                        u.lanes = d.lanes;
                        u.child = d.child;
                        u.subtreeFlags = 0;
                        u.deletions = null;
                        u.memoizedProps = d.memoizedProps;
                        u.memoizedState = d.memoizedState;
                        u.updateQueue = d.updateQueue;
                        u.type = d.type;
                        e = d.dependencies;
                        u.dependencies = e === null ? null : {
                          lanes: e.lanes,
                          firstContext: e.firstContext
                        };
                      }
                      n = n.sibling;
                    }
                    Ne(Me, Me.current & 1 | 2);
                    return t.child;
                  }
                  e = e.sibling;
                }
              }
              if (u.tail !== null && Fe() > mr) {
                t.flags |= 128;
                s = true;
                uo(u, false);
                t.lanes = 4194304;
              }
            }
          } else {
            if (!s) {
              e = Oi(d);
              if (e !== null) {
                t.flags |= 128;
                s = true;
                n = e.updateQueue;
                if (n !== null) {
                  t.updateQueue = n;
                  t.flags |= 4;
                }
                uo(u, true);
                if (u.tail === null && u.tailMode === "hidden" && !d.alternate && !Le) {
                  Je(t);
                  return null;
                }
              } else if (Fe() * 2 - u.renderingStartTime > mr && n !== 1073741824) {
                t.flags |= 128;
                s = true;
                uo(u, false);
                t.lanes = 4194304;
              }
            }
            if (u.isBackwards) {
              d.sibling = t.child;
              t.child = d;
            } else {
              n = u.last;
              if (n !== null) {
                n.sibling = d;
              } else {
                t.child = d;
              }
              u.last = d;
            }
          }
          if (u.tail !== null) {
            t = u.tail;
            u.rendering = t;
            u.tail = t.sibling;
            u.renderingStartTime = Fe();
            t.sibling = null;
            n = Me.current;
            Ne(Me, s ? n & 1 | 2 : n & 1);
            return t;
          } else {
            Je(t);
            return null;
          }
        case 22:
        case 23:
          Da();
          s = t.memoizedState !== null;
          if (e !== null && e.memoizedState !== null !== s) {
            t.flags |= 8192;
          }
          if (s && (t.mode & 1) !== 0) {
            if ((mt & 1073741824) !== 0) {
              Je(t);
              if (t.subtreeFlags & 6) {
                t.flags |= 8192;
              }
            }
          } else {
            Je(t);
          }
          return null;
        case 24:
          return null;
        case 25:
          return null;
      }
      throw Error(i(156, t.tag));
    }
    function CE(e, t) {
      Wl(t);
      switch (t.tag) {
        case 1:
          if (st(t.type)) {
            wi();
          }
          e = t.flags;
          if (e & 65536) {
            t.flags = e & -65537 | 128;
            return t;
          } else {
            return null;
          }
        case 3:
          cr();
          Ie(it);
          Ie(Xe);
          ra();
          e = t.flags;
          if ((e & 65536) !== 0 && (e & 128) === 0) {
            t.flags = e & -65537 | 128;
            return t;
          } else {
            return null;
          }
        case 5:
          ta(t);
          return null;
        case 13:
          Ie(Me);
          e = t.memoizedState;
          if (e !== null && e.dehydrated !== null) {
            if (t.alternate === null) {
              throw Error(i(340));
            }
            sr();
          }
          e = t.flags;
          if (e & 65536) {
            t.flags = e & -65537 | 128;
            return t;
          } else {
            return null;
          }
        case 19:
          Ie(Me);
          return null;
        case 4:
          cr();
          return null;
        case 10:
          Xl(t.type._context);
          return null;
        case 22:
        case 23:
          Da();
          return null;
        case 24:
          return null;
        default:
          return null;
      }
    }
    var ji = false;
    var Ze = false;
    var _E = typeof WeakSet == "function" ? WeakSet : Set;
    var X = null;
    function dr(e, t) {
      var n = e.ref;
      if (n !== null) {
        if (typeof n == "function") {
          try {
            n(null);
          } catch (s) {
            be(e, t, s);
          }
        } else {
          n.current = null;
        }
      }
    }
    function ka(e, t, n) {
      try {
        n();
      } catch (s) {
        be(e, t, s);
      }
    }
    var Wp = false;
    function TE(e, t) {
      Dl = ii;
      e = xd();
      if (Rl(e)) {
        if ("selectionStart" in e) {
          var n = {
            start: e.selectionStart,
            end: e.selectionEnd
          };
        } else {
          e: {
            n = (n = e.ownerDocument) && n.defaultView || window;
            var s = n.getSelection && n.getSelection();
            if (s && s.rangeCount !== 0) {
              n = s.anchorNode;
              var a = s.anchorOffset;
              var u = s.focusNode;
              s = s.focusOffset;
              try {
                n.nodeType;
                u.nodeType;
              } catch {
                n = null;
                break e;
              }
              var d = 0;
              var h = -1;
              var S = -1;
              var A = 0;
              var j = 0;
              var U = e;
              var z = null;
              t: while (true) {
                for (var Q; U !== n || a !== 0 && U.nodeType !== 3 || (h = d + a), U !== u || s !== 0 && U.nodeType !== 3 || (S = d + s), U.nodeType === 3 && (d += U.nodeValue.length), (Q = U.firstChild) !== null;) {
                  z = U;
                  U = Q;
                }
                while (true) {
                  if (U === e) {
                    break t;
                  }
                  if (z === n && ++A === a) {
                    h = d;
                  }
                  if (z === u && ++j === s) {
                    S = d;
                  }
                  if ((Q = U.nextSibling) !== null) {
                    break;
                  }
                  U = z;
                  z = U.parentNode;
                }
                U = Q;
              }
              n = h === -1 || S === -1 ? null : {
                start: h,
                end: S
              };
            } else {
              n = null;
            }
          }
        }
        n = n || {
          start: 0,
          end: 0
        };
      } else {
        n = null;
      }
      bl = {
        focusedElem: e,
        selectionRange: n
      };
      ii = false;
      X = t;
      while (X !== null) {
        t = X;
        e = t.child;
        if ((t.subtreeFlags & 1028) !== 0 && e !== null) {
          e.return = t;
          X = e;
        } else {
          while (X !== null) {
            t = X;
            try {
              var ee = t.alternate;
              if ((t.flags & 1024) !== 0) {
                switch (t.tag) {
                  case 0:
                  case 11:
                  case 15:
                    break;
                  case 1:
                    if (ee !== null) {
                      var te = ee.memoizedProps;
                      var ze = ee.memoizedState;
                      var R = t.stateNode;
                      var x = R.getSnapshotBeforeUpdate(t.elementType === t.type ? te : Tt(t.type, te), ze);
                      R.__reactInternalSnapshotBeforeUpdate = x;
                    }
                    break;
                  case 3:
                    var P = t.stateNode.containerInfo;
                    if (P.nodeType === 1) {
                      P.textContent = "";
                    } else if (P.nodeType === 9 && P.documentElement) {
                      P.removeChild(P.documentElement);
                    }
                    break;
                  case 5:
                  case 6:
                  case 4:
                  case 17:
                    break;
                  default:
                    throw Error(i(163));
                }
              }
            } catch (V) {
              be(t, t.return, V);
            }
            e = t.sibling;
            if (e !== null) {
              e.return = t.return;
              X = e;
              break;
            }
            X = t.return;
          }
        }
      }
      ee = Wp;
      Wp = false;
      return ee;
    }
    function co(e, t, n) {
      var s = t.updateQueue;
      s = s !== null ? s.lastEffect : null;
      if (s !== null) {
        var a = s = s.next;
        do {
          if ((a.tag & e) === e) {
            var u = a.destroy;
            a.destroy = undefined;
            if (u !== undefined) {
              ka(t, n, u);
            }
          }
          a = a.next;
        } while (a !== s);
      }
    }
    function Ui(e, t) {
      t = t.updateQueue;
      t = t !== null ? t.lastEffect : null;
      if (t !== null) {
        var n = t = t.next;
        do {
          if ((n.tag & e) === e) {
            var s = n.create;
            n.destroy = s();
          }
          n = n.next;
        } while (n !== t);
      }
    }
    function Ca(e) {
      var t = e.ref;
      if (t !== null) {
        var n = e.stateNode;
        e.tag;
        e = n;
        if (typeof t == "function") {
          t(e);
        } else {
          t.current = e;
        }
      }
    }
    function Kp(e) {
      var t = e.alternate;
      if (t !== null) {
        e.alternate = null;
        Kp(t);
      }
      e.child = null;
      e.deletions = null;
      e.sibling = null;
      if (e.tag === 5) {
        t = e.stateNode;
        if (t !== null) {
          delete t[Lt];
          delete t[Zr];
          delete t[Ul];
          delete t[aE];
          delete t[uE];
        }
      }
      e.stateNode = null;
      e.return = null;
      e.dependencies = null;
      e.memoizedProps = null;
      e.memoizedState = null;
      e.pendingProps = null;
      e.stateNode = null;
      e.updateQueue = null;
    }
    function Hp(e) {
      return e.tag === 5 || e.tag === 3 || e.tag === 4;
    }
    function qp(e) {
      e: while (true) {
        while (e.sibling === null) {
          if (e.return === null || Hp(e.return)) {
            return null;
          }
          e = e.return;
        }
        e.sibling.return = e.return;
        e = e.sibling;
        while (e.tag !== 5 && e.tag !== 6 && e.tag !== 18) {
          if (e.flags & 2 || e.child === null || e.tag === 4) {
            continue e;
          }
          e.child.return = e;
          e = e.child;
        }
        if (!(e.flags & 2)) {
          return e.stateNode;
        }
      }
    }
    function _a(e, t, n) {
      var s = e.tag;
      if (s === 5 || s === 6) {
        e = e.stateNode;
        if (t) {
          if (n.nodeType === 8) {
            n.parentNode.insertBefore(e, t);
          } else {
            n.insertBefore(e, t);
          }
        } else {
          if (n.nodeType === 8) {
            t = n.parentNode;
            t.insertBefore(e, n);
          } else {
            t = n;
            t.appendChild(e);
          }
          n = n._reactRootContainer;
          if (n == null && t.onclick === null) {
            t.onclick = yi;
          }
        }
      } else if (s !== 4 && (e = e.child, e !== null)) {
        _a(e, t, n);
        e = e.sibling;
        while (e !== null) {
          _a(e, t, n);
          e = e.sibling;
        }
      }
    }
    function Ta(e, t, n) {
      var s = e.tag;
      if (s === 5 || s === 6) {
        e = e.stateNode;
        if (t) {
          n.insertBefore(e, t);
        } else {
          n.appendChild(e);
        }
      } else if (s !== 4 && (e = e.child, e !== null)) {
        Ta(e, t, n);
        e = e.sibling;
        while (e !== null) {
          Ta(e, t, n);
          e = e.sibling;
        }
      }
    }
    var qe = null;
    var Rt = false;
    function dn(e, t, n) {
      for (n = n.child; n !== null;) {
        Gp(e, t, n);
        n = n.sibling;
      }
    }
    function Gp(e, t, n) {
      if (It && typeof It.onCommitFiberUnmount == "function") {
        try {
          It.onCommitFiberUnmount(Zo, n);
        } catch {}
      }
      switch (n.tag) {
        case 5:
          if (!Ze) {
            dr(n, t);
          }
        case 6:
          var s = qe;
          var a = Rt;
          qe = null;
          dn(e, t, n);
          qe = s;
          Rt = a;
          if (qe !== null) {
            if (Rt) {
              e = qe;
              n = n.stateNode;
              if (e.nodeType === 8) {
                e.parentNode.removeChild(n);
              } else {
                e.removeChild(n);
              }
            } else {
              qe.removeChild(n.stateNode);
            }
          }
          break;
        case 18:
          if (qe !== null) {
            if (Rt) {
              e = qe;
              n = n.stateNode;
              if (e.nodeType === 8) {
                jl(e.parentNode, n);
              } else if (e.nodeType === 1) {
                jl(e, n);
              }
              Vr(e);
            } else {
              jl(qe, n.stateNode);
            }
          }
          break;
        case 4:
          s = qe;
          a = Rt;
          qe = n.stateNode.containerInfo;
          Rt = true;
          dn(e, t, n);
          qe = s;
          Rt = a;
          break;
        case 0:
        case 11:
        case 14:
        case 15:
          if (!Ze && (s = n.updateQueue, s !== null && (s = s.lastEffect, s !== null))) {
            a = s = s.next;
            do {
              var u = a;
              var d = u.destroy;
              u = u.tag;
              if (d !== undefined && ((u & 2) !== 0 || (u & 4) !== 0)) {
                ka(n, t, d);
              }
              a = a.next;
            } while (a !== s);
          }
          dn(e, t, n);
          break;
        case 1:
          if (!Ze && (dr(n, t), s = n.stateNode, typeof s.componentWillUnmount == "function")) {
            try {
              s.props = n.memoizedProps;
              s.state = n.memoizedState;
              s.componentWillUnmount();
            } catch (h) {
              be(n, t, h);
            }
          }
          dn(e, t, n);
          break;
        case 21:
          dn(e, t, n);
          break;
        case 22:
          if (n.mode & 1) {
            Ze = (s = Ze) || n.memoizedState !== null;
            dn(e, t, n);
            Ze = s;
          } else {
            dn(e, t, n);
          }
          break;
        default:
          dn(e, t, n);
      }
    }
    function Qp(e) {
      var t = e.updateQueue;
      if (t !== null) {
        e.updateQueue = null;
        var n = e.stateNode;
        if (n === null) {
          n = e.stateNode = new _E();
        }
        t.forEach(function (s) {
          var a = DE.bind(null, e, s);
          if (!n.has(s)) {
            n.add(s);
            s.then(a, a);
          }
        });
      }
    }
    function Pt(e, t) {
      var n = t.deletions;
      if (n !== null) {
        for (var s = 0; s < n.length; s++) {
          var a = n[s];
          try {
            var u = e;
            var d = t;
            var h = d;
            e: while (h !== null) {
              switch (h.tag) {
                case 5:
                  qe = h.stateNode;
                  Rt = false;
                  break e;
                case 3:
                  qe = h.stateNode.containerInfo;
                  Rt = true;
                  break e;
                case 4:
                  qe = h.stateNode.containerInfo;
                  Rt = true;
                  break e;
              }
              h = h.return;
            }
            if (qe === null) {
              throw Error(i(160));
            }
            Gp(u, d, a);
            qe = null;
            Rt = false;
            var S = a.alternate;
            if (S !== null) {
              S.return = null;
            }
            a.return = null;
          } catch (A) {
            be(a, t, A);
          }
        }
      }
      if (t.subtreeFlags & 12854) {
        for (t = t.child; t !== null;) {
          Xp(t, e);
          t = t.sibling;
        }
      }
    }
    function Xp(e, t) {
      var n = e.alternate;
      var s = e.flags;
      switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          Pt(t, e);
          bt(e);
          if (s & 4) {
            try {
              co(3, e, e.return);
              Ui(3, e);
            } catch (te) {
              be(e, e.return, te);
            }
            try {
              co(5, e, e.return);
            } catch (te) {
              be(e, e.return, te);
            }
          }
          break;
        case 1:
          Pt(t, e);
          bt(e);
          if (s & 512 && n !== null) {
            dr(n, n.return);
          }
          break;
        case 5:
          Pt(t, e);
          bt(e);
          if (s & 512 && n !== null) {
            dr(n, n.return);
          }
          if (e.flags & 32) {
            var a = e.stateNode;
            try {
              Ar(a, "");
            } catch (te) {
              be(e, e.return, te);
            }
          }
          if (s & 4 && (a = e.stateNode, a != null)) {
            var u = e.memoizedProps;
            var d = n !== null ? n.memoizedProps : u;
            var h = e.type;
            var S = e.updateQueue;
            e.updateQueue = null;
            if (S !== null) {
              try {
                if (h === "input" && u.type === "radio" && u.name != null) {
                  Cf(a, u);
                }
                rl(h, d);
                var A = rl(h, u);
                for (d = 0; d < S.length; d += 2) {
                  var j = S[d];
                  var U = S[d + 1];
                  if (j === "style") {
                    If(a, U);
                  } else if (j === "dangerouslySetInnerHTML") {
                    Of(a, U);
                  } else if (j === "children") {
                    Ar(a, U);
                  } else {
                    b(a, j, U, A);
                  }
                }
                switch (h) {
                  case "input":
                    Js(a, u);
                    break;
                  case "textarea":
                    Rf(a, u);
                    break;
                  case "select":
                    var z = a._wrapperState.wasMultiple;
                    a._wrapperState.wasMultiple = !!u.multiple;
                    var Q = u.value;
                    if (Q != null) {
                      Kn(a, !!u.multiple, Q, false);
                    } else if (z !== !!u.multiple) {
                      if (u.defaultValue != null) {
                        Kn(a, !!u.multiple, u.defaultValue, true);
                      } else {
                        Kn(a, !!u.multiple, u.multiple ? [] : "", false);
                      }
                    }
                }
                a[Zr] = u;
              } catch (te) {
                be(e, e.return, te);
              }
            }
          }
          break;
        case 6:
          Pt(t, e);
          bt(e);
          if (s & 4) {
            if (e.stateNode === null) {
              throw Error(i(162));
            }
            a = e.stateNode;
            u = e.memoizedProps;
            try {
              a.nodeValue = u;
            } catch (te) {
              be(e, e.return, te);
            }
          }
          break;
        case 3:
          Pt(t, e);
          bt(e);
          if (s & 4 && n !== null && n.memoizedState.isDehydrated) {
            try {
              Vr(t.containerInfo);
            } catch (te) {
              be(e, e.return, te);
            }
          }
          break;
        case 4:
          Pt(t, e);
          bt(e);
          break;
        case 13:
          Pt(t, e);
          bt(e);
          a = e.child;
          if (a.flags & 8192) {
            u = a.memoizedState !== null;
            a.stateNode.isHidden = u;
            if (!!u && (a.alternate === null || a.alternate.memoizedState === null)) {
              Na = Fe();
            }
          }
          if (s & 4) {
            Qp(e);
          }
          break;
        case 22:
          j = n !== null && n.memoizedState !== null;
          if (e.mode & 1) {
            Ze = (A = Ze) || j;
            Pt(t, e);
            Ze = A;
          } else {
            Pt(t, e);
          }
          bt(e);
          if (s & 8192) {
            A = e.memoizedState !== null;
            if ((e.stateNode.isHidden = A) && !j && (e.mode & 1) !== 0) {
              X = e;
              j = e.child;
              while (j !== null) {
                for (U = X = j; X !== null;) {
                  z = X;
                  Q = z.child;
                  switch (z.tag) {
                    case 0:
                    case 11:
                    case 14:
                    case 15:
                      co(4, z, z.return);
                      break;
                    case 1:
                      dr(z, z.return);
                      var ee = z.stateNode;
                      if (typeof ee.componentWillUnmount == "function") {
                        s = z;
                        n = z.return;
                        try {
                          t = s;
                          ee.props = t.memoizedProps;
                          ee.state = t.memoizedState;
                          ee.componentWillUnmount();
                        } catch (te) {
                          be(s, n, te);
                        }
                      }
                      break;
                    case 5:
                      dr(z, z.return);
                      break;
                    case 22:
                      if (z.memoizedState !== null) {
                        Zp(U);
                        continue;
                      }
                  }
                  if (Q !== null) {
                    Q.return = z;
                    X = Q;
                  } else {
                    Zp(U);
                  }
                }
                j = j.sibling;
              }
            }
            j = null;
            U = e;
            e: while (true) {
              if (U.tag === 5) {
                if (j === null) {
                  j = U;
                  try {
                    a = U.stateNode;
                    if (A) {
                      u = a.style;
                      if (typeof u.setProperty == "function") {
                        u.setProperty("display", "none", "important");
                      } else {
                        u.display = "none";
                      }
                    } else {
                      h = U.stateNode;
                      S = U.memoizedProps.style;
                      d = S != null && S.hasOwnProperty("display") ? S.display : null;
                      h.style.display = Af("display", d);
                    }
                  } catch (te) {
                    be(e, e.return, te);
                  }
                }
              } else if (U.tag === 6) {
                if (j === null) {
                  try {
                    U.stateNode.nodeValue = A ? "" : U.memoizedProps;
                  } catch (te) {
                    be(e, e.return, te);
                  }
                }
              } else if ((U.tag !== 22 && U.tag !== 23 || U.memoizedState === null || U === e) && U.child !== null) {
                U.child.return = U;
                U = U.child;
                continue;
              }
              if (U === e) {
                break e;
              }
              while (U.sibling === null) {
                if (U.return === null || U.return === e) {
                  break e;
                }
                if (j === U) {
                  j = null;
                }
                U = U.return;
              }
              if (j === U) {
                j = null;
              }
              U.sibling.return = U.return;
              U = U.sibling;
            }
          }
          break;
        case 19:
          Pt(t, e);
          bt(e);
          if (s & 4) {
            Qp(e);
          }
          break;
        case 21:
          break;
        default:
          Pt(t, e);
          bt(e);
      }
    }
    function bt(e) {
      var t = e.flags;
      if (t & 2) {
        try {
          e: {
            for (var n = e.return; n !== null;) {
              if (Hp(n)) {
                var s = n;
                break e;
              }
              n = n.return;
            }
            throw Error(i(160));
          }
          switch (s.tag) {
            case 5:
              var a = s.stateNode;
              if (s.flags & 32) {
                Ar(a, "");
                s.flags &= -33;
              }
              var u = qp(e);
              Ta(e, u, a);
              break;
            case 3:
            case 4:
              var d = s.stateNode.containerInfo;
              var h = qp(e);
              _a(e, h, d);
              break;
            default:
              throw Error(i(161));
          }
        } catch (S) {
          be(e, e.return, S);
        }
        e.flags &= -3;
      }
      if (t & 4096) {
        e.flags &= -4097;
      }
    }
    function RE(e, t, n) {
      X = e;
      Yp(e);
    }
    function Yp(e, t, n) {
      var s = (e.mode & 1) !== 0;
      for (; X !== null;) {
        var a = X;
        var u = a.child;
        if (a.tag === 22 && s) {
          var d = a.memoizedState !== null || ji;
          if (!d) {
            var h = a.alternate;
            var S = h !== null && h.memoizedState !== null || Ze;
            h = ji;
            var A = Ze;
            ji = d;
            if ((Ze = S) && !A) {
              for (X = a; X !== null;) {
                d = X;
                S = d.child;
                if (d.tag === 22 && d.memoizedState !== null) {
                  em(a);
                } else if (S !== null) {
                  S.return = d;
                  X = S;
                } else {
                  em(a);
                }
              }
            }
            while (u !== null) {
              X = u;
              Yp(u);
              u = u.sibling;
            }
            X = a;
            ji = h;
            Ze = A;
          }
          Jp(e);
        } else if ((a.subtreeFlags & 8772) !== 0 && u !== null) {
          u.return = a;
          X = u;
        } else {
          Jp(e);
        }
      }
    }
    function Jp(e) {
      while (X !== null) {
        var t = X;
        if ((t.flags & 8772) !== 0) {
          var n = t.alternate;
          try {
            if ((t.flags & 8772) !== 0) {
              switch (t.tag) {
                case 0:
                case 11:
                case 15:
                  if (!Ze) {
                    Ui(5, t);
                  }
                  break;
                case 1:
                  var s = t.stateNode;
                  if (t.flags & 4 && !Ze) {
                    if (n === null) {
                      s.componentDidMount();
                    } else {
                      var a = t.elementType === t.type ? n.memoizedProps : Tt(t.type, n.memoizedProps);
                      s.componentDidUpdate(a, n.memoizedState, s.__reactInternalSnapshotBeforeUpdate);
                    }
                  }
                  var u = t.updateQueue;
                  if (u !== null) {
                    Zd(t, u, s);
                  }
                  break;
                case 3:
                  var d = t.updateQueue;
                  if (d !== null) {
                    n = null;
                    if (t.child !== null) {
                      switch (t.child.tag) {
                        case 5:
                          n = t.child.stateNode;
                          break;
                        case 1:
                          n = t.child.stateNode;
                      }
                    }
                    Zd(t, d, n);
                  }
                  break;
                case 5:
                  var h = t.stateNode;
                  if (n === null && t.flags & 4) {
                    n = h;
                    var S = t.memoizedProps;
                    switch (t.type) {
                      case "button":
                      case "input":
                      case "select":
                      case "textarea":
                        if (S.autoFocus) {
                          n.focus();
                        }
                        break;
                      case "img":
                        if (S.src) {
                          n.src = S.src;
                        }
                    }
                  }
                  break;
                case 6:
                  break;
                case 4:
                  break;
                case 12:
                  break;
                case 13:
                  if (t.memoizedState === null) {
                    var A = t.alternate;
                    if (A !== null) {
                      var j = A.memoizedState;
                      if (j !== null) {
                        var U = j.dehydrated;
                        if (U !== null) {
                          Vr(U);
                        }
                      }
                    }
                  }
                  break;
                case 19:
                case 17:
                case 21:
                case 22:
                case 23:
                case 25:
                  break;
                default:
                  throw Error(i(163));
              }
            }
            if (!Ze) {
              if (t.flags & 512) {
                Ca(t);
              }
            }
          } catch (z) {
            be(t, t.return, z);
          }
        }
        if (t === e) {
          X = null;
          break;
        }
        n = t.sibling;
        if (n !== null) {
          n.return = t.return;
          X = n;
          break;
        }
        X = t.return;
      }
    }
    function Zp(e) {
      while (X !== null) {
        var t = X;
        if (t === e) {
          X = null;
          break;
        }
        var n = t.sibling;
        if (n !== null) {
          n.return = t.return;
          X = n;
          break;
        }
        X = t.return;
      }
    }
    function em(e) {
      while (X !== null) {
        var t = X;
        try {
          switch (t.tag) {
            case 0:
            case 11:
            case 15:
              var n = t.return;
              try {
                Ui(4, t);
              } catch (S) {
                be(t, n, S);
              }
              break;
            case 1:
              var s = t.stateNode;
              if (typeof s.componentDidMount == "function") {
                var a = t.return;
                try {
                  s.componentDidMount();
                } catch (S) {
                  be(t, a, S);
                }
              }
              var u = t.return;
              try {
                Ca(t);
              } catch (S) {
                be(t, u, S);
              }
              break;
            case 5:
              var d = t.return;
              try {
                Ca(t);
              } catch (S) {
                be(t, d, S);
              }
          }
        } catch (S) {
          be(t, t.return, S);
        }
        if (t === e) {
          X = null;
          break;
        }
        var h = t.sibling;
        if (h !== null) {
          h.return = t.return;
          X = h;
          break;
        }
        X = t.return;
      }
    }
    var PE = Math.ceil;
    var Bi = D.ReactCurrentDispatcher;
    var Ra = D.ReactCurrentOwner;
    var Et = D.ReactCurrentBatchConfig;
    var Se = 0;
    var Ke = null;
    var je = null;
    var Ge = 0;
    var mt = 0;
    var pr = ln(0);
    var Ve = 0;
    var fo = null;
    var Dn = 0;
    var Vi = 0;
    var Pa = 0;
    var po = null;
    var at = null;
    var Na = 0;
    var mr = Infinity;
    var Kt = null;
    var $i = false;
    var Oa = null;
    var pn = null;
    var Wi = false;
    var mn = null;
    var Ki = 0;
    var mo = 0;
    var Aa = null;
    var Hi = -1;
    var qi = 0;
    function tt() {
      if ((Se & 6) !== 0) {
        return Fe();
      } else if (Hi !== -1) {
        return Hi;
      } else {
        return Hi = Fe();
      }
    }
    function hn(e) {
      if ((e.mode & 1) === 0) {
        return 1;
      } else if ((Se & 2) !== 0 && Ge !== 0) {
        return Ge & -Ge;
      } else if (fE.transition !== null) {
        if (qi === 0) {
          qi = qf();
        }
        return qi;
      } else {
        e = Pe;
        if (e === 0) {
          e = window.event;
          e = e === undefined ? 16 : nd(e.type);
        }
        return e;
      }
    }
    function Nt(e, t, n, s) {
      if (mo > 50) {
        mo = 0;
        Aa = null;
        throw Error(i(185));
      }
      Fr(e, n, s);
      if ((Se & 2) === 0 || e !== Ke) {
        if (e === Ke) {
          if ((Se & 2) === 0) {
            Vi |= n;
          }
          if (Ve === 4) {
            gn(e, Ge);
          }
        }
        ut(e, s);
        if (n === 1 && Se === 0 && (t.mode & 1) === 0) {
          mr = Fe() + 500;
          if (Si) {
            un();
          }
        }
      }
    }
    function ut(e, t) {
      var n = e.callbackNode;
      f0(e, t);
      var s = ni(e, e === Ke ? Ge : 0);
      if (s === 0) {
        if (n !== null) {
          Wf(n);
        }
        e.callbackNode = null;
        e.callbackPriority = 0;
      } else {
        t = s & -s;
        if (e.callbackPriority !== t) {
          if (n != null) {
            Wf(n);
          }
          if (t === 1) {
            if (e.tag === 0) {
              cE(nm.bind(null, e));
            } else {
              Bd(nm.bind(null, e));
            }
            sE(function () {
              if ((Se & 6) === 0) {
                un();
              }
            });
            n = null;
          } else {
            switch (Gf(s)) {
              case 1:
                n = cl;
                break;
              case 4:
                n = Kf;
                break;
              case 16:
                n = Jo;
                break;
              case 536870912:
                n = Hf;
                break;
              default:
                n = Jo;
            }
            n = cm(n, tm.bind(null, e));
          }
          e.callbackPriority = t;
          e.callbackNode = n;
        }
      }
    }
    function tm(e, t) {
      Hi = -1;
      qi = 0;
      if ((Se & 6) !== 0) {
        throw Error(i(327));
      }
      var n = e.callbackNode;
      if (hr() && e.callbackNode !== n) {
        return null;
      }
      var s = ni(e, e === Ke ? Ge : 0);
      if (s === 0) {
        return null;
      }
      if ((s & 30) !== 0 || (s & e.expiredLanes) !== 0 || t) {
        t = Gi(e, s);
      } else {
        t = s;
        var a = Se;
        Se |= 2;
        var u = om();
        if (Ke !== e || Ge !== t) {
          Kt = null;
          mr = Fe() + 500;
          Fn(e, t);
        }
        do {
          try {
            AE();
            break;
          } catch (h) {
            rm(e, h);
          }
        } while (true);
        Ql();
        Bi.current = u;
        Se = a;
        if (je !== null) {
          t = 0;
        } else {
          Ke = null;
          Ge = 0;
          t = Ve;
        }
      }
      if (t !== 0) {
        if (t === 2) {
          a = fl(e);
          if (a !== 0) {
            s = a;
            t = Ia(e, a);
          }
        }
        if (t === 1) {
          n = fo;
          Fn(e, 0);
          gn(e, s);
          ut(e, Fe());
          throw n;
        }
        if (t === 6) {
          gn(e, s);
        } else {
          a = e.current.alternate;
          if ((s & 30) === 0 && !NE(a) && (t = Gi(e, s), t === 2 && (u = fl(e), u !== 0 && (s = u, t = Ia(e, u))), t === 1)) {
            n = fo;
            Fn(e, 0);
            gn(e, s);
            ut(e, Fe());
            throw n;
          }
          e.finishedWork = a;
          e.finishedLanes = s;
          switch (t) {
            case 0:
            case 1:
              throw Error(i(345));
            case 2:
              zn(e, at, Kt);
              break;
            case 3:
              gn(e, s);
              if ((s & 130023424) === s && (t = Na + 500 - Fe(), t > 10)) {
                if (ni(e, 0) !== 0) {
                  break;
                }
                a = e.suspendedLanes;
                if ((a & s) !== s) {
                  tt();
                  e.pingedLanes |= e.suspendedLanes & a;
                  break;
                }
                e.timeoutHandle = zl(zn.bind(null, e, at, Kt), t);
                break;
              }
              zn(e, at, Kt);
              break;
            case 4:
              gn(e, s);
              if ((s & 4194240) === s) {
                break;
              }
              t = e.eventTimes;
              a = -1;
              while (s > 0) {
                var d = 31 - kt(s);
                u = 1 << d;
                d = t[d];
                if (d > a) {
                  a = d;
                }
                s &= ~u;
              }
              s = a;
              s = Fe() - s;
              s = (s < 120 ? 120 : s < 480 ? 480 : s < 1080 ? 1080 : s < 1920 ? 1920 : s < 3000 ? 3000 : s < 4320 ? 4320 : PE(s / 1960) * 1960) - s;
              if (s > 10) {
                e.timeoutHandle = zl(zn.bind(null, e, at, Kt), s);
                break;
              }
              zn(e, at, Kt);
              break;
            case 5:
              zn(e, at, Kt);
              break;
            default:
              throw Error(i(329));
          }
        }
      }
      ut(e, Fe());
      if (e.callbackNode === n) {
        return tm.bind(null, e);
      } else {
        return null;
      }
    }
    function Ia(e, t) {
      var n = po;
      if (e.current.memoizedState.isDehydrated) {
        Fn(e, t).flags |= 256;
      }
      e = Gi(e, t);
      if (e !== 2) {
        t = at;
        at = n;
        if (t !== null) {
          La(t);
        }
      }
      return e;
    }
    function La(e) {
      if (at === null) {
        at = e;
      } else {
        at.push.apply(at, e);
      }
    }
    function NE(e) {
      var t = e;
      for (;;) {
        if (t.flags & 16384) {
          var n = t.updateQueue;
          if (n !== null && (n = n.stores, n !== null)) {
            for (var s = 0; s < n.length; s++) {
              var a = n[s];
              var u = a.getSnapshot;
              a = a.value;
              try {
                if (!Ct(u(), a)) {
                  return false;
                }
              } catch {
                return false;
              }
            }
          }
        }
        n = t.child;
        if (t.subtreeFlags & 16384 && n !== null) {
          n.return = t;
          t = n;
        } else {
          if (t === e) {
            break;
          }
          while (t.sibling === null) {
            if (t.return === null || t.return === e) {
              return true;
            }
            t = t.return;
          }
          t.sibling.return = t.return;
          t = t.sibling;
        }
      }
      return true;
    }
    function gn(e, t) {
      t &= ~Pa;
      t &= ~Vi;
      e.suspendedLanes |= t;
      e.pingedLanes &= ~t;
      e = e.expirationTimes;
      while (t > 0) {
        var n = 31 - kt(t);
        var s = 1 << n;
        e[n] = -1;
        t &= ~s;
      }
    }
    function nm(e) {
      if ((Se & 6) !== 0) {
        throw Error(i(327));
      }
      hr();
      var t = ni(e, 0);
      if ((t & 1) === 0) {
        ut(e, Fe());
        return null;
      }
      var n = Gi(e, t);
      if (e.tag !== 0 && n === 2) {
        var s = fl(e);
        if (s !== 0) {
          t = s;
          n = Ia(e, s);
        }
      }
      if (n === 1) {
        n = fo;
        Fn(e, 0);
        gn(e, t);
        ut(e, Fe());
        throw n;
      }
      if (n === 6) {
        throw Error(i(345));
      }
      e.finishedWork = e.current.alternate;
      e.finishedLanes = t;
      zn(e, at, Kt);
      ut(e, Fe());
      return null;
    }
    function Ma(e, t) {
      var n = Se;
      Se |= 1;
      try {
        return e(t);
      } finally {
        Se = n;
        if (Se === 0) {
          mr = Fe() + 500;
          if (Si) {
            un();
          }
        }
      }
    }
    function bn(e) {
      if (mn !== null && mn.tag === 0 && (Se & 6) === 0) {
        hr();
      }
      var t = Se;
      Se |= 1;
      var n = Et.transition;
      var s = Pe;
      try {
        Et.transition = null;
        Pe = 1;
        if (e) {
          return e();
        }
      } finally {
        Pe = s;
        Et.transition = n;
        Se = t;
        if ((Se & 6) === 0) {
          un();
        }
      }
    }
    function Da() {
      mt = pr.current;
      Ie(pr);
    }
    function Fn(e, t) {
      e.finishedWork = null;
      e.finishedLanes = 0;
      var n = e.timeoutHandle;
      if (n !== -1) {
        e.timeoutHandle = -1;
        iE(n);
      }
      if (je !== null) {
        for (n = je.return; n !== null;) {
          var s = n;
          Wl(s);
          switch (s.tag) {
            case 1:
              s = s.type.childContextTypes;
              if (s != null) {
                wi();
              }
              break;
            case 3:
              cr();
              Ie(it);
              Ie(Xe);
              ra();
              break;
            case 5:
              ta(s);
              break;
            case 4:
              cr();
              break;
            case 13:
              Ie(Me);
              break;
            case 19:
              Ie(Me);
              break;
            case 10:
              Xl(s.type._context);
              break;
            case 22:
            case 23:
              Da();
          }
          n = n.return;
        }
      }
      Ke = e;
      je = e = yn(e.current, null);
      Ge = mt = t;
      Ve = 0;
      fo = null;
      Pa = Vi = Dn = 0;
      at = po = null;
      if (In !== null) {
        for (t = 0; t < In.length; t++) {
          n = In[t];
          s = n.interleaved;
          if (s !== null) {
            n.interleaved = null;
            var a = s.next;
            var u = n.pending;
            if (u !== null) {
              var d = u.next;
              u.next = a;
              s.next = d;
            }
            n.pending = s;
          }
        }
        In = null;
      }
      return e;
    }
    function rm(e, t) {
      do {
        var n = je;
        try {
          Ql();
          Ai.current = Di;
          if (Ii) {
            for (var s = De.memoizedState; s !== null;) {
              var a = s.queue;
              if (a !== null) {
                a.pending = null;
              }
              s = s.next;
            }
            Ii = false;
          }
          Mn = 0;
          We = Be = De = null;
          io = false;
          so = 0;
          Ra.current = null;
          if (n === null || n.return === null) {
            Ve = 1;
            fo = t;
            je = null;
            break;
          }
          e: {
            var u = e;
            var d = n.return;
            var h = n;
            var S = t;
            t = Ge;
            h.flags |= 32768;
            if (S !== null && typeof S == "object" && typeof S.then == "function") {
              var A = S;
              var j = h;
              var U = j.tag;
              if ((j.mode & 1) === 0 && (U === 0 || U === 11 || U === 15)) {
                var z = j.alternate;
                if (z) {
                  j.updateQueue = z.updateQueue;
                  j.memoizedState = z.memoizedState;
                  j.lanes = z.lanes;
                } else {
                  j.updateQueue = null;
                  j.memoizedState = null;
                }
              }
              var Q = Pp(d);
              if (Q !== null) {
                Q.flags &= -257;
                Np(Q, d, h, u, t);
                if (Q.mode & 1) {
                  Rp(u, A, t);
                }
                t = Q;
                S = A;
                var ee = t.updateQueue;
                if (ee === null) {
                  var te = new Set();
                  te.add(S);
                  t.updateQueue = te;
                } else {
                  ee.add(S);
                }
                break e;
              } else {
                if ((t & 1) === 0) {
                  Rp(u, A, t);
                  ba();
                  break e;
                }
                S = Error(i(426));
              }
            } else if (Le && h.mode & 1) {
              var ze = Pp(d);
              if (ze !== null) {
                if ((ze.flags & 65536) === 0) {
                  ze.flags |= 256;
                }
                Np(ze, d, h, u, t);
                ql(fr(S, h));
                break e;
              }
            }
            u = S = fr(S, h);
            if (Ve !== 4) {
              Ve = 2;
            }
            if (po === null) {
              po = [u];
            } else {
              po.push(u);
            }
            u = d;
            do {
              switch (u.tag) {
                case 3:
                  u.flags |= 65536;
                  t &= -t;
                  u.lanes |= t;
                  var R = _p(u, S, t);
                  Jd(u, R);
                  break e;
                case 1:
                  h = S;
                  var x = u.type;
                  var P = u.stateNode;
                  if ((u.flags & 128) === 0 && (typeof x.getDerivedStateFromError == "function" || P !== null && typeof P.componentDidCatch == "function" && (pn === null || !pn.has(P)))) {
                    u.flags |= 65536;
                    t &= -t;
                    u.lanes |= t;
                    var V = Tp(u, h, t);
                    Jd(u, V);
                    break e;
                  }
              }
              u = u.return;
            } while (u !== null);
          }
          sm(n);
        } catch (re) {
          t = re;
          if (je === n && n !== null) {
            je = n = n.return;
          }
          continue;
        }
        break;
      } while (true);
    }
    function om() {
      var e = Bi.current;
      Bi.current = Di;
      if (e === null) {
        return Di;
      } else {
        return e;
      }
    }
    function ba() {
      if (Ve === 0 || Ve === 3 || Ve === 2) {
        Ve = 4;
      }
      if (Ke !== null && ((Dn & 268435455) !== 0 || (Vi & 268435455) !== 0)) {
        gn(Ke, Ge);
      }
    }
    function Gi(e, t) {
      var n = Se;
      Se |= 2;
      var s = om();
      if (Ke !== e || Ge !== t) {
        Kt = null;
        Fn(e, t);
      }
      do {
        try {
          OE();
          break;
        } catch (a) {
          rm(e, a);
        }
      } while (true);
      Ql();
      Se = n;
      Bi.current = s;
      if (je !== null) {
        throw Error(i(261));
      }
      Ke = null;
      Ge = 0;
      return Ve;
    }
    function OE() {
      while (je !== null) {
        im(je);
      }
    }
    function AE() {
      while (je !== null && !n0()) {
        im(je);
      }
    }
    function im(e) {
      var t = um(e.alternate, e, mt);
      e.memoizedProps = e.pendingProps;
      if (t === null) {
        sm(e);
      } else {
        je = t;
      }
      Ra.current = null;
    }
    function sm(e) {
      var t = e;
      do {
        var n = t.alternate;
        e = t.return;
        if ((t.flags & 32768) === 0) {
          n = kE(n, t, mt);
          if (n !== null) {
            je = n;
            return;
          }
        } else {
          n = CE(n, t);
          if (n !== null) {
            n.flags &= 32767;
            je = n;
            return;
          }
          if (e !== null) {
            e.flags |= 32768;
            e.subtreeFlags = 0;
            e.deletions = null;
          } else {
            Ve = 6;
            je = null;
            return;
          }
        }
        t = t.sibling;
        if (t !== null) {
          je = t;
          return;
        }
        je = t = e;
      } while (t !== null);
      if (Ve === 0) {
        Ve = 5;
      }
    }
    function zn(e, t, n) {
      var s = Pe;
      var a = Et.transition;
      try {
        Et.transition = null;
        Pe = 1;
        IE(e, t, n, s);
      } finally {
        Et.transition = a;
        Pe = s;
      }
      return null;
    }
    function IE(e, t, n, s) {
      do {
        hr();
      } while (mn !== null);
      if ((Se & 6) !== 0) {
        throw Error(i(327));
      }
      n = e.finishedWork;
      var a = e.finishedLanes;
      if (n === null) {
        return null;
      }
      e.finishedWork = null;
      e.finishedLanes = 0;
      if (n === e.current) {
        throw Error(i(177));
      }
      e.callbackNode = null;
      e.callbackPriority = 0;
      var u = n.lanes | n.childLanes;
      d0(e, u);
      if (e === Ke) {
        je = Ke = null;
        Ge = 0;
      }
      if (((n.subtreeFlags & 2064) !== 0 || (n.flags & 2064) !== 0) && !Wi) {
        Wi = true;
        cm(Jo, function () {
          hr();
          return null;
        });
      }
      u = (n.flags & 15990) !== 0;
      if ((n.subtreeFlags & 15990) !== 0 || u) {
        u = Et.transition;
        Et.transition = null;
        var d = Pe;
        Pe = 1;
        var h = Se;
        Se |= 4;
        Ra.current = null;
        TE(e, n);
        Xp(n, e);
        J0(bl);
        ii = !!Dl;
        bl = Dl = null;
        e.current = n;
        RE(n);
        r0();
        Se = h;
        Pe = d;
        Et.transition = u;
      } else {
        e.current = n;
      }
      if (Wi) {
        Wi = false;
        mn = e;
        Ki = a;
      }
      u = e.pendingLanes;
      if (u === 0) {
        pn = null;
      }
      s0(n.stateNode);
      ut(e, Fe());
      if (t !== null) {
        s = e.onRecoverableError;
        n = 0;
        for (; n < t.length; n++) {
          a = t[n];
          s(a.value, {
            componentStack: a.stack,
            digest: a.digest
          });
        }
      }
      if ($i) {
        $i = false;
        e = Oa;
        Oa = null;
        throw e;
      }
      if ((Ki & 1) !== 0 && e.tag !== 0) {
        hr();
      }
      u = e.pendingLanes;
      if ((u & 1) !== 0) {
        if (e === Aa) {
          mo++;
        } else {
          mo = 0;
          Aa = e;
        }
      } else {
        mo = 0;
      }
      un();
      return null;
    }
    function hr() {
      if (mn !== null) {
        var e = Gf(Ki);
        var t = Et.transition;
        var n = Pe;
        try {
          Et.transition = null;
          Pe = e < 16 ? 16 : e;
          if (mn === null) {
            var s = false;
          } else {
            e = mn;
            mn = null;
            Ki = 0;
            if ((Se & 6) !== 0) {
              throw Error(i(331));
            }
            var a = Se;
            Se |= 4;
            X = e.current;
            while (X !== null) {
              var u = X;
              var d = u.child;
              if ((X.flags & 16) !== 0) {
                var h = u.deletions;
                if (h !== null) {
                  for (var S = 0; S < h.length; S++) {
                    var A = h[S];
                    for (X = A; X !== null;) {
                      var j = X;
                      switch (j.tag) {
                        case 0:
                        case 11:
                        case 15:
                          co(8, j, u);
                      }
                      var U = j.child;
                      if (U !== null) {
                        U.return = j;
                        X = U;
                      } else {
                        while (X !== null) {
                          j = X;
                          var z = j.sibling;
                          var Q = j.return;
                          Kp(j);
                          if (j === A) {
                            X = null;
                            break;
                          }
                          if (z !== null) {
                            z.return = Q;
                            X = z;
                            break;
                          }
                          X = Q;
                        }
                      }
                    }
                  }
                  var ee = u.alternate;
                  if (ee !== null) {
                    var te = ee.child;
                    if (te !== null) {
                      ee.child = null;
                      do {
                        var ze = te.sibling;
                        te.sibling = null;
                        te = ze;
                      } while (te !== null);
                    }
                  }
                  X = u;
                }
              }
              if ((u.subtreeFlags & 2064) !== 0 && d !== null) {
                d.return = u;
                X = d;
              } else {
                e: while (X !== null) {
                  u = X;
                  if ((u.flags & 2048) !== 0) {
                    switch (u.tag) {
                      case 0:
                      case 11:
                      case 15:
                        co(9, u, u.return);
                    }
                  }
                  var R = u.sibling;
                  if (R !== null) {
                    R.return = u.return;
                    X = R;
                    break e;
                  }
                  X = u.return;
                }
              }
            }
            var x = e.current;
            for (X = x; X !== null;) {
              d = X;
              var P = d.child;
              if ((d.subtreeFlags & 2064) !== 0 && P !== null) {
                P.return = d;
                X = P;
              } else {
                e: for (d = x; X !== null;) {
                  h = X;
                  if ((h.flags & 2048) !== 0) {
                    try {
                      switch (h.tag) {
                        case 0:
                        case 11:
                        case 15:
                          Ui(9, h);
                      }
                    } catch (re) {
                      be(h, h.return, re);
                    }
                  }
                  if (h === d) {
                    X = null;
                    break e;
                  }
                  var V = h.sibling;
                  if (V !== null) {
                    V.return = h.return;
                    X = V;
                    break e;
                  }
                  X = h.return;
                }
              }
            }
            Se = a;
            un();
            if (It && typeof It.onPostCommitFiberRoot == "function") {
              try {
                It.onPostCommitFiberRoot(Zo, e);
              } catch {}
            }
            s = true;
          }
          return s;
        } finally {
          Pe = n;
          Et.transition = t;
        }
      }
      return false;
    }
    function lm(e, t, n) {
      t = fr(n, t);
      t = _p(e, t, 1);
      e = fn(e, t, 1);
      t = tt();
      if (e !== null) {
        Fr(e, 1, t);
        ut(e, t);
      }
    }
    function be(e, t, n) {
      if (e.tag === 3) {
        lm(e, e, n);
      } else {
        while (t !== null) {
          if (t.tag === 3) {
            lm(t, e, n);
            break;
          } else if (t.tag === 1) {
            var s = t.stateNode;
            if (typeof t.type.getDerivedStateFromError == "function" || typeof s.componentDidCatch == "function" && (pn === null || !pn.has(s))) {
              e = fr(n, e);
              e = Tp(t, e, 1);
              t = fn(t, e, 1);
              e = tt();
              if (t !== null) {
                Fr(t, 1, e);
                ut(t, e);
              }
              break;
            }
          }
          t = t.return;
        }
      }
    }
    function LE(e, t, n) {
      var s = e.pingCache;
      if (s !== null) {
        s.delete(t);
      }
      t = tt();
      e.pingedLanes |= e.suspendedLanes & n;
      if (Ke === e && (Ge & n) === n) {
        if (Ve === 4 || Ve === 3 && (Ge & 130023424) === Ge && Fe() - Na < 500) {
          Fn(e, 0);
        } else {
          Pa |= n;
        }
      }
      ut(e, t);
    }
    function am(e, t) {
      if (t === 0) {
        if ((e.mode & 1) === 0) {
          t = 1;
        } else {
          t = ti;
          ti <<= 1;
          if ((ti & 130023424) === 0) {
            ti = 4194304;
          }
        }
      }
      var n = tt();
      e = Vt(e, t);
      if (e !== null) {
        Fr(e, t, n);
        ut(e, n);
      }
    }
    function ME(e) {
      var t = e.memoizedState;
      var n = 0;
      if (t !== null) {
        n = t.retryLane;
      }
      am(e, n);
    }
    function DE(e, t) {
      var n = 0;
      switch (e.tag) {
        case 13:
          var s = e.stateNode;
          var a = e.memoizedState;
          if (a !== null) {
            n = a.retryLane;
          }
          break;
        case 19:
          s = e.stateNode;
          break;
        default:
          throw Error(i(314));
      }
      if (s !== null) {
        s.delete(t);
      }
      am(e, n);
    }
    var um;
    um = function (e, t, n) {
      if (e !== null) {
        if (e.memoizedProps !== t.pendingProps || it.current) {
          lt = true;
        } else {
          if ((e.lanes & n) === 0 && (t.flags & 128) === 0) {
            lt = false;
            return xE(e, t, n);
          }
          lt = (e.flags & 131072) !== 0;
        }
      } else {
        lt = false;
        if (Le && (t.flags & 1048576) !== 0) {
          Vd(t, ki, t.index);
        }
      }
      t.lanes = 0;
      switch (t.tag) {
        case 2:
          var s = t.type;
          zi(e, t);
          e = t.pendingProps;
          var a = rr(t, Xe.current);
          ur(t, n);
          a = sa(null, t, s, e, a, n);
          var u = la();
          t.flags |= 1;
          if (typeof a == "object" && a !== null && typeof a.render == "function" && a.$$typeof === undefined) {
            t.tag = 1;
            t.memoizedState = null;
            t.updateQueue = null;
            if (st(s)) {
              u = true;
              Ei(t);
            } else {
              u = false;
            }
            t.memoizedState = a.state ?? null;
            Zl(t);
            a.updater = bi;
            t.stateNode = a;
            a._reactInternals = t;
            pa(t, s, e, n);
            t = ya(null, t, s, true, u, n);
          } else {
            t.tag = 0;
            if (Le && u) {
              $l(t);
            }
            et(null, t, a, n);
            t = t.child;
          }
          return t;
        case 16:
          s = t.elementType;
          e: {
            zi(e, t);
            e = t.pendingProps;
            a = s._init;
            s = a(s._payload);
            t.type = s;
            a = t.tag = FE(s);
            e = Tt(s, e);
            switch (a) {
              case 0:
                t = ga(null, t, s, e, n);
                break e;
              case 1:
                t = Dp(null, t, s, e, n);
                break e;
              case 11:
                t = Op(null, t, s, e, n);
                break e;
              case 14:
                t = Ap(null, t, s, Tt(s.type, e), n);
                break e;
            }
            throw Error(i(306, s, ""));
          }
          return t;
        case 0:
          s = t.type;
          a = t.pendingProps;
          a = t.elementType === s ? a : Tt(s, a);
          return ga(e, t, s, a, n);
        case 1:
          s = t.type;
          a = t.pendingProps;
          a = t.elementType === s ? a : Tt(s, a);
          return Dp(e, t, s, a, n);
        case 3:
          e: {
            bp(t);
            if (e === null) {
              throw Error(i(387));
            }
            s = t.pendingProps;
            u = t.memoizedState;
            a = u.element;
            Yd(e, t);
            Ni(t, s, null, n);
            var d = t.memoizedState;
            s = d.element;
            if (u.isDehydrated) {
              u = {
                element: s,
                isDehydrated: false,
                cache: d.cache,
                pendingSuspenseBoundaries: d.pendingSuspenseBoundaries,
                transitions: d.transitions
              };
              t.updateQueue.baseState = u;
              t.memoizedState = u;
              if (t.flags & 256) {
                a = fr(Error(i(423)), t);
                t = Fp(e, t, s, n, a);
                break e;
              } else if (s !== a) {
                a = fr(Error(i(424)), t);
                t = Fp(e, t, s, n, a);
                break e;
              } else {
                pt = sn(t.stateNode.containerInfo.firstChild);
                dt = t;
                Le = true;
                _t = null;
                n = Qd(t, null, s, n);
                t.child = n;
                while (n) {
                  n.flags = n.flags & -3 | 4096;
                  n = n.sibling;
                }
              }
            } else {
              sr();
              if (s === a) {
                t = Wt(e, t, n);
                break e;
              }
              et(e, t, s, n);
            }
            t = t.child;
          }
          return t;
        case 5:
          ep(t);
          if (e === null) {
            Hl(t);
          }
          s = t.type;
          a = t.pendingProps;
          u = e !== null ? e.memoizedProps : null;
          d = a.children;
          if (Fl(s, a)) {
            d = null;
          } else if (u !== null && Fl(s, u)) {
            t.flags |= 32;
          }
          Mp(e, t);
          et(e, t, d, n);
          return t.child;
        case 6:
          if (e === null) {
            Hl(t);
          }
          return null;
        case 13:
          return zp(e, t, n);
        case 4:
          ea(t, t.stateNode.containerInfo);
          s = t.pendingProps;
          if (e === null) {
            t.child = lr(t, null, s, n);
          } else {
            et(e, t, s, n);
          }
          return t.child;
        case 11:
          s = t.type;
          a = t.pendingProps;
          a = t.elementType === s ? a : Tt(s, a);
          return Op(e, t, s, a, n);
        case 7:
          et(e, t, t.pendingProps, n);
          return t.child;
        case 8:
          et(e, t, t.pendingProps.children, n);
          return t.child;
        case 12:
          et(e, t, t.pendingProps.children, n);
          return t.child;
        case 10:
          e: {
            s = t.type._context;
            a = t.pendingProps;
            u = t.memoizedProps;
            d = a.value;
            Ne(Ti, s._currentValue);
            s._currentValue = d;
            if (u !== null) {
              if (Ct(u.value, d)) {
                if (u.children === a.children && !it.current) {
                  t = Wt(e, t, n);
                  break e;
                }
              } else {
                u = t.child;
                if (u !== null) {
                  u.return = t;
                }
                while (u !== null) {
                  var h = u.dependencies;
                  if (h !== null) {
                    d = u.child;
                    for (var S = h.firstContext; S !== null;) {
                      if (S.context === s) {
                        if (u.tag === 1) {
                          S = $t(-1, n & -n);
                          S.tag = 2;
                          var A = u.updateQueue;
                          if (A !== null) {
                            A = A.shared;
                            var j = A.pending;
                            if (j === null) {
                              S.next = S;
                            } else {
                              S.next = j.next;
                              j.next = S;
                            }
                            A.pending = S;
                          }
                        }
                        u.lanes |= n;
                        S = u.alternate;
                        if (S !== null) {
                          S.lanes |= n;
                        }
                        Yl(u.return, n, t);
                        h.lanes |= n;
                        break;
                      }
                      S = S.next;
                    }
                  } else if (u.tag === 10) {
                    d = u.type === t.type ? null : u.child;
                  } else if (u.tag === 18) {
                    d = u.return;
                    if (d === null) {
                      throw Error(i(341));
                    }
                    d.lanes |= n;
                    h = d.alternate;
                    if (h !== null) {
                      h.lanes |= n;
                    }
                    Yl(d, n, t);
                    d = u.sibling;
                  } else {
                    d = u.child;
                  }
                  if (d !== null) {
                    d.return = u;
                  } else {
                    for (d = u; d !== null;) {
                      if (d === t) {
                        d = null;
                        break;
                      }
                      u = d.sibling;
                      if (u !== null) {
                        u.return = d.return;
                        d = u;
                        break;
                      }
                      d = d.return;
                    }
                  }
                  u = d;
                }
              }
            }
            et(e, t, a.children, n);
            t = t.child;
          }
          return t;
        case 9:
          a = t.type;
          s = t.pendingProps.children;
          ur(t, n);
          a = vt(a);
          s = s(a);
          t.flags |= 1;
          et(e, t, s, n);
          return t.child;
        case 14:
          s = t.type;
          a = Tt(s, t.pendingProps);
          a = Tt(s.type, a);
          return Ap(e, t, s, a, n);
        case 15:
          return Ip(e, t, t.type, t.pendingProps, n);
        case 17:
          s = t.type;
          a = t.pendingProps;
          a = t.elementType === s ? a : Tt(s, a);
          zi(e, t);
          t.tag = 1;
          if (st(s)) {
            e = true;
            Ei(t);
          } else {
            e = false;
          }
          ur(t, n);
          kp(t, s, a);
          pa(t, s, a, n);
          return ya(null, t, s, true, e, n);
        case 19:
          return Up(e, t, n);
        case 22:
          return Lp(e, t, n);
      }
      throw Error(i(156, t.tag));
    };
    function cm(e, t) {
      return $f(e, t);
    }
    function bE(e, t, n, s) {
      this.tag = e;
      this.key = n;
      this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
      this.index = 0;
      this.ref = null;
      this.pendingProps = t;
      this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
      this.mode = s;
      this.subtreeFlags = this.flags = 0;
      this.deletions = null;
      this.childLanes = this.lanes = 0;
      this.alternate = null;
    }
    function St(e, t, n, s) {
      return new bE(e, t, n, s);
    }
    function Fa(e) {
      e = e.prototype;
      return !!e && !!e.isReactComponent;
    }
    function FE(e) {
      if (typeof e == "function") {
        if (Fa(e)) {
          return 1;
        } else {
          return 0;
        }
      }
      if (e != null) {
        e = e.$$typeof;
        if (e === _e) {
          return 11;
        }
        if (e === we) {
          return 14;
        }
      }
      return 2;
    }
    function yn(e, t) {
      var n = e.alternate;
      if (n === null) {
        n = St(e.tag, t, e.key, e.mode);
        n.elementType = e.elementType;
        n.type = e.type;
        n.stateNode = e.stateNode;
        n.alternate = e;
        e.alternate = n;
      } else {
        n.pendingProps = t;
        n.type = e.type;
        n.flags = 0;
        n.subtreeFlags = 0;
        n.deletions = null;
      }
      n.flags = e.flags & 14680064;
      n.childLanes = e.childLanes;
      n.lanes = e.lanes;
      n.child = e.child;
      n.memoizedProps = e.memoizedProps;
      n.memoizedState = e.memoizedState;
      n.updateQueue = e.updateQueue;
      t = e.dependencies;
      n.dependencies = t === null ? null : {
        lanes: t.lanes,
        firstContext: t.firstContext
      };
      n.sibling = e.sibling;
      n.index = e.index;
      n.ref = e.ref;
      return n;
    }
    function Qi(e, t, n, s, a, u) {
      var d = 2;
      s = e;
      if (typeof e == "function") {
        if (Fa(e)) {
          d = 1;
        }
      } else if (typeof e == "string") {
        d = 5;
      } else {
        e: switch (e) {
          case q:
            return jn(n.children, a, u, t);
          case $:
            d = 8;
            a |= 8;
            break;
          case de:
            e = St(12, n, t, a | 2);
            e.elementType = de;
            e.lanes = u;
            return e;
          case xe:
            e = St(13, n, t, a);
            e.elementType = xe;
            e.lanes = u;
            return e;
          case oe:
            e = St(19, n, t, a);
            e.elementType = oe;
            e.lanes = u;
            return e;
          case me:
            return Xi(n, a, u, t);
          default:
            if (typeof e == "object" && e !== null) {
              switch (e.$$typeof) {
                case ue:
                  d = 10;
                  break e;
                case Te:
                  d = 9;
                  break e;
                case _e:
                  d = 11;
                  break e;
                case we:
                  d = 14;
                  break e;
                case se:
                  d = 16;
                  s = null;
                  break e;
              }
            }
            throw Error(i(130, e == null ? e : typeof e, ""));
        }
      }
      t = St(d, n, t, a);
      t.elementType = e;
      t.type = s;
      t.lanes = u;
      return t;
    }
    function jn(e, t, n, s) {
      e = St(7, e, s, t);
      e.lanes = n;
      return e;
    }
    function Xi(e, t, n, s) {
      e = St(22, e, s, t);
      e.elementType = me;
      e.lanes = n;
      e.stateNode = {
        isHidden: false
      };
      return e;
    }
    function za(e, t, n) {
      e = St(6, e, null, t);
      e.lanes = n;
      return e;
    }
    function ja(e, t, n) {
      t = St(4, e.children !== null ? e.children : [], e.key, t);
      t.lanes = n;
      t.stateNode = {
        containerInfo: e.containerInfo,
        pendingChildren: null,
        implementation: e.implementation
      };
      return t;
    }
    function zE(e, t, n, s, a) {
      this.tag = t;
      this.containerInfo = e;
      this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
      this.timeoutHandle = -1;
      this.callbackNode = this.pendingContext = this.context = null;
      this.callbackPriority = 0;
      this.eventTimes = dl(0);
      this.expirationTimes = dl(-1);
      this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
      this.entanglements = dl(0);
      this.identifierPrefix = s;
      this.onRecoverableError = a;
      this.mutableSourceEagerHydrationData = null;
    }
    function Ua(e, t, n, s, a, u, d, h, S) {
      e = new zE(e, t, n, h, S);
      if (t === 1) {
        t = 1;
        if (u === true) {
          t |= 8;
        }
      } else {
        t = 0;
      }
      u = St(3, null, null, t);
      e.current = u;
      u.stateNode = e;
      u.memoizedState = {
        element: s,
        isDehydrated: n,
        cache: null,
        transitions: null,
        pendingSuspenseBoundaries: null
      };
      Zl(u);
      return e;
    }
    function jE(e, t, n, s = null) {
      return {
        $$typeof: W,
        key: s == null ? null : "" + s,
        children: e,
        containerInfo: t,
        implementation: n
      };
    }
    function fm(e) {
      if (!e) {
        return an;
      }
      e = e._reactInternals;
      e: {
        if (Rn(e) !== e || e.tag !== 1) {
          throw Error(i(170));
        }
        var t = e;
        do {
          switch (t.tag) {
            case 3:
              t = t.stateNode.context;
              break e;
            case 1:
              if (st(t.type)) {
                t = t.stateNode.__reactInternalMemoizedMergedChildContext;
                break e;
              }
          }
          t = t.return;
        } while (t !== null);
        throw Error(i(171));
      }
      if (e.tag === 1) {
        var n = e.type;
        if (st(n)) {
          return jd(e, n, t);
        }
      }
      return t;
    }
    function dm(e, t, n, s, a, u, d, h, S) {
      e = Ua(n, s, true, e, a, u, d, h, S);
      e.context = fm(null);
      n = e.current;
      s = tt();
      a = hn(n);
      u = $t(s, a);
      u.callback = t ?? null;
      fn(n, u, a);
      e.current.lanes = a;
      Fr(e, a, s);
      ut(e, s);
      return e;
    }
    function Yi(e, t, n, s) {
      var a = t.current;
      var u = tt();
      var d = hn(a);
      n = fm(n);
      if (t.context === null) {
        t.context = n;
      } else {
        t.pendingContext = n;
      }
      t = $t(u, d);
      t.payload = {
        element: e
      };
      s = s === undefined ? null : s;
      if (s !== null) {
        t.callback = s;
      }
      e = fn(a, t, d);
      if (e !== null) {
        Nt(e, a, d, u);
        Pi(e, a, d);
      }
      return d;
    }
    function Ji(e) {
      e = e.current;
      if (e.child) {
        e.child.tag === 5;
        return e.child.stateNode;
      } else {
        return null;
      }
    }
    function pm(e, t) {
      e = e.memoizedState;
      if (e !== null && e.dehydrated !== null) {
        var n = e.retryLane;
        e.retryLane = n !== 0 && n < t ? n : t;
      }
    }
    function Ba(e, t) {
      pm(e, t);
      if (e = e.alternate) {
        pm(e, t);
      }
    }
    function UE() {
      return null;
    }
    var mm = typeof reportError == "function" ? reportError : function (e) {
      console.error(e);
    };
    function Va(e) {
      this._internalRoot = e;
    }
    Zi.prototype.render = Va.prototype.render = function (e) {
      var t = this._internalRoot;
      if (t === null) {
        throw Error(i(409));
      }
      Yi(e, t, null, null);
    };
    Zi.prototype.unmount = Va.prototype.unmount = function () {
      var e = this._internalRoot;
      if (e !== null) {
        this._internalRoot = null;
        var t = e.containerInfo;
        bn(function () {
          Yi(null, e, null, null);
        });
        t[zt] = null;
      }
    };
    function Zi(e) {
      this._internalRoot = e;
    }
    Zi.prototype.unstable_scheduleHydration = function (e) {
      if (e) {
        var t = Yf();
        e = {
          blockedOn: null,
          target: e,
          priority: t
        };
        for (var n = 0; n < nn.length && t !== 0 && t < nn[n].priority; n++);
        nn.splice(n, 0, e);
        if (n === 0) {
          ed(e);
        }
      }
    };
    function $a(e) {
      return !!e && (e.nodeType === 1 || e.nodeType === 9 || e.nodeType === 11);
    }
    function es(e) {
      return !!e && (e.nodeType === 1 || e.nodeType === 9 || e.nodeType === 11 || e.nodeType === 8 && e.nodeValue === " react-mount-point-unstable ");
    }
    function hm() {}
    function BE(e, t, n, s, a) {
      if (a) {
        if (typeof s == "function") {
          var u = s;
          s = function () {
            var A = Ji(d);
            u.call(A);
          };
        }
        var d = dm(t, s, e, 0, null, false, false, "", hm);
        e._reactRootContainer = d;
        e[zt] = d.current;
        Yr(e.nodeType === 8 ? e.parentNode : e);
        bn();
        return d;
      }
      while (a = e.lastChild) {
        e.removeChild(a);
      }
      if (typeof s == "function") {
        var h = s;
        s = function () {
          var A = Ji(S);
          h.call(A);
        };
      }
      var S = Ua(e, 0, false, null, null, false, false, "", hm);
      e._reactRootContainer = S;
      e[zt] = S.current;
      Yr(e.nodeType === 8 ? e.parentNode : e);
      bn(function () {
        Yi(t, S, n, s);
      });
      return S;
    }
    function ts(e, t, n, s, a) {
      var u = n._reactRootContainer;
      if (u) {
        var d = u;
        if (typeof a == "function") {
          var h = a;
          a = function () {
            var S = Ji(d);
            h.call(S);
          };
        }
        Yi(t, d, e, a);
      } else {
        d = BE(n, t, e, a, s);
      }
      return Ji(d);
    }
    Qf = function (e) {
      switch (e.tag) {
        case 3:
          var t = e.stateNode;
          if (t.current.memoizedState.isDehydrated) {
            var n = br(t.pendingLanes);
            if (n !== 0) {
              pl(t, n | 1);
              ut(t, Fe());
              if ((Se & 6) === 0) {
                mr = Fe() + 500;
                un();
              }
            }
          }
          break;
        case 13:
          bn(function () {
            var s = Vt(e, 1);
            if (s !== null) {
              var a = tt();
              Nt(s, e, 1, a);
            }
          });
          Ba(e, 1);
      }
    };
    ml = function (e) {
      if (e.tag === 13) {
        var t = Vt(e, 134217728);
        if (t !== null) {
          var n = tt();
          Nt(t, e, 134217728, n);
        }
        Ba(e, 134217728);
      }
    };
    Xf = function (e) {
      if (e.tag === 13) {
        var t = hn(e);
        var n = Vt(e, t);
        if (n !== null) {
          var s = tt();
          Nt(n, e, t, s);
        }
        Ba(e, t);
      }
    };
    Yf = function () {
      return Pe;
    };
    Jf = function (e, t) {
      var n = Pe;
      try {
        Pe = e;
        return t();
      } finally {
        Pe = n;
      }
    };
    sl = function (e, t, n) {
      switch (t) {
        case "input":
          Js(e, n);
          t = n.name;
          if (n.type === "radio" && t != null) {
            for (n = e; n.parentNode;) {
              n = n.parentNode;
            }
            n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + "][type=\"radio\"]");
            t = 0;
            for (; t < n.length; t++) {
              var s = n[t];
              if (s !== e && s.form === e.form) {
                var a = vi(s);
                if (!a) {
                  throw Error(i(90));
                }
                Tn(s);
                Js(s, a);
              }
            }
          }
          break;
        case "textarea":
          Rf(e, n);
          break;
        case "select":
          t = n.value;
          if (t != null) {
            Kn(e, !!n.multiple, t, false);
          }
      }
    };
    bf = Ma;
    Ff = bn;
    var VE = {
      usingClientEntryPoint: false,
      Events: [eo, tr, vi, Mf, Df, Ma]
    };
    var ho = {
      findFiberByHostInstance: Pn,
      bundleType: 0,
      version: "18.3.1",
      rendererPackageName: "react-dom"
    };
    var $E = {
      bundleType: ho.bundleType,
      version: ho.version,
      rendererPackageName: ho.rendererPackageName,
      rendererConfig: ho.rendererConfig,
      overrideHookState: null,
      overrideHookStateDeletePath: null,
      overrideHookStateRenamePath: null,
      overrideProps: null,
      overridePropsDeletePath: null,
      overridePropsRenamePath: null,
      setErrorHandler: null,
      setSuspenseHandler: null,
      scheduleUpdate: null,
      currentDispatcherRef: D.ReactCurrentDispatcher,
      findHostInstanceByFiber: function (e) {
        e = Bf(e);
        if (e === null) {
          return null;
        } else {
          return e.stateNode;
        }
      },
      findFiberByHostInstance: ho.findFiberByHostInstance || UE,
      findHostInstancesForRefresh: null,
      scheduleRefresh: null,
      scheduleRoot: null,
      setRefreshHandler: null,
      getCurrentFiber: null,
      reconcilerVersion: "18.3.1-next-f1338f8080-20240426"
    };
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined") {
      var ns = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!ns.isDisabled && ns.supportsFiber) {
        try {
          Zo = ns.inject($E);
          It = ns;
        } catch {}
      }
    }
    nt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = VE;
    nt.createPortal = function (e, t, n = null) {
      if (!$a(t)) {
        throw Error(i(200));
      }
      return jE(e, t, null, n);
    };
    nt.createRoot = function (e, t) {
      if (!$a(e)) {
        throw Error(i(299));
      }
      var n = false;
      var s = "";
      var a = mm;
      if (t != null) {
        if (t.unstable_strictMode === true) {
          n = true;
        }
        if (t.identifierPrefix !== undefined) {
          s = t.identifierPrefix;
        }
        if (t.onRecoverableError !== undefined) {
          a = t.onRecoverableError;
        }
      }
      t = Ua(e, 1, false, null, null, n, false, s, a);
      e[zt] = t.current;
      Yr(e.nodeType === 8 ? e.parentNode : e);
      return new Va(t);
    };
    nt.findDOMNode = function (e) {
      if (e == null) {
        return null;
      }
      if (e.nodeType === 1) {
        return e;
      }
      var t = e._reactInternals;
      if (t === undefined) {
        throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
      }
      e = Bf(t);
      e = e === null ? null : e.stateNode;
      return e;
    };
    nt.flushSync = function (e) {
      return bn(e);
    };
    nt.hydrate = function (e, t, n) {
      if (!es(t)) {
        throw Error(i(200));
      }
      return ts(null, e, t, true, n);
    };
    nt.hydrateRoot = function (e, t, n) {
      if (!$a(e)) {
        throw Error(i(405));
      }
      var s = n != null && n.hydratedSources || null;
      var a = false;
      var u = "";
      var d = mm;
      if (n != null) {
        if (n.unstable_strictMode === true) {
          a = true;
        }
        if (n.identifierPrefix !== undefined) {
          u = n.identifierPrefix;
        }
        if (n.onRecoverableError !== undefined) {
          d = n.onRecoverableError;
        }
      }
      t = dm(t, null, e, 1, n ?? null, a, false, u, d);
      e[zt] = t.current;
      Yr(e);
      if (s) {
        for (e = 0; e < s.length; e++) {
          n = s[e];
          a = n._getVersion;
          a = a(n._source);
          if (t.mutableSourceEagerHydrationData == null) {
            t.mutableSourceEagerHydrationData = [n, a];
          } else {
            t.mutableSourceEagerHydrationData.push(n, a);
          }
        }
      }
      return new Zi(t);
    };
    nt.render = function (e, t, n) {
      if (!es(t)) {
        throw Error(i(200));
      }
      return ts(null, e, t, false, n);
    };
    nt.unmountComponentAtNode = function (e) {
      if (!es(e)) {
        throw Error(i(40));
      }
      if (e._reactRootContainer) {
        bn(function () {
          ts(null, null, e, false, function () {
            e._reactRootContainer = null;
            e[zt] = null;
          });
        });
        return true;
      } else {
        return false;
      }
    };
    nt.unstable_batchedUpdates = Ma;
    nt.unstable_renderSubtreeIntoContainer = function (e, t, n, s) {
      if (!es(n)) {
        throw Error(i(200));
      }
      if (e == null || e._reactInternals === undefined) {
        throw Error(i(38));
      }
      return ts(e, t, n, false, s);
    };
    nt.version = "18.3.1-next-f1338f8080-20240426";
    return nt;
  }
  var tu;
  function nu() {
    if (tu) {
      return fs.exports;
    }
    tu = 1;
    function r() {
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") {
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(r);
        } catch (o) {
          console.error(o);
        }
      }
    }
    r();
    fs.exports = Vm();
    return fs.exports;
  }
  var ru;
  function $m() {
    if (ru) {
      return yo;
    }
    ru = 1;
    var r = nu();
    yo.createRoot = r.createRoot;
    yo.hydrateRoot = r.hydrateRoot;
    return yo;
  }
  var Wm = $m();
  const Km = ls(Wm);
  const ou = {
    version: "3.37.0"
  }.version;
  const iu = "https://dotb.io/api";
  const Hm = ["https://cdn.dotb.io/"];
  const qm = "https://dotb-storage.s3.eu-central-003.backblazeb2.com/";
  const Gm = "https://images1.vinted.net/";
  const Qm = ["at", "be", "cz", "de", "dk", "es", "fi", "fr", "gr", "hr", "hu", "ie", "it", "lt", "lu", "nl", "pl", "pt", "ro", "se", "sk", "co.uk", "com", "ee", "lv", "si"];
  var su = Object.prototype.hasOwnProperty;
  function ms(r, o) {
    var i;
    var l;
    if (r === o) {
      return true;
    }
    if (r && o && (i = r.constructor) === o.constructor) {
      if (i === Date) {
        return r.getTime() === o.getTime();
      }
      if (i === RegExp) {
        return r.toString() === o.toString();
      }
      if (i === Array) {
        if ((l = r.length) === o.length) {
          while (l-- && ms(r[l], o[l]));
        }
        return l === -1;
      }
      if (!i || typeof r == "object") {
        l = 0;
        for (i in r) {
          if (su.call(r, i) && ++l && !su.call(o, i) || !(i in o) || !ms(r[i], o[i])) {
            return false;
          }
        }
        return Object.keys(o).length === l;
      }
    }
    return r !== r && o !== o;
  }
  const Xm = new Error("request for lock canceled");
  function Ym(r, o, i, l) {
    function c(f) {
      if (f instanceof i) {
        return f;
      } else {
        return new i(function (p) {
          p(f);
        });
      }
    }
    return new (i ||= Promise)(function (f, p) {
      function m(g) {
        try {
          v(l.next(g));
        } catch (T) {
          p(T);
        }
      }
      function w(g) {
        try {
          v(l.throw(g));
        } catch (T) {
          p(T);
        }
      }
      function v(g) {
        if (g.done) {
          f(g.value);
        } else {
          c(g.value).then(m, w);
        }
      }
      v((l = l.apply(r, o || [])).next());
    });
  }
  class Jm {
    constructor(o, i = Xm) {
      this._value = o;
      this._cancelError = i;
      this._queue = [];
      this._weightedWaiters = [];
    }
    acquire(o = 1, i = 0) {
      if (o <= 0) {
        throw new Error(`invalid weight ${o}: must be positive`);
      }
      return new Promise((l, c) => {
        const f = {
          resolve: l,
          reject: c,
          weight: o,
          priority: i
        };
        const p = lu(this._queue, m => i <= m.priority);
        if (p === -1 && o <= this._value) {
          this._dispatchItem(f);
        } else {
          this._queue.splice(p + 1, 0, f);
        }
      });
    }
    runExclusive(o) {
      return Ym(this, arguments, undefined, function* (i, l = 1, c = 0) {
        const [f, p] = yield this.acquire(l, c);
        try {
          return yield i(f);
        } finally {
          p();
        }
      });
    }
    waitForUnlock(o = 1, i = 0) {
      if (o <= 0) {
        throw new Error(`invalid weight ${o}: must be positive`);
      }
      if (this._couldLockImmediately(o, i)) {
        return Promise.resolve();
      } else {
        return new Promise(l => {
          this._weightedWaiters[o - 1] ||= [];
          Zm(this._weightedWaiters[o - 1], {
            resolve: l,
            priority: i
          });
        });
      }
    }
    isLocked() {
      return this._value <= 0;
    }
    getValue() {
      return this._value;
    }
    setValue(o) {
      this._value = o;
      this._dispatchQueue();
    }
    release(o = 1) {
      if (o <= 0) {
        throw new Error(`invalid weight ${o}: must be positive`);
      }
      this._value += o;
      this._dispatchQueue();
    }
    cancel() {
      this._queue.forEach(o => o.reject(this._cancelError));
      this._queue = [];
    }
    _dispatchQueue() {
      for (this._drainUnlockWaiters(); this._queue.length > 0 && this._queue[0].weight <= this._value;) {
        this._dispatchItem(this._queue.shift());
        this._drainUnlockWaiters();
      }
    }
    _dispatchItem(o) {
      const i = this._value;
      this._value -= o.weight;
      o.resolve([i, this._newReleaser(o.weight)]);
    }
    _newReleaser(o) {
      let i = false;
      return () => {
        if (!i) {
          i = true;
          this.release(o);
        }
      };
    }
    _drainUnlockWaiters() {
      if (this._queue.length === 0) {
        for (let o = this._value; o > 0; o--) {
          const i = this._weightedWaiters[o - 1];
          if (i) {
            i.forEach(l => l.resolve());
            this._weightedWaiters[o - 1] = [];
          }
        }
      } else {
        const o = this._queue[0].priority;
        for (let i = this._value; i > 0; i--) {
          const l = this._weightedWaiters[i - 1];
          if (!l) {
            continue;
          }
          const c = l.findIndex(f => f.priority <= o);
          (c === -1 ? l : l.splice(0, c)).forEach(f => f.resolve());
        }
      }
    }
    _couldLockImmediately(o, i) {
      return (this._queue.length === 0 || this._queue[0].priority < i) && o <= this._value;
    }
  }
  function Zm(r, o) {
    const i = lu(r, l => o.priority <= l.priority);
    r.splice(i + 1, 0, o);
  }
  function lu(r, o) {
    for (let i = r.length - 1; i >= 0; i--) {
      if (o(r[i])) {
        return i;
      }
    }
    return -1;
  }
  function eh(r, o, i, l) {
    function c(f) {
      if (f instanceof i) {
        return f;
      } else {
        return new i(function (p) {
          p(f);
        });
      }
    }
    return new (i ||= Promise)(function (f, p) {
      function m(g) {
        try {
          v(l.next(g));
        } catch (T) {
          p(T);
        }
      }
      function w(g) {
        try {
          v(l.throw(g));
        } catch (T) {
          p(T);
        }
      }
      function v(g) {
        if (g.done) {
          f(g.value);
        } else {
          c(g.value).then(m, w);
        }
      }
      v((l = l.apply(r, o || [])).next());
    });
  }
  class th {
    constructor(o) {
      this._semaphore = new Jm(1, o);
    }
    acquire() {
      return eh(this, arguments, undefined, function* (o = 0) {
        const [, i] = yield this._semaphore.acquire(1, o);
        return i;
      });
    }
    runExclusive(o, i = 0) {
      return this._semaphore.runExclusive(() => o(), 1, i);
    }
    isLocked() {
      return this._semaphore.isLocked();
    }
    waitForUnlock(o = 0) {
      return this._semaphore.waitForUnlock(1, o);
    }
    release() {
      if (this._semaphore.isLocked()) {
        this._semaphore.release();
      }
    }
    cancel() {
      return this._semaphore.cancel();
    }
  }
  const vo = globalThis.browser?.runtime?.id == null ? globalThis.chrome : globalThis.browser;
  const Ot = nh();
  function nh() {
    const r = {
      local: wo("local"),
      session: wo("session"),
      sync: wo("sync"),
      managed: wo("managed")
    };
    const o = E => {
      const y = r[E];
      if (y == null) {
        const _ = Object.keys(r).join(", ");
        throw Error(`Invalid area "${E}". Options: ${_}`);
      }
      return y;
    };
    const i = E => {
      const y = E.indexOf(":");
      const _ = E.substring(0, y);
      const N = E.substring(y + 1);
      if (N == null) {
        throw Error(`Storage key should be in the form of "area:key", but received "${E}"`);
      }
      return {
        driverArea: _,
        driverKey: N,
        driver: o(_)
      };
    };
    const l = E => E + "$";
    const c = (E, y) => {
      const _ = {
        ...E
      };
      Object.entries(y).forEach(([N, b]) => {
        if (b == null) {
          delete _[N];
        } else {
          _[N] = b;
        }
      });
      return _;
    };
    const f = (E, y) => E ?? y ?? null;
    const p = E => typeof E == "object" && !Array.isArray(E) ? E : {};
    const m = async (E, y, _) => {
      const N = await E.getItem(y);
      return f(N, _?.fallback ?? _?.defaultValue);
    };
    const w = async (E, y) => {
      const _ = l(y);
      const N = await E.getItem(_);
      return p(N);
    };
    const v = async (E, y, _) => {
      await E.setItem(y, _ ?? null);
    };
    const g = async (E, y, _) => {
      const N = l(y);
      const b = p(await E.getItem(N));
      await E.setItem(N, c(b, _));
    };
    const T = async (E, y, _) => {
      await E.removeItem(y);
      if (_?.removeMeta) {
        const N = l(y);
        await E.removeItem(N);
      }
    };
    const L = async (E, y, _) => {
      const N = l(y);
      if (_ == null) {
        await E.removeItem(N);
      } else {
        const b = p(await E.getItem(N));
        [_].flat().forEach(D => delete b[D]);
        await E.setItem(N, b);
      }
    };
    const B = (E, y, _) => E.watch(y, _);
    return {
      getItem: async (E, y) => {
        const {
          driver: _,
          driverKey: N
        } = i(E);
        return await m(_, N, y);
      },
      getItems: async E => {
        const y = new Map();
        const _ = new Map();
        const N = [];
        E.forEach(D => {
          let H;
          let W;
          if (typeof D == "string") {
            H = D;
          } else if ("getValue" in D) {
            H = D.key;
            W = {
              fallback: D.fallback
            };
          } else {
            H = D.key;
            W = D.options;
          }
          N.push(H);
          const {
            driverArea: q,
            driverKey: $
          } = i(H);
          const de = y.get(q) ?? [];
          y.set(q, de.concat($));
          _.set(H, W);
        });
        const b = new Map();
        await Promise.all(Array.from(y.entries()).map(async ([D, H]) => {
          (await r[D].getItems(H)).forEach(q => {
            const $ = `${D}:${q.key}`;
            const de = _.get($);
            const ue = f(q.value, de?.fallback ?? de?.defaultValue);
            b.set($, ue);
          });
        }));
        return N.map(D => ({
          key: D,
          value: b.get(D)
        }));
      },
      getMeta: async E => {
        const {
          driver: y,
          driverKey: _
        } = i(E);
        return await w(y, _);
      },
      getMetas: async E => {
        const y = E.map(b => {
          const D = typeof b == "string" ? b : b.key;
          const {
            driverArea: H,
            driverKey: W
          } = i(D);
          return {
            key: D,
            driverArea: H,
            driverKey: W,
            driverMetaKey: l(W)
          };
        });
        const _ = y.reduce((b, D) => {
          b[D.driverArea] ??= [];
          b[D.driverArea].push(D);
          return b;
        }, {});
        const N = {};
        await Promise.all(Object.entries(_).map(async ([b, D]) => {
          const H = await vo.storage[b].get(D.map(W => W.driverMetaKey));
          D.forEach(W => {
            N[W.key] = H[W.driverMetaKey] ?? {};
          });
        }));
        return y.map(b => ({
          key: b.key,
          meta: N[b.key]
        }));
      },
      setItem: async (E, y) => {
        const {
          driver: _,
          driverKey: N
        } = i(E);
        await v(_, N, y);
      },
      setItems: async E => {
        const y = {};
        E.forEach(_ => {
          const {
            driverArea: N,
            driverKey: b
          } = i("key" in _ ? _.key : _.item.key);
          y[N] ??= [];
          y[N].push({
            key: b,
            value: _.value
          });
        });
        await Promise.all(Object.entries(y).map(async ([_, N]) => {
          await o(_).setItems(N);
        }));
      },
      setMeta: async (E, y) => {
        const {
          driver: _,
          driverKey: N
        } = i(E);
        await g(_, N, y);
      },
      setMetas: async E => {
        const y = {};
        E.forEach(_ => {
          const {
            driverArea: N,
            driverKey: b
          } = i("key" in _ ? _.key : _.item.key);
          y[N] ??= [];
          y[N].push({
            key: b,
            properties: _.meta
          });
        });
        await Promise.all(Object.entries(y).map(async ([_, N]) => {
          const b = o(_);
          const D = N.map(({
            key: $
          }) => l($));
          console.log(_, D);
          const H = await b.getItems(D);
          const W = Object.fromEntries(H.map(({
            key: $,
            value: de
          }) => [$, p(de)]));
          const q = N.map(({
            key: $,
            properties: de
          }) => {
            const ue = l($);
            return {
              key: ue,
              value: c(W[ue] ?? {}, de)
            };
          });
          await b.setItems(q);
        }));
      },
      removeItem: async (E, y) => {
        const {
          driver: _,
          driverKey: N
        } = i(E);
        await T(_, N, y);
      },
      removeItems: async E => {
        const y = {};
        E.forEach(_ => {
          let N;
          let b;
          if (typeof _ == "string") {
            N = _;
          } else if ("getValue" in _) {
            N = _.key;
          } else if ("item" in _) {
            N = _.item.key;
            b = _.options;
          } else {
            N = _.key;
            b = _.options;
          }
          const {
            driverArea: D,
            driverKey: H
          } = i(N);
          y[D] ??= [];
          y[D].push(H);
          if (b?.removeMeta) {
            y[D].push(l(H));
          }
        });
        await Promise.all(Object.entries(y).map(async ([_, N]) => {
          await o(_).removeItems(N);
        }));
      },
      clear: async E => {
        await o(E).clear();
      },
      removeMeta: async (E, y) => {
        const {
          driver: _,
          driverKey: N
        } = i(E);
        await L(_, N, y);
      },
      snapshot: async (E, y) => {
        const N = await o(E).snapshot();
        y?.excludeKeys?.forEach(b => {
          delete N[b];
          delete N[l(b)];
        });
        return N;
      },
      restoreSnapshot: async (E, y) => {
        await o(E).restoreSnapshot(y);
      },
      watch: (E, y) => {
        const {
          driver: _,
          driverKey: N
        } = i(E);
        return B(_, N, y);
      },
      unwatch() {
        Object.values(r).forEach(E => {
          E.unwatch();
        });
      },
      defineItem: (E, y) => {
        const {
          driver: _,
          driverKey: N
        } = i(E);
        const {
          version: b = 1,
          migrations: D = {}
        } = y ?? {};
        if (b < 1) {
          throw Error("Storage item version cannot be less than 1. Initial versions should be set to 1, not 0.");
        }
        const H = async () => {
          const ue = l(N);
          const [{
            value: Te
          }, {
            value: _e
          }] = await _.getItems([N, ue]);
          if (Te == null) {
            return;
          }
          const xe = _e?.v ?? 1;
          if (xe > b) {
            throw Error(`Version downgrade detected (v${xe} -> v${b}) for "${E}"`);
          }
          if (xe === b) {
            return;
          }
          console.debug(`[@wxt-dev/storage] Running storage migration for ${E}: v${xe} -> v${b}`);
          const oe = Array.from({
            length: b - xe
          }, (se, me) => xe + me + 1);
          let we = Te;
          for (const se of oe) {
            try {
              we = (await D?.[se]?.(we)) ?? we;
            } catch (me) {
              throw new rh(E, se, {
                cause: me
              });
            }
          }
          await _.setItems([{
            key: N,
            value: we
          }, {
            key: ue,
            value: {
              ..._e,
              v: b
            }
          }]);
          console.debug(`[@wxt-dev/storage] Storage migration completed for ${E} v${b}`, {
            migratedValue: we
          });
        };
        const W = y?.migrations == null ? Promise.resolve() : H().catch(ue => {
          console.error(`[@wxt-dev/storage] Migration failed for ${E}`, ue);
        });
        const q = new th();
        const $ = () => y?.fallback ?? y?.defaultValue ?? null;
        const de = () => q.runExclusive(async () => {
          const ue = await _.getItem(N);
          if (ue != null || y?.init == null) {
            return ue;
          }
          const Te = await y.init();
          await _.setItem(N, Te);
          return Te;
        });
        W.then(de);
        return {
          key: E,
          get defaultValue() {
            return $();
          },
          get fallback() {
            return $();
          },
          getValue: async () => {
            await W;
            if (y?.init) {
              return await de();
            } else {
              return await m(_, N, y);
            }
          },
          getMeta: async () => {
            await W;
            return await w(_, N);
          },
          setValue: async ue => {
            await W;
            return await v(_, N, ue);
          },
          setMeta: async ue => {
            await W;
            return await g(_, N, ue);
          },
          removeValue: async ue => {
            await W;
            return await T(_, N, ue);
          },
          removeMeta: async ue => {
            await W;
            return await L(_, N, ue);
          },
          watch: ue => B(_, N, (Te, _e) => ue(Te ?? $(), _e ?? $())),
          migrate: H
        };
      }
    };
  }
  function wo(r) {
    const o = () => {
      if (vo.runtime == null) {
        throw Error(["'wxt/storage' must be loaded in a web extension environment", `
 - If thrown during a build, see https://github.com/wxt-dev/wxt/issues/371`, ` - If thrown during tests, mock 'wxt/browser' correctly. See https://wxt.dev/guide/go-further/testing.html
`].join(`
`));
      }
      if (vo.storage == null) {
        throw Error("You must add the 'storage' permission to your manifest to use 'wxt/storage'");
      }
      const l = vo.storage[r];
      if (l == null) {
        throw Error(`"browser.storage.${r}" is undefined`);
      }
      return l;
    };
    const i = new Set();
    return {
      getItem: async l => (await o().get(l))[l],
      getItems: async l => {
        const c = await o().get(l);
        return l.map(f => ({
          key: f,
          value: c[f] ?? null
        }));
      },
      setItem: async (l, c) => {
        if (c == null) {
          await o().remove(l);
        } else {
          await o().set({
            [l]: c
          });
        }
      },
      setItems: async l => {
        const c = l.reduce((f, {
          key: p,
          value: m
        }) => {
          f[p] = m;
          return f;
        }, {});
        await o().set(c);
      },
      removeItem: async l => {
        await o().remove(l);
      },
      removeItems: async l => {
        await o().remove(l);
      },
      clear: async () => {
        await o().clear();
      },
      snapshot: async () => await o().get(),
      restoreSnapshot: async l => {
        await o().set(l);
      },
      watch(l, c) {
        const f = p => {
          const m = p[l];
          if (m != null) {
            if (!ms(m.newValue, m.oldValue)) {
              c(m.newValue ?? null, m.oldValue ?? null);
            }
          }
        };
        o().onChanged.addListener(f);
        i.add(f);
        return () => {
          o().onChanged.removeListener(f);
          i.delete(f);
        };
      },
      unwatch() {
        i.forEach(l => {
          o().onChanged.removeListener(l);
        });
        i.clear();
      }
    };
  }
  class rh extends Error {
    constructor(o, i, l) {
      super(`v${i} migration failed for "${o}"`, l);
      this.key = o;
      this.version = i;
    }
  }
  function au(r, o) {
    return function () {
      return r.apply(o, arguments);
    };
  }
  const {
    toString: oh
  } = Object.prototype;
  const {
    getPrototypeOf: hs
  } = Object;
  const {
    iterator: Eo,
    toStringTag: uu
  } = Symbol;
  const So = (r => o => {
    const i = oh.call(o);
    return r[i] ||= i.slice(8, -1).toLowerCase();
  })(Object.create(null));
  const xt = r => {
    r = r.toLowerCase();
    return o => So(o) === r;
  };
  const xo = r => o => typeof o === r;
  const {
    isArray: Un
  } = Array;
  const Bn = xo("undefined");
  function yr(r) {
    return r !== null && !Bn(r) && r.constructor !== null && !Bn(r.constructor) && rt(r.constructor.isBuffer) && r.constructor.isBuffer(r);
  }
  const cu = xt("ArrayBuffer");
  function ih(r) {
    let o;
    if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
      o = ArrayBuffer.isView(r);
    } else {
      o = r && r.buffer && cu(r.buffer);
    }
    return o;
  }
  const sh = xo("string");
  const rt = xo("function");
  const fu = xo("number");
  const vr = r => r !== null && typeof r == "object";
  const lh = r => r === true || r === false;
  const ko = r => {
    if (So(r) !== "object") {
      return false;
    }
    const o = hs(r);
    return (o === null || o === Object.prototype || Object.getPrototypeOf(o) === null) && !(uu in r) && !(Eo in r);
  };
  const ah = r => {
    if (!vr(r) || yr(r)) {
      return false;
    }
    try {
      return Object.keys(r).length === 0 && Object.getPrototypeOf(r) === Object.prototype;
    } catch {
      return false;
    }
  };
  const uh = xt("Date");
  const ch = xt("File");
  const fh = xt("Blob");
  const dh = xt("FileList");
  const ph = r => vr(r) && rt(r.pipe);
  const mh = r => {
    let o;
    return r && (typeof FormData == "function" && r instanceof FormData || rt(r.append) && ((o = So(r)) === "formdata" || o === "object" && rt(r.toString) && r.toString() === "[object FormData]"));
  };
  const hh = xt("URLSearchParams");
  const [gh, yh, vh, wh] = ["ReadableStream", "Request", "Response", "Headers"].map(xt);
  const Eh = r => r.trim ? r.trim() : r.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
  function wr(r, o, {
    allOwnKeys: i = false
  } = {}) {
    if (r === null || typeof r === "undefined") {
      return;
    }
    let l;
    let c;
    if (typeof r != "object") {
      r = [r];
    }
    if (Un(r)) {
      l = 0;
      c = r.length;
      for (; l < c; l++) {
        o.call(null, r[l], l, r);
      }
    } else {
      if (yr(r)) {
        return;
      }
      const f = i ? Object.getOwnPropertyNames(r) : Object.keys(r);
      const p = f.length;
      let m;
      for (l = 0; l < p; l++) {
        m = f[l];
        o.call(null, r[m], m, r);
      }
    }
  }
  function du(r, o) {
    if (yr(r)) {
      return null;
    }
    o = o.toLowerCase();
    const i = Object.keys(r);
    let l = i.length;
    let c;
    while (l-- > 0) {
      c = i[l];
      if (o === c.toLowerCase()) {
        return c;
      }
    }
    return null;
  }
  const wn = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
  const pu = r => !Bn(r) && r !== wn;
  function gs() {
    const {
      caseless: r,
      skipUndefined: o
    } = pu(this) && this || {};
    const i = {};
    const l = (c, f) => {
      if (f === "__proto__" || f === "constructor" || f === "prototype") {
        return;
      }
      const p = r && du(i, f) || f;
      if (ko(i[p]) && ko(c)) {
        i[p] = gs(i[p], c);
      } else if (ko(c)) {
        i[p] = gs({}, c);
      } else if (Un(c)) {
        i[p] = c.slice();
      } else if (!o || !Bn(c)) {
        i[p] = c;
      }
    };
    for (let c = 0, f = arguments.length; c < f; c++) {
      if (arguments[c]) {
        wr(arguments[c], l);
      }
    }
    return i;
  }
  const Sh = (r, o, i, {
    allOwnKeys: l
  } = {}) => {
    wr(o, (c, f) => {
      if (i && rt(c)) {
        Object.defineProperty(r, f, {
          value: au(c, i),
          writable: true,
          enumerable: true,
          configurable: true
        });
      } else {
        Object.defineProperty(r, f, {
          value: c,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    }, {
      allOwnKeys: l
    });
    return r;
  };
  const xh = r => {
    if (r.charCodeAt(0) === 65279) {
      r = r.slice(1);
    }
    return r;
  };
  const kh = (r, o, i, l) => {
    r.prototype = Object.create(o.prototype, l);
    Object.defineProperty(r.prototype, "constructor", {
      value: r,
      writable: true,
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(r, "super", {
      value: o.prototype
    });
    if (i) {
      Object.assign(r.prototype, i);
    }
  };
  const Ch = (r, o, i, l) => {
    let c;
    let f;
    let p;
    const m = {};
    o = o || {};
    if (r == null) {
      return o;
    }
    do {
      c = Object.getOwnPropertyNames(r);
      f = c.length;
      while (f-- > 0) {
        p = c[f];
        if ((!l || l(p, r, o)) && !m[p]) {
          o[p] = r[p];
          m[p] = true;
        }
      }
      r = i !== false && hs(r);
    } while (r && (!i || i(r, o)) && r !== Object.prototype);
    return o;
  };
  const _h = (r, o, i) => {
    r = String(r);
    if (i === undefined || i > r.length) {
      i = r.length;
    }
    i -= o.length;
    const l = r.indexOf(o, i);
    return l !== -1 && l === i;
  };
  const Th = r => {
    if (!r) {
      return null;
    }
    if (Un(r)) {
      return r;
    }
    let o = r.length;
    if (!fu(o)) {
      return null;
    }
    const i = new Array(o);
    while (o-- > 0) {
      i[o] = r[o];
    }
    return i;
  };
  const Rh = (r => o => r && o instanceof r)(typeof Uint8Array !== "undefined" && hs(Uint8Array));
  const Ph = (r, o) => {
    const l = (r && r[Eo]).call(r);
    let c;
    while ((c = l.next()) && !c.done) {
      const f = c.value;
      o.call(r, f[0], f[1]);
    }
  };
  const Nh = (r, o) => {
    let i;
    const l = [];
    while ((i = r.exec(o)) !== null) {
      l.push(i);
    }
    return l;
  };
  const Oh = xt("HTMLFormElement");
  const Ah = r => r.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function (i, l, c) {
    return l.toUpperCase() + c;
  });
  const mu = (({
    hasOwnProperty: r
  }) => (o, i) => r.call(o, i))(Object.prototype);
  const Ih = xt("RegExp");
  const hu = (r, o) => {
    const i = Object.getOwnPropertyDescriptors(r);
    const l = {};
    wr(i, (c, f) => {
      let p;
      if ((p = o(c, f, r)) !== false) {
        l[f] = p || c;
      }
    });
    Object.defineProperties(r, l);
  };
  const Lh = r => {
    hu(r, (o, i) => {
      if (rt(r) && ["arguments", "caller", "callee"].indexOf(i) !== -1) {
        return false;
      }
      const l = r[i];
      if (rt(l)) {
        o.enumerable = false;
        if ("writable" in o) {
          o.writable = false;
          return;
        }
        o.set ||= () => {
          throw Error("Can not rewrite read-only method '" + i + "'");
        };
      }
    });
  };
  const Mh = (r, o) => {
    const i = {};
    const l = c => {
      c.forEach(f => {
        i[f] = true;
      });
    };
    if (Un(r)) {
      l(r);
    } else {
      l(String(r).split(o));
    }
    return i;
  };
  const Dh = () => {};
  const bh = (r, o) => r != null && Number.isFinite(r = +r) ? r : o;
  function Fh(r) {
    return !!r && !!rt(r.append) && r[uu] === "FormData" && !!r[Eo];
  }
  const zh = r => {
    const o = new Array(10);
    const i = (l, c) => {
      if (vr(l)) {
        if (o.indexOf(l) >= 0) {
          return;
        }
        if (yr(l)) {
          return l;
        }
        if (!("toJSON" in l)) {
          o[c] = l;
          const f = Un(l) ? [] : {};
          wr(l, (p, m) => {
            const w = i(p, c + 1);
            if (!Bn(w)) {
              f[m] = w;
            }
          });
          o[c] = undefined;
          return f;
        }
      }
      return l;
    };
    return i(r, 0);
  };
  const jh = xt("AsyncFunction");
  const Uh = r => r && (vr(r) || rt(r)) && rt(r.then) && rt(r.catch);
  const gu = ((r, o) => r ? setImmediate : o ? ((i, l) => {
    wn.addEventListener("message", ({
      source: c,
      data: f
    }) => {
      if (c === wn && f === i && l.length) {
        l.shift()();
      }
    }, false);
    return c => {
      l.push(c);
      wn.postMessage(i, "*");
    };
  })(`axios@${Math.random()}`, []) : i => setTimeout(i))(typeof setImmediate == "function", rt(wn.postMessage));
  const Bh = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(wn) : typeof process !== "undefined" && process.nextTick || gu;
  const I = {
    isArray: Un,
    isArrayBuffer: cu,
    isBuffer: yr,
    isFormData: mh,
    isArrayBufferView: ih,
    isString: sh,
    isNumber: fu,
    isBoolean: lh,
    isObject: vr,
    isPlainObject: ko,
    isEmptyObject: ah,
    isReadableStream: gh,
    isRequest: yh,
    isResponse: vh,
    isHeaders: wh,
    isUndefined: Bn,
    isDate: uh,
    isFile: ch,
    isBlob: fh,
    isRegExp: Ih,
    isFunction: rt,
    isStream: ph,
    isURLSearchParams: hh,
    isTypedArray: Rh,
    isFileList: dh,
    forEach: wr,
    merge: gs,
    extend: Sh,
    trim: Eh,
    stripBOM: xh,
    inherits: kh,
    toFlatObject: Ch,
    kindOf: So,
    kindOfTest: xt,
    endsWith: _h,
    toArray: Th,
    forEachEntry: Ph,
    matchAll: Nh,
    isHTMLForm: Oh,
    hasOwnProperty: mu,
    hasOwnProp: mu,
    reduceDescriptors: hu,
    freezeMethods: Lh,
    toObjectSet: Mh,
    toCamelCase: Ah,
    noop: Dh,
    toFiniteNumber: bh,
    findKey: du,
    global: wn,
    isContextDefined: pu,
    isSpecCompliantForm: Fh,
    toJSONObject: zh,
    isAsyncFn: jh,
    isThenable: Uh,
    setImmediate: gu,
    asap: Bh,
    isIterable: r => r != null && rt(r[Eo])
  };
  let ce = class gm extends Error {
    static from(o, i, l, c, f, p) {
      const m = new gm(o.message, i || o.code, l, c, f);
      m.cause = o;
      m.name = o.name;
      if (p) {
        Object.assign(m, p);
      }
      return m;
    }
    constructor(o, i, l, c, f) {
      super(o);
      this.name = "AxiosError";
      this.isAxiosError = true;
      if (i) {
        this.code = i;
      }
      if (l) {
        this.config = l;
      }
      if (c) {
        this.request = c;
      }
      if (f) {
        this.response = f;
        this.status = f.status;
      }
    }
    toJSON() {
      return {
        message: this.message,
        name: this.name,
        description: this.description,
        number: this.number,
        fileName: this.fileName,
        lineNumber: this.lineNumber,
        columnNumber: this.columnNumber,
        stack: this.stack,
        config: I.toJSONObject(this.config),
        code: this.code,
        status: this.status
      };
    }
  };
  ce.ERR_BAD_OPTION_VALUE = "ERR_BAD_OPTION_VALUE";
  ce.ERR_BAD_OPTION = "ERR_BAD_OPTION";
  ce.ECONNABORTED = "ECONNABORTED";
  ce.ETIMEDOUT = "ETIMEDOUT";
  ce.ERR_NETWORK = "ERR_NETWORK";
  ce.ERR_FR_TOO_MANY_REDIRECTS = "ERR_FR_TOO_MANY_REDIRECTS";
  ce.ERR_DEPRECATED = "ERR_DEPRECATED";
  ce.ERR_BAD_RESPONSE = "ERR_BAD_RESPONSE";
  ce.ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
  ce.ERR_CANCELED = "ERR_CANCELED";
  ce.ERR_NOT_SUPPORT = "ERR_NOT_SUPPORT";
  ce.ERR_INVALID_URL = "ERR_INVALID_URL";
  const Vh = null;
  function ys(r) {
    return I.isPlainObject(r) || I.isArray(r);
  }
  function yu(r) {
    if (I.endsWith(r, "[]")) {
      return r.slice(0, -2);
    } else {
      return r;
    }
  }
  function vu(r, o, i) {
    if (r) {
      return r.concat(o).map(function (c, f) {
        c = yu(c);
        if (!i && f) {
          return "[" + c + "]";
        } else {
          return c;
        }
      }).join(i ? "." : "");
    } else {
      return o;
    }
  }
  function $h(r) {
    return I.isArray(r) && !r.some(ys);
  }
  const Wh = I.toFlatObject(I, {}, null, function (o) {
    return /^is[A-Z]/.test(o);
  });
  function Co(r, o, i) {
    if (!I.isObject(r)) {
      throw new TypeError("target must be an object");
    }
    o = o || new FormData();
    i = I.toFlatObject(i, {
      metaTokens: true,
      dots: false,
      indexes: false
    }, false, function (E, y) {
      return !I.isUndefined(y[E]);
    });
    const l = i.metaTokens;
    const c = i.visitor || g;
    const f = i.dots;
    const p = i.indexes;
    const w = (i.Blob || typeof Blob !== "undefined" && Blob) && I.isSpecCompliantForm(o);
    if (!I.isFunction(c)) {
      throw new TypeError("visitor must be a function");
    }
    function v(C) {
      if (C === null) {
        return "";
      }
      if (I.isDate(C)) {
        return C.toISOString();
      }
      if (I.isBoolean(C)) {
        return C.toString();
      }
      if (!w && I.isBlob(C)) {
        throw new ce("Blob is not supported. Use a Buffer instead.");
      }
      if (I.isArrayBuffer(C) || I.isTypedArray(C)) {
        if (w && typeof Blob == "function") {
          return new Blob([C]);
        } else {
          return Buffer.from(C);
        }
      } else {
        return C;
      }
    }
    function g(C, E, y) {
      let _ = C;
      if (C && !y && typeof C == "object") {
        if (I.endsWith(E, "{}")) {
          E = l ? E : E.slice(0, -2);
          C = JSON.stringify(C);
        } else if (I.isArray(C) && $h(C) || (I.isFileList(C) || I.endsWith(E, "[]")) && (_ = I.toArray(C))) {
          E = yu(E);
          _.forEach(function (b, D) {
            if (!I.isUndefined(b) && b !== null) {
              o.append(p === true ? vu([E], D, f) : p === null ? E : E + "[]", v(b));
            }
          });
          return false;
        }
      }
      if (ys(C)) {
        return true;
      } else {
        o.append(vu(y, E, f), v(C));
        return false;
      }
    }
    const T = [];
    const L = Object.assign(Wh, {
      defaultVisitor: g,
      convertValue: v,
      isVisitable: ys
    });
    function B(C, E) {
      if (!I.isUndefined(C)) {
        if (T.indexOf(C) !== -1) {
          throw Error("Circular reference detected in " + E.join("."));
        }
        T.push(C);
        I.forEach(C, function (_, N) {
          if ((!I.isUndefined(_) && _ !== null && c.call(o, _, I.isString(N) ? N.trim() : N, E, L)) === true) {
            B(_, E ? E.concat(N) : [N]);
          }
        });
        T.pop();
      }
    }
    if (!I.isObject(r)) {
      throw new TypeError("data must be an object");
    }
    B(r);
    return o;
  }
  function wu(r) {
    const o = {
      "!": "%21",
      "'": "%27",
      "(": "%28",
      ")": "%29",
      "~": "%7E",
      "%20": "+",
      "%00": "\0"
    };
    return encodeURIComponent(r).replace(/[!'()~]|%20|%00/g, function (l) {
      return o[l];
    });
  }
  function vs(r, o) {
    this._pairs = [];
    if (r) {
      Co(r, this, o);
    }
  }
  const Eu = vs.prototype;
  Eu.append = function (o, i) {
    this._pairs.push([o, i]);
  };
  Eu.toString = function (o) {
    const i = o ? function (l) {
      return o.call(this, l, wu);
    } : wu;
    return this._pairs.map(function (c) {
      return i(c[0]) + "=" + i(c[1]);
    }, "").join("&");
  };
  function Kh(r) {
    return encodeURIComponent(r).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+");
  }
  function Su(r, o, i) {
    if (!o) {
      return r;
    }
    const l = i && i.encode || Kh;
    const c = I.isFunction(i) ? {
      serialize: i
    } : i;
    const f = c && c.serialize;
    let p;
    if (f) {
      p = f(o, c);
    } else {
      p = I.isURLSearchParams(o) ? o.toString() : new vs(o, c).toString(l);
    }
    if (p) {
      const m = r.indexOf("#");
      if (m !== -1) {
        r = r.slice(0, m);
      }
      r += (r.indexOf("?") === -1 ? "?" : "&") + p;
    }
    return r;
  }
  class xu {
    constructor() {
      this.handlers = [];
    }
    use(o, i, l) {
      this.handlers.push({
        fulfilled: o,
        rejected: i,
        synchronous: l ? l.synchronous : false,
        runWhen: l ? l.runWhen : null
      });
      return this.handlers.length - 1;
    }
    eject(o) {
      this.handlers[o] &&= null;
    }
    clear() {
      this.handlers &&= [];
    }
    forEach(o) {
      I.forEach(this.handlers, function (l) {
        if (l !== null) {
          o(l);
        }
      });
    }
  }
  const ws = {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false,
    legacyInterceptorReqResOrdering: true
  };
  const Hh = {
    isBrowser: true,
    classes: {
      URLSearchParams: typeof URLSearchParams !== "undefined" ? URLSearchParams : vs,
      FormData: typeof FormData !== "undefined" ? FormData : null,
      Blob: typeof Blob !== "undefined" ? Blob : null
    },
    protocols: ["http", "https", "file", "blob", "url", "data"]
  };
  const Es = typeof window !== "undefined" && typeof document !== "undefined";
  const Ss = typeof navigator == "object" && navigator || undefined;
  const qh = Es && (!Ss || ["ReactNative", "NativeScript", "NS"].indexOf(Ss.product) < 0);
  const Gh = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope && typeof self.importScripts == "function";
  const Qh = Es && window.location.href || "http://localhost";
  const Qe = {
    ...Object.freeze(Object.defineProperty({
      __proto__: null,
      hasBrowserEnv: Es,
      hasStandardBrowserEnv: qh,
      hasStandardBrowserWebWorkerEnv: Gh,
      navigator: Ss,
      origin: Qh
    }, Symbol.toStringTag, {
      value: "Module"
    })),
    ...Hh
  };
  function Xh(r, o) {
    return Co(r, new Qe.classes.URLSearchParams(), {
      visitor: function (i, l, c, f) {
        if (Qe.isNode && I.isBuffer(i)) {
          this.append(l, i.toString("base64"));
          return false;
        } else {
          return f.defaultVisitor.apply(this, arguments);
        }
      },
      ...o
    });
  }
  function Yh(r) {
    return I.matchAll(/\w+|\[(\w*)]/g, r).map(o => o[0] === "[]" ? "" : o[1] || o[0]);
  }
  function Jh(r) {
    const o = {};
    const i = Object.keys(r);
    let l;
    const c = i.length;
    let f;
    for (l = 0; l < c; l++) {
      f = i[l];
      o[f] = r[f];
    }
    return o;
  }
  function ku(r) {
    function o(i, l, c, f) {
      let p = i[f++];
      if (p === "__proto__") {
        return true;
      }
      const m = Number.isFinite(+p);
      const w = f >= i.length;
      p = !p && I.isArray(c) ? c.length : p;
      if (w) {
        if (I.hasOwnProp(c, p)) {
          c[p] = [c[p], l];
        } else {
          c[p] = l;
        }
        return !m;
      } else {
        if (!c[p] || !I.isObject(c[p])) {
          c[p] = [];
        }
        if (o(i, l, c[p], f) && I.isArray(c[p])) {
          c[p] = Jh(c[p]);
        }
        return !m;
      }
    }
    if (I.isFormData(r) && I.isFunction(r.entries)) {
      const i = {};
      I.forEachEntry(r, (l, c) => {
        o(Yh(l), c, i, 0);
      });
      return i;
    }
    return null;
  }
  function Zh(r, o, i) {
    if (I.isString(r)) {
      try {
        (o || JSON.parse)(r);
        return I.trim(r);
      } catch (l) {
        if (l.name !== "SyntaxError") {
          throw l;
        }
      }
    }
    return (i || JSON.stringify)(r);
  }
  const Er = {
    transitional: ws,
    adapter: ["xhr", "http", "fetch"],
    transformRequest: [function (o, i) {
      const l = i.getContentType() || "";
      const c = l.indexOf("application/json") > -1;
      const f = I.isObject(o);
      if (f && I.isHTMLForm(o)) {
        o = new FormData(o);
      }
      if (I.isFormData(o)) {
        if (c) {
          return JSON.stringify(ku(o));
        } else {
          return o;
        }
      }
      if (I.isArrayBuffer(o) || I.isBuffer(o) || I.isStream(o) || I.isFile(o) || I.isBlob(o) || I.isReadableStream(o)) {
        return o;
      }
      if (I.isArrayBufferView(o)) {
        return o.buffer;
      }
      if (I.isURLSearchParams(o)) {
        i.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
        return o.toString();
      }
      let m;
      if (f) {
        if (l.indexOf("application/x-www-form-urlencoded") > -1) {
          return Xh(o, this.formSerializer).toString();
        }
        if ((m = I.isFileList(o)) || l.indexOf("multipart/form-data") > -1) {
          const w = this.env && this.env.FormData;
          return Co(m ? {
            "files[]": o
          } : o, w && new w(), this.formSerializer);
        }
      }
      if (f || c) {
        i.setContentType("application/json", false);
        return Zh(o);
      } else {
        return o;
      }
    }],
    transformResponse: [function (o) {
      const i = this.transitional || Er.transitional;
      const l = i && i.forcedJSONParsing;
      const c = this.responseType === "json";
      if (I.isResponse(o) || I.isReadableStream(o)) {
        return o;
      }
      if (o && I.isString(o) && (l && !this.responseType || c)) {
        const p = (!i || !i.silentJSONParsing) && c;
        try {
          return JSON.parse(o, this.parseReviver);
        } catch (m) {
          if (p) {
            throw m.name === "SyntaxError" ? ce.from(m, ce.ERR_BAD_RESPONSE, this, null, this.response) : m;
          }
        }
      }
      return o;
    }],
    timeout: 0,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    maxContentLength: -1,
    maxBodyLength: -1,
    env: {
      FormData: Qe.classes.FormData,
      Blob: Qe.classes.Blob
    },
    validateStatus: function (o) {
      return o >= 200 && o < 300;
    },
    headers: {
      common: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": undefined
      }
    }
  };
  I.forEach(["delete", "get", "head", "post", "put", "patch"], r => {
    Er.headers[r] = {};
  });
  const eg = I.toObjectSet(["age", "authorization", "content-length", "content-type", "etag", "expires", "from", "host", "if-modified-since", "if-unmodified-since", "last-modified", "location", "max-forwards", "proxy-authorization", "referer", "retry-after", "user-agent"]);
  const tg = r => {
    const o = {};
    let i;
    let l;
    let c;
    if (r) {
      r.split(`
`).forEach(function (p) {
        c = p.indexOf(":");
        i = p.substring(0, c).trim().toLowerCase();
        l = p.substring(c + 1).trim();
        if (!!i && (!o[i] || !eg[i])) {
          if (i === "set-cookie") {
            if (o[i]) {
              o[i].push(l);
            } else {
              o[i] = [l];
            }
          } else {
            o[i] = o[i] ? o[i] + ", " + l : l;
          }
        }
      });
    }
    return o;
  };
  const Cu = Symbol("internals");
  function Sr(r) {
    return r && String(r).trim().toLowerCase();
  }
  function _o(r) {
    if (r === false || r == null) {
      return r;
    } else if (I.isArray(r)) {
      return r.map(_o);
    } else {
      return String(r);
    }
  }
  function ng(r) {
    const o = Object.create(null);
    const i = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
    let l;
    while (l = i.exec(r)) {
      o[l[1]] = l[2];
    }
    return o;
  }
  const rg = r => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(r.trim());
  function xs(r, o, i, l, c) {
    if (I.isFunction(l)) {
      return l.call(this, o, i);
    }
    if (c) {
      o = i;
    }
    if (I.isString(o)) {
      if (I.isString(l)) {
        return o.indexOf(l) !== -1;
      }
      if (I.isRegExp(l)) {
        return l.test(o);
      }
    }
  }
  function og(r) {
    return r.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (o, i, l) => i.toUpperCase() + l);
  }
  function ig(r, o) {
    const i = I.toCamelCase(" " + o);
    ["get", "set", "has"].forEach(l => {
      Object.defineProperty(r, l + i, {
        value: function (c, f, p) {
          return this[l].call(this, o, c, f, p);
        },
        configurable: true
      });
    });
  }
  let ot = class {
    constructor(o) {
      if (o) {
        this.set(o);
      }
    }
    set(o, i, l) {
      const c = this;
      function f(m, w, v) {
        const g = Sr(w);
        if (!g) {
          throw new Error("header name must be a non-empty string");
        }
        const T = I.findKey(c, g);
        if (!T || c[T] === undefined || v === true || v === undefined && c[T] !== false) {
          c[T || w] = _o(m);
        }
      }
      const p = (m, w) => I.forEach(m, (v, g) => f(v, g, w));
      if (I.isPlainObject(o) || o instanceof this.constructor) {
        p(o, i);
      } else if (I.isString(o) && (o = o.trim()) && !rg(o)) {
        p(tg(o), i);
      } else if (I.isObject(o) && I.isIterable(o)) {
        let m = {};
        let w;
        let v;
        for (const g of o) {
          if (!I.isArray(g)) {
            throw TypeError("Object iterator must return a key-value pair");
          }
          m[v = g[0]] = (w = m[v]) ? I.isArray(w) ? [...w, g[1]] : [w, g[1]] : g[1];
        }
        p(m, i);
      } else if (o != null) {
        f(i, o, l);
      }
      return this;
    }
    get(o, i) {
      o = Sr(o);
      if (o) {
        const l = I.findKey(this, o);
        if (l) {
          const c = this[l];
          if (!i) {
            return c;
          }
          if (i === true) {
            return ng(c);
          }
          if (I.isFunction(i)) {
            return i.call(this, c, l);
          }
          if (I.isRegExp(i)) {
            return i.exec(c);
          }
          throw new TypeError("parser must be boolean|regexp|function");
        }
      }
    }
    has(o, i) {
      o = Sr(o);
      if (o) {
        const l = I.findKey(this, o);
        return !!l && this[l] !== undefined && (!i || !!xs(this, this[l], l, i));
      }
      return false;
    }
    delete(o, i) {
      const l = this;
      let c = false;
      function f(p) {
        p = Sr(p);
        if (p) {
          const m = I.findKey(l, p);
          if (m && (!i || xs(l, l[m], m, i))) {
            delete l[m];
            c = true;
          }
        }
      }
      if (I.isArray(o)) {
        o.forEach(f);
      } else {
        f(o);
      }
      return c;
    }
    clear(o) {
      const i = Object.keys(this);
      let l = i.length;
      let c = false;
      while (l--) {
        const f = i[l];
        if (!o || xs(this, this[f], f, o, true)) {
          delete this[f];
          c = true;
        }
      }
      return c;
    }
    normalize(o) {
      const i = this;
      const l = {};
      I.forEach(this, (c, f) => {
        const p = I.findKey(l, f);
        if (p) {
          i[p] = _o(c);
          delete i[f];
          return;
        }
        const m = o ? og(f) : String(f).trim();
        if (m !== f) {
          delete i[f];
        }
        i[m] = _o(c);
        l[m] = true;
      });
      return this;
    }
    concat(...o) {
      return this.constructor.concat(this, ...o);
    }
    toJSON(o) {
      const i = Object.create(null);
      I.forEach(this, (l, c) => {
        if (l != null && l !== false) {
          i[c] = o && I.isArray(l) ? l.join(", ") : l;
        }
      });
      return i;
    }
    [Symbol.iterator]() {
      return Object.entries(this.toJSON())[Symbol.iterator]();
    }
    toString() {
      return Object.entries(this.toJSON()).map(([o, i]) => o + ": " + i).join(`
`);
    }
    getSetCookie() {
      return this.get("set-cookie") || [];
    }
    get [Symbol.toStringTag]() {
      return "AxiosHeaders";
    }
    static from(o) {
      if (o instanceof this) {
        return o;
      } else {
        return new this(o);
      }
    }
    static concat(o, ...i) {
      const l = new this(o);
      i.forEach(c => l.set(c));
      return l;
    }
    static accessor(o) {
      const l = (this[Cu] = this[Cu] = {
        accessors: {}
      }).accessors;
      const c = this.prototype;
      function f(p) {
        const m = Sr(p);
        if (!l[m]) {
          ig(c, p);
          l[m] = true;
        }
      }
      if (I.isArray(o)) {
        o.forEach(f);
      } else {
        f(o);
      }
      return this;
    }
  };
  ot.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
  I.reduceDescriptors(ot.prototype, ({
    value: r
  }, o) => {
    let i = o[0].toUpperCase() + o.slice(1);
    return {
      get: () => r,
      set(l) {
        this[i] = l;
      }
    };
  });
  I.freezeMethods(ot);
  function ks(r, o) {
    const i = this || Er;
    const l = o || i;
    const c = ot.from(l.headers);
    let f = l.data;
    I.forEach(r, function (m) {
      f = m.call(i, f, c.normalize(), o ? o.status : undefined);
    });
    c.normalize();
    return f;
  }
  function _u(r) {
    return !!r && !!r.__CANCEL__;
  }
  let xr = class extends ce {
    constructor(o, i, l) {
      super(o ?? "canceled", ce.ERR_CANCELED, i, l);
      this.name = "CanceledError";
      this.__CANCEL__ = true;
    }
  };
  function Tu(r, o, i) {
    const l = i.config.validateStatus;
    if (!i.status || !l || l(i.status)) {
      r(i);
    } else {
      o(new ce("Request failed with status code " + i.status, [ce.ERR_BAD_REQUEST, ce.ERR_BAD_RESPONSE][Math.floor(i.status / 100) - 4], i.config, i.request, i));
    }
  }
  function sg(r) {
    const o = /^([-+\w]{1,25})(:?\/\/|:)/.exec(r);
    return o && o[1] || "";
  }
  function lg(r, o) {
    r = r || 10;
    const i = new Array(r);
    const l = new Array(r);
    let c = 0;
    let f = 0;
    let p;
    o = o !== undefined ? o : 1000;
    return function (w) {
      const v = Date.now();
      const g = l[f];
      p ||= v;
      i[c] = w;
      l[c] = v;
      let T = f;
      let L = 0;
      while (T !== c) {
        L += i[T++];
        T = T % r;
      }
      c = (c + 1) % r;
      if (c === f) {
        f = (f + 1) % r;
      }
      if (v - p < o) {
        return;
      }
      const B = g && v - g;
      if (B) {
        return Math.round(L * 1000 / B);
      } else {
        return undefined;
      }
    };
  }
  function ag(r, o) {
    let i = 0;
    let l = 1000 / o;
    let c;
    let f;
    const p = (v, g = Date.now()) => {
      i = g;
      c = null;
      if (f) {
        clearTimeout(f);
        f = null;
      }
      r(...v);
    };
    return [(...v) => {
      const g = Date.now();
      const T = g - i;
      if (T >= l) {
        p(v, g);
      } else {
        c = v;
        f ||= setTimeout(() => {
          f = null;
          p(c);
        }, l - T);
      }
    }, () => c && p(c)];
  }
  const To = (r, o, i = 3) => {
    let l = 0;
    const c = lg(50, 250);
    return ag(f => {
      const p = f.loaded;
      const m = f.lengthComputable ? f.total : undefined;
      const w = p - l;
      const v = c(w);
      const g = p <= m;
      l = p;
      const T = {
        loaded: p,
        total: m,
        progress: m ? p / m : undefined,
        bytes: w,
        rate: v || undefined,
        estimated: v && m && g ? (m - p) / v : undefined,
        event: f,
        lengthComputable: m != null,
        [o ? "download" : "upload"]: true
      };
      r(T);
    }, i);
  };
  const Ru = (r, o) => {
    const i = r != null;
    return [l => o[0]({
      lengthComputable: i,
      total: r,
      loaded: l
    }), o[1]];
  };
  const Pu = r => (...o) => I.asap(() => r(...o));
  const ug = Qe.hasStandardBrowserEnv ? ((r, o) => i => {
    i = new URL(i, Qe.origin);
    return r.protocol === i.protocol && r.host === i.host && (o || r.port === i.port);
  })(new URL(Qe.origin), Qe.navigator && /(msie|trident)/i.test(Qe.navigator.userAgent)) : () => true;
  const cg = Qe.hasStandardBrowserEnv ? {
    write(r, o, i, l, c, f, p) {
      if (typeof document === "undefined") {
        return;
      }
      const m = [`${r}=${encodeURIComponent(o)}`];
      if (I.isNumber(i)) {
        m.push(`expires=${new Date(i).toUTCString()}`);
      }
      if (I.isString(l)) {
        m.push(`path=${l}`);
      }
      if (I.isString(c)) {
        m.push(`domain=${c}`);
      }
      if (f === true) {
        m.push("secure");
      }
      if (I.isString(p)) {
        m.push(`SameSite=${p}`);
      }
      document.cookie = m.join("; ");
    },
    read(r) {
      if (typeof document === "undefined") {
        return null;
      }
      const o = document.cookie.match(new RegExp("(?:^|; )" + r + "=([^;]*)"));
      if (o) {
        return decodeURIComponent(o[1]);
      } else {
        return null;
      }
    },
    remove(r) {
      this.write(r, "", Date.now() - 86400000, "/");
    }
  } : {
    write() {},
    read() {
      return null;
    },
    remove() {}
  };
  function fg(r) {
    if (typeof r != "string") {
      return false;
    } else {
      return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(r);
    }
  }
  function dg(r, o) {
    if (o) {
      return r.replace(/\/?\/$/, "") + "/" + o.replace(/^\/+/, "");
    } else {
      return r;
    }
  }
  function Nu(r, o, i) {
    let l = !fg(o);
    if (r && (l || i == false)) {
      return dg(r, o);
    } else {
      return o;
    }
  }
  const Ou = r => r instanceof ot ? {
    ...r
  } : r;
  function En(r, o) {
    o = o || {};
    const i = {};
    function l(v, g, T, L) {
      if (I.isPlainObject(v) && I.isPlainObject(g)) {
        return I.merge.call({
          caseless: L
        }, v, g);
      } else if (I.isPlainObject(g)) {
        return I.merge({}, g);
      } else if (I.isArray(g)) {
        return g.slice();
      } else {
        return g;
      }
    }
    function c(v, g, T, L) {
      if (I.isUndefined(g)) {
        if (!I.isUndefined(v)) {
          return l(undefined, v, T, L);
        }
      } else {
        return l(v, g, T, L);
      }
    }
    function f(v, g) {
      if (!I.isUndefined(g)) {
        return l(undefined, g);
      }
    }
    function p(v, g) {
      if (I.isUndefined(g)) {
        if (!I.isUndefined(v)) {
          return l(undefined, v);
        }
      } else {
        return l(undefined, g);
      }
    }
    function m(v, g, T) {
      if (T in o) {
        return l(v, g);
      }
      if (T in r) {
        return l(undefined, v);
      }
    }
    const w = {
      url: f,
      method: f,
      data: f,
      baseURL: p,
      transformRequest: p,
      transformResponse: p,
      paramsSerializer: p,
      timeout: p,
      timeoutMessage: p,
      withCredentials: p,
      withXSRFToken: p,
      adapter: p,
      responseType: p,
      xsrfCookieName: p,
      xsrfHeaderName: p,
      onUploadProgress: p,
      onDownloadProgress: p,
      decompress: p,
      maxContentLength: p,
      maxBodyLength: p,
      beforeRedirect: p,
      transport: p,
      httpAgent: p,
      httpsAgent: p,
      cancelToken: p,
      socketPath: p,
      responseEncoding: p,
      validateStatus: m,
      headers: (v, g, T) => c(Ou(v), Ou(g), T, true)
    };
    I.forEach(Object.keys({
      ...r,
      ...o
    }), function (g) {
      if (g === "__proto__" || g === "constructor" || g === "prototype") {
        return;
      }
      const T = I.hasOwnProp(w, g) ? w[g] : c;
      const L = T(r[g], o[g], g);
      if (!I.isUndefined(L) || T === m) {
        i[g] = L;
      }
    });
    return i;
  }
  const Au = r => {
    const o = En({}, r);
    let {
      data: i,
      withXSRFToken: l,
      xsrfHeaderName: c,
      xsrfCookieName: f,
      headers: p,
      auth: m
    } = o;
    o.headers = p = ot.from(p);
    o.url = Su(Nu(o.baseURL, o.url, o.allowAbsoluteUrls), r.params, r.paramsSerializer);
    if (m) {
      p.set("Authorization", "Basic " + btoa((m.username || "") + ":" + (m.password ? unescape(encodeURIComponent(m.password)) : "")));
    }
    if (I.isFormData(i)) {
      if (Qe.hasStandardBrowserEnv || Qe.hasStandardBrowserWebWorkerEnv) {
        p.setContentType(undefined);
      } else if (I.isFunction(i.getHeaders)) {
        const w = i.getHeaders();
        const v = ["content-type", "content-length"];
        Object.entries(w).forEach(([g, T]) => {
          if (v.includes(g.toLowerCase())) {
            p.set(g, T);
          }
        });
      }
    }
    if (Qe.hasStandardBrowserEnv && (l && I.isFunction(l) && (l = l(o)), l || l !== false && ug(o.url))) {
      const w = c && f && cg.read(f);
      if (w) {
        p.set(c, w);
      }
    }
    return o;
  };
  const pg = typeof XMLHttpRequest !== "undefined" && function (r) {
    return new Promise(function (i, l) {
      const c = Au(r);
      let f = c.data;
      const p = ot.from(c.headers).normalize();
      let {
        responseType: m,
        onUploadProgress: w,
        onDownloadProgress: v
      } = c;
      let g;
      let T;
      let L;
      let B;
      let C;
      function E() {
        if (B) {
          B();
        }
        if (C) {
          C();
        }
        if (c.cancelToken) {
          c.cancelToken.unsubscribe(g);
        }
        if (c.signal) {
          c.signal.removeEventListener("abort", g);
        }
      }
      let y = new XMLHttpRequest();
      y.open(c.method.toUpperCase(), c.url, true);
      y.timeout = c.timeout;
      function _() {
        if (!y) {
          return;
        }
        const b = ot.from("getAllResponseHeaders" in y && y.getAllResponseHeaders());
        const H = {
          data: !m || m === "text" || m === "json" ? y.responseText : y.response,
          status: y.status,
          statusText: y.statusText,
          headers: b,
          config: r,
          request: y
        };
        Tu(function (q) {
          i(q);
          E();
        }, function (q) {
          l(q);
          E();
        }, H);
        y = null;
      }
      if ("onloadend" in y) {
        y.onloadend = _;
      } else {
        y.onreadystatechange = function () {
          if (!!y && y.readyState === 4 && (y.status !== 0 || !!y.responseURL && y.responseURL.indexOf("file:") === 0)) {
            setTimeout(_);
          }
        };
      }
      y.onabort = function () {
        if (y) {
          l(new ce("Request aborted", ce.ECONNABORTED, r, y));
          y = null;
        }
      };
      y.onerror = function (D) {
        const H = D && D.message ? D.message : "Network Error";
        const W = new ce(H, ce.ERR_NETWORK, r, y);
        W.event = D || null;
        l(W);
        y = null;
      };
      y.ontimeout = function () {
        let D = c.timeout ? "timeout of " + c.timeout + "ms exceeded" : "timeout exceeded";
        const H = c.transitional || ws;
        if (c.timeoutErrorMessage) {
          D = c.timeoutErrorMessage;
        }
        l(new ce(D, H.clarifyTimeoutError ? ce.ETIMEDOUT : ce.ECONNABORTED, r, y));
        y = null;
      };
      if (f === undefined) {
        p.setContentType(null);
      }
      if ("setRequestHeader" in y) {
        I.forEach(p.toJSON(), function (D, H) {
          y.setRequestHeader(H, D);
        });
      }
      if (!I.isUndefined(c.withCredentials)) {
        y.withCredentials = !!c.withCredentials;
      }
      if (m && m !== "json") {
        y.responseType = c.responseType;
      }
      if (v) {
        [L, C] = To(v, true);
        y.addEventListener("progress", L);
      }
      if (w && y.upload) {
        [T, B] = To(w);
        y.upload.addEventListener("progress", T);
        y.upload.addEventListener("loadend", B);
      }
      if (c.cancelToken || c.signal) {
        g = b => {
          if (y) {
            l(!b || b.type ? new xr(null, r, y) : b);
            y.abort();
            y = null;
          }
        };
        if (c.cancelToken) {
          c.cancelToken.subscribe(g);
        }
        if (c.signal) {
          if (c.signal.aborted) {
            g();
          } else {
            c.signal.addEventListener("abort", g);
          }
        }
      }
      const N = sg(c.url);
      if (N && Qe.protocols.indexOf(N) === -1) {
        l(new ce("Unsupported protocol " + N + ":", ce.ERR_BAD_REQUEST, r));
        return;
      }
      y.send(f || null);
    });
  };
  const mg = (r, o) => {
    const {
      length: i
    } = r = r ? r.filter(Boolean) : [];
    if (o || i) {
      let l = new AbortController();
      let c;
      const f = function (v) {
        if (!c) {
          c = true;
          m();
          const g = v instanceof Error ? v : this.reason;
          l.abort(g instanceof ce ? g : new xr(g instanceof Error ? g.message : g));
        }
      };
      let p = o && setTimeout(() => {
        p = null;
        f(new ce(`timeout of ${o}ms exceeded`, ce.ETIMEDOUT));
      }, o);
      const m = () => {
        if (r) {
          if (p) {
            clearTimeout(p);
          }
          p = null;
          r.forEach(v => {
            if (v.unsubscribe) {
              v.unsubscribe(f);
            } else {
              v.removeEventListener("abort", f);
            }
          });
          r = null;
        }
      };
      r.forEach(v => v.addEventListener("abort", f));
      const {
        signal: w
      } = l;
      w.unsubscribe = () => I.asap(m);
      return w;
    }
  };
  const hg = function* (r, o) {
    let i = r.byteLength;
    if (i < o) {
      yield r;
      return;
    }
    let l = 0;
    let c;
    while (l < i) {
      c = l + o;
      yield r.slice(l, c);
      l = c;
    }
  };
  const gg = async function* (r, o) {
    for await (const i of yg(r)) {
      yield* hg(i, o);
    }
  };
  const yg = async function* (r) {
    if (r[Symbol.asyncIterator]) {
      yield* r;
      return;
    }
    const o = r.getReader();
    try {
      while (true) {
        const {
          done: i,
          value: l
        } = await o.read();
        if (i) {
          break;
        }
        yield l;
      }
    } finally {
      await o.cancel();
    }
  };
  const Iu = (r, o, i, l) => {
    const c = gg(r, o);
    let f = 0;
    let p;
    let m = w => {
      if (!p) {
        p = true;
        if (l) {
          l(w);
        }
      }
    };
    return new ReadableStream({
      async pull(w) {
        try {
          const {
            done: v,
            value: g
          } = await c.next();
          if (v) {
            m();
            w.close();
            return;
          }
          let T = g.byteLength;
          if (i) {
            let L = f += T;
            i(L);
          }
          w.enqueue(new Uint8Array(g));
        } catch (v) {
          m(v);
          throw v;
        }
      },
      cancel(w) {
        m(w);
        return c.return();
      }
    }, {
      highWaterMark: 2
    });
  };
  const Lu = 65536;
  const {
    isFunction: Ro
  } = I;
  const vg = (({
    Request: r,
    Response: o
  }) => ({
    Request: r,
    Response: o
  }))(I.global);
  const {
    ReadableStream: Mu,
    TextEncoder: Du
  } = I.global;
  const bu = (r, ...o) => {
    try {
      return !!r(...o);
    } catch {
      return false;
    }
  };
  const wg = r => {
    r = I.merge.call({
      skipUndefined: true
    }, vg, r);
    const {
      fetch: o,
      Request: i,
      Response: l
    } = r;
    const c = o ? Ro(o) : typeof fetch == "function";
    const f = Ro(i);
    const p = Ro(l);
    if (!c) {
      return false;
    }
    const m = c && Ro(Mu);
    const w = c && (typeof Du == "function" ? (C => E => C.encode(E))(new Du()) : async C => new Uint8Array(await new i(C).arrayBuffer()));
    const v = f && m && bu(() => {
      let C = false;
      const E = new i(Qe.origin, {
        body: new Mu(),
        method: "POST",
        get duplex() {
          C = true;
          return "half";
        }
      }).headers.has("Content-Type");
      return C && !E;
    });
    const g = p && m && bu(() => I.isReadableStream(new l("").body));
    const T = {
      stream: g && (C => C.body)
    };
    if (c) {
      ["text", "arrayBuffer", "blob", "formData", "stream"].forEach(C => {
        if (!T[C]) {
          T[C] = (E, y) => {
            let _ = E && E[C];
            if (_) {
              return _.call(E);
            }
            throw new ce(`Response type '${C}' is not supported`, ce.ERR_NOT_SUPPORT, y);
          };
        }
      });
    }
    const L = async C => {
      if (C == null) {
        return 0;
      }
      if (I.isBlob(C)) {
        return C.size;
      }
      if (I.isSpecCompliantForm(C)) {
        return (await new i(Qe.origin, {
          method: "POST",
          body: C
        }).arrayBuffer()).byteLength;
      }
      if (I.isArrayBufferView(C) || I.isArrayBuffer(C)) {
        return C.byteLength;
      }
      if (I.isURLSearchParams(C)) {
        C = C + "";
      }
      if (I.isString(C)) {
        return (await w(C)).byteLength;
      }
    };
    const B = async (C, E) => {
      const y = I.toFiniteNumber(C.getContentLength());
      return y ?? L(E);
    };
    return async C => {
      let {
        url: E,
        method: y,
        data: _,
        signal: N,
        cancelToken: b,
        timeout: D,
        onDownloadProgress: H,
        onUploadProgress: W,
        responseType: q,
        headers: $,
        withCredentials: de = "same-origin",
        fetchOptions: ue
      } = Au(C);
      let Te = o || fetch;
      q = q ? (q + "").toLowerCase() : "text";
      let _e = mg([N, b && b.toAbortSignal()], D);
      let xe = null;
      const oe = _e && _e.unsubscribe && (() => {
        _e.unsubscribe();
      });
      let we;
      try {
        if (W && v && y !== "get" && y !== "head" && (we = await B($, _)) !== 0) {
          let k = new i(E, {
            method: "POST",
            body: _,
            duplex: "half"
          });
          let F;
          if (I.isFormData(_) && (F = k.headers.get("content-type"))) {
            $.setContentType(F);
          }
          if (k.body) {
            const [Z, ie] = Ru(we, To(Pu(W)));
            _ = Iu(k.body, Lu, Z, ie);
          }
        }
        if (!I.isString(de)) {
          de = de ? "include" : "omit";
        }
        const se = f && "credentials" in i.prototype;
        const me = {
          ...ue,
          signal: _e,
          method: y.toUpperCase(),
          headers: $.normalize().toJSON(),
          body: _,
          duplex: "half",
          credentials: se ? de : undefined
        };
        xe = f && new i(E, me);
        let M = await (f ? Te(xe, ue) : Te(E, me));
        const ne = g && (q === "stream" || q === "response");
        if (g && (H || ne && oe)) {
          const k = {};
          ["status", "statusText", "headers"].forEach(he => {
            k[he] = M[he];
          });
          const F = I.toFiniteNumber(M.headers.get("content-length"));
          const [Z, ie] = H && Ru(F, To(Pu(H), true)) || [];
          M = new l(Iu(M.body, Lu, Z, () => {
            if (ie) {
              ie();
            }
            if (oe) {
              oe();
            }
          }), k);
        }
        q = q || "text";
        let G = await T[I.findKey(T, q) || "text"](M, C);
        if (!ne && oe) {
          oe();
        }
        return await new Promise((k, F) => {
          Tu(k, F, {
            data: G,
            headers: ot.from(M.headers),
            status: M.status,
            statusText: M.statusText,
            config: C,
            request: xe
          });
        });
      } catch (se) {
        if (oe) {
          oe();
        }
        throw se && se.name === "TypeError" && /Load failed|fetch/i.test(se.message) ? Object.assign(new ce("Network Error", ce.ERR_NETWORK, C, xe, se && se.response), {
          cause: se.cause || se
        }) : ce.from(se, se && se.code, C, xe, se && se.response);
      }
    };
  };
  const Eg = new Map();
  const Fu = r => {
    let o = r && r.env || {};
    const {
      fetch: i,
      Request: l,
      Response: c
    } = o;
    const f = [l, c, i];
    let p = f.length;
    let m = p;
    let w;
    let v;
    let g = Eg;
    while (m--) {
      w = f[m];
      v = g.get(w);
      if (v === undefined) {
        g.set(w, v = m ? new Map() : wg(o));
      }
      g = v;
    }
    return v;
  };
  Fu();
  const Cs = {
    http: Vh,
    xhr: pg,
    fetch: {
      get: Fu
    }
  };
  I.forEach(Cs, (r, o) => {
    if (r) {
      try {
        Object.defineProperty(r, "name", {
          value: o
        });
      } catch {}
      Object.defineProperty(r, "adapterName", {
        value: o
      });
    }
  });
  const zu = r => `- ${r}`;
  const Sg = r => I.isFunction(r) || r === null || r === false;
  function xg(r, o) {
    r = I.isArray(r) ? r : [r];
    const {
      length: i
    } = r;
    let l;
    let c;
    const f = {};
    for (let p = 0; p < i; p++) {
      l = r[p];
      let m;
      c = l;
      if (!Sg(l) && (c = Cs[(m = String(l)).toLowerCase()], c === undefined)) {
        throw new ce(`Unknown adapter '${m}'`);
      }
      if (c && (I.isFunction(c) || (c = c.get(o)))) {
        break;
      }
      f[m || "#" + p] = c;
    }
    if (!c) {
      const p = Object.entries(f).map(([w, v]) => `adapter ${w} ${v === false ? "is not supported by the environment" : "is not available in the build"}`);
      let m = i ? p.length > 1 ? `since :
${p.map(zu).join(`
`)}` : " " + zu(p[0]) : "as no adapter specified";
      throw new ce("There is no suitable adapter to dispatch the request " + m, "ERR_NOT_SUPPORT");
    }
    return c;
  }
  const ju = {
    getAdapter: xg,
    adapters: Cs
  };
  function _s(r) {
    if (r.cancelToken) {
      r.cancelToken.throwIfRequested();
    }
    if (r.signal && r.signal.aborted) {
      throw new xr(null, r);
    }
  }
  function Uu(r) {
    _s(r);
    r.headers = ot.from(r.headers);
    r.data = ks.call(r, r.transformRequest);
    if (["post", "put", "patch"].indexOf(r.method) !== -1) {
      r.headers.setContentType("application/x-www-form-urlencoded", false);
    }
    return ju.getAdapter(r.adapter || Er.adapter, r)(r).then(function (l) {
      _s(r);
      l.data = ks.call(r, r.transformResponse, l);
      l.headers = ot.from(l.headers);
      return l;
    }, function (l) {
      if (!_u(l)) {
        _s(r);
        if (l && l.response) {
          l.response.data = ks.call(r, r.transformResponse, l.response);
          l.response.headers = ot.from(l.response.headers);
        }
      }
      return Promise.reject(l);
    });
  }
  const Bu = "1.13.5";
  const Po = {};
  ["object", "boolean", "number", "function", "string", "symbol"].forEach((r, o) => {
    Po[r] = function (l) {
      return typeof l === r || "a" + (o < 1 ? "n " : " ") + r;
    };
  });
  const Vu = {};
  Po.transitional = function (o, i, l) {
    function c(f, p) {
      return "[Axios v" + Bu + "] Transitional option '" + f + "'" + p + (l ? ". " + l : "");
    }
    return (f, p, m) => {
      if (o === false) {
        throw new ce(c(p, " has been removed" + (i ? " in " + i : "")), ce.ERR_DEPRECATED);
      }
      if (i && !Vu[p]) {
        Vu[p] = true;
        console.warn(c(p, " has been deprecated since v" + i + " and will be removed in the near future"));
      }
      if (o) {
        return o(f, p, m);
      } else {
        return true;
      }
    };
  };
  Po.spelling = function (o) {
    return (i, l) => {
      console.warn(`${l} is likely a misspelling of ${o}`);
      return true;
    };
  };
  function kg(r, o, i) {
    if (typeof r != "object") {
      throw new ce("options must be an object", ce.ERR_BAD_OPTION_VALUE);
    }
    const l = Object.keys(r);
    let c = l.length;
    while (c-- > 0) {
      const f = l[c];
      const p = o[f];
      if (p) {
        const m = r[f];
        const w = m === undefined || p(m, f, r);
        if (w !== true) {
          throw new ce("option " + f + " must be " + w, ce.ERR_BAD_OPTION_VALUE);
        }
        continue;
      }
      if (i !== true) {
        throw new ce("Unknown option " + f, ce.ERR_BAD_OPTION);
      }
    }
  }
  const No = {
    assertOptions: kg,
    validators: Po
  };
  const ht = No.validators;
  let Sn = class {
    constructor(o) {
      this.defaults = o || {};
      this.interceptors = {
        request: new xu(),
        response: new xu()
      };
    }
    async request(o, i) {
      try {
        return await this._request(o, i);
      } catch (l) {
        if (l instanceof Error) {
          let c = {};
          if (Error.captureStackTrace) {
            Error.captureStackTrace(c);
          } else {
            c = new Error();
          }
          const f = c.stack ? c.stack.replace(/^.+\n/, "") : "";
          try {
            if (l.stack) {
              if (f && !String(l.stack).endsWith(f.replace(/^.+\n.+\n/, ""))) {
                l.stack += `
${f}`;
              }
            } else {
              l.stack = f;
            }
          } catch {}
        }
        throw l;
      }
    }
    _request(o, i) {
      if (typeof o == "string") {
        i = i || {};
        i.url = o;
      } else {
        i = o || {};
      }
      i = En(this.defaults, i);
      const {
        transitional: l,
        paramsSerializer: c,
        headers: f
      } = i;
      if (l !== undefined) {
        No.assertOptions(l, {
          silentJSONParsing: ht.transitional(ht.boolean),
          forcedJSONParsing: ht.transitional(ht.boolean),
          clarifyTimeoutError: ht.transitional(ht.boolean),
          legacyInterceptorReqResOrdering: ht.transitional(ht.boolean)
        }, false);
      }
      if (c != null) {
        if (I.isFunction(c)) {
          i.paramsSerializer = {
            serialize: c
          };
        } else {
          No.assertOptions(c, {
            encode: ht.function,
            serialize: ht.function
          }, true);
        }
      }
      if (i.allowAbsoluteUrls === undefined) {
        if (this.defaults.allowAbsoluteUrls !== undefined) {
          i.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
        } else {
          i.allowAbsoluteUrls = true;
        }
      }
      No.assertOptions(i, {
        baseUrl: ht.spelling("baseURL"),
        withXsrfToken: ht.spelling("withXSRFToken")
      }, true);
      i.method = (i.method || this.defaults.method || "get").toLowerCase();
      let p = f && I.merge(f.common, f[i.method]);
      if (f) {
        I.forEach(["delete", "get", "head", "post", "put", "patch", "common"], C => {
          delete f[C];
        });
      }
      i.headers = ot.concat(p, f);
      const m = [];
      let w = true;
      this.interceptors.request.forEach(function (E) {
        if (typeof E.runWhen == "function" && E.runWhen(i) === false) {
          return;
        }
        w = w && E.synchronous;
        const y = i.transitional || ws;
        if (y && y.legacyInterceptorReqResOrdering) {
          m.unshift(E.fulfilled, E.rejected);
        } else {
          m.push(E.fulfilled, E.rejected);
        }
      });
      const v = [];
      this.interceptors.response.forEach(function (E) {
        v.push(E.fulfilled, E.rejected);
      });
      let g;
      let T = 0;
      let L;
      if (!w) {
        const C = [Uu.bind(this), undefined];
        C.unshift(...m);
        C.push(...v);
        L = C.length;
        g = Promise.resolve(i);
        while (T < L) {
          g = g.then(C[T++], C[T++]);
        }
        return g;
      }
      L = m.length;
      let B = i;
      while (T < L) {
        const C = m[T++];
        const E = m[T++];
        try {
          B = C(B);
        } catch (y) {
          E.call(this, y);
          break;
        }
      }
      try {
        g = Uu.call(this, B);
      } catch (C) {
        return Promise.reject(C);
      }
      T = 0;
      L = v.length;
      while (T < L) {
        g = g.then(v[T++], v[T++]);
      }
      return g;
    }
    getUri(o) {
      o = En(this.defaults, o);
      const i = Nu(o.baseURL, o.url, o.allowAbsoluteUrls);
      return Su(i, o.params, o.paramsSerializer);
    }
  };
  I.forEach(["delete", "get", "head", "options"], function (o) {
    Sn.prototype[o] = function (i, l) {
      return this.request(En(l || {}, {
        method: o,
        url: i,
        data: (l || {}).data
      }));
    };
  });
  I.forEach(["post", "put", "patch"], function (o) {
    function i(l) {
      return function (f, p, m) {
        return this.request(En(m || {}, {
          method: o,
          headers: l ? {
            "Content-Type": "multipart/form-data"
          } : {},
          url: f,
          data: p
        }));
      };
    }
    Sn.prototype[o] = i();
    Sn.prototype[o + "Form"] = i(true);
  });
  let Cg = class ym {
    constructor(o) {
      if (typeof o != "function") {
        throw new TypeError("executor must be a function.");
      }
      let i;
      this.promise = new Promise(function (f) {
        i = f;
      });
      const l = this;
      this.promise.then(c => {
        if (!l._listeners) {
          return;
        }
        let f = l._listeners.length;
        while (f-- > 0) {
          l._listeners[f](c);
        }
        l._listeners = null;
      });
      this.promise.then = c => {
        let f;
        const p = new Promise(m => {
          l.subscribe(m);
          f = m;
        }).then(c);
        p.cancel = function () {
          l.unsubscribe(f);
        };
        return p;
      };
      o(function (f, p, m) {
        if (!l.reason) {
          l.reason = new xr(f, p, m);
          i(l.reason);
        }
      });
    }
    throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    }
    subscribe(o) {
      if (this.reason) {
        o(this.reason);
        return;
      }
      if (this._listeners) {
        this._listeners.push(o);
      } else {
        this._listeners = [o];
      }
    }
    unsubscribe(o) {
      if (!this._listeners) {
        return;
      }
      const i = this._listeners.indexOf(o);
      if (i !== -1) {
        this._listeners.splice(i, 1);
      }
    }
    toAbortSignal() {
      const o = new AbortController();
      const i = l => {
        o.abort(l);
      };
      this.subscribe(i);
      o.signal.unsubscribe = () => this.unsubscribe(i);
      return o.signal;
    }
    static source() {
      let o;
      return {
        token: new ym(function (c) {
          o = c;
        }),
        cancel: o
      };
    }
  };
  function _g(r) {
    return function (i) {
      return r.apply(null, i);
    };
  }
  function Tg(r) {
    return I.isObject(r) && r.isAxiosError === true;
  }
  const Ts = {
    Continue: 100,
    SwitchingProtocols: 101,
    Processing: 102,
    EarlyHints: 103,
    Ok: 200,
    Created: 201,
    Accepted: 202,
    NonAuthoritativeInformation: 203,
    NoContent: 204,
    ResetContent: 205,
    PartialContent: 206,
    MultiStatus: 207,
    AlreadyReported: 208,
    ImUsed: 226,
    MultipleChoices: 300,
    MovedPermanently: 301,
    Found: 302,
    SeeOther: 303,
    NotModified: 304,
    UseProxy: 305,
    Unused: 306,
    TemporaryRedirect: 307,
    PermanentRedirect: 308,
    BadRequest: 400,
    Unauthorized: 401,
    PaymentRequired: 402,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    NotAcceptable: 406,
    ProxyAuthenticationRequired: 407,
    RequestTimeout: 408,
    Conflict: 409,
    Gone: 410,
    LengthRequired: 411,
    PreconditionFailed: 412,
    PayloadTooLarge: 413,
    UriTooLong: 414,
    UnsupportedMediaType: 415,
    RangeNotSatisfiable: 416,
    ExpectationFailed: 417,
    ImATeapot: 418,
    MisdirectedRequest: 421,
    UnprocessableEntity: 422,
    Locked: 423,
    FailedDependency: 424,
    TooEarly: 425,
    UpgradeRequired: 426,
    PreconditionRequired: 428,
    TooManyRequests: 429,
    RequestHeaderFieldsTooLarge: 431,
    UnavailableForLegalReasons: 451,
    InternalServerError: 500,
    NotImplemented: 501,
    BadGateway: 502,
    ServiceUnavailable: 503,
    GatewayTimeout: 504,
    HttpVersionNotSupported: 505,
    VariantAlsoNegotiates: 506,
    InsufficientStorage: 507,
    LoopDetected: 508,
    NotExtended: 510,
    NetworkAuthenticationRequired: 511,
    WebServerIsDown: 521,
    ConnectionTimedOut: 522,
    OriginIsUnreachable: 523,
    TimeoutOccurred: 524,
    SslHandshakeFailed: 525,
    InvalidSslCertificate: 526
  };
  Object.entries(Ts).forEach(([r, o]) => {
    Ts[o] = r;
  });
  function $u(r) {
    const o = new Sn(r);
    const i = au(Sn.prototype.request, o);
    I.extend(i, Sn.prototype, o, {
      allOwnKeys: true
    });
    I.extend(i, o, null, {
      allOwnKeys: true
    });
    i.create = function (c) {
      return $u(En(r, c));
    };
    return i;
  }
  const Oe = $u(Er);
  Oe.Axios = Sn;
  Oe.CanceledError = xr;
  Oe.CancelToken = Cg;
  Oe.isCancel = _u;
  Oe.VERSION = Bu;
  Oe.toFormData = Co;
  Oe.AxiosError = ce;
  Oe.Cancel = Oe.CanceledError;
  Oe.all = function (o) {
    return Promise.all(o);
  };
  Oe.spread = _g;
  Oe.isAxiosError = Tg;
  Oe.mergeConfig = En;
  Oe.AxiosHeaders = ot;
  Oe.formToJSON = r => ku(I.isHTMLForm(r) ? new FormData(r) : r);
  Oe.getAdapter = ju.getAdapter;
  Oe.HttpStatusCode = Ts;
  Oe.default = Oe;
  const {
    Axios: n1,
    AxiosError: r1,
    CanceledError: o1,
    isCancel: i1,
    CancelToken: s1,
    VERSION: l1,
    all: a1,
    Cancel: u1,
    isAxiosError: Oo,
    spread: c1,
    toFormData: f1,
    AxiosHeaders: d1,
    HttpStatusCode: p1,
    formToJSON: m1,
    getAdapter: h1,
    mergeConfig: g1
  } = Oe;
  const qt = Oe.create({
    baseURL: iu
  });
  const Rg = Oe.create({
    baseURL: iu
  });
  Oe.create();
  (r => r.interceptors.request.use(async o => {
    const i = await Ot.getItem("local:token");
    if (i) {
      o.headers.set("authorization", `Bearer ${i}`);
    }
    return o;
  }))(qt);
  var Rs = (r => {
    r.GET_USER_ID = "getUserID";
    r.MAYBE_PIN_AUTO_MESSAGES_TAB = "maybePinAutoMessagesTab";
    r.MAYBE_PIN_RESTOCKER_TAB = "maybePinRestockerTab";
    r.MAYBE_PIN_AUTOMATIONS_TAB = "maybePinAutomationsTab";
    r.DOWNLOAD = "download";
    r.GET_PLATFORM_INFO = "getPlatformInfo";
    r.VINTED_LOGOUT = "vintedLogout";
    return r;
  })(Rs || {});
  function Wu(r) {
    return Ht.runtime.sendMessage(r);
  }
  function Pg(r) {
    const o = {
      action: Rs.GET_USER_ID,
      data: {
        url: r
      }
    };
    return Wu(o);
  }
  function Ng() {
    const r = {
      action: Rs.GET_PLATFORM_INFO,
      data: null
    };
    return Wu(r);
  }
  let Ao = {};
  function Ku() {
    if (typeof window === "undefined" || typeof document === "undefined" || typeof self !== "undefined" && typeof importScripts == "function") {
      return "background";
    }
    if (window.location.protocol.startsWith("http")) {
      return "content";
    }
    if (window.location.protocol === "chrome-extension:") {
      const r = window.location.pathname;
      if (r.includes("popup")) {
        return "popup";
      }
      if (r.includes("options")) {
        return "options";
      }
    }
    return "unknown";
  }
  async function Og() {
    const r = Ku();
    try {
      if (r === "background") {
        if (Ht.runtime.getPlatformInfo) {
          const o = await Ht.runtime.getPlatformInfo();
          Ao = {
            os: o.os,
            arch: o.arch
          };
        }
      } else {
        const o = await Ng();
        if (o) {
          Ao = o;
        }
      }
      ge.info("Platform detection initialized", Ao);
    } catch (o) {
      ge.error("Failed to initialize platform detection", o);
    }
  }
  Og();
  function Ag() {
    return Ao;
  }
  function Ig() {
    if (typeof window !== "undefined" && window.location) {
      try {
        return {
          url: window.location.href,
          pathname: window.location.pathname
        };
      } catch {}
    }
    return {};
  }
  function Hu(r) {
    return r && typeof r == "object" && "config" in r;
  }
  function Lg(r, o, i = {}, l = "error") {
    const c = Ku();
    const f = Ig();
    const p = Ag();
    const w = {
      ddsource: "chrome-extension",
      ddtags: ["env:production", `version:${ou}`, "browser:chrome", `context:${c}`].join(","),
      hostname: "ext-dotb",
      message: r,
      service: "ext-dotb",
      status: l,
      timestamp: Date.now(),
      context: {
        extensionVersion: ou,
        browser: "chrome",
        environment: "production",
        executionContext: c,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        ...f,
        ...(p.os && {
          platformOS: p.os,
          platformArch: p.arch
        }),
        ...i
      }
    };
    const v = g => {
      const T = {};
      if (!!Hu(g) && !!g.config) {
        if (g.config.method) {
          T.httpMethod = g.config.method.toUpperCase();
        }
        if (g.config.url) {
          T.httpUrl = g.config.url;
        }
        if (g.config.baseURL) {
          T.httpBaseUrl = g.config.baseURL;
        }
        if (g.config.data) {
          T.httpRequestBody = g.config.data;
        }
        if (g.response) {
          if (g.response.status) {
            T.httpStatus = g.response.status;
          }
          if (g.response.statusText) {
            T.httpStatusText = g.response.statusText;
          }
          if (g.response.data) {
            T.httpResponseBody = g.response.data;
          }
        } else {
          if (g._responseStatus) {
            T.httpStatus = g._responseStatus;
          }
          if (g._responseStatusText) {
            T.httpStatusText = g._responseStatusText;
          }
          if (g._responseData) {
            T.httpResponseBody = g._responseData;
          }
        }
        if (g.code) {
          T.httpErrorCode = g.code;
        }
        if (g.status) {
          T.httpStatusCode = g.status;
        }
      }
      return T;
    };
    if (o) {
      w.error = {
        kind: o.name || "Error",
        message: o.message,
        stack: o.stack
      };
      const g = v(o);
      if (Object.keys(g).length > 0) {
        w.context = {
          ...w.context,
          ...g
        };
      }
    }
    if (i.error && Hu(i.error)) {
      const g = v(i.error);
      if (Object.keys(g).length > 0) {
        w.context = {
          ...w.context,
          ...g
        };
      }
    }
    return w;
  }
  async function qu(r, o = null, i = {}, l = "error") {
    try {
      const c = Lg(r, o, i, l);
      await qt.post("/logs/datadog", c, {
        timeout: 2000
      });
    } catch {}
  }
  async function Mg(r, o = null, i = {}) {
    return qu(r, o, i, "error");
  }
  let Ps = false;
  Ot.getItem("local:debugMode").then(r => {
    Ps = r ?? false;
  });
  Ot.watch("local:debugMode", r => {
    Ps = r ?? false;
  });
  function Io() {
    return Ps;
  }
  function kr() {
    return new Date().toLocaleString();
  }
  function Dg(...r) {
    if (Io()) {
      console.log("[36m%s[0m", `[${kr()}] dotB LEVEL:DEBUG`, ...r);
    }
  }
  function bg(...r) {
    if (Io()) {
      console.log("[36m%s[0m", `[${kr()}] dotB LEVEL:LOG`, ...r);
    }
  }
  function Fg(...r) {
    if (Io()) {
      console.log("[33m%s[0m", `[${kr()}] dotB LEVEL:INFO`, ...r);
    }
  }
  function zg(r, o) {
    const i = typeof r == "string" ? r : JSON.stringify(r);
    if (Io()) {
      console.log("[35m%s[0m", `[${kr()}] dotB LEVEL:TRACE`, i, o);
    }
    try {
      qu(i, null, o || {}, "debug").catch(() => {});
    } catch {}
  }
  function jg(r, o, i) {
    const l = typeof r == "string" ? r : JSON.stringify(r);
    console.log("[31m%s[0m", `[${kr()}] dotB LEVEL:ERROR`, l, o, i);
    try {
      const c = o instanceof Error ? o : null;
      const f = {
        ...i
      };
      if (o && !(o instanceof Error)) {
        f.error = o;
      }
      Mg(l, c, f).catch(() => {});
    } catch {}
  }
  const ge = {
    debug: Dg,
    log: bg,
    info: Fg,
    trace: zg,
    error: jg
  };
  var O = cs();
  const Gt = ls(O);
  const Gu = wm({
    __proto__: null,
    default: Gt
  }, [O]);
  const Ug = r => r.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  const Bg = r => r.replace(/^([A-Z])|[\s-_]+(\w)/g, (o, i, l) => l ? l.toUpperCase() : i.toLowerCase());
  const Qu = r => {
    const o = Bg(r);
    return o.charAt(0).toUpperCase() + o.slice(1);
  };
  const Xu = (...r) => r.filter((o, i, l) => !!o && o.trim() !== "" && l.indexOf(o) === i).join(" ").trim();
  const Vg = r => {
    for (const o in r) {
      if (o.startsWith("aria-") || o === "role" || o === "title") {
        return true;
      }
    }
  };
  var $g = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };
  const Wg = O.forwardRef(({
    color: r = "currentColor",
    size: o = 24,
    strokeWidth: i = 2,
    absoluteStrokeWidth: l,
    className: c = "",
    children: f,
    iconNode: p,
    ...m
  }, w) => O.createElement("svg", {
    ref: w,
    ...$g,
    width: o,
    height: o,
    stroke: r,
    strokeWidth: l ? Number(i) * 24 / Number(o) : i,
    className: Xu("lucide", c),
    ...(!f && !Vg(m) && {
      "aria-hidden": "true"
    }),
    ...m
  }, [...p.map(([v, g]) => O.createElement(v, g)), ...(Array.isArray(f) ? f : [f])]));
  const Lo = (r, o) => {
    const i = O.forwardRef(({
      className: l,
      ...c
    }, f) => O.createElement(Wg, {
      ref: f,
      iconNode: o,
      className: Xu(`lucide-${Ug(Qu(r))}`, `lucide-${r}`, l),
      ...c
    }));
    i.displayName = Qu(r);
    return i;
  };
  const Kg = Lo("bot", [["path", {
    d: "M12 8V4H8",
    key: "hb8ula"
  }], ["rect", {
    width: "16",
    height: "12",
    x: "4",
    y: "8",
    rx: "2",
    key: "enze0r"
  }], ["path", {
    d: "M2 14h2",
    key: "vft8re"
  }], ["path", {
    d: "M20 14h2",
    key: "4cs60a"
  }], ["path", {
    d: "M15 13v2",
    key: "1xurst"
  }], ["path", {
    d: "M9 13v2",
    key: "rq6x2g"
  }]]);
  const Hg = Lo("loader-circle", [["path", {
    d: "M21 12a9 9 0 1 1-6.219-8.56",
    key: "13zald"
  }]]);
  const _Component20 = Lo("sparkles", [["path", {
    d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
    key: "1s2grr"
  }], ["path", {
    d: "M20 2v4",
    key: "1rf3ol"
  }], ["path", {
    d: "M22 4h-4",
    key: "gwowj6"
  }], ["circle", {
    cx: "4",
    cy: "20",
    r: "2",
    key: "6kqj1y"
  }]]);
  const Gg = Lo("x", [["path", {
    d: "M18 6 6 18",
    key: "1bl5f8"
  }], ["path", {
    d: "m6 6 12 12",
    key: "d8bk6v"
  }]]);
  function Yu(r, o) {
    if (typeof r == "function") {
      return r(o);
    }
    if (r != null) {
      r.current = o;
    }
  }
  function Ns(...r) {
    return o => {
      let i = false;
      const l = r.map(c => {
        const f = Yu(c, o);
        if (!i && typeof f == "function") {
          i = true;
        }
        return f;
      });
      if (i) {
        return () => {
          for (let c = 0; c < l.length; c++) {
            const f = l[c];
            if (typeof f == "function") {
              f();
            } else {
              Yu(r[c], null);
            }
          }
        };
      }
    };
  }
  function xn(...r) {
    return O.useCallback(Ns(...r), r);
  }
  var Qg = Symbol.for("react.lazy");
  var Mo = Gu[" use ".trim().toString()];
  function Xg(r) {
    return typeof r == "object" && r !== null && "then" in r;
  }
  function Ju(r) {
    return r != null && typeof r == "object" && "$$typeof" in r && r.$$typeof === Qg && "_payload" in r && Xg(r._payload);
  }
  function Yg(r) {
    const _Component = Zg(r);
    const i = O.forwardRef((l, c) => {
      let {
        children: f,
        ...p
      } = l;
      if (Ju(f) && typeof Mo == "function") {
        f = Mo(f._payload);
      }
      const m = O.Children.toArray(f);
      const w = m.find(ty);
      if (w) {
        const v = w.props.children;
        const g = m.map(T => T === w ? O.Children.count(v) > 1 ? O.Children.only(null) : O.isValidElement(v) ? v.props.children : null : T);
        return <_Component {...p} ref={c}>{O.isValidElement(v) ? O.cloneElement(v, undefined, g) : null}</_Component>;
      }
      return <_Component {...p} ref={c}>{f}</_Component>;
    });
    i.displayName = `${r}.Slot`;
    return i;
  }
  var Jg = Yg("Slot");
  function Zg(r) {
    const o = O.forwardRef((i, l) => {
      let {
        children: c,
        ...f
      } = i;
      if (Ju(c) && typeof Mo == "function") {
        c = Mo(c._payload);
      }
      if (O.isValidElement(c)) {
        const p = ry(c);
        const m = ny(f, c.props);
        if (c.type !== O.Fragment) {
          m.ref = l ? Ns(l, p) : p;
        }
        return O.cloneElement(c, m);
      }
      if (O.Children.count(c) > 1) {
        return O.Children.only(null);
      } else {
        return null;
      }
    });
    o.displayName = `${r}.SlotClone`;
    return o;
  }
  var ey = Symbol("radix.slottable");
  function ty(r) {
    return O.isValidElement(r) && typeof r.type == "function" && "__radixId" in r.type && r.type.__radixId === ey;
  }
  function ny(r, o) {
    const i = {
      ...o
    };
    for (const l in o) {
      const c = r[l];
      const f = o[l];
      if (/^on[A-Z]/.test(l)) {
        if (c && f) {
          i[l] = (...m) => {
            const w = f(...m);
            c(...m);
            return w;
          };
        } else if (c) {
          i[l] = c;
        }
      } else if (l === "style") {
        i[l] = {
          ...c,
          ...f
        };
      } else if (l === "className") {
        i[l] = [c, f].filter(Boolean).join(" ");
      }
    }
    return {
      ...r,
      ...i
    };
  }
  function ry(r) {
    let o = Object.getOwnPropertyDescriptor(r.props, "ref")?.get;
    let i = o && "isReactWarning" in o && o.isReactWarning;
    if (i) {
      return r.ref;
    } else {
      o = Object.getOwnPropertyDescriptor(r, "ref")?.get;
      i = o && "isReactWarning" in o && o.isReactWarning;
      if (i) {
        return r.props.ref;
      } else {
        return r.props.ref || r.ref;
      }
    }
  }
  function Zu(r) {
    var o;
    var i;
    var l = "";
    if (typeof r == "string" || typeof r == "number") {
      l += r;
    } else if (typeof r == "object") {
      if (Array.isArray(r)) {
        var c = r.length;
        for (o = 0; o < c; o++) {
          if (r[o] && (i = Zu(r[o]))) {
            if (l) {
              l += " ";
            }
            l += i;
          }
        }
      } else {
        for (i in r) {
          if (r[i]) {
            if (l) {
              l += " ";
            }
            l += i;
          }
        }
      }
    }
    return l;
  }
  function ec() {
    var r;
    var o;
    for (var i = 0, l = "", c = arguments.length; i < c; i++) {
      if ((r = arguments[i]) && (o = Zu(r))) {
        if (l) {
          l += " ";
        }
        l += o;
      }
    }
    return l;
  }
  const tc = r => typeof r == "boolean" ? `${r}` : r === 0 ? "0" : r;
  const nc = ec;
  const rc = (r, o) => i => {
    var l;
    if (o?.variants == null) {
      return nc(r, i?.class, i?.className);
    }
    const {
      variants: c,
      defaultVariants: f
    } = o;
    const p = Object.keys(c).map(v => {
      const g = i?.[v];
      const T = f?.[v];
      if (g === null) {
        return null;
      }
      const L = tc(g) || tc(T);
      return c[v][L];
    });
    const m = i && Object.entries(i).reduce((v, g) => {
      let [T, L] = g;
      if (L !== undefined) {
        v[T] = L;
      }
      return v;
    }, {});
    const w = o == null || (l = o.compoundVariants) === null || l === undefined ? undefined : l.reduce((v, g) => {
      let {
        class: T,
        className: L,
        ...B
      } = g;
      if (Object.entries(B).every(C => {
        let [E, y] = C;
        if (Array.isArray(y)) {
          return y.includes({
            ...f,
            ...m
          }[E]);
        } else {
          return {
            ...f,
            ...m
          }[E] === y;
        }
      })) {
        return [...v, T, L];
      } else {
        return v;
      }
    }, []);
    return nc(r, p, w, i?.class, i?.className);
  };
  function Os(r) {
    const o = Object.prototype.toString.call(r);
    if (r instanceof Date || typeof r == "object" && o === "[object Date]") {
      return new r.constructor(+r);
    } else if (typeof r == "number" || o === "[object Number]" || typeof r == "string" || o === "[object String]") {
      return new Date(r);
    } else {
      return new Date(NaN);
    }
  }
  function Do(r, o) {
    if (r instanceof Date) {
      return new r.constructor(o);
    } else {
      return new Date(o);
    }
  }
  function oy(r, o) {
    const i = Os(r);
    if (isNaN(o)) {
      return Do(r, NaN);
    } else {
      if (o) {
        i.setDate(i.getDate() + o);
      }
      return i;
    }
  }
  function iy(r, o) {
    const i = Os(r);
    if (isNaN(o)) {
      return Do(r, NaN);
    }
    const l = i.getDate();
    const c = Do(r, i.getTime());
    c.setMonth(i.getMonth() + o + 1, 0);
    const f = c.getDate();
    if (l >= f) {
      return c;
    } else {
      i.setFullYear(c.getFullYear(), c.getMonth(), l);
      return i;
    }
  }
  function oc(r, o) {
    const i = +Os(r);
    return Do(r, i + o);
  }
  const sy = 60000;
  const ly = 3600000;
  function ay(r, o) {
    return oc(r, o * ly);
  }
  function uy(r, o) {
    return oc(r, o * sy);
  }
  function cy(r, o) {
    return iy(r, o * 12);
  }
  const fy = (r, o) => {
    const i = new Array(r.length + o.length);
    for (let l = 0; l < r.length; l++) {
      i[l] = r[l];
    }
    for (let l = 0; l < o.length; l++) {
      i[r.length + l] = o[l];
    }
    return i;
  };
  const dy = (r, o) => ({
    classGroupId: r,
    validator: o
  });
  const ic = (r = new Map(), o = null, i) => ({
    nextPart: r,
    validators: o,
    classGroupId: i
  });
  const bo = "-";
  const sc = [];
  const py = "arbitrary..";
  const my = r => {
    const o = gy(r);
    const {
      conflictingClassGroups: i,
      conflictingClassGroupModifiers: l
    } = r;
    return {
      getClassGroupId: p => {
        if (p.startsWith("[") && p.endsWith("]")) {
          return hy(p);
        }
        const m = p.split(bo);
        const w = m[0] === "" && m.length > 1 ? 1 : 0;
        return lc(m, w, o);
      },
      getConflictingClassGroupIds: (p, m) => {
        if (m) {
          const w = l[p];
          const v = i[p];
          if (w) {
            if (v) {
              return fy(v, w);
            } else {
              return w;
            }
          } else {
            return v || sc;
          }
        }
        return i[p] || sc;
      }
    };
  };
  const lc = (r, o, i) => {
    if (r.length - o === 0) {
      return i.classGroupId;
    }
    const c = r[o];
    const f = i.nextPart.get(c);
    if (f) {
      const v = lc(r, o + 1, f);
      if (v) {
        return v;
      }
    }
    const p = i.validators;
    if (p === null) {
      return;
    }
    const m = o === 0 ? r.join(bo) : r.slice(o).join(bo);
    const w = p.length;
    for (let v = 0; v < w; v++) {
      const g = p[v];
      if (g.validator(m)) {
        return g.classGroupId;
      }
    }
  };
  const hy = r => r.slice(1, -1).indexOf(":") === -1 ? undefined : (() => {
    const o = r.slice(1, -1);
    const i = o.indexOf(":");
    const l = o.slice(0, i);
    if (l) {
      return py + l;
    } else {
      return undefined;
    }
  })();
  const gy = r => {
    const {
      theme: o,
      classGroups: i
    } = r;
    return yy(i, o);
  };
  const yy = (r, o) => {
    const i = ic();
    for (const l in r) {
      const c = r[l];
      As(c, i, l, o);
    }
    return i;
  };
  const As = (r, o, i, l) => {
    const c = r.length;
    for (let f = 0; f < c; f++) {
      const p = r[f];
      vy(p, o, i, l);
    }
  };
  const vy = (r, o, i, l) => {
    if (typeof r == "string") {
      wy(r, o, i);
      return;
    }
    if (typeof r == "function") {
      Ey(r, o, i, l);
      return;
    }
    Sy(r, o, i, l);
  };
  const wy = (r, o, i) => {
    const l = r === "" ? o : ac(o, r);
    l.classGroupId = i;
  };
  const Ey = (r, o, i, l) => {
    if (xy(r)) {
      As(r(l), o, i, l);
      return;
    }
    if (o.validators === null) {
      o.validators = [];
    }
    o.validators.push(dy(i, r));
  };
  const Sy = (r, o, i, l) => {
    const c = Object.entries(r);
    const f = c.length;
    for (let p = 0; p < f; p++) {
      const [m, w] = c[p];
      As(w, ac(o, m), i, l);
    }
  };
  const ac = (r, o) => {
    let i = r;
    const l = o.split(bo);
    const c = l.length;
    for (let f = 0; f < c; f++) {
      const p = l[f];
      let m = i.nextPart.get(p);
      if (!m) {
        m = ic();
        i.nextPart.set(p, m);
      }
      i = m;
    }
    return i;
  };
  const xy = r => "isThemeGetter" in r && r.isThemeGetter === true;
  const ky = r => {
    if (r < 1) {
      return {
        get: () => {},
        set: () => {}
      };
    }
    let o = 0;
    let i = Object.create(null);
    let l = Object.create(null);
    const c = (f, p) => {
      i[f] = p;
      o++;
      if (o > r) {
        o = 0;
        l = i;
        i = Object.create(null);
      }
    };
    return {
      get(f) {
        let p = i[f];
        if (p !== undefined) {
          return p;
        }
        if ((p = l[f]) !== undefined) {
          c(f, p);
          return p;
        }
      },
      set(f, p) {
        if (f in i) {
          i[f] = p;
        } else {
          c(f, p);
        }
      }
    };
  };
  const Is = "!";
  const uc = ":";
  const Cy = [];
  const cc = (r, o, i, l, c) => ({
    modifiers: r,
    hasImportantModifier: o,
    baseClassName: i,
    maybePostfixModifierPosition: l,
    isExternal: c
  });
  const _y = r => {
    const {
      prefix: o,
      experimentalParseClassName: i
    } = r;
    let l = c => {
      const f = [];
      let p = 0;
      let m = 0;
      let w = 0;
      let v;
      const g = c.length;
      for (let E = 0; E < g; E++) {
        const y = c[E];
        if (p === 0 && m === 0) {
          if (y === uc) {
            f.push(c.slice(w, E));
            w = E + 1;
            continue;
          }
          if (y === "/") {
            v = E;
            continue;
          }
        }
        if (y === "[") {
          p++;
        } else if (y === "]") {
          p--;
        } else if (y === "(") {
          m++;
        } else if (y === ")") {
          m--;
        }
      }
      const T = f.length === 0 ? c : c.slice(w);
      let L = T;
      let B = false;
      if (T.endsWith(Is)) {
        L = T.slice(0, -1);
        B = true;
      } else if (T.startsWith(Is)) {
        L = T.slice(1);
        B = true;
      }
      const C = v && v > w ? v - w : undefined;
      return cc(f, B, L, C);
    };
    if (o) {
      const c = o + uc;
      const f = l;
      l = p => p.startsWith(c) ? f(p.slice(c.length)) : cc(Cy, false, p, undefined, true);
    }
    if (i) {
      const c = l;
      l = f => i({
        className: f,
        parseClassName: c
      });
    }
    return l;
  };
  const Ty = r => {
    const o = new Map();
    r.orderSensitiveModifiers.forEach((i, l) => {
      o.set(i, 1000000 + l);
    });
    return i => {
      const l = [];
      let c = [];
      for (let f = 0; f < i.length; f++) {
        const p = i[f];
        const m = p[0] === "[";
        const w = o.has(p);
        if (m || w) {
          if (c.length > 0) {
            c.sort();
            l.push(...c);
            c = [];
          }
          l.push(p);
        } else {
          c.push(p);
        }
      }
      if (c.length > 0) {
        c.sort();
        l.push(...c);
      }
      return l;
    };
  };
  const Ry = r => ({
    cache: ky(r.cacheSize),
    parseClassName: _y(r),
    sortModifiers: Ty(r),
    ...my(r)
  });
  const Py = /\s+/;
  const Ny = (r, o) => {
    const {
      parseClassName: i,
      getClassGroupId: l,
      getConflictingClassGroupIds: c,
      sortModifiers: f
    } = o;
    const p = [];
    const m = r.trim().split(Py);
    let w = "";
    for (let v = m.length - 1; v >= 0; v -= 1) {
      const g = m[v];
      const {
        isExternal: T,
        modifiers: L,
        hasImportantModifier: B,
        baseClassName: C,
        maybePostfixModifierPosition: E
      } = i(g);
      if (T) {
        w = g + (w.length > 0 ? " " + w : w);
        continue;
      }
      let y = !!E;
      let _ = l(y ? C.substring(0, E) : C);
      if (!_) {
        if (!y) {
          w = g + (w.length > 0 ? " " + w : w);
          continue;
        }
        _ = l(C);
        if (!_) {
          w = g + (w.length > 0 ? " " + w : w);
          continue;
        }
        y = false;
      }
      const N = L.length === 0 ? "" : L.length === 1 ? L[0] : f(L).join(":");
      const b = B ? N + Is : N;
      const D = b + _;
      if (p.indexOf(D) > -1) {
        continue;
      }
      p.push(D);
      const H = c(_, y);
      for (let W = 0; W < H.length; ++W) {
        const q = H[W];
        p.push(b + q);
      }
      w = g + (w.length > 0 ? " " + w : w);
    }
    return w;
  };
  const Oy = (...r) => {
    let o = 0;
    let i;
    let l;
    let c = "";
    while (o < r.length) {
      if ((i = r[o++]) && (l = fc(i))) {
        if (c) {
          c += " ";
        }
        c += l;
      }
    }
    return c;
  };
  const fc = r => {
    if (typeof r == "string") {
      return r;
    }
    let o;
    let i = "";
    for (let l = 0; l < r.length; l++) {
      if (r[l] && (o = fc(r[l]))) {
        if (i) {
          i += " ";
        }
        i += o;
      }
    }
    return i;
  };
  const dc = (r, ...o) => {
    let i;
    let l;
    let c;
    let f;
    const p = w => {
      const v = o.reduce((g, T) => T(g), r());
      i = Ry(v);
      l = i.cache.get;
      c = i.cache.set;
      f = m;
      return m(w);
    };
    const m = w => {
      const v = l(w);
      if (v) {
        return v;
      }
      const g = Ny(w, i);
      c(w, g);
      return g;
    };
    f = p;
    return (...w) => f(Oy(...w));
  };
  const Ay = [];
  const Ue = r => {
    const o = i => i[r] || Ay;
    o.isThemeGetter = true;
    return o;
  };
  const pc = /^\[(?:(\w[\w-]*):)?(.+)\]$/i;
  const mc = /^\((?:(\w[\w-]*):)?(.+)\)$/i;
  const Iy = /^\d+\/\d+$/;
  const Ly = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
  const My = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
  const Dy = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/;
  const by = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
  const Fy = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
  const Vn = r => Iy.test(r);
  const ye = r => !!r && !Number.isNaN(Number(r));
  const Qt = r => !!r && Number.isInteger(Number(r));
  const Ls = r => r.endsWith("%") && ye(r.slice(0, -1));
  const Ft = r => Ly.test(r);
  const zy = () => true;
  const jy = r => My.test(r) && !Dy.test(r);
  const hc = () => false;
  const Uy = r => by.test(r);
  const By = r => Fy.test(r);
  const Vy = r => !Y(r) && !J(r);
  const $y = r => $n(r, Ec, hc);
  const Y = r => pc.test(r);
  const kn = r => $n(r, Sc, jy);
  const Ms = r => $n(r, Gy, ye);
  const gc = r => $n(r, vc, hc);
  const Wy = r => $n(r, wc, By);
  const Fo = r => $n(r, xc, Uy);
  const J = r => mc.test(r);
  const Cr = r => Wn(r, Sc);
  const Ky = r => Wn(r, Qy);
  const yc = r => Wn(r, vc);
  const Hy = r => Wn(r, Ec);
  const qy = r => Wn(r, wc);
  const zo = r => Wn(r, xc, true);
  const $n = (r, o, i) => {
    const l = pc.exec(r);
    if (l) {
      if (l[1]) {
        return o(l[1]);
      } else {
        return i(l[2]);
      }
    } else {
      return false;
    }
  };
  const Wn = (r, o, i = false) => {
    const l = mc.exec(r);
    if (l) {
      if (l[1]) {
        return o(l[1]);
      } else {
        return i;
      }
    } else {
      return false;
    }
  };
  const vc = r => r === "position" || r === "percentage";
  const wc = r => r === "image" || r === "url";
  const Ec = r => r === "length" || r === "size" || r === "bg-size";
  const Sc = r => r === "length";
  const Gy = r => r === "number";
  const Qy = r => r === "family-name";
  const xc = r => r === "shadow";
  const kc = () => {
    const r = Ue("color");
    const o = Ue("font");
    const i = Ue("text");
    const l = Ue("font-weight");
    const c = Ue("tracking");
    const f = Ue("leading");
    const p = Ue("breakpoint");
    const m = Ue("container");
    const w = Ue("spacing");
    const v = Ue("radius");
    const g = Ue("shadow");
    const T = Ue("inset-shadow");
    const L = Ue("text-shadow");
    const B = Ue("drop-shadow");
    const C = Ue("blur");
    const E = Ue("perspective");
    const y = Ue("aspect");
    const _ = Ue("ease");
    const N = Ue("animate");
    const b = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"];
    const D = () => ["center", "top", "bottom", "left", "right", "top-left", "left-top", "top-right", "right-top", "bottom-right", "right-bottom", "bottom-left", "left-bottom"];
    const H = () => [...D(), J, Y];
    const W = () => ["auto", "hidden", "clip", "visible", "scroll"];
    const q = () => ["auto", "contain", "none"];
    const $ = () => [J, Y, w];
    const de = () => [Vn, "full", "auto", ...$()];
    const ue = () => [Qt, "none", "subgrid", J, Y];
    const Te = () => ["auto", {
      span: ["full", Qt, J, Y]
    }, Qt, J, Y];
    const _e = () => [Qt, "auto", J, Y];
    const xe = () => ["auto", "min", "max", "fr", J, Y];
    const oe = () => ["start", "end", "center", "between", "around", "evenly", "stretch", "baseline", "center-safe", "end-safe"];
    const we = () => ["start", "end", "center", "stretch", "center-safe", "end-safe"];
    const se = () => ["auto", ...$()];
    const me = () => [Vn, "auto", "full", "dvw", "dvh", "lvw", "lvh", "svw", "svh", "min", "max", "fit", ...$()];
    const M = () => [r, J, Y];
    const ne = () => [...D(), yc, gc, {
      position: [J, Y]
    }];
    const G = () => ["no-repeat", {
      repeat: ["", "x", "y", "space", "round"]
    }];
    const k = () => ["auto", "cover", "contain", Hy, $y, {
      size: [J, Y]
    }];
    const F = () => [Ls, Cr, kn];
    const Z = () => ["", "none", "full", v, J, Y];
    const ie = () => ["", ye, Cr, kn];
    const he = () => ["solid", "dashed", "dotted", "double"];
    const Ee = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];
    const pe = () => [ye, Ls, yc, gc];
    const ke = () => ["", "none", C, J, Y];
    const Re = () => ["none", ye, J, Y];
    const $e = () => ["none", ye, J, Y];
    const Jt = () => [ye, J, Y];
    const Tn = () => [Vn, "full", ...$()];
    return {
      cacheSize: 500,
      theme: {
        animate: ["spin", "ping", "pulse", "bounce"],
        aspect: ["video"],
        blur: [Ft],
        breakpoint: [Ft],
        color: [zy],
        container: [Ft],
        "drop-shadow": [Ft],
        ease: ["in", "out", "in-out"],
        font: [Vy],
        "font-weight": ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black"],
        "inset-shadow": [Ft],
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose"],
        perspective: ["dramatic", "near", "normal", "midrange", "distant", "none"],
        radius: [Ft],
        shadow: [Ft],
        spacing: ["px", ye],
        text: [Ft],
        "text-shadow": [Ft],
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest"]
      },
      classGroups: {
        aspect: [{
          aspect: ["auto", "square", Vn, Y, J, y]
        }],
        container: ["container"],
        columns: [{
          columns: [ye, Y, J, m]
        }],
        "break-after": [{
          "break-after": b()
        }],
        "break-before": [{
          "break-before": b()
        }],
        "break-inside": [{
          "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
        }],
        "box-decoration": [{
          "box-decoration": ["slice", "clone"]
        }],
        box: [{
          box: ["border", "content"]
        }],
        display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
        sr: ["sr-only", "not-sr-only"],
        float: [{
          float: ["right", "left", "none", "start", "end"]
        }],
        clear: [{
          clear: ["left", "right", "both", "none", "start", "end"]
        }],
        isolation: ["isolate", "isolation-auto"],
        "object-fit": [{
          object: ["contain", "cover", "fill", "none", "scale-down"]
        }],
        "object-position": [{
          object: H()
        }],
        overflow: [{
          overflow: W()
        }],
        "overflow-x": [{
          "overflow-x": W()
        }],
        "overflow-y": [{
          "overflow-y": W()
        }],
        overscroll: [{
          overscroll: q()
        }],
        "overscroll-x": [{
          "overscroll-x": q()
        }],
        "overscroll-y": [{
          "overscroll-y": q()
        }],
        position: ["static", "fixed", "absolute", "relative", "sticky"],
        inset: [{
          inset: de()
        }],
        "inset-x": [{
          "inset-x": de()
        }],
        "inset-y": [{
          "inset-y": de()
        }],
        start: [{
          start: de()
        }],
        end: [{
          end: de()
        }],
        top: [{
          top: de()
        }],
        right: [{
          right: de()
        }],
        bottom: [{
          bottom: de()
        }],
        left: [{
          left: de()
        }],
        visibility: ["visible", "invisible", "collapse"],
        z: [{
          z: [Qt, "auto", J, Y]
        }],
        basis: [{
          basis: [Vn, "full", "auto", m, ...$()]
        }],
        "flex-direction": [{
          flex: ["row", "row-reverse", "col", "col-reverse"]
        }],
        "flex-wrap": [{
          flex: ["nowrap", "wrap", "wrap-reverse"]
        }],
        flex: [{
          flex: [ye, Vn, "auto", "initial", "none", Y]
        }],
        grow: [{
          grow: ["", ye, J, Y]
        }],
        shrink: [{
          shrink: ["", ye, J, Y]
        }],
        order: [{
          order: [Qt, "first", "last", "none", J, Y]
        }],
        "grid-cols": [{
          "grid-cols": ue()
        }],
        "col-start-end": [{
          col: Te()
        }],
        "col-start": [{
          "col-start": _e()
        }],
        "col-end": [{
          "col-end": _e()
        }],
        "grid-rows": [{
          "grid-rows": ue()
        }],
        "row-start-end": [{
          row: Te()
        }],
        "row-start": [{
          "row-start": _e()
        }],
        "row-end": [{
          "row-end": _e()
        }],
        "grid-flow": [{
          "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
        }],
        "auto-cols": [{
          "auto-cols": xe()
        }],
        "auto-rows": [{
          "auto-rows": xe()
        }],
        gap: [{
          gap: $()
        }],
        "gap-x": [{
          "gap-x": $()
        }],
        "gap-y": [{
          "gap-y": $()
        }],
        "justify-content": [{
          justify: [...oe(), "normal"]
        }],
        "justify-items": [{
          "justify-items": [...we(), "normal"]
        }],
        "justify-self": [{
          "justify-self": ["auto", ...we()]
        }],
        "align-content": [{
          content: ["normal", ...oe()]
        }],
        "align-items": [{
          items: [...we(), {
            baseline: ["", "last"]
          }]
        }],
        "align-self": [{
          self: ["auto", ...we(), {
            baseline: ["", "last"]
          }]
        }],
        "place-content": [{
          "place-content": oe()
        }],
        "place-items": [{
          "place-items": [...we(), "baseline"]
        }],
        "place-self": [{
          "place-self": ["auto", ...we()]
        }],
        p: [{
          p: $()
        }],
        px: [{
          px: $()
        }],
        py: [{
          py: $()
        }],
        ps: [{
          ps: $()
        }],
        pe: [{
          pe: $()
        }],
        pt: [{
          pt: $()
        }],
        pr: [{
          pr: $()
        }],
        pb: [{
          pb: $()
        }],
        pl: [{
          pl: $()
        }],
        m: [{
          m: se()
        }],
        mx: [{
          mx: se()
        }],
        my: [{
          my: se()
        }],
        ms: [{
          ms: se()
        }],
        me: [{
          me: se()
        }],
        mt: [{
          mt: se()
        }],
        mr: [{
          mr: se()
        }],
        mb: [{
          mb: se()
        }],
        ml: [{
          ml: se()
        }],
        "space-x": [{
          "space-x": $()
        }],
        "space-x-reverse": ["space-x-reverse"],
        "space-y": [{
          "space-y": $()
        }],
        "space-y-reverse": ["space-y-reverse"],
        size: [{
          size: me()
        }],
        w: [{
          w: [m, "screen", ...me()]
        }],
        "min-w": [{
          "min-w": [m, "screen", "none", ...me()]
        }],
        "max-w": [{
          "max-w": [m, "screen", "none", "prose", {
            screen: [p]
          }, ...me()]
        }],
        h: [{
          h: ["screen", "lh", ...me()]
        }],
        "min-h": [{
          "min-h": ["screen", "lh", "none", ...me()]
        }],
        "max-h": [{
          "max-h": ["screen", "lh", ...me()]
        }],
        "font-size": [{
          text: ["base", i, Cr, kn]
        }],
        "font-smoothing": ["antialiased", "subpixel-antialiased"],
        "font-style": ["italic", "not-italic"],
        "font-weight": [{
          font: [l, J, Ms]
        }],
        "font-stretch": [{
          "font-stretch": ["ultra-condensed", "extra-condensed", "condensed", "semi-condensed", "normal", "semi-expanded", "expanded", "extra-expanded", "ultra-expanded", Ls, Y]
        }],
        "font-family": [{
          font: [Ky, Y, o]
        }],
        "fvn-normal": ["normal-nums"],
        "fvn-ordinal": ["ordinal"],
        "fvn-slashed-zero": ["slashed-zero"],
        "fvn-figure": ["lining-nums", "oldstyle-nums"],
        "fvn-spacing": ["proportional-nums", "tabular-nums"],
        "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
        tracking: [{
          tracking: [c, J, Y]
        }],
        "line-clamp": [{
          "line-clamp": [ye, "none", J, Ms]
        }],
        leading: [{
          leading: [f, ...$()]
        }],
        "list-image": [{
          "list-image": ["none", J, Y]
        }],
        "list-style-position": [{
          list: ["inside", "outside"]
        }],
        "list-style-type": [{
          list: ["disc", "decimal", "none", J, Y]
        }],
        "text-alignment": [{
          text: ["left", "center", "right", "justify", "start", "end"]
        }],
        "placeholder-color": [{
          placeholder: M()
        }],
        "text-color": [{
          text: M()
        }],
        "text-decoration": ["underline", "overline", "line-through", "no-underline"],
        "text-decoration-style": [{
          decoration: [...he(), "wavy"]
        }],
        "text-decoration-thickness": [{
          decoration: [ye, "from-font", "auto", J, kn]
        }],
        "text-decoration-color": [{
          decoration: M()
        }],
        "underline-offset": [{
          "underline-offset": [ye, "auto", J, Y]
        }],
        "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
        "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
        "text-wrap": [{
          text: ["wrap", "nowrap", "balance", "pretty"]
        }],
        indent: [{
          indent: $()
        }],
        "vertical-align": [{
          align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", J, Y]
        }],
        whitespace: [{
          whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
        }],
        break: [{
          break: ["normal", "words", "all", "keep"]
        }],
        wrap: [{
          wrap: ["break-word", "anywhere", "normal"]
        }],
        hyphens: [{
          hyphens: ["none", "manual", "auto"]
        }],
        content: [{
          content: ["none", J, Y]
        }],
        "bg-attachment": [{
          bg: ["fixed", "local", "scroll"]
        }],
        "bg-clip": [{
          "bg-clip": ["border", "padding", "content", "text"]
        }],
        "bg-origin": [{
          "bg-origin": ["border", "padding", "content"]
        }],
        "bg-position": [{
          bg: ne()
        }],
        "bg-repeat": [{
          bg: G()
        }],
        "bg-size": [{
          bg: k()
        }],
        "bg-image": [{
          bg: ["none", {
            linear: [{
              to: ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
            }, Qt, J, Y],
            radial: ["", J, Y],
            conic: [Qt, J, Y]
          }, qy, Wy]
        }],
        "bg-color": [{
          bg: M()
        }],
        "gradient-from-pos": [{
          from: F()
        }],
        "gradient-via-pos": [{
          via: F()
        }],
        "gradient-to-pos": [{
          to: F()
        }],
        "gradient-from": [{
          from: M()
        }],
        "gradient-via": [{
          via: M()
        }],
        "gradient-to": [{
          to: M()
        }],
        rounded: [{
          rounded: Z()
        }],
        "rounded-s": [{
          "rounded-s": Z()
        }],
        "rounded-e": [{
          "rounded-e": Z()
        }],
        "rounded-t": [{
          "rounded-t": Z()
        }],
        "rounded-r": [{
          "rounded-r": Z()
        }],
        "rounded-b": [{
          "rounded-b": Z()
        }],
        "rounded-l": [{
          "rounded-l": Z()
        }],
        "rounded-ss": [{
          "rounded-ss": Z()
        }],
        "rounded-se": [{
          "rounded-se": Z()
        }],
        "rounded-ee": [{
          "rounded-ee": Z()
        }],
        "rounded-es": [{
          "rounded-es": Z()
        }],
        "rounded-tl": [{
          "rounded-tl": Z()
        }],
        "rounded-tr": [{
          "rounded-tr": Z()
        }],
        "rounded-br": [{
          "rounded-br": Z()
        }],
        "rounded-bl": [{
          "rounded-bl": Z()
        }],
        "border-w": [{
          border: ie()
        }],
        "border-w-x": [{
          "border-x": ie()
        }],
        "border-w-y": [{
          "border-y": ie()
        }],
        "border-w-s": [{
          "border-s": ie()
        }],
        "border-w-e": [{
          "border-e": ie()
        }],
        "border-w-t": [{
          "border-t": ie()
        }],
        "border-w-r": [{
          "border-r": ie()
        }],
        "border-w-b": [{
          "border-b": ie()
        }],
        "border-w-l": [{
          "border-l": ie()
        }],
        "divide-x": [{
          "divide-x": ie()
        }],
        "divide-x-reverse": ["divide-x-reverse"],
        "divide-y": [{
          "divide-y": ie()
        }],
        "divide-y-reverse": ["divide-y-reverse"],
        "border-style": [{
          border: [...he(), "hidden", "none"]
        }],
        "divide-style": [{
          divide: [...he(), "hidden", "none"]
        }],
        "border-color": [{
          border: M()
        }],
        "border-color-x": [{
          "border-x": M()
        }],
        "border-color-y": [{
          "border-y": M()
        }],
        "border-color-s": [{
          "border-s": M()
        }],
        "border-color-e": [{
          "border-e": M()
        }],
        "border-color-t": [{
          "border-t": M()
        }],
        "border-color-r": [{
          "border-r": M()
        }],
        "border-color-b": [{
          "border-b": M()
        }],
        "border-color-l": [{
          "border-l": M()
        }],
        "divide-color": [{
          divide: M()
        }],
        "outline-style": [{
          outline: [...he(), "none", "hidden"]
        }],
        "outline-offset": [{
          "outline-offset": [ye, J, Y]
        }],
        "outline-w": [{
          outline: ["", ye, Cr, kn]
        }],
        "outline-color": [{
          outline: M()
        }],
        shadow: [{
          shadow: ["", "none", g, zo, Fo]
        }],
        "shadow-color": [{
          shadow: M()
        }],
        "inset-shadow": [{
          "inset-shadow": ["none", T, zo, Fo]
        }],
        "inset-shadow-color": [{
          "inset-shadow": M()
        }],
        "ring-w": [{
          ring: ie()
        }],
        "ring-w-inset": ["ring-inset"],
        "ring-color": [{
          ring: M()
        }],
        "ring-offset-w": [{
          "ring-offset": [ye, kn]
        }],
        "ring-offset-color": [{
          "ring-offset": M()
        }],
        "inset-ring-w": [{
          "inset-ring": ie()
        }],
        "inset-ring-color": [{
          "inset-ring": M()
        }],
        "text-shadow": [{
          "text-shadow": ["none", L, zo, Fo]
        }],
        "text-shadow-color": [{
          "text-shadow": M()
        }],
        opacity: [{
          opacity: [ye, J, Y]
        }],
        "mix-blend": [{
          "mix-blend": [...Ee(), "plus-darker", "plus-lighter"]
        }],
        "bg-blend": [{
          "bg-blend": Ee()
        }],
        "mask-clip": [{
          "mask-clip": ["border", "padding", "content", "fill", "stroke", "view"]
        }, "mask-no-clip"],
        "mask-composite": [{
          mask: ["add", "subtract", "intersect", "exclude"]
        }],
        "mask-image-linear-pos": [{
          "mask-linear": [ye]
        }],
        "mask-image-linear-from-pos": [{
          "mask-linear-from": pe()
        }],
        "mask-image-linear-to-pos": [{
          "mask-linear-to": pe()
        }],
        "mask-image-linear-from-color": [{
          "mask-linear-from": M()
        }],
        "mask-image-linear-to-color": [{
          "mask-linear-to": M()
        }],
        "mask-image-t-from-pos": [{
          "mask-t-from": pe()
        }],
        "mask-image-t-to-pos": [{
          "mask-t-to": pe()
        }],
        "mask-image-t-from-color": [{
          "mask-t-from": M()
        }],
        "mask-image-t-to-color": [{
          "mask-t-to": M()
        }],
        "mask-image-r-from-pos": [{
          "mask-r-from": pe()
        }],
        "mask-image-r-to-pos": [{
          "mask-r-to": pe()
        }],
        "mask-image-r-from-color": [{
          "mask-r-from": M()
        }],
        "mask-image-r-to-color": [{
          "mask-r-to": M()
        }],
        "mask-image-b-from-pos": [{
          "mask-b-from": pe()
        }],
        "mask-image-b-to-pos": [{
          "mask-b-to": pe()
        }],
        "mask-image-b-from-color": [{
          "mask-b-from": M()
        }],
        "mask-image-b-to-color": [{
          "mask-b-to": M()
        }],
        "mask-image-l-from-pos": [{
          "mask-l-from": pe()
        }],
        "mask-image-l-to-pos": [{
          "mask-l-to": pe()
        }],
        "mask-image-l-from-color": [{
          "mask-l-from": M()
        }],
        "mask-image-l-to-color": [{
          "mask-l-to": M()
        }],
        "mask-image-x-from-pos": [{
          "mask-x-from": pe()
        }],
        "mask-image-x-to-pos": [{
          "mask-x-to": pe()
        }],
        "mask-image-x-from-color": [{
          "mask-x-from": M()
        }],
        "mask-image-x-to-color": [{
          "mask-x-to": M()
        }],
        "mask-image-y-from-pos": [{
          "mask-y-from": pe()
        }],
        "mask-image-y-to-pos": [{
          "mask-y-to": pe()
        }],
        "mask-image-y-from-color": [{
          "mask-y-from": M()
        }],
        "mask-image-y-to-color": [{
          "mask-y-to": M()
        }],
        "mask-image-radial": [{
          "mask-radial": [J, Y]
        }],
        "mask-image-radial-from-pos": [{
          "mask-radial-from": pe()
        }],
        "mask-image-radial-to-pos": [{
          "mask-radial-to": pe()
        }],
        "mask-image-radial-from-color": [{
          "mask-radial-from": M()
        }],
        "mask-image-radial-to-color": [{
          "mask-radial-to": M()
        }],
        "mask-image-radial-shape": [{
          "mask-radial": ["circle", "ellipse"]
        }],
        "mask-image-radial-size": [{
          "mask-radial": [{
            closest: ["side", "corner"],
            farthest: ["side", "corner"]
          }]
        }],
        "mask-image-radial-pos": [{
          "mask-radial-at": D()
        }],
        "mask-image-conic-pos": [{
          "mask-conic": [ye]
        }],
        "mask-image-conic-from-pos": [{
          "mask-conic-from": pe()
        }],
        "mask-image-conic-to-pos": [{
          "mask-conic-to": pe()
        }],
        "mask-image-conic-from-color": [{
          "mask-conic-from": M()
        }],
        "mask-image-conic-to-color": [{
          "mask-conic-to": M()
        }],
        "mask-mode": [{
          mask: ["alpha", "luminance", "match"]
        }],
        "mask-origin": [{
          "mask-origin": ["border", "padding", "content", "fill", "stroke", "view"]
        }],
        "mask-position": [{
          mask: ne()
        }],
        "mask-repeat": [{
          mask: G()
        }],
        "mask-size": [{
          mask: k()
        }],
        "mask-type": [{
          "mask-type": ["alpha", "luminance"]
        }],
        "mask-image": [{
          mask: ["none", J, Y]
        }],
        filter: [{
          filter: ["", "none", J, Y]
        }],
        blur: [{
          blur: ke()
        }],
        brightness: [{
          brightness: [ye, J, Y]
        }],
        contrast: [{
          contrast: [ye, J, Y]
        }],
        "drop-shadow": [{
          "drop-shadow": ["", "none", B, zo, Fo]
        }],
        "drop-shadow-color": [{
          "drop-shadow": M()
        }],
        grayscale: [{
          grayscale: ["", ye, J, Y]
        }],
        "hue-rotate": [{
          "hue-rotate": [ye, J, Y]
        }],
        invert: [{
          invert: ["", ye, J, Y]
        }],
        saturate: [{
          saturate: [ye, J, Y]
        }],
        sepia: [{
          sepia: ["", ye, J, Y]
        }],
        "backdrop-filter": [{
          "backdrop-filter": ["", "none", J, Y]
        }],
        "backdrop-blur": [{
          "backdrop-blur": ke()
        }],
        "backdrop-brightness": [{
          "backdrop-brightness": [ye, J, Y]
        }],
        "backdrop-contrast": [{
          "backdrop-contrast": [ye, J, Y]
        }],
        "backdrop-grayscale": [{
          "backdrop-grayscale": ["", ye, J, Y]
        }],
        "backdrop-hue-rotate": [{
          "backdrop-hue-rotate": [ye, J, Y]
        }],
        "backdrop-invert": [{
          "backdrop-invert": ["", ye, J, Y]
        }],
        "backdrop-opacity": [{
          "backdrop-opacity": [ye, J, Y]
        }],
        "backdrop-saturate": [{
          "backdrop-saturate": [ye, J, Y]
        }],
        "backdrop-sepia": [{
          "backdrop-sepia": ["", ye, J, Y]
        }],
        "border-collapse": [{
          border: ["collapse", "separate"]
        }],
        "border-spacing": [{
          "border-spacing": $()
        }],
        "border-spacing-x": [{
          "border-spacing-x": $()
        }],
        "border-spacing-y": [{
          "border-spacing-y": $()
        }],
        "table-layout": [{
          table: ["auto", "fixed"]
        }],
        caption: [{
          caption: ["top", "bottom"]
        }],
        transition: [{
          transition: ["", "all", "colors", "opacity", "shadow", "transform", "none", J, Y]
        }],
        "transition-behavior": [{
          transition: ["normal", "discrete"]
        }],
        duration: [{
          duration: [ye, "initial", J, Y]
        }],
        ease: [{
          ease: ["linear", "initial", _, J, Y]
        }],
        delay: [{
          delay: [ye, J, Y]
        }],
        animate: [{
          animate: ["none", N, J, Y]
        }],
        backface: [{
          backface: ["hidden", "visible"]
        }],
        perspective: [{
          perspective: [E, J, Y]
        }],
        "perspective-origin": [{
          "perspective-origin": H()
        }],
        rotate: [{
          rotate: Re()
        }],
        "rotate-x": [{
          "rotate-x": Re()
        }],
        "rotate-y": [{
          "rotate-y": Re()
        }],
        "rotate-z": [{
          "rotate-z": Re()
        }],
        scale: [{
          scale: $e()
        }],
        "scale-x": [{
          "scale-x": $e()
        }],
        "scale-y": [{
          "scale-y": $e()
        }],
        "scale-z": [{
          "scale-z": $e()
        }],
        "scale-3d": ["scale-3d"],
        skew: [{
          skew: Jt()
        }],
        "skew-x": [{
          "skew-x": Jt()
        }],
        "skew-y": [{
          "skew-y": Jt()
        }],
        transform: [{
          transform: [J, Y, "", "none", "gpu", "cpu"]
        }],
        "transform-origin": [{
          origin: H()
        }],
        "transform-style": [{
          transform: ["3d", "flat"]
        }],
        translate: [{
          translate: Tn()
        }],
        "translate-x": [{
          "translate-x": Tn()
        }],
        "translate-y": [{
          "translate-y": Tn()
        }],
        "translate-z": [{
          "translate-z": Tn()
        }],
        "translate-none": ["translate-none"],
        accent: [{
          accent: M()
        }],
        appearance: [{
          appearance: ["none", "auto"]
        }],
        "caret-color": [{
          caret: M()
        }],
        "color-scheme": [{
          scheme: ["normal", "dark", "light", "light-dark", "only-dark", "only-light"]
        }],
        cursor: [{
          cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", J, Y]
        }],
        "field-sizing": [{
          "field-sizing": ["fixed", "content"]
        }],
        "pointer-events": [{
          "pointer-events": ["auto", "none"]
        }],
        resize: [{
          resize: ["none", "", "y", "x"]
        }],
        "scroll-behavior": [{
          scroll: ["auto", "smooth"]
        }],
        "scroll-m": [{
          "scroll-m": $()
        }],
        "scroll-mx": [{
          "scroll-mx": $()
        }],
        "scroll-my": [{
          "scroll-my": $()
        }],
        "scroll-ms": [{
          "scroll-ms": $()
        }],
        "scroll-me": [{
          "scroll-me": $()
        }],
        "scroll-mt": [{
          "scroll-mt": $()
        }],
        "scroll-mr": [{
          "scroll-mr": $()
        }],
        "scroll-mb": [{
          "scroll-mb": $()
        }],
        "scroll-ml": [{
          "scroll-ml": $()
        }],
        "scroll-p": [{
          "scroll-p": $()
        }],
        "scroll-px": [{
          "scroll-px": $()
        }],
        "scroll-py": [{
          "scroll-py": $()
        }],
        "scroll-ps": [{
          "scroll-ps": $()
        }],
        "scroll-pe": [{
          "scroll-pe": $()
        }],
        "scroll-pt": [{
          "scroll-pt": $()
        }],
        "scroll-pr": [{
          "scroll-pr": $()
        }],
        "scroll-pb": [{
          "scroll-pb": $()
        }],
        "scroll-pl": [{
          "scroll-pl": $()
        }],
        "snap-align": [{
          snap: ["start", "end", "center", "align-none"]
        }],
        "snap-stop": [{
          snap: ["normal", "always"]
        }],
        "snap-type": [{
          snap: ["none", "x", "y", "both"]
        }],
        "snap-strictness": [{
          snap: ["mandatory", "proximity"]
        }],
        touch: [{
          touch: ["auto", "none", "manipulation"]
        }],
        "touch-x": [{
          "touch-pan": ["x", "left", "right"]
        }],
        "touch-y": [{
          "touch-pan": ["y", "up", "down"]
        }],
        "touch-pz": ["touch-pinch-zoom"],
        select: [{
          select: ["none", "text", "all", "auto"]
        }],
        "will-change": [{
          "will-change": ["auto", "scroll", "contents", "transform", J, Y]
        }],
        fill: [{
          fill: ["none", ...M()]
        }],
        "stroke-w": [{
          stroke: [ye, Cr, kn, Ms]
        }],
        stroke: [{
          stroke: ["none", ...M()]
        }],
        "forced-color-adjust": [{
          "forced-color-adjust": ["auto", "none"]
        }]
      },
      conflictingClassGroups: {
        overflow: ["overflow-x", "overflow-y"],
        overscroll: ["overscroll-x", "overscroll-y"],
        inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
        "inset-x": ["right", "left"],
        "inset-y": ["top", "bottom"],
        flex: ["basis", "grow", "shrink"],
        gap: ["gap-x", "gap-y"],
        p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
        px: ["pr", "pl"],
        py: ["pt", "pb"],
        m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
        mx: ["mr", "ml"],
        my: ["mt", "mb"],
        size: ["w", "h"],
        "font-size": ["leading"],
        "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
        "fvn-ordinal": ["fvn-normal"],
        "fvn-slashed-zero": ["fvn-normal"],
        "fvn-figure": ["fvn-normal"],
        "fvn-spacing": ["fvn-normal"],
        "fvn-fraction": ["fvn-normal"],
        "line-clamp": ["display", "overflow"],
        rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
        "rounded-s": ["rounded-ss", "rounded-es"],
        "rounded-e": ["rounded-se", "rounded-ee"],
        "rounded-t": ["rounded-tl", "rounded-tr"],
        "rounded-r": ["rounded-tr", "rounded-br"],
        "rounded-b": ["rounded-br", "rounded-bl"],
        "rounded-l": ["rounded-tl", "rounded-bl"],
        "border-spacing": ["border-spacing-x", "border-spacing-y"],
        "border-w": ["border-w-x", "border-w-y", "border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
        "border-w-x": ["border-w-r", "border-w-l"],
        "border-w-y": ["border-w-t", "border-w-b"],
        "border-color": ["border-color-x", "border-color-y", "border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
        "border-color-x": ["border-color-r", "border-color-l"],
        "border-color-y": ["border-color-t", "border-color-b"],
        translate: ["translate-x", "translate-y", "translate-none"],
        "translate-none": ["translate", "translate-x", "translate-y", "translate-z"],
        "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
        "scroll-mx": ["scroll-mr", "scroll-ml"],
        "scroll-my": ["scroll-mt", "scroll-mb"],
        "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
        "scroll-px": ["scroll-pr", "scroll-pl"],
        "scroll-py": ["scroll-pt", "scroll-pb"],
        touch: ["touch-x", "touch-y", "touch-pz"],
        "touch-x": ["touch"],
        "touch-y": ["touch"],
        "touch-pz": ["touch"]
      },
      conflictingClassGroupModifiers: {
        "font-size": ["leading"]
      },
      orderSensitiveModifiers: ["*", "**", "after", "backdrop", "before", "details-content", "file", "first-letter", "first-line", "marker", "placeholder", "selection"]
    };
  };
  const Xy = (r, {
    cacheSize: o,
    prefix: i,
    experimentalParseClassName: l,
    extend: c = {},
    override: f = {}
  }) => {
    _r(r, "cacheSize", o);
    _r(r, "prefix", i);
    _r(r, "experimentalParseClassName", l);
    jo(r.theme, f.theme);
    jo(r.classGroups, f.classGroups);
    jo(r.conflictingClassGroups, f.conflictingClassGroups);
    jo(r.conflictingClassGroupModifiers, f.conflictingClassGroupModifiers);
    _r(r, "orderSensitiveModifiers", f.orderSensitiveModifiers);
    Uo(r.theme, c.theme);
    Uo(r.classGroups, c.classGroups);
    Uo(r.conflictingClassGroups, c.conflictingClassGroups);
    Uo(r.conflictingClassGroupModifiers, c.conflictingClassGroupModifiers);
    Cc(r, c, "orderSensitiveModifiers");
    return r;
  };
  const _r = (r, o, i) => {
    if (i !== undefined) {
      r[o] = i;
    }
  };
  const jo = (r, o) => {
    if (o) {
      for (const i in o) {
        _r(r, i, o[i]);
      }
    }
  };
  const Uo = (r, o) => {
    if (o) {
      for (const i in o) {
        Cc(r, o, i);
      }
    }
  };
  const Cc = (r, o, i) => {
    const l = o[i];
    if (l !== undefined) {
      r[i] = r[i] ? r[i].concat(l) : l;
    }
  };
  const Yy = (r, ...o) => typeof r == "function" ? dc(kc, r, ...o) : dc(() => Xy(kc(), r), ...o);
  function Jy(r) {
    return {
      id: r.id,
      login: r.login,
      email: r.email,
      total_items_count: r.total_items_count,
      city: r.city,
      country_id: r.country_id,
      country_title: r.country_title,
      country_code: r.country_code,
      photo: r.photo,
      business: r.business
    };
  }
  function Zy({
    email: r,
    password: o
  }) {
    return Rg.post("/users/log_in", {
      user: {
        email: r,
        password: o
      }
    }).then(i => {
      if (i.data && i.data.token) {
        return i.data;
      }
    });
  }
  function ev() {
    return qt.delete("/users/log_out");
  }
  function _c() {
    return qt.get("/vinted/entitlements").then(r => r.data.data);
  }
  function Tc(r) {
    const o = Jy(r);
    return qt.post("/vinted/accounts", {
      account: o
    }).then(i => i.data.data);
  }
  function tv(r) {
    return qt.get(`/vinted/accounts/${r}`).then(o => o.data.data);
  }
  function Rc() {
    return qt.get("/extension/settings").then(r => r.data.data);
  }
  Hm.map(r => new URL(r).host);
  const {
    host: x1
  } = new URL(qm);
  const {
    host: k1
  } = new URL(Gm);
  function nv(r) {
    return qt.post("/vinted/ai/generate_listing", r).then(o => o.data.data);
  }
  const rv = Yy({
    prefix: "tw"
  });
  function Cn(...r) {
    return rv(ec(r));
  }
  const ov = rc("tw:inline-flex tw:items-center tw:justify-center tw:whitespace-nowrap tw:rounded-md tw:text-sm tw:font-medium tw:ring-offset-background tw:transition-colors tw:focus-visible:outline-hidden tw:focus-visible:ring-2 tw:focus-visible:ring-ring tw:focus-visible:ring-offset-2 tw:disabled:pointer-events-none tw:disabled:opacity-50", {
    variants: {
      variant: {
        default: "tw:bg-primary tw:text-primary-foreground tw:hover:bg-primary/90",
        destructive: "tw:bg-destructive tw:text-destructive-foreground tw:hover:bg-destructive/90",
        outline: "tw:border tw:text-primary tw:border-input tw:bg-background tw:hover:bg-accent tw:hover:text-accent-foreground",
        secondary: "tw:bg-secondary tw:text-secondary-foreground hover:bg-secondary/80",
        ghost: "tw:hover:bg-accent tw:hover:text-accent-foreground",
        link: "tw:text-primary tw:underline-offset-4 tw:hover:underline"
      },
      size: {
        default: "tw:h-10 tw:px-4 tw:py-2",
        sm: "tw:h-9 tw:rounded-md tw:px-3",
        lg: "tw:h-11 tw:rounded-md tw:px-8",
        icon: "tw:h-10 tw:w-10",
        icon_wide: "tw:h-10 tw:gap-1 tw:px-3"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  });
  const Pc = O.forwardRef(({
    className: r,
    variant: o,
    size: i,
    asChild: l = false,
    ...c
  }, f) => {
    const _Component2 = l ? Jg : "button";
    return <_Component2 className={Cn(ov({
      variant: o,
      size: i,
      className: r
    }))} ref={f} {...c} />;
  });
  Pc.displayName = "Button";
  var Ds = nu();
  const iv = ls(Ds);
  function ct(r, o, {
    checkForDefaultPrevented: i = true
  } = {}) {
    return function (c) {
      r?.(c);
      if (i === false || !c.defaultPrevented) {
        return o?.(c);
      }
    };
  }
  function Nc(r, o = []) {
    let i = [];
    function l(f, p) {
      const m = O.createContext(p);
      const w = i.length;
      i = [...i, p];
      const v = T => {
        const {
          scope: L,
          children: B,
          ...C
        } = T;
        const E = L?.[r]?.[w] || m;
        const y = O.useMemo(() => C, Object.values(C));
        return <E.Provider value={y}>{B}</E.Provider>;
      };
      v.displayName = f + "Provider";
      function g(T, L) {
        const B = L?.[r]?.[w] || m;
        const C = O.useContext(B);
        if (C) {
          return C;
        }
        if (p !== undefined) {
          return p;
        }
        throw new Error(`\`${T}\` must be used within \`${f}\``);
      }
      return [v, g];
    }
    const c = () => {
      const f = i.map(p => O.createContext(p));
      return function (m) {
        const w = m?.[r] || f;
        return O.useMemo(() => ({
          [`__scope${r}`]: {
            ...m,
            [r]: w
          }
        }), [m, w]);
      };
    };
    c.scopeName = r;
    return [l, sv(c, ...o)];
  }
  function sv(...r) {
    const o = r[0];
    if (r.length === 1) {
      return o;
    }
    const i = () => {
      const l = r.map(c => ({
        useScope: c(),
        scopeName: c.scopeName
      }));
      return function (f) {
        const p = l.reduce((m, {
          useScope: w,
          scopeName: v
        }) => {
          const T = w(f)[`__scope${v}`];
          return {
            ...m,
            ...T
          };
        }, {});
        return O.useMemo(() => ({
          [`__scope${o.scopeName}`]: p
        }), [p]);
      };
    };
    i.scopeName = o.scopeName;
    return i;
  }
  function bs(r) {
    const _Component3 = lv(r);
    const i = O.forwardRef((l, c) => {
      const {
        children: f,
        ...p
      } = l;
      const m = O.Children.toArray(f);
      const w = m.find(uv);
      if (w) {
        const v = w.props.children;
        const g = m.map(T => T === w ? O.Children.count(v) > 1 ? O.Children.only(null) : O.isValidElement(v) ? v.props.children : null : T);
        return <_Component3 {...p} ref={c}>{O.isValidElement(v) ? O.cloneElement(v, undefined, g) : null}</_Component3>;
      }
      return <_Component3 {...p} ref={c}>{f}</_Component3>;
    });
    i.displayName = `${r}.Slot`;
    return i;
  }
  function lv(r) {
    const o = O.forwardRef((i, l) => {
      const {
        children: c,
        ...f
      } = i;
      if (O.isValidElement(c)) {
        const p = fv(c);
        const m = cv(f, c.props);
        if (c.type !== O.Fragment) {
          m.ref = l ? Ns(l, p) : p;
        }
        return O.cloneElement(c, m);
      }
      if (O.Children.count(c) > 1) {
        return O.Children.only(null);
      } else {
        return null;
      }
    });
    o.displayName = `${r}.SlotClone`;
    return o;
  }
  var av = Symbol("radix.slottable");
  function uv(r) {
    return O.isValidElement(r) && typeof r.type == "function" && "__radixId" in r.type && r.type.__radixId === av;
  }
  function cv(r, o) {
    const i = {
      ...o
    };
    for (const l in o) {
      const c = r[l];
      const f = o[l];
      if (/^on[A-Z]/.test(l)) {
        if (c && f) {
          i[l] = (...m) => {
            const w = f(...m);
            c(...m);
            return w;
          };
        } else if (c) {
          i[l] = c;
        }
      } else if (l === "style") {
        i[l] = {
          ...c,
          ...f
        };
      } else if (l === "className") {
        i[l] = [c, f].filter(Boolean).join(" ");
      }
    }
    return {
      ...r,
      ...i
    };
  }
  function fv(r) {
    let o = Object.getOwnPropertyDescriptor(r.props, "ref")?.get;
    let i = o && "isReactWarning" in o && o.isReactWarning;
    if (i) {
      return r.ref;
    } else {
      o = Object.getOwnPropertyDescriptor(r, "ref")?.get;
      i = o && "isReactWarning" in o && o.isReactWarning;
      if (i) {
        return r.props.ref;
      } else {
        return r.props.ref || r.ref;
      }
    }
  }
  function dv(r) {
    const o = r + "CollectionProvider";
    const [i, l] = Nc(o);
    const [_Component4, f] = i(o, {
      collectionRef: {
        current: null
      },
      itemMap: new Map()
    });
    const p = E => {
      const {
        scope: y,
        children: _
      } = E;
      const N = Gt.useRef(null);
      const b = Gt.useRef(new Map()).current;
      return <_Component4 scope={y} itemMap={b} collectionRef={N}>{_}</_Component4>;
    };
    p.displayName = o;
    const m = r + "CollectionSlot";
    const _Component5 = bs(m);
    const v = Gt.forwardRef((E, y) => {
      const {
        scope: _,
        children: N
      } = E;
      const b = f(m, _);
      const D = xn(y, b.collectionRef);
      return <_Component5 ref={D}>{N}</_Component5>;
    });
    v.displayName = m;
    const g = r + "CollectionItemSlot";
    const T = "data-radix-collection-item";
    const L = bs(g);
    const B = Gt.forwardRef((E, y) => {
      const {
        scope: _,
        children: N,
        ...b
      } = E;
      const D = Gt.useRef(null);
      const H = xn(y, D);
      const W = f(g, _);
      Gt.useEffect(() => {
        W.itemMap.set(D, {
          ref: D,
          ...b
        });
        return () => {
          W.itemMap.delete(D);
        };
      });
      return <L T="" ref={H}>{N}</L>;
    });
    B.displayName = g;
    function C(E) {
      const y = f(r + "CollectionConsumer", E);
      return Gt.useCallback(() => {
        const N = y.collectionRef.current;
        if (!N) {
          return [];
        }
        const b = Array.from(N.querySelectorAll(`[${T}]`));
        return Array.from(y.itemMap.values()).sort((W, q) => b.indexOf(W.ref.current) - b.indexOf(q.ref.current));
      }, [y.collectionRef, y.itemMap]);
    }
    return [{
      Provider: p,
      Slot: v,
      ItemSlot: B
    }, C, l];
  }
  var pv = ["a", "button", "div", "form", "h2", "h3", "img", "input", "label", "li", "nav", "ol", "p", "select", "span", "svg", "ul"];
  var At = pv.reduce((r, o) => {
    const i = bs(`Primitive.${o}`);
    const l = O.forwardRef((c, f) => {
      const {
        asChild: p,
        ...m
      } = c;
      const _Component6 = p ? i : o;
      if (typeof window !== "undefined") {
        window[Symbol.for("radix-ui")] = true;
      }
      return <_Component6 {...m} ref={f} />;
    });
    l.displayName = `Primitive.${o}`;
    return {
      ...r,
      [o]: l
    };
  }, {});
  function Oc(r, o) {
    if (r) {
      Ds.flushSync(() => r.dispatchEvent(o));
    }
  }
  function _n(r) {
    const o = O.useRef(r);
    O.useEffect(() => {
      o.current = r;
    });
    return O.useMemo(() => (...i) => o.current?.(...i), []);
  }
  function mv(r, o = globalThis?.document) {
    const i = _n(r);
    O.useEffect(() => {
      const l = c => {
        if (c.key === "Escape") {
          i(c);
        }
      };
      o.addEventListener("keydown", l, {
        capture: true
      });
      return () => o.removeEventListener("keydown", l, {
        capture: true
      });
    }, [i, o]);
  }
  var hv = "DismissableLayer";
  var Fs = "dismissableLayer.update";
  var gv = "dismissableLayer.pointerDownOutside";
  var yv = "dismissableLayer.focusOutside";
  var Ac;
  var Ic = O.createContext({
    layers: new Set(),
    layersWithOutsidePointerEventsDisabled: new Set(),
    branches: new Set()
  });
  var Lc = O.forwardRef((r, o) => {
    const {
      disableOutsidePointerEvents: i = false,
      onEscapeKeyDown: l,
      onPointerDownOutside: c,
      onFocusOutside: f,
      onInteractOutside: p,
      onDismiss: m,
      ...w
    } = r;
    const v = O.useContext(Ic);
    const [g, T] = O.useState(null);
    const L = g?.ownerDocument ?? globalThis?.document;
    const [, B] = O.useState({});
    const C = xn(o, q => T(q));
    const E = Array.from(v.layers);
    const [y] = [...v.layersWithOutsidePointerEventsDisabled].slice(-1);
    const _ = E.indexOf(y);
    const N = g ? E.indexOf(g) : -1;
    const b = v.layersWithOutsidePointerEventsDisabled.size > 0;
    const D = N >= _;
    const H = wv(q => {
      const $ = q.target;
      const de = [...v.branches].some(ue => ue.contains($));
      if (!!D && !de) {
        c?.(q);
        p?.(q);
        if (!q.defaultPrevented) {
          m?.();
        }
      }
    }, L);
    const W = Ev(q => {
      const $ = q.target;
      if (![...v.branches].some(ue => ue.contains($))) {
        f?.(q);
        p?.(q);
        if (!q.defaultPrevented) {
          m?.();
        }
      }
    }, L);
    mv(q => {
      if (N === v.layers.size - 1) {
        l?.(q);
        if (!q.defaultPrevented && m) {
          q.preventDefault();
          m();
        }
      }
    }, L);
    O.useEffect(() => {
      if (g) {
        if (i) {
          if (v.layersWithOutsidePointerEventsDisabled.size === 0) {
            Ac = L.body.style.pointerEvents;
            L.body.style.pointerEvents = "none";
          }
          v.layersWithOutsidePointerEventsDisabled.add(g);
        }
        v.layers.add(g);
        Dc();
        return () => {
          if (i && v.layersWithOutsidePointerEventsDisabled.size === 1) {
            L.body.style.pointerEvents = Ac;
          }
        };
      }
    }, [g, L, i, v]);
    O.useEffect(() => () => {
      if (g) {
        v.layers.delete(g);
        v.layersWithOutsidePointerEventsDisabled.delete(g);
        Dc();
      }
    }, [g, v]);
    O.useEffect(() => {
      const q = () => B({});
      document.addEventListener(Fs, q);
      return () => document.removeEventListener(Fs, q);
    }, []);
    return <At.div {...w} ref={C} style={{
      pointerEvents: b ? D ? "auto" : "none" : undefined,
      ...r.style
    }} onFocusCapture={ct(r.onFocusCapture, W.onFocusCapture)} onBlurCapture={ct(r.onBlurCapture, W.onBlurCapture)} onPointerDownCapture={ct(r.onPointerDownCapture, H.onPointerDownCapture)} />;
  });
  Lc.displayName = hv;
  var vv = "DismissableLayerBranch";
  var Mc = O.forwardRef((r, o) => {
    const i = O.useContext(Ic);
    const l = O.useRef(null);
    const c = xn(o, l);
    O.useEffect(() => {
      const f = l.current;
      if (f) {
        i.branches.add(f);
        return () => {
          i.branches.delete(f);
        };
      }
    }, [i.branches]);
    return <At.div {...r} ref={c} />;
  });
  Mc.displayName = vv;
  function wv(r, o = globalThis?.document) {
    const i = _n(r);
    const l = O.useRef(false);
    const c = O.useRef(() => {});
    O.useEffect(() => {
      const f = m => {
        if (m.target && !l.current) {
          let w = function () {
            bc(gv, i, v, {
              discrete: true
            });
          };
          const v = {
            originalEvent: m
          };
          if (m.pointerType === "touch") {
            o.removeEventListener("click", c.current);
            c.current = w;
            o.addEventListener("click", c.current, {
              once: true
            });
          } else {
            w();
          }
        } else {
          o.removeEventListener("click", c.current);
        }
        l.current = false;
      };
      const p = window.setTimeout(() => {
        o.addEventListener("pointerdown", f);
      }, 0);
      return () => {
        window.clearTimeout(p);
        o.removeEventListener("pointerdown", f);
        o.removeEventListener("click", c.current);
      };
    }, [o, i]);
    return {
      onPointerDownCapture: () => l.current = true
    };
  }
  function Ev(r, o = globalThis?.document) {
    const i = _n(r);
    const l = O.useRef(false);
    O.useEffect(() => {
      const c = f => {
        if (f.target && !l.current) {
          bc(yv, i, {
            originalEvent: f
          }, {
            discrete: false
          });
        }
      };
      o.addEventListener("focusin", c);
      return () => o.removeEventListener("focusin", c);
    }, [o, i]);
    return {
      onFocusCapture: () => l.current = true,
      onBlurCapture: () => l.current = false
    };
  }
  function Dc() {
    const r = new CustomEvent(Fs);
    document.dispatchEvent(r);
  }
  function bc(r, o, i, {
    discrete: l
  }) {
    const c = i.originalEvent.target;
    const f = new CustomEvent(r, {
      bubbles: false,
      cancelable: true,
      detail: i
    });
    if (o) {
      c.addEventListener(r, o, {
        once: true
      });
    }
    if (l) {
      Oc(c, f);
    } else {
      c.dispatchEvent(f);
    }
  }
  var Sv = Lc;
  var _Component7 = Mc;
  var Tr = globalThis?.document ? O.useLayoutEffect : () => {};
  var kv = "Portal";
  var Fc = O.forwardRef((r, o) => {
    const {
      container: i,
      ...l
    } = r;
    const [c, f] = O.useState(false);
    Tr(() => f(true), []);
    const p = i || c && globalThis?.document?.body;
    if (p) {
      return iv.createPortal(<At.div {...l} ref={o} />, p);
    } else {
      return null;
    }
  });
  Fc.displayName = kv;
  function Cv(r, o) {
    return O.useReducer((i, l) => o[i][l] ?? i, r);
  }
  var _Component9 = r => {
    const {
      present: o,
      children: i
    } = r;
    const l = _v(o);
    const c = typeof i == "function" ? i({
      present: l.isPresent
    }) : O.Children.only(i);
    const f = xn(l.ref, Tv(c));
    if (typeof i == "function" || l.isPresent) {
      return O.cloneElement(c, {
        ref: f
      });
    } else {
      return null;
    }
  };
  _Component9.displayName = "Presence";
  function _v(r) {
    const [o, i] = O.useState();
    const l = O.useRef(null);
    const c = O.useRef(r);
    const f = O.useRef("none");
    const p = r ? "mounted" : "unmounted";
    const [m, w] = Cv(p, {
      mounted: {
        UNMOUNT: "unmounted",
        ANIMATION_OUT: "unmountSuspended"
      },
      unmountSuspended: {
        MOUNT: "mounted",
        ANIMATION_END: "unmounted"
      },
      unmounted: {
        MOUNT: "mounted"
      }
    });
    O.useEffect(() => {
      const v = Bo(l.current);
      f.current = m === "mounted" ? v : "none";
    }, [m]);
    Tr(() => {
      const v = l.current;
      const g = c.current;
      if (g !== r) {
        const L = f.current;
        const B = Bo(v);
        if (r) {
          w("MOUNT");
        } else if (B === "none" || v?.display === "none") {
          w("UNMOUNT");
        } else {
          w(g && L !== B ? "ANIMATION_OUT" : "UNMOUNT");
        }
        c.current = r;
      }
    }, [r, w]);
    Tr(() => {
      if (o) {
        let v;
        const g = o.ownerDocument.defaultView ?? window;
        const T = B => {
          const E = Bo(l.current).includes(B.animationName);
          if (B.target === o && E && (w("ANIMATION_END"), !c.current)) {
            const y = o.style.animationFillMode;
            o.style.animationFillMode = "forwards";
            v = g.setTimeout(() => {
              if (o.style.animationFillMode === "forwards") {
                o.style.animationFillMode = y;
              }
            });
          }
        };
        const L = B => {
          if (B.target === o) {
            f.current = Bo(l.current);
          }
        };
        o.addEventListener("animationstart", L);
        o.addEventListener("animationcancel", T);
        o.addEventListener("animationend", T);
        return () => {
          g.clearTimeout(v);
          o.removeEventListener("animationstart", L);
          o.removeEventListener("animationcancel", T);
          o.removeEventListener("animationend", T);
        };
      } else {
        w("ANIMATION_END");
      }
    }, [o, w]);
    return {
      isPresent: ["mounted", "unmountSuspended"].includes(m),
      ref: O.useCallback(v => {
        l.current = v ? getComputedStyle(v) : null;
        i(v);
      }, [])
    };
  }
  function Bo(r) {
    return r?.animationName || "none";
  }
  function Tv(r) {
    let o = Object.getOwnPropertyDescriptor(r.props, "ref")?.get;
    let i = o && "isReactWarning" in o && o.isReactWarning;
    if (i) {
      return r.ref;
    } else {
      o = Object.getOwnPropertyDescriptor(r, "ref")?.get;
      i = o && "isReactWarning" in o && o.isReactWarning;
      if (i) {
        return r.props.ref;
      } else {
        return r.props.ref || r.ref;
      }
    }
  }
  var Rv = Gu[" useInsertionEffect ".trim().toString()] || Tr;
  function Pv({
    prop: r,
    defaultProp: o,
    onChange: i = () => {},
    caller: l
  }) {
    const [c, f, p] = Nv({
      defaultProp: o,
      onChange: i
    });
    const m = r !== undefined;
    const w = m ? r : c;
    {
      const g = O.useRef(r !== undefined);
      O.useEffect(() => {
        const T = g.current;
        if (T !== m) {
          console.warn(`${l} is changing from ${T ? "controlled" : "uncontrolled"} to ${m ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`);
        }
        g.current = m;
      }, [m, l]);
    }
    const v = O.useCallback(g => {
      if (m) {
        const T = Ov(g) ? g(r) : g;
        if (T !== r) {
          p.current?.(T);
        }
      } else {
        f(g);
      }
    }, [m, r, f, p]);
    return [w, v];
  }
  function Nv({
    defaultProp: r,
    onChange: o
  }) {
    const [i, l] = O.useState(r);
    const c = O.useRef(i);
    const f = O.useRef(o);
    Rv(() => {
      f.current = o;
    }, [o]);
    O.useEffect(() => {
      if (c.current !== i) {
        f.current?.(i);
        c.current = i;
      }
    }, [i, c]);
    return [i, l, f];
  }
  function Ov(r) {
    return typeof r == "function";
  }
  var Av = Object.freeze({
    position: "absolute",
    border: 0,
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    wordWrap: "normal"
  });
  var Iv = "VisuallyHidden";
  var _Component8 = O.forwardRef((r, o) => <At.span {...r} ref={o} style={{
    ...Av,
    ...r.style
  }} />);
  _Component8.displayName = Iv;
  var js = "ToastProvider";
  var [Us, Lv, Mv] = dv("Toast");
  var [jc] = Nc("Toast", [Mv]);
  var [Dv, Vo] = jc(js);
  var Uc = r => {
    const {
      __scopeToast: o,
      label: i = "Notification",
      duration: l = 5000,
      swipeDirection: c = "right",
      swipeThreshold: f = 50,
      children: p
    } = r;
    const [m, w] = O.useState(null);
    const [v, g] = O.useState(0);
    const T = O.useRef(false);
    const L = O.useRef(false);
    if (!i.trim()) {
      console.error(`Invalid prop \`label\` supplied to \`${js}\`. Expected non-empty \`string\`.`);
    }
    return <Us.Provider scope={o}><Dv scope={o} label={i} duration={l} swipeDirection={c} swipeThreshold={f} toastCount={v} viewport={m} onViewportChange={w} onToastAdd={O.useCallback(() => g(B => B + 1), [])} onToastRemove={O.useCallback(() => g(B => B - 1), [])} isFocusedToastEscapeKeyDownRef={T} isClosePausedRef={L}>{p}</Dv></Us.Provider>;
  };
  Uc.displayName = js;
  var Bc = "ToastViewport";
  var bv = ["F8"];
  var Bs = "toast.viewportPause";
  var Vs = "toast.viewportResume";
  var Vc = O.forwardRef((r, o) => {
    const {
      __scopeToast: i,
      hotkey: l = bv,
      label: c = "Notifications ({hotkey})",
      ...f
    } = r;
    const p = Vo(Bc, i);
    const m = Lv(i);
    const w = O.useRef(null);
    const v = O.useRef(null);
    const g = O.useRef(null);
    const T = O.useRef(null);
    const L = xn(o, T, p.onViewportChange);
    const B = l.join("+").replace(/Key/g, "").replace(/Digit/g, "");
    const C = p.toastCount > 0;
    O.useEffect(() => {
      const y = _ => {
        if (l.length !== 0 && l.every(b => _[b] || _.code === b)) {
          T.current?.focus();
        }
      };
      document.addEventListener("keydown", y);
      return () => document.removeEventListener("keydown", y);
    }, [l]);
    O.useEffect(() => {
      const y = w.current;
      const _ = T.current;
      if (C && y && _) {
        const N = () => {
          if (!p.isClosePausedRef.current) {
            const W = new CustomEvent(Bs);
            _.dispatchEvent(W);
            p.isClosePausedRef.current = true;
          }
        };
        const b = () => {
          if (p.isClosePausedRef.current) {
            const W = new CustomEvent(Vs);
            _.dispatchEvent(W);
            p.isClosePausedRef.current = false;
          }
        };
        const D = W => {
          if (!y.contains(W.relatedTarget)) {
            b();
          }
        };
        const H = () => {
          if (!y.contains(document.activeElement)) {
            b();
          }
        };
        y.addEventListener("focusin", N);
        y.addEventListener("focusout", D);
        y.addEventListener("pointermove", N);
        y.addEventListener("pointerleave", H);
        window.addEventListener("blur", N);
        window.addEventListener("focus", b);
        return () => {
          y.removeEventListener("focusin", N);
          y.removeEventListener("focusout", D);
          y.removeEventListener("pointermove", N);
          y.removeEventListener("pointerleave", H);
          window.removeEventListener("blur", N);
          window.removeEventListener("focus", b);
        };
      }
    }, [C, p.isClosePausedRef]);
    const E = O.useCallback(({
      tabbingDirection: y
    }) => {
      const N = m().map(b => {
        const D = b.ref.current;
        const H = [D, ...Qv(D)];
        if (y === "forwards") {
          return H;
        } else {
          return H.reverse();
        }
      });
      return (y === "forwards" ? N.reverse() : N).flat();
    }, [m]);
    O.useEffect(() => {
      const y = T.current;
      if (y) {
        const _ = N => {
          const b = N.altKey || N.ctrlKey || N.metaKey;
          if (N.key === "Tab" && !b) {
            const H = document.activeElement;
            const W = N.shiftKey;
            if (N.target === y && W) {
              v.current?.focus();
              return;
            }
            const de = E({
              tabbingDirection: W ? "backwards" : "forwards"
            });
            const ue = de.findIndex(Te => Te === H);
            if (Ks(de.slice(ue + 1))) {
              N.preventDefault();
            } else if (W) {
              v.current?.focus();
            } else {
              g.current?.focus();
            }
          }
        };
        y.addEventListener("keydown", _);
        return () => y.removeEventListener("keydown", _);
      }
    }, [m, E]);
    return <_Component7 ref={w} role="region" aria-label={c.replace("{hotkey}", B)} tabIndex={-1} style={{
      pointerEvents: C ? undefined : "none"
    }}>{C && <$s ref={v} onFocusFromOutsideViewport={() => {
        const y = E({
          tabbingDirection: "forwards"
        });
        Ks(y);
      }} />}<Us.Slot scope={i}><At.ol tabIndex={-1} {...f} ref={L} /></Us.Slot>{C && <$s ref={g} onFocusFromOutsideViewport={() => {
        const y = E({
          tabbingDirection: "backwards"
        });
        Ks(y);
      }} />}</_Component7>;
  });
  Vc.displayName = Bc;
  var $c = "ToastFocusProxy";
  var $s = O.forwardRef((r, o) => {
    const {
      __scopeToast: i,
      onFocusFromOutsideViewport: l,
      ...c
    } = r;
    const f = Vo($c, i);
    return <_Component8 aria-hidden={true} tabIndex={0} {...c} ref={o} style={{
      position: "fixed"
    }} onFocus={p => {
      const m = p.relatedTarget;
      if (!f.viewport?.contains(m)) {
        l();
      }
    }} />;
  });
  $s.displayName = $c;
  var Rr = "Toast";
  var Fv = "toast.swipeStart";
  var zv = "toast.swipeMove";
  var jv = "toast.swipeCancel";
  var Uv = "toast.swipeEnd";
  var Wc = O.forwardRef((r, o) => {
    const {
      forceMount: i,
      open: l,
      defaultOpen: c,
      onOpenChange: f,
      ...p
    } = r;
    const [m, w] = Pv({
      prop: l,
      defaultProp: c ?? true,
      onChange: f,
      caller: Rr
    });
    return <_Component9 present={i || m}><$v open={m} {...p} ref={o} onClose={() => w(false)} onPause={_n(r.onPause)} onResume={_n(r.onResume)} onSwipeStart={ct(r.onSwipeStart, v => {
        v.currentTarget.setAttribute("data-swipe", "start");
      })} onSwipeMove={ct(r.onSwipeMove, v => {
        const {
          x: g,
          y: T
        } = v.detail.delta;
        v.currentTarget.setAttribute("data-swipe", "move");
        v.currentTarget.style.setProperty("--radix-toast-swipe-move-x", `${g}px`);
        v.currentTarget.style.setProperty("--radix-toast-swipe-move-y", `${T}px`);
      })} onSwipeCancel={ct(r.onSwipeCancel, v => {
        v.currentTarget.setAttribute("data-swipe", "cancel");
        v.currentTarget.style.removeProperty("--radix-toast-swipe-move-x");
        v.currentTarget.style.removeProperty("--radix-toast-swipe-move-y");
        v.currentTarget.style.removeProperty("--radix-toast-swipe-end-x");
        v.currentTarget.style.removeProperty("--radix-toast-swipe-end-y");
      })} onSwipeEnd={ct(r.onSwipeEnd, v => {
        const {
          x: g,
          y: T
        } = v.detail.delta;
        v.currentTarget.setAttribute("data-swipe", "end");
        v.currentTarget.style.removeProperty("--radix-toast-swipe-move-x");
        v.currentTarget.style.removeProperty("--radix-toast-swipe-move-y");
        v.currentTarget.style.setProperty("--radix-toast-swipe-end-x", `${g}px`);
        v.currentTarget.style.setProperty("--radix-toast-swipe-end-y", `${T}px`);
        w(false);
      })} /></_Component9>;
  });
  Wc.displayName = Rr;
  var [Bv, Vv] = jc(Rr, {
    onClose() {}
  });
  var $v = O.forwardRef((r, o) => {
    const {
      __scopeToast: i,
      type: l = "foreground",
      duration: c,
      open: f,
      onClose: p,
      onEscapeKeyDown: m,
      onPause: w,
      onResume: v,
      onSwipeStart: g,
      onSwipeMove: T,
      onSwipeCancel: L,
      onSwipeEnd: B,
      ...C
    } = r;
    const E = Vo(Rr, i);
    const [y, _] = O.useState(null);
    const N = xn(o, oe => _(oe));
    const b = O.useRef(null);
    const D = O.useRef(null);
    const H = c || E.duration;
    const W = O.useRef(0);
    const q = O.useRef(H);
    const $ = O.useRef(0);
    const {
      onToastAdd: de,
      onToastRemove: ue
    } = E;
    const Te = _n(() => {
      if (y?.contains(document.activeElement)) {
        E.viewport?.focus();
      }
      p();
    });
    const _e = O.useCallback(oe => {
      if (!!oe && oe !== Infinity) {
        window.clearTimeout($.current);
        W.current = new Date().getTime();
        $.current = window.setTimeout(Te, oe);
      }
    }, [Te]);
    O.useEffect(() => {
      const oe = E.viewport;
      if (oe) {
        const we = () => {
          _e(q.current);
          v?.();
        };
        const se = () => {
          const me = new Date().getTime() - W.current;
          q.current = q.current - me;
          window.clearTimeout($.current);
          w?.();
        };
        oe.addEventListener(Bs, se);
        oe.addEventListener(Vs, we);
        return () => {
          oe.removeEventListener(Bs, se);
          oe.removeEventListener(Vs, we);
        };
      }
    }, [E.viewport, H, w, v, _e]);
    O.useEffect(() => {
      if (f && !E.isClosePausedRef.current) {
        _e(H);
      }
    }, [f, H, E.isClosePausedRef, _e]);
    O.useEffect(() => {
      de();
      return () => ue();
    }, [de, ue]);
    const xe = O.useMemo(() => y ? Yc(y) : null, [y]);
    if (E.viewport) {
      return <K.Fragment>{xe && <Wv __scopeToast={i} role="status" aria-live={l === "foreground" ? "assertive" : "polite"} aria-atomic={true}>{xe}</Wv>}<Bv scope={i} onClose={Te}>{Ds.createPortal(<Us.ItemSlot scope={i}><Sv asChild={true} onEscapeKeyDown={ct(m, () => {
              if (!E.isFocusedToastEscapeKeyDownRef.current) {
                Te();
              }
              E.isFocusedToastEscapeKeyDownRef.current = false;
            })}><At.li role="status" aria-live="off" aria-atomic={true} tabIndex={0} data-state={f ? "open" : "closed"} data-swipe-direction={E.swipeDirection} {...C} ref={N} style={{
                userSelect: "none",
                touchAction: "none",
                ...r.style
              }} onKeyDown={ct(r.onKeyDown, oe => {
                if (oe.key === "Escape") {
                  m?.(oe.nativeEvent);
                  if (!oe.nativeEvent.defaultPrevented) {
                    E.isFocusedToastEscapeKeyDownRef.current = true;
                    Te();
                  }
                }
              })} onPointerDown={ct(r.onPointerDown, oe => {
                if (oe.button === 0) {
                  b.current = {
                    x: oe.clientX,
                    y: oe.clientY
                  };
                }
              })} onPointerMove={ct(r.onPointerMove, oe => {
                if (!b.current) {
                  return;
                }
                const we = oe.clientX - b.current.x;
                const se = oe.clientY - b.current.y;
                const me = !!D.current;
                const M = ["left", "right"].includes(E.swipeDirection);
                const ne = ["left", "up"].includes(E.swipeDirection) ? Math.min : Math.max;
                const G = M ? ne(0, we) : 0;
                const k = M ? 0 : ne(0, se);
                const F = oe.pointerType === "touch" ? 10 : 2;
                const Z = {
                  x: G,
                  y: k
                };
                const ie = {
                  originalEvent: oe,
                  delta: Z
                };
                if (me) {
                  D.current = Z;
                  $o(zv, T, ie, {
                    discrete: false
                  });
                } else if (Jc(Z, E.swipeDirection, F)) {
                  D.current = Z;
                  $o(Fv, g, ie, {
                    discrete: false
                  });
                  oe.target.setPointerCapture(oe.pointerId);
                } else if (Math.abs(we) > F || Math.abs(se) > F) {
                  b.current = null;
                }
              })} onPointerUp={ct(r.onPointerUp, oe => {
                const we = D.current;
                const se = oe.target;
                if (se.hasPointerCapture(oe.pointerId)) {
                  se.releasePointerCapture(oe.pointerId);
                }
                D.current = null;
                b.current = null;
                if (we) {
                  const me = oe.currentTarget;
                  const M = {
                    originalEvent: oe,
                    delta: we
                  };
                  if (Jc(we, E.swipeDirection, E.swipeThreshold)) {
                    $o(Uv, B, M, {
                      discrete: true
                    });
                  } else {
                    $o(jv, L, M, {
                      discrete: true
                    });
                  }
                  me.addEventListener("click", ne => ne.preventDefault(), {
                    once: true
                  });
                }
              })} /></Sv></Us.ItemSlot>, E.viewport)}</Bv></K.Fragment>;
    } else {
      return null;
    }
  });
  var Wv = r => {
    const {
      __scopeToast: o,
      children: i,
      ...l
    } = r;
    const c = Vo(Rr, o);
    const [f, p] = O.useState(false);
    const [m, w] = O.useState(false);
    qv(() => p(true));
    O.useEffect(() => {
      const v = window.setTimeout(() => w(true), 1000);
      return () => window.clearTimeout(v);
    }, []);
    if (m) {
      return null;
    } else {
      return <Fc asChild={true}><_Component8 {...l}>{f && <K.Fragment>{c.label} {i}</K.Fragment>}</_Component8></Fc>;
    }
  };
  var Kv = "ToastTitle";
  var Kc = O.forwardRef((r, o) => {
    const {
      __scopeToast: i,
      ...l
    } = r;
    return <At.div {...l} ref={o} />;
  });
  Kc.displayName = Kv;
  var Hv = "ToastDescription";
  var Hc = O.forwardRef((r, o) => {
    const {
      __scopeToast: i,
      ...l
    } = r;
    return <At.div {...l} ref={o} />;
  });
  Hc.displayName = Hv;
  var qc = "ToastAction";
  var Gc = O.forwardRef((r, o) => {
    const {
      altText: i,
      ...l
    } = r;
    if (i.trim()) {
      return <Xc altText={i} asChild={true}><Ws {...l} ref={o} /></Xc>;
    } else {
      console.error(`Invalid prop \`altText\` supplied to \`${qc}\`. Expected non-empty \`string\`.`);
      return null;
    }
  });
  Gc.displayName = qc;
  var Qc = "ToastClose";
  var Ws = O.forwardRef((r, o) => {
    const {
      __scopeToast: i,
      ...l
    } = r;
    const c = Vv(Qc, i);
    return <Xc asChild={true}><At.button type="button" {...l} ref={o} onClick={ct(r.onClick, c.onClose)} /></Xc>;
  });
  Ws.displayName = Qc;
  var Xc = O.forwardRef((r, o) => {
    const {
      __scopeToast: i,
      altText: l,
      ...c
    } = r;
    return <At.div data-radix-toast-announce-exclude="" data-radix-toast-announce-alt={l || undefined} {...c} ref={o} />;
  });
  function Yc(r) {
    const o = [];
    Array.from(r.childNodes).forEach(l => {
      if (l.nodeType === l.TEXT_NODE && l.textContent) {
        o.push(l.textContent);
      }
      if (Gv(l)) {
        const c = l.ariaHidden || l.hidden || l.style.display === "none";
        const f = l.dataset.radixToastAnnounceExclude === "";
        if (!c) {
          if (f) {
            const p = l.dataset.radixToastAnnounceAlt;
            if (p) {
              o.push(p);
            }
          } else {
            o.push(...Yc(l));
          }
        }
      }
    });
    return o;
  }
  function $o(r, o, i, {
    discrete: l
  }) {
    const c = i.originalEvent.currentTarget;
    const f = new CustomEvent(r, {
      bubbles: true,
      cancelable: true,
      detail: i
    });
    if (o) {
      c.addEventListener(r, o, {
        once: true
      });
    }
    if (l) {
      Oc(c, f);
    } else {
      c.dispatchEvent(f);
    }
  }
  var Jc = (r, o, i = 0) => {
    const l = Math.abs(r.x);
    const c = Math.abs(r.y);
    const f = l > c;
    if (o === "left" || o === "right") {
      return f && l > i;
    } else {
      return !f && c > i;
    }
  };
  function qv(r = () => {}) {
    const o = _n(r);
    Tr(() => {
      let i = 0;
      let l = 0;
      i = window.requestAnimationFrame(() => l = window.requestAnimationFrame(o));
      return () => {
        window.cancelAnimationFrame(i);
        window.cancelAnimationFrame(l);
      };
    }, [o]);
  }
  function Gv(r) {
    return r.nodeType === r.ELEMENT_NODE;
  }
  function Qv(r) {
    const o = [];
    const i = document.createTreeWalker(r, NodeFilter.SHOW_ELEMENT, {
      acceptNode: l => {
        const c = l.tagName === "INPUT" && l.type === "hidden";
        if (l.disabled || l.hidden || c) {
          return NodeFilter.FILTER_SKIP;
        } else if (l.tabIndex >= 0) {
          return NodeFilter.FILTER_ACCEPT;
        } else {
          return NodeFilter.FILTER_SKIP;
        }
      }
    });
    while (i.nextNode()) {
      o.push(i.currentNode);
    }
    return o;
  }
  function Ks(r) {
    const o = document.activeElement;
    return r.some(i => i === o ? true : (i.focus(), document.activeElement !== o));
  }
  var Xv = Uc;
  var Zc = Vc;
  var _Component0 = Wc;
  var _Component11 = Kc;
  var _Component12 = Hc;
  var _Component1 = Gc;
  var _Component10 = Ws;
  const Yv = Xv;
  const _Component17 = O.forwardRef(({
    className: r,
    disableRightOffset: o = false,
    ...i
  }, l) => <Zc ref={l} className={Cn("tw:fixed tw:top-0 tw:z-vinted-1 tw:flex tw:max-h-screen tw:w-full tw:flex-col-reverse tw:p-4 tw:sm:bottom-0 tw:sm:top-auto tw:sm:flex-col tw:md:max-w-[420px]", o ? "tw:right-0" : "tw:right-16 tw:md:right-20", r)} {...i} />);
  _Component17.displayName = Zc.displayName;
  const Jv = rc("tw:group tw:pointer-events-auto tw:relative tw:flex tw:w-full tw:items-center tw:justify-between tw:space-x-4 tw:overflow-hidden tw:rounded-md tw:border tw:p-6 tw:pr-8 tw:shadow-lg tw:transition-all tw:data-[swipe=cancel]:translate-x-0 tw:data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) tw:data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) tw:data-[swipe=move]:transition-none tw:data-[state=open]:animate-in tw:data-[state=closed]:animate-out tw:data-[swipe=end]:animate-out tw:data-[state=closed]:fade-out-80 tw:data-[state=closed]:slide-out-to-right-full tw:data-[state=open]:slide-in-from-top-full tw:sm:data-[state=open]:slide-in-from-bottom-full", {
    variants: {
      variant: {
        default: "tw:border tw:bg-background tw:text-foreground",
        destructive: "tw:destructive tw:group tw:border-destructive tw:bg-destructive tw:text-destructive-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  });
  const _Component16 = O.forwardRef(({
    className: r,
    variant: o,
    ...i
  }, l) => <_Component0 ref={l} className={Cn(Jv({
    variant: o
  }), r)} {...i} />);
  _Component16.displayName = _Component0.displayName;
  const Zv = O.forwardRef(({
    className: r,
    ...o
  }, i) => <_Component1 ref={i} className={Cn("tw:inline-flex tw:h-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:border tw:bg-transparent tw:px-3 tw:text-sm tw:font-medium tw:ring-offset-background tw:transition-colors tw:hover:bg-secondary tw:focus:outline-hidden tw:focus:ring-2 tw:focus:ring-ring tw:focus:ring-offset-2 tw:disabled:pointer-events-none tw:disabled:opacity-50 tw:group-[.tw:destructive]:border-muted/40 tw:hover:group-[.tw:destructive]:border-destructive/30 tw:hover:group-[.tw:destructive]:bg-destructive tw:hover:group-[.tw:destructive]:text-destructive-foreground tw:focus:group-[.tw:destructive]:ring-destructive", r)} {...o} />);
  Zv.displayName = _Component1.displayName;
  const _Component15 = O.forwardRef(({
    className: r,
    ...o
  }, i) => <_Component10 ref={i} className={Cn("tw:absolute tw:right-2 tw:top-2 tw:rounded-md tw:p-1 tw:text-foreground/50 tw:opacity-0 tw:transition-opacity tw:hover:text-foreground tw:focus:opacity-100 tw:focus:outline-hidden tw:focus:ring-2 tw:group-hover:opacity-100 tw:group-[.tw:destructive]:text-red-300 tw:hover:group-[.tw:destructive]:text-red-50 tw:focus:group-[.tw:destructive]:ring-red-400 tw:focus:group-[.tw:destructive]:ring-offset-red-600", r)} toast-close="" {...o}><Gg className="tw:h-4 tw:w-4" /></_Component10>);
  _Component15.displayName = _Component10.displayName;
  const _Component13 = O.forwardRef(({
    className: r,
    ...o
  }, i) => <_Component11 ref={i} className={Cn("tw:text-sm tw:font-semibold", r)} {...o} />);
  _Component13.displayName = _Component11.displayName;
  const _Component14 = O.forwardRef(({
    className: r,
    ...o
  }, i) => <_Component12 ref={i} className={Cn("tw:text-sm tw:opacity-90", r)} {...o} />);
  _Component14.displayName = _Component12.displayName;
  const ew = 1;
  const tw = 1000000;
  let Hs = 0;
  function nw() {
    Hs = (Hs + 1) % Number.MAX_SAFE_INTEGER;
    return Hs.toString();
  }
  const qs = new Map();
  const ff = r => {
    if (qs.has(r)) {
      return;
    }
    const o = setTimeout(() => {
      qs.delete(r);
      Pr({
        type: "REMOVE_TOAST",
        toastId: r
      });
    }, tw);
    qs.set(r, o);
  };
  const rw = (r, o) => {
    switch (o.type) {
      case "ADD_TOAST":
        return {
          ...r,
          toasts: [o.toast, ...r.toasts].slice(0, ew)
        };
      case "UPDATE_TOAST":
        return {
          ...r,
          toasts: r.toasts.map(i => i.id === o.toast.id ? {
            ...i,
            ...o.toast
          } : i)
        };
      case "DISMISS_TOAST":
        {
          const {
            toastId: i
          } = o;
          if (i) {
            ff(i);
          } else {
            r.toasts.forEach(l => {
              ff(l.id);
            });
          }
          return {
            ...r,
            toasts: r.toasts.map(l => l.id === i || i === undefined ? {
              ...l,
              open: false
            } : l)
          };
        }
      case "REMOVE_TOAST":
        if (o.toastId === undefined) {
          return {
            ...r,
            toasts: []
          };
        } else {
          return {
            ...r,
            toasts: r.toasts.filter(i => i.id !== o.toastId)
          };
        }
    }
  };
  const Wo = [];
  let Ko = {
    toasts: []
  };
  function Pr(r) {
    Ko = rw(Ko, r);
    Wo.forEach(o => {
      o(Ko);
    });
  }
  function ow({
    ...r
  }) {
    const o = nw();
    const i = c => Pr({
      type: "UPDATE_TOAST",
      toast: {
        ...c,
        id: o
      }
    });
    const l = () => Pr({
      type: "DISMISS_TOAST",
      toastId: o
    });
    Pr({
      type: "ADD_TOAST",
      toast: {
        ...r,
        id: o,
        open: true,
        onOpenChange: c => {
          if (!c) {
            l();
          }
        }
      }
    });
    return {
      id: o,
      dismiss: l,
      update: i
    };
  }
  function df() {
    const [r, o] = O.useState(Ko);
    O.useEffect(() => {
      Wo.push(o);
      return () => {
        const i = Wo.indexOf(o);
        if (i > -1) {
          Wo.splice(i, 1);
        }
      };
    }, [r]);
    return {
      ...r,
      toast: ow,
      dismiss: i => Pr({
        type: "DISMISS_TOAST",
        toastId: i
      })
    };
  }
  function _Component18({
    disableRightOffset: r = false
  } = {}) {
    const {
      toasts: o
    } = df();
    return <Yv>{o.map(function ({
        id: i,
        title: l,
        description: c,
        action: f,
        ...p
      }) {
        return <_Component16 {...p} key={i}><div className="tw:grid tw:gap-1">{l && <_Component13>{l}</_Component13>}{c && <_Component14>{c}</_Component14>}</div>{f}<_Component15 /></_Component16>;
      })}<_Component17 disableRightOffset={r} /></Yv>;
  }
  const pf = (r = document) => {
    const o = r.querySelectorAll("script");
    const i = /"CSRF_TOKEN\\?":\\?"([^"\\]+)\\?"/;
    for (const l of o) {
      const c = l.textContent?.match(i);
      if (c && c[1]) {
        return c[1];
      }
    }
  };
  const sw = () => {
    const r = document.querySelectorAll("script");
    const o = /"userId\\?":\\?"([^"\\]+)\\?"/;
    for (const i of r) {
      const l = i.textContent?.match(o);
      if (l && l[1]) {
        if (l[1] === "$undefined") {
          return undefined;
        } else {
          return l[1];
        }
      }
    }
  };
  async function lw() {
    let r = await Pg(window.location.origin);
    ge.debug("User ID from cookies:", r);
    if (!r) {
      r = sw();
      ge.debug("User ID from next Data:", r);
    }
    return r;
  }
  const mf = O.createContext({
    userId: null,
    isAuthenticated: false
  });
  const _Component19 = ({
    children: r
  }) => {
    const [o, i] = O.useState(true);
    const [l, c] = O.useState(false);
    const [f, p] = O.useState(null);
    O.useEffect(() => {
      (async () => {
        try {
          if (f === null) {
            const w = await lw();
            if (w) {
              p(w);
              c(true);
            }
          }
        } catch (w) {
          ge.error(w);
        } finally {
          i(false);
        }
      })();
    }, []);
    return <mf.Provider value={{
      userId: f,
      isAuthenticated: l
    }}>{!o && r}</mf.Provider>;
  };
  const uw = () => O.useContext(mf);
  const cw = 10240;
  function fw(r) {
    r.interceptors.response.use(o => o, o => {
      if (o.response) {
        const i = o.config?.headers?.["Content-Type"];
        const l = o.config?.data instanceof FormData || typeof i == "string" && i.includes("multipart/form-data");
        o._responseStatus = o.response.status;
        o._responseStatusText = o.response.statusText;
        o._responseHeaders = o.response.headers;
        if (!l && o.response.data) {
          try {
            if (JSON.stringify(o.response.data).length < cw) {
              o._responseData = o.response.data;
            }
          } catch {}
        }
      }
      return Promise.reject(o);
    });
  }
  var Nr = {};
  var hf;
  function dw() {
    if (hf) {
      return Nr;
    }
    hf = 1;
    Object.defineProperty(Nr, "__esModule", {
      value: true
    });
    Nr.parse = p;
    Nr.serialize = v;
    const r = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
    const o = /^[\u0021-\u003A\u003C-\u007E]*$/;
    const i = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    const l = /^[\u0020-\u003A\u003D-\u007E]*$/;
    const c = Object.prototype.toString;
    const f = (() => {
      const L = function () {};
      L.prototype = Object.create(null);
      return L;
    })();
    function p(L, B) {
      const C = new f();
      const E = L.length;
      if (E < 2) {
        return C;
      }
      const y = B?.decode || g;
      let _ = 0;
      do {
        const N = L.indexOf("=", _);
        if (N === -1) {
          break;
        }
        const b = L.indexOf(";", _);
        const D = b === -1 ? E : b;
        if (N > D) {
          _ = L.lastIndexOf(";", N - 1) + 1;
          continue;
        }
        const H = m(L, _, N);
        const W = w(L, N, H);
        const q = L.slice(H, W);
        if (C[q] === undefined) {
          let $ = m(L, N + 1, D);
          let de = w(L, D, $);
          const ue = y(L.slice($, de));
          C[q] = ue;
        }
        _ = D + 1;
      } while (_ < E);
      return C;
    }
    function m(L, B, C) {
      do {
        const E = L.charCodeAt(B);
        if (E !== 32 && E !== 9) {
          return B;
        }
      } while (++B < C);
      return C;
    }
    function w(L, B, C) {
      while (B > C) {
        const E = L.charCodeAt(--B);
        if (E !== 32 && E !== 9) {
          return B + 1;
        }
      }
      return C;
    }
    function v(L, B, C) {
      const E = C?.encode || encodeURIComponent;
      if (!r.test(L)) {
        throw new TypeError(`argument name is invalid: ${L}`);
      }
      const y = E(B);
      if (!o.test(y)) {
        throw new TypeError(`argument val is invalid: ${B}`);
      }
      let _ = L + "=" + y;
      if (!C) {
        return _;
      }
      if (C.maxAge !== undefined) {
        if (!Number.isInteger(C.maxAge)) {
          throw new TypeError(`option maxAge is invalid: ${C.maxAge}`);
        }
        _ += "; Max-Age=" + C.maxAge;
      }
      if (C.domain) {
        if (!i.test(C.domain)) {
          throw new TypeError(`option domain is invalid: ${C.domain}`);
        }
        _ += "; Domain=" + C.domain;
      }
      if (C.path) {
        if (!l.test(C.path)) {
          throw new TypeError(`option path is invalid: ${C.path}`);
        }
        _ += "; Path=" + C.path;
      }
      if (C.expires) {
        if (!T(C.expires) || !Number.isFinite(C.expires.valueOf())) {
          throw new TypeError(`option expires is invalid: ${C.expires}`);
        }
        _ += "; Expires=" + C.expires.toUTCString();
      }
      if (C.httpOnly) {
        _ += "; HttpOnly";
      }
      if (C.secure) {
        _ += "; Secure";
      }
      if (C.partitioned) {
        _ += "; Partitioned";
      }
      if (C.priority) {
        switch (typeof C.priority == "string" ? C.priority.toLowerCase() : undefined) {
          case "low":
            _ += "; Priority=Low";
            break;
          case "medium":
            _ += "; Priority=Medium";
            break;
          case "high":
            _ += "; Priority=High";
            break;
          default:
            throw new TypeError(`option priority is invalid: ${C.priority}`);
        }
      }
      if (C.sameSite) {
        switch (typeof C.sameSite == "string" ? C.sameSite.toLowerCase() : C.sameSite) {
          case true:
          case "strict":
            _ += "; SameSite=Strict";
            break;
          case "lax":
            _ += "; SameSite=Lax";
            break;
          case "none":
            _ += "; SameSite=None";
            break;
          default:
            throw new TypeError(`option sameSite is invalid: ${C.sameSite}`);
        }
      }
      return _;
    }
    function g(L) {
      if (L.indexOf("%") === -1) {
        return L;
      }
      try {
        return decodeURIComponent(L);
      } catch {
        return L;
      }
    }
    function T(L) {
      return c.call(L) === "[object Date]";
    }
    return Nr;
  }
  var Ho = dw();
  function pw() {
    const r = typeof global === "undefined" ? undefined : global.TEST_HAS_DOCUMENT_COOKIE;
    if (typeof r == "boolean") {
      return r;
    } else {
      return typeof document == "object" && typeof document.cookie == "string";
    }
  }
  function mw(r) {
    if (typeof r == "string") {
      return Ho.parse(r);
    } else if (typeof r == "object" && r !== null) {
      return r;
    } else {
      return {};
    }
  }
  function Gs(r, o = {}) {
    const i = hw(r);
    if (!o.doNotParse) {
      try {
        return JSON.parse(i);
      } catch {}
    }
    return r;
  }
  function hw(r) {
    if (r && r[0] === "j" && r[1] === ":") {
      return r.substr(2);
    } else {
      return r;
    }
  }
  class gw {
    constructor(o, i = {}) {
      this.changeListeners = [];
      this.HAS_DOCUMENT_COOKIE = false;
      this.update = () => {
        if (!this.HAS_DOCUMENT_COOKIE) {
          return;
        }
        const c = this.cookies;
        this.cookies = Ho.parse(document.cookie);
        this._checkChanges(c);
      };
      const l = typeof document === "undefined" ? "" : document.cookie;
      this.cookies = mw(o || l);
      this.defaultSetOptions = i;
      this.HAS_DOCUMENT_COOKIE = pw();
    }
    _emitChange(o) {
      for (let i = 0; i < this.changeListeners.length; ++i) {
        this.changeListeners[i](o);
      }
    }
    _checkChanges(o) {
      new Set(Object.keys(o).concat(Object.keys(this.cookies))).forEach(l => {
        if (o[l] !== this.cookies[l]) {
          this._emitChange({
            name: l,
            value: Gs(this.cookies[l])
          });
        }
      });
    }
    _startPolling() {
      this.pollingInterval = setInterval(this.update, 300);
    }
    _stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
    }
    get(o, i = {}) {
      if (!i.doNotUpdate) {
        this.update();
      }
      return Gs(this.cookies[o], i);
    }
    getAll(o = {}) {
      if (!o.doNotUpdate) {
        this.update();
      }
      const i = {};
      for (let l in this.cookies) {
        i[l] = Gs(this.cookies[l], o);
      }
      return i;
    }
    set(o, i, l) {
      if (l) {
        l = Object.assign(Object.assign({}, this.defaultSetOptions), l);
      } else {
        l = this.defaultSetOptions;
      }
      const c = typeof i == "string" ? i : JSON.stringify(i);
      this.cookies = Object.assign(Object.assign({}, this.cookies), {
        [o]: c
      });
      if (this.HAS_DOCUMENT_COOKIE) {
        document.cookie = Ho.serialize(o, c, l);
      }
      this._emitChange({
        name: o,
        value: i,
        options: l
      });
    }
    remove(o, i) {
      const l = i = Object.assign(Object.assign(Object.assign({}, this.defaultSetOptions), i), {
        expires: new Date(1970, 1, 1, 0, 0, 1),
        maxAge: 0
      });
      this.cookies = Object.assign({}, this.cookies);
      delete this.cookies[o];
      if (this.HAS_DOCUMENT_COOKIE) {
        document.cookie = Ho.serialize(o, "", l);
      }
      this._emitChange({
        name: o,
        value: undefined,
        options: i
      });
    }
    addChangeListener(o) {
      this.changeListeners.push(o);
      if (this.HAS_DOCUMENT_COOKIE && this.changeListeners.length === 1) {
        if (typeof window == "object" && "cookieStore" in window) {
          window.cookieStore.addEventListener("change", this.update);
        } else {
          this._startPolling();
        }
      }
    }
    removeChangeListener(o) {
      const i = this.changeListeners.indexOf(o);
      if (i >= 0) {
        this.changeListeners.splice(i, 1);
      }
      if (this.HAS_DOCUMENT_COOKIE && this.changeListeners.length === 0) {
        if (typeof window == "object" && "cookieStore" in window) {
          window.cookieStore.removeEventListener("change", this.update);
        } else {
          this._stopPolling();
        }
      }
    }
    removeAllChangeListeners() {
      while (this.changeListeners.length > 0) {
        this.removeChangeListener(this.changeListeners[0]);
      }
    }
  }
  const gf = "/";
  class yw {
    cookies = new gw();
    set = (o, i) => {
      if (o.httpOnly) {
        throw new Error("Attempting to set a server cookie using ClientCookieManager.");
      }
      const {
        name: l,
        ...c
      } = o;
      this.cookies.set(l, i, {
        path: gf,
        ...c
      });
    };
    delete = o => {
      this.cookies.remove(o.name, {
        path: o.path || gf
      });
    };
    get = o => {
      const i = typeof o == "string" ? o : o.name;
      return this.cookies.get(i);
    };
  }
  const yf = 1000;
  function vw() {
    return Math.floor(Date.now() / yf);
  }
  function ww(r) {
    let o = new Date();
    o = cy(o, r.years);
    if (r.days) {
      o = oy(o, r.days);
    }
    if (r.hours) {
      o = ay(o, r.hours);
    }
    if (r.minutes) {
      o = uy(o, r.minutes);
    }
    return o;
  }
  const Ew = [{
    name: "anon_id",
    maxAge: (r => {
      const o = vw();
      const i = ww(r).getTime() / yf;
      return Math.floor(i - o);
    })({
      years: 20
    }),
    sameSite: "lax"
  }].reduce((r, o) => {
    r[o.name] = o;
    return r;
  }, {});
  const Qs = {
    ACCEPT_LANGUAGE: "Accept-Language",
    X_ANON_ID: "X-Anon-Id",
    X_CSRF_TOKEN: "X-CSRF-Token"
  };
  var vf = (r => {
    r[r.Ok = 200] = "Ok";
    r[r.Created = 201] = "Created";
    r[r.TemporarilyMoved = 302] = "TemporarilyMoved";
    r[r.MovedPermanently = 301] = "MovedPermanently";
    r[r.TemporaryRedirect = 307] = "TemporaryRedirect";
    r[r.BadRequest = 400] = "BadRequest";
    r[r.Unauthorized = 401] = "Unauthorized";
    r[r.Forbidden = 403] = "Forbidden";
    r[r.NotFound = 404] = "NotFound";
    r[r.RequestTimeout = 408] = "RequestTimeout";
    r[r.PayloadTooLarge = 413] = "PayloadTooLarge";
    r[r.UnprocessableEntity = 422] = "UnprocessableEntity";
    r[r.TooEarly = 425] = "TooEarly";
    r[r.TooManyRequests = 429] = "TooManyRequests";
    r[r.InternalError = 500] = "InternalError";
    r[r.BadGateway = 502] = "BadGateway";
    r[r.ServiceUnavailable = 503] = "ServiceUnavailable";
    r[r.GatewayTimeout = 504] = "GatewayTimeout";
    return r;
  })(vf || {});
  const Sw = new yw();
  const xw = r => r.interceptors.request.use(o => {
    const i = document.querySelector("meta[name=\"accept-language\"]")?.getAttribute("content");
    if (!i) {
      ge.info("Unable to retrieve locale for API call");
    }
    if (i) {
      o.headers.set(Qs.ACCEPT_LANGUAGE, i);
    }
    return o;
  });
  const kw = r => r.interceptors.request.use(o => {
    const i = document.querySelector("meta[name=\"iso-locale\"]")?.getAttribute("content");
    if (!i) {
      ge.info("Unable to retrieve iso locale for API call");
    }
    if (i) {
      o.headers.set("Locale", i);
    }
    return o;
  });
  const Cw = r => {
    r.interceptors.request.use(o => {
      const i = Sw.get(Ew.anon_id);
      if (i) {
        o.headers.set(Qs.X_ANON_ID, i);
      }
      return o;
    });
  };
  const _w = r => r.interceptors.request.use(o => {
    if (!o.headers.hasAccept("image/webp")) {
      const i = o.headers.getAccept()?.toString().split(",") ?? [];
      i.push("image/webp");
      o.headers.setAccept(i);
    }
    return o;
  });
  const wf = r => r.interceptors.request.use(o => {
    if (!window.csrfTokenCache) {
      const i = pf();
      ge.info("Extracted CSRF token from scripts", i);
      if (!i) {
        throw new Error("Missing Next.js CSRF token");
      }
      window.csrfTokenCache = i;
    }
    o.headers.set(Qs.X_CSRF_TOKEN, window.csrfTokenCache);
    return o;
  });
  const Ef = Oe.create({
    baseURL: "/web/api/auth"
  });
  wf(Ef);
  const Tw = async () => Ef.post("/refresh");
  const Rw = async () => new Promise((i, l) => {
    ge.info("Attempting session refresh via iframe fallback");
    const c = document.createElement("iframe");
    c.style.display = "none";
    c.src = window.location.origin;
    const f = setTimeout(() => {
      p();
      l(new Error("Iframe session refresh timeout"));
    }, 10000);
    const p = () => {
      clearTimeout(f);
      c.remove();
    };
    c.onload = () => {
      setTimeout(() => {
        try {
          const m = c.contentDocument || c.contentWindow?.document;
          if (!m) {
            ge.error("Cannot access iframe document");
            p();
            l(new Error("Cannot access iframe document"));
            return;
          }
          const w = pf(m);
          if (w) {
            ge.info("Successfully extracted CSRF token from iframe", w);
          } else {
            ge.info("No CSRF token found in iframe, session may still be refreshed");
          }
          p();
          i(w);
        } catch (m) {
          ge.error("Error extracting CSRF token from iframe", m);
          p();
          l(m);
        }
      }, 3000);
    };
    c.onerror = () => {
      p();
      l(new Error("Iframe failed to load"));
    };
    document.body.appendChild(c);
  });
  const Pw = async () => {
    ge.info("Attempting session refresh via API");
    const r = await Tw();
    if ("errors" in r || r.status !== 200 && r.status !== 204) {
      throw new Error("API refresh failed");
    }
    ge.info("Session refreshed successfully via API");
    return true;
  };
  const Nw = async () => {
    ge.info("API refresh failed, trying iframe fallback");
    delete window.csrfTokenCache;
    const r = await Rw();
    if (r) {
      window.csrfTokenCache = r;
      ge.info("Cached fresh CSRF token from iframe");
    } else {
      ge.info("No CSRF token to cache, will extract on next request");
    }
    return true;
  };
  const Ow = async () => {
    try {
      await Pw();
    } catch (r) {
      ge.error("performSessionRefresh apiError", r);
      try {
        await Nw();
      } catch (o) {
        ge.error("performSessionRefresh iframeError", o);
        throw o;
      }
    }
  };
  const Aw = r => {
    let o = null;
    r.interceptors.response.use(undefined, async i => {
      const l = i.config;
      const c = i.response?.status === vf.Unauthorized;
      if (!l || !c) {
        return Promise.reject(i);
      }
      o ||= Ow();
      try {
        await o;
        o = null;
        return r.request(l);
      } catch {
        o = null;
        delete window.csrfTokenCache;
        return Promise.reject(i);
      }
    });
  };
  const Xt = Oe.create();
  xw(Xt);
  kw(Xt);
  Cw(Xt);
  _w(Xt);
  wf(Xt);
  Aw(Xt);
  fw(Xt);
  const Iw = "/api/v2";
  function Sf(r) {
    return Xt.get(`${Iw}/users/${r}`, {
      params: {
        localize: false
      }
    }).then(o => o.data.user);
  }
  const Lw = false;
  const Mw = {
    currentAccount: undefined,
    extensionSettings: undefined,
    proxyPhotoBucket: false,
    isAuthenticated: false,
    isDuplicate: false,
    entitlement: undefined,
    login: async () => {},
    logout: async () => {}
  };
  const xf = O.createContext(Mw);
  const Dw = ({
    children: r
  }) => {
    const [o, i] = O.useState(true);
    const [l, c] = O.useState(false);
    const [f, p] = O.useState(false);
    const [m, w] = O.useState(undefined);
    const [v, g] = O.useState(undefined);
    const [T, L] = O.useState(undefined);
    const {
      userId: B
    } = uw();
    async function C(y) {
      const _ = await Zy(y);
      await Ot.setItem("local:token", _.token);
      const N = await Rc();
      g(N);
      try {
        const D = await _c();
        ge.info("entitlement", D);
        w(D);
        p(true);
      } catch (D) {
        if (Oo(D) && D.response?.status === 404) {
          p(true);
        }
      }
      const b = await Sf(B);
      ge.info("userResponse", b);
      try {
        const D = await Tc(b);
        ge.info("account", D);
        L(D);
      } catch (D) {
        if (Oo(D) && D.response?.status === 422 && D.response?.data?.errors?.vinted_id) {
          ge.info("isDuplicate", true);
          c(true);
          await Ot.setItem("local:isDuplicate", true);
        }
      }
    }
    async function E() {
      try {
        await ev();
      } catch (y) {
        ge.error("Failed to revoke token", y);
      }
      await Ot.removeItem("local:token");
      await Ot.removeItem("local:isDuplicate");
      p(false);
      c(false);
      L(undefined);
      g(undefined);
    }
    O.useEffect(() => {
      const y = async () => {
        if (typeof (await Ot.getItem("local:token")) == "string") {
          p(true);
          const H = await _c();
          ge.info("entitlement", H);
          w(H);
          const W = await Rc();
          ge.info("extensionSettings", W);
          g(W);
          await N();
          await _();
        }
      };
      const _ = async () => {
        const D = await Ot.getItem("local:isDuplicate");
        if (typeof D == "boolean" && D === true) {
          c(true);
        }
      };
      const N = async () => {
        try {
          if (B) {
            const D = await tv(B);
            ge.info("account", D);
            L(D);
          }
        } catch (D) {
          ge.error("getCurrentAccount error", D);
          if (Oo(D) && D.response?.status === 401) {
            ge.info("getCurrentAccount set isDuplicate");
            c(true);
            await Ot.setItem("local:isDuplicate", true);
          } else if (Oo(D) && D.response?.status === 404) {
            const H = await Sf(B);
            ge.info("getCurrentAccount account not found");
            const W = await Tc(H);
            ge.info("account", W);
            L(W);
          }
        }
      };
      (async () => {
        try {
          await y();
        } catch (D) {
          ge.error("account context mount error", D);
        } finally {
          i(false);
        }
      })();
    }, []);
    return <xf.Provider value={{
      proxyPhotoBucket: Lw,
      currentAccount: T,
      extensionSettings: v,
      isAuthenticated: f,
      isDuplicate: l,
      login: C,
      logout: E,
      entitlement: m
    }}>{!o && r}</xf.Provider>;
  };
  const bw = () => O.useContext(xf);
  const Fw = /\{([A-Z]+)\}/g;
  function Yt(r, o, i = []) {
    let l;
    try {
      l = Ht.i18n.getMessage(r);
    } catch {
      l = "";
    }
    if (l === "") {
      l = o;
    }
    if (i.length > 0) {
      const c = i.map(f => String(f));
      return zw(l, c);
    }
    return l;
  }
  function zw(r, o) {
    return (r.match(Fw) || []).reduce((i, l, c) => i.replace(l, o[c]), r);
  }
  const _Component21 = ({
    children: r
  }) => <_Component19><Dw><Uw><div className="dotb-reset tw:bg-transparent">{r}</div><_Component18 /></Uw></Dw></_Component19>;
  const Uw = ({
    children: r
  }) => {
    const {
      isAuthenticated: o,
      entitlement: i,
      isDuplicate: l
    } = bw();
    ge.info("AiAutofill AuthenticatedWrapper", {
      isAuthenticated: o,
      entitlement: i,
      isDuplicate: l
    });
    if (o && !l && i?.enforced_limits.ai_listing_generation) {
      return r;
    } else {
      return null;
    }
  };
  function Bw() {
    const {
      toast: r
    } = df();
    const [o, i] = O.useState(false);
    const l = async () => {
      const c = Array.from(document.querySelectorAll("#photos img")).map(p => p.src).filter(Boolean);
      ge.info("AiAutofill images", c);
      if (c.length === 0) {
        r({
          variant: "destructive",
          title: Yt("toast_error", "Error"),
          description: Yt("ai_autofill_no_photos", "Please add at least one photo before using AI Autofill.")
        });
        return;
      }
      const f = document.querySelector("meta[name=\"accept-language\"]")?.getAttribute("content") ?? navigator.language ?? "en-US";
      ge.info("AiAutofill locale", f);
      i(true);
      try {
        const p = await nv({
          image_urls: c,
          locale: f
        });
        ge.info("AiAutofill result", p);
        window.postMessage({
          type: "dotb:set-input-value",
          selector: "#title",
          value: p.title
        }, window.location.origin);
        window.postMessage({
          type: "dotb:set-input-value",
          selector: "#description",
          value: p.description
        }, window.location.origin);
      } catch (p) {
        ge.error("AiAutofill error", p);
        r({
          variant: "destructive",
          title: Yt("toast_error", "Error"),
          description: Yt("ai_autofill_error", "Could not generate listing. Please try again later.")
        });
      } finally {
        i(false);
      }
    };
    return <div className="tw:mt-4 tw:flex tw:flex-col tw:sm:flex-row tw:gap-4 tw:sm:items-center tw:sm:justify-between tw:rounded-md tw:border tw:border-[rgba(var(--greyscale-level-1),0.12)] tw:bg-gradient-to-r tw:from-primary/5 tw:to-primary/10 tw:p-4"><div className="tw:flex tw:items-center tw:gap-3"><div className="tw:hidden tw:sm:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-lg tw:bg-primary"><Kg className="tw:h-5 tw:w-5 tw:text-white" /></div><div><h3 className="tw:text-sm tw:font-bold tw:text-gray-900">{Yt("ai_autofill_title", "AI Autofill")}</h3><p className="tw:text-sm tw:text-gray-600">{Yt("ai_autofill_description", "Let AI analyze your photos and fill in the details")}</p></div></div>{o ? <div className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:bg-primary tw:px-4 tw:py-2 tw:text-primary-foreground tw:whitespace-nowrap"><Hg className="tw:h-4 tw:w-4 tw:animate-spin" /><span className="tw:text-sm tw:font-medium">{Yt("ai_autofill_button_loading", "Generating...")}</span></div> : <Pc className="tw:bg-primary tw:text-primary-foreground tw:hover:bg-primary/90 tw:whitespace-nowrap" onClick={l}><_Component20 className="tw:h-4 tw:w-4 tw:mr-2" />{Yt("ai_autofill_button", "Fill with AI")}</Pc>}</div>;
  }
  function Vw() {
    return <_Component21><Bw /></_Component21>;
  }
  const $w = Qm.flatMap(r => [`https://www.vinted.${r}/items/*/edit`, `https://www.vinted.${r}/items/new`]);
  const Ww = {
    matches: $w,
    async main(r) {
      await Dm("/react-input-main-world.js", {
        keepInDom: true
      });
      Mm(r, {
        position: "inline",
        anchor: ":has(> #photos)",
        append: "after",
        onMount: i => {
          ge.info("Inject AiAutofill");
          const l = Km.createRoot(i);
          l.render(<Vw />);
          return l;
        },
        onRemove: i => {
          if (i) {
            i.unmount();
          }
        }
      }).autoMount();
    }
  };
  var Kw = class vm extends Event {
    static EVENT_NAME = Xs("wxt:locationchange");
    constructor(o, i) {
      super(vm.EVENT_NAME, {});
      this.newUrl = o;
      this.oldUrl = i;
    }
  };
  function Xs(r) {
    return `${Ht?.runtime?.id}:ai-autofill:${r}`;
  }
  function Hw(r) {
    let o;
    let i;
    return {
      run() {
        if (o == null) {
          i = new URL(location.href);
          o = r.setInterval(() => {
            let l = new URL(location.href);
            if (l.href !== i.href) {
              window.dispatchEvent(new Kw(l, i));
              i = l;
            }
          }, 1000);
        }
      }
    };
  }
  var qw = class Wa {
    static SCRIPT_STARTED_MESSAGE_TYPE = Xs("wxt:content-script-started");
    isTopFrame = window.self === window.top;
    abortController;
    locationWatcher = Hw(this);
    receivedMessageIds = new Set();
    constructor(o, i) {
      this.contentScriptName = o;
      this.options = i;
      this.abortController = new AbortController();
      if (this.isTopFrame) {
        this.listenForNewerScripts({
          ignoreFirstEvent: true
        });
        this.stopOldScripts();
      } else {
        this.listenForNewerScripts();
      }
    }
    get signal() {
      return this.abortController.signal;
    }
    abort(o) {
      return this.abortController.abort(o);
    }
    get isInvalid() {
      if (Ht.runtime?.id == null) {
        this.notifyInvalidated();
      }
      return this.signal.aborted;
    }
    get isValid() {
      return !this.isInvalid;
    }
    onInvalidated(o) {
      this.signal.addEventListener("abort", o);
      return () => this.signal.removeEventListener("abort", o);
    }
    block() {
      return new Promise(() => {});
    }
    setInterval(o, i) {
      const l = setInterval(() => {
        if (this.isValid) {
          o();
        }
      }, i);
      this.onInvalidated(() => clearInterval(l));
      return l;
    }
    setTimeout(o, i) {
      const l = setTimeout(() => {
        if (this.isValid) {
          o();
        }
      }, i);
      this.onInvalidated(() => clearTimeout(l));
      return l;
    }
    requestAnimationFrame(o) {
      const i = requestAnimationFrame((...l) => {
        if (this.isValid) {
          o(...l);
        }
      });
      this.onInvalidated(() => cancelAnimationFrame(i));
      return i;
    }
    requestIdleCallback(o, i) {
      const l = requestIdleCallback((...c) => {
        if (!this.signal.aborted) {
          o(...c);
        }
      }, i);
      this.onInvalidated(() => cancelIdleCallback(l));
      return l;
    }
    addEventListener(o, i, l, c) {
      if (i === "wxt:locationchange" && this.isValid) {
        this.locationWatcher.run();
      }
      o.addEventListener?.(i.startsWith("wxt:") ? Xs(i) : i, l, {
        ...c,
        signal: this.signal
      });
    }
    notifyInvalidated() {
      this.abort("Content script context invalidated");
      Ka.debug(`Content script "${this.contentScriptName}" context invalidated`);
    }
    stopOldScripts() {
      window.postMessage({
        type: Wa.SCRIPT_STARTED_MESSAGE_TYPE,
        contentScriptName: this.contentScriptName,
        messageId: Math.random().toString(36).slice(2)
      }, "*");
    }
    verifyScriptStartedEvent(o) {
      const i = o.data?.type === Wa.SCRIPT_STARTED_MESSAGE_TYPE;
      const l = o.data?.contentScriptName === this.contentScriptName;
      const c = !this.receivedMessageIds.has(o.data?.messageId);
      return i && l && c;
    }
    listenForNewerScripts(o) {
      let i = true;
      const l = c => {
        if (this.verifyScriptStartedEvent(c)) {
          this.receivedMessageIds.add(c.data.messageId);
          const f = i;
          i = false;
          if (f && o?.ignoreFirstEvent) {
            return;
          }
          this.notifyInvalidated();
        }
      };
      addEventListener("message", l);
      this.onInvalidated(() => removeEventListener("message", l));
    }
  };
  function T1() {}
  function qo(r, ...o) {}
  const Gw = {
    debug: (...r) => qo(console.debug, ...r),
    log: (...r) => qo(console.log, ...r),
    warn: (...r) => qo(console.warn, ...r),
    error: (...r) => qo(console.error, ...r)
  };
  return (async () => {
    try {
      const {
        main: r,
        ...o
      } = Ww;
      return await r(new qw("ai-autofill", o));
    } catch (r) {
      Gw.error("The content script \"ai-autofill\" crashed on startup!", r);
      throw r;
    }
  })();
}();
aiAutofill;