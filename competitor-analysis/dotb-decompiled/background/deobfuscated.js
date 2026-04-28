var background = function () {
  "use strict";

  const F = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
  function Nn(e) {
    if (e == null || typeof e == "function") {
      return {
        main: e
      };
    } else {
      return e;
    }
  }
  const wt = {
    version: "3.37.0"
  }.version;
  const Xe = "https://dotb.io/";
  const yt = `${Xe}api`;
  const Mn = ["https://cdn.dotb.io/"];
  const Un = "https://dotb-storage.s3.eu-central-003.backblazeb2.com/";
  const Bn = "https://images1.vinted.net/";
  const Fn = ["at", "be", "cz", "de", "dk", "es", "fi", "fr", "gr", "hr", "hu", "ie", "it", "lt", "lu", "nl", "pl", "pt", "ro", "se", "sk", "co.uk", "com", "ee", "lv", "si"];
  const Dn = "/?d=t";
  const $n = "/my_orders?d=r";
  const zn = "/my_orders?d=a";
  var ee = (e => {
    e.GET_USER_ID = "getUserID";
    e.MAYBE_PIN_AUTO_MESSAGES_TAB = "maybePinAutoMessagesTab";
    e.MAYBE_PIN_RESTOCKER_TAB = "maybePinRestockerTab";
    e.MAYBE_PIN_AUTOMATIONS_TAB = "maybePinAutomationsTab";
    e.DOWNLOAD = "download";
    e.GET_PLATFORM_INFO = "getPlatformInfo";
    e.VINTED_LOGOUT = "vintedLogout";
    return e;
  })(ee || {});
  const Vn = Fn.map(e => `https://www.vinted.${e}/*`);
  function jn(e) {
    return F.runtime.sendMessage(e);
  }
  function qn() {
    const e = {
      action: ee.GET_PLATFORM_INFO,
      data: null
    };
    return jn(e);
  }
  function Re() {
    Vn.forEach(e => {
      F.tabs.query({
        url: e
      }).then(t => {
        t.forEach(n => {
          if (n.id) {
            F.tabs.reload(n.id);
          }
        });
      });
    });
  }
  var xt = Object.prototype.hasOwnProperty;
  function Ye(e, t) {
    var n;
    var r;
    if (e === t) {
      return true;
    }
    if (e && t && (n = e.constructor) === t.constructor) {
      if (n === Date) {
        return e.getTime() === t.getTime();
      }
      if (n === RegExp) {
        return e.toString() === t.toString();
      }
      if (n === Array) {
        if ((r = e.length) === t.length) {
          while (r-- && Ye(e[r], t[r]));
        }
        return r === -1;
      }
      if (!n || typeof e == "object") {
        r = 0;
        for (n in e) {
          if (xt.call(e, n) && ++r && !xt.call(t, n) || !(n in t) || !Ye(e[n], t[n])) {
            return false;
          }
        }
        return Object.keys(t).length === r;
      }
    }
    return e !== e && t !== t;
  }
  const Gn = new Error("request for lock canceled");
  function Kn(e, t, n, r) {
    function o(s) {
      if (s instanceof n) {
        return s;
      } else {
        return new n(function (i) {
          i(s);
        });
      }
    }
    return new (n ||= Promise)(function (s, i) {
      function a(c) {
        try {
          p(r.next(c));
        } catch (g) {
          i(g);
        }
      }
      function f(c) {
        try {
          p(r.throw(c));
        } catch (g) {
          i(g);
        }
      }
      function p(c) {
        if (c.done) {
          s(c.value);
        } else {
          o(c.value).then(a, f);
        }
      }
      p((r = r.apply(e, t || [])).next());
    });
  }
  class Hn {
    constructor(t, n = Gn) {
      this._value = t;
      this._cancelError = n;
      this._queue = [];
      this._weightedWaiters = [];
    }
    acquire(t = 1, n = 0) {
      if (t <= 0) {
        throw new Error(`invalid weight ${t}: must be positive`);
      }
      return new Promise((r, o) => {
        const s = {
          resolve: r,
          reject: o,
          weight: t,
          priority: n
        };
        const i = Et(this._queue, a => n <= a.priority);
        if (i === -1 && t <= this._value) {
          this._dispatchItem(s);
        } else {
          this._queue.splice(i + 1, 0, s);
        }
      });
    }
    runExclusive(t) {
      return Kn(this, arguments, undefined, function* (n, r = 1, o = 0) {
        const [s, i] = yield this.acquire(r, o);
        try {
          return yield n(s);
        } finally {
          i();
        }
      });
    }
    waitForUnlock(t = 1, n = 0) {
      if (t <= 0) {
        throw new Error(`invalid weight ${t}: must be positive`);
      }
      if (this._couldLockImmediately(t, n)) {
        return Promise.resolve();
      } else {
        return new Promise(r => {
          this._weightedWaiters[t - 1] ||= [];
          Wn(this._weightedWaiters[t - 1], {
            resolve: r,
            priority: n
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
    setValue(t) {
      this._value = t;
      this._dispatchQueue();
    }
    release(t = 1) {
      if (t <= 0) {
        throw new Error(`invalid weight ${t}: must be positive`);
      }
      this._value += t;
      this._dispatchQueue();
    }
    cancel() {
      this._queue.forEach(t => t.reject(this._cancelError));
      this._queue = [];
    }
    _dispatchQueue() {
      for (this._drainUnlockWaiters(); this._queue.length > 0 && this._queue[0].weight <= this._value;) {
        this._dispatchItem(this._queue.shift());
        this._drainUnlockWaiters();
      }
    }
    _dispatchItem(t) {
      const n = this._value;
      this._value -= t.weight;
      t.resolve([n, this._newReleaser(t.weight)]);
    }
    _newReleaser(t) {
      let n = false;
      return () => {
        if (!n) {
          n = true;
          this.release(t);
        }
      };
    }
    _drainUnlockWaiters() {
      if (this._queue.length === 0) {
        for (let t = this._value; t > 0; t--) {
          const n = this._weightedWaiters[t - 1];
          if (n) {
            n.forEach(r => r.resolve());
            this._weightedWaiters[t - 1] = [];
          }
        }
      } else {
        const t = this._queue[0].priority;
        for (let n = this._value; n > 0; n--) {
          const r = this._weightedWaiters[n - 1];
          if (!r) {
            continue;
          }
          const o = r.findIndex(s => s.priority <= t);
          (o === -1 ? r : r.splice(0, o)).forEach(s => s.resolve());
        }
      }
    }
    _couldLockImmediately(t, n) {
      return (this._queue.length === 0 || this._queue[0].priority < n) && t <= this._value;
    }
  }
  function Wn(e, t) {
    const n = Et(e, r => t.priority <= r.priority);
    e.splice(n + 1, 0, t);
  }
  function Et(e, t) {
    for (let n = e.length - 1; n >= 0; n--) {
      if (t(e[n])) {
        return n;
      }
    }
    return -1;
  }
  function Jn(e, t, n, r) {
    function o(s) {
      if (s instanceof n) {
        return s;
      } else {
        return new n(function (i) {
          i(s);
        });
      }
    }
    return new (n ||= Promise)(function (s, i) {
      function a(c) {
        try {
          p(r.next(c));
        } catch (g) {
          i(g);
        }
      }
      function f(c) {
        try {
          p(r.throw(c));
        } catch (g) {
          i(g);
        }
      }
      function p(c) {
        if (c.done) {
          s(c.value);
        } else {
          o(c.value).then(a, f);
        }
      }
      p((r = r.apply(e, t || [])).next());
    });
  }
  class Xn {
    constructor(t) {
      this._semaphore = new Hn(1, t);
    }
    acquire() {
      return Jn(this, arguments, undefined, function* (t = 0) {
        const [, n] = yield this._semaphore.acquire(1, t);
        return n;
      });
    }
    runExclusive(t, n = 0) {
      return this._semaphore.runExclusive(() => t(), 1, n);
    }
    isLocked() {
      return this._semaphore.isLocked();
    }
    waitForUnlock(t = 0) {
      return this._semaphore.waitForUnlock(1, t);
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
  const Se = globalThis.browser?.runtime?.id == null ? globalThis.chrome : globalThis.browser;
  const re = Yn();
  function Yn() {
    const e = {
      local: Te("local"),
      session: Te("session"),
      sync: Te("sync"),
      managed: Te("managed")
    };
    const t = d => {
      const l = e[d];
      if (l == null) {
        const m = Object.keys(e).join(", ");
        throw Error(`Invalid area "${d}". Options: ${m}`);
      }
      return l;
    };
    const n = d => {
      const l = d.indexOf(":");
      const m = d.substring(0, l);
      const b = d.substring(l + 1);
      if (b == null) {
        throw Error(`Storage key should be in the form of "area:key", but received "${d}"`);
      }
      return {
        driverArea: m,
        driverKey: b,
        driver: t(m)
      };
    };
    const r = d => d + "$";
    const o = (d, l) => {
      const m = {
        ...d
      };
      Object.entries(l).forEach(([b, w]) => {
        if (w == null) {
          delete m[b];
        } else {
          m[b] = w;
        }
      });
      return m;
    };
    const s = (d, l) => d ?? l ?? null;
    const i = d => typeof d == "object" && !Array.isArray(d) ? d : {};
    const a = async (d, l, m) => {
      const b = await d.getItem(l);
      return s(b, m?.fallback ?? m?.defaultValue);
    };
    const f = async (d, l) => {
      const m = r(l);
      const b = await d.getItem(m);
      return i(b);
    };
    const p = async (d, l, m) => {
      await d.setItem(l, m ?? null);
    };
    const c = async (d, l, m) => {
      const b = r(l);
      const w = i(await d.getItem(b));
      await d.setItem(b, o(w, m));
    };
    const g = async (d, l, m) => {
      await d.removeItem(l);
      if (m?.removeMeta) {
        const b = r(l);
        await d.removeItem(b);
      }
    };
    const S = async (d, l, m) => {
      const b = r(l);
      if (m == null) {
        await d.removeItem(b);
      } else {
        const w = i(await d.getItem(b));
        [m].flat().forEach(v => delete w[v]);
        await d.setItem(b, w);
      }
    };
    const P = (d, l, m) => d.watch(l, m);
    return {
      getItem: async (d, l) => {
        const {
          driver: m,
          driverKey: b
        } = n(d);
        return await a(m, b, l);
      },
      getItems: async d => {
        const l = new Map();
        const m = new Map();
        const b = [];
        d.forEach(v => {
          let A;
          let _;
          if (typeof v == "string") {
            A = v;
          } else if ("getValue" in v) {
            A = v.key;
            _ = {
              fallback: v.fallback
            };
          } else {
            A = v.key;
            _ = v.options;
          }
          b.push(A);
          const {
            driverArea: O,
            driverKey: E
          } = n(A);
          const L = l.get(O) ?? [];
          l.set(O, L.concat(E));
          m.set(A, _);
        });
        const w = new Map();
        await Promise.all(Array.from(l.entries()).map(async ([v, A]) => {
          (await e[v].getItems(A)).forEach(O => {
            const E = `${v}:${O.key}`;
            const L = m.get(E);
            const C = s(O.value, L?.fallback ?? L?.defaultValue);
            w.set(E, C);
          });
        }));
        return b.map(v => ({
          key: v,
          value: w.get(v)
        }));
      },
      getMeta: async d => {
        const {
          driver: l,
          driverKey: m
        } = n(d);
        return await f(l, m);
      },
      getMetas: async d => {
        const l = d.map(w => {
          const v = typeof w == "string" ? w : w.key;
          const {
            driverArea: A,
            driverKey: _
          } = n(v);
          return {
            key: v,
            driverArea: A,
            driverKey: _,
            driverMetaKey: r(_)
          };
        });
        const m = l.reduce((w, v) => {
          w[v.driverArea] ??= [];
          w[v.driverArea].push(v);
          return w;
        }, {});
        const b = {};
        await Promise.all(Object.entries(m).map(async ([w, v]) => {
          const A = await Se.storage[w].get(v.map(_ => _.driverMetaKey));
          v.forEach(_ => {
            b[_.key] = A[_.driverMetaKey] ?? {};
          });
        }));
        return l.map(w => ({
          key: w.key,
          meta: b[w.key]
        }));
      },
      setItem: async (d, l) => {
        const {
          driver: m,
          driverKey: b
        } = n(d);
        await p(m, b, l);
      },
      setItems: async d => {
        const l = {};
        d.forEach(m => {
          const {
            driverArea: b,
            driverKey: w
          } = n("key" in m ? m.key : m.item.key);
          l[b] ??= [];
          l[b].push({
            key: w,
            value: m.value
          });
        });
        await Promise.all(Object.entries(l).map(async ([m, b]) => {
          await t(m).setItems(b);
        }));
      },
      setMeta: async (d, l) => {
        const {
          driver: m,
          driverKey: b
        } = n(d);
        await c(m, b, l);
      },
      setMetas: async d => {
        const l = {};
        d.forEach(m => {
          const {
            driverArea: b,
            driverKey: w
          } = n("key" in m ? m.key : m.item.key);
          l[b] ??= [];
          l[b].push({
            key: w,
            properties: m.meta
          });
        });
        await Promise.all(Object.entries(l).map(async ([m, b]) => {
          const w = t(m);
          const v = b.map(({
            key: E
          }) => r(E));
          console.log(m, v);
          const A = await w.getItems(v);
          const _ = Object.fromEntries(A.map(({
            key: E,
            value: L
          }) => [E, i(L)]));
          const O = b.map(({
            key: E,
            properties: L
          }) => {
            const C = r(E);
            return {
              key: C,
              value: o(_[C] ?? {}, L)
            };
          });
          await w.setItems(O);
        }));
      },
      removeItem: async (d, l) => {
        const {
          driver: m,
          driverKey: b
        } = n(d);
        await g(m, b, l);
      },
      removeItems: async d => {
        const l = {};
        d.forEach(m => {
          let b;
          let w;
          if (typeof m == "string") {
            b = m;
          } else if ("getValue" in m) {
            b = m.key;
          } else if ("item" in m) {
            b = m.item.key;
            w = m.options;
          } else {
            b = m.key;
            w = m.options;
          }
          const {
            driverArea: v,
            driverKey: A
          } = n(b);
          l[v] ??= [];
          l[v].push(A);
          if (w?.removeMeta) {
            l[v].push(r(A));
          }
        });
        await Promise.all(Object.entries(l).map(async ([m, b]) => {
          await t(m).removeItems(b);
        }));
      },
      clear: async d => {
        await t(d).clear();
      },
      removeMeta: async (d, l) => {
        const {
          driver: m,
          driverKey: b
        } = n(d);
        await S(m, b, l);
      },
      snapshot: async (d, l) => {
        const b = await t(d).snapshot();
        l?.excludeKeys?.forEach(w => {
          delete b[w];
          delete b[r(w)];
        });
        return b;
      },
      restoreSnapshot: async (d, l) => {
        await t(d).restoreSnapshot(l);
      },
      watch: (d, l) => {
        const {
          driver: m,
          driverKey: b
        } = n(d);
        return P(m, b, l);
      },
      unwatch() {
        Object.values(e).forEach(d => {
          d.unwatch();
        });
      },
      defineItem: (d, l) => {
        const {
          driver: m,
          driverKey: b
        } = n(d);
        const {
          version: w = 1,
          migrations: v = {}
        } = l ?? {};
        if (w < 1) {
          throw Error("Storage item version cannot be less than 1. Initial versions should be set to 1, not 0.");
        }
        const A = async () => {
          const C = r(b);
          const [{
            value: W
          }, {
            value: K
          }] = await m.getItems([b, C]);
          if (W == null) {
            return;
          }
          const V = K?.v ?? 1;
          if (V > w) {
            throw Error(`Version downgrade detected (v${V} -> v${w}) for "${d}"`);
          }
          if (V === w) {
            return;
          }
          console.debug(`[@wxt-dev/storage] Running storage migration for ${d}: v${V} -> v${w}`);
          const J = Array.from({
            length: w - V
          }, (I, H) => V + H + 1);
          let j = W;
          for (const I of J) {
            try {
              j = (await v?.[I]?.(j)) ?? j;
            } catch (H) {
              throw new Qn(d, I, {
                cause: H
              });
            }
          }
          await m.setItems([{
            key: b,
            value: j
          }, {
            key: C,
            value: {
              ...K,
              v: w
            }
          }]);
          console.debug(`[@wxt-dev/storage] Storage migration completed for ${d} v${w}`, {
            migratedValue: j
          });
        };
        const _ = l?.migrations == null ? Promise.resolve() : A().catch(C => {
          console.error(`[@wxt-dev/storage] Migration failed for ${d}`, C);
        });
        const O = new Xn();
        const E = () => l?.fallback ?? l?.defaultValue ?? null;
        const L = () => O.runExclusive(async () => {
          const C = await m.getItem(b);
          if (C != null || l?.init == null) {
            return C;
          }
          const W = await l.init();
          await m.setItem(b, W);
          return W;
        });
        _.then(L);
        return {
          key: d,
          get defaultValue() {
            return E();
          },
          get fallback() {
            return E();
          },
          getValue: async () => {
            await _;
            if (l?.init) {
              return await L();
            } else {
              return await a(m, b, l);
            }
          },
          getMeta: async () => {
            await _;
            return await f(m, b);
          },
          setValue: async C => {
            await _;
            return await p(m, b, C);
          },
          setMeta: async C => {
            await _;
            return await c(m, b, C);
          },
          removeValue: async C => {
            await _;
            return await g(m, b, C);
          },
          removeMeta: async C => {
            await _;
            return await S(m, b, C);
          },
          watch: C => P(m, b, (W, K) => C(W ?? E(), K ?? E())),
          migrate: A
        };
      }
    };
  }
  function Te(e) {
    const t = () => {
      if (Se.runtime == null) {
        throw Error(["'wxt/storage' must be loaded in a web extension environment", `
 - If thrown during a build, see https://github.com/wxt-dev/wxt/issues/371`, ` - If thrown during tests, mock 'wxt/browser' correctly. See https://wxt.dev/guide/go-further/testing.html
`].join(`
`));
      }
      if (Se.storage == null) {
        throw Error("You must add the 'storage' permission to your manifest to use 'wxt/storage'");
      }
      const r = Se.storage[e];
      if (r == null) {
        throw Error(`"browser.storage.${e}" is undefined`);
      }
      return r;
    };
    const n = new Set();
    return {
      getItem: async r => (await t().get(r))[r],
      getItems: async r => {
        const o = await t().get(r);
        return r.map(s => ({
          key: s,
          value: o[s] ?? null
        }));
      },
      setItem: async (r, o) => {
        if (o == null) {
          await t().remove(r);
        } else {
          await t().set({
            [r]: o
          });
        }
      },
      setItems: async r => {
        const o = r.reduce((s, {
          key: i,
          value: a
        }) => {
          s[i] = a;
          return s;
        }, {});
        await t().set(o);
      },
      removeItem: async r => {
        await t().remove(r);
      },
      removeItems: async r => {
        await t().remove(r);
      },
      clear: async () => {
        await t().clear();
      },
      snapshot: async () => await t().get(),
      restoreSnapshot: async r => {
        await t().set(r);
      },
      watch(r, o) {
        const s = i => {
          const a = i[r];
          if (a != null) {
            if (!Ye(a.newValue, a.oldValue)) {
              o(a.newValue ?? null, a.oldValue ?? null);
            }
          }
        };
        t().onChanged.addListener(s);
        n.add(s);
        return () => {
          t().onChanged.removeListener(s);
          n.delete(s);
        };
      },
      unwatch() {
        n.forEach(r => {
          t().onChanged.removeListener(r);
        });
        n.clear();
      }
    };
  }
  class Qn extends Error {
    constructor(t, n, r) {
      super(`v${n} migration failed for "${t}"`, r);
      this.key = t;
      this.version = n;
    }
  }
  function vt(e, t) {
    return function () {
      return e.apply(t, arguments);
    };
  }
  const {
    toString: Zn
  } = Object.prototype;
  const {
    getPrototypeOf: Qe
  } = Object;
  const {
    iterator: Ae,
    toStringTag: kt
  } = Symbol;
  const _e = (e => t => {
    const n = Zn.call(t);
    return e[n] ||= n.slice(8, -1).toLowerCase();
  })(Object.create(null));
  const Y = e => {
    e = e.toLowerCase();
    return t => _e(t) === e;
  };
  const Oe = e => t => typeof t === e;
  const {
    isArray: le
  } = Array;
  const ue = Oe("undefined");
  function me(e) {
    return e !== null && !ue(e) && e.constructor !== null && !ue(e.constructor) && q(e.constructor.isBuffer) && e.constructor.isBuffer(e);
  }
  const Rt = Y("ArrayBuffer");
  function er(e) {
    let t;
    if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
      t = ArrayBuffer.isView(e);
    } else {
      t = e && e.buffer && Rt(e.buffer);
    }
    return t;
  }
  const tr = Oe("string");
  const q = Oe("function");
  const St = Oe("number");
  const he = e => e !== null && typeof e == "object";
  const nr = e => e === true || e === false;
  const Ce = e => {
    if (_e(e) !== "object") {
      return false;
    }
    const t = Qe(e);
    return (t === null || t === Object.prototype || Object.getPrototypeOf(t) === null) && !(kt in e) && !(Ae in e);
  };
  const rr = e => {
    if (!he(e) || me(e)) {
      return false;
    }
    try {
      return Object.keys(e).length === 0 && Object.getPrototypeOf(e) === Object.prototype;
    } catch {
      return false;
    }
  };
  const or = Y("Date");
  const sr = Y("File");
  const ir = Y("Blob");
  const ar = Y("FileList");
  const cr = e => he(e) && q(e.pipe);
  const lr = e => {
    let t;
    return e && (typeof FormData == "function" && e instanceof FormData || q(e.append) && ((t = _e(e)) === "formdata" || t === "object" && q(e.toString) && e.toString() === "[object FormData]"));
  };
  const ur = Y("URLSearchParams");
  const [dr, fr, pr, mr] = ["ReadableStream", "Request", "Response", "Headers"].map(Y);
  const hr = e => e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
  function ge(e, t, {
    allOwnKeys: n = false
  } = {}) {
    if (e === null || typeof e === "undefined") {
      return;
    }
    let r;
    let o;
    if (typeof e != "object") {
      e = [e];
    }
    if (le(e)) {
      r = 0;
      o = e.length;
      for (; r < o; r++) {
        t.call(null, e[r], r, e);
      }
    } else {
      if (me(e)) {
        return;
      }
      const s = n ? Object.getOwnPropertyNames(e) : Object.keys(e);
      const i = s.length;
      let a;
      for (r = 0; r < i; r++) {
        a = s[r];
        t.call(null, e[a], a, e);
      }
    }
  }
  function Tt(e, t) {
    if (me(e)) {
      return null;
    }
    t = t.toLowerCase();
    const n = Object.keys(e);
    let r = n.length;
    let o;
    while (r-- > 0) {
      o = n[r];
      if (t === o.toLowerCase()) {
        return o;
      }
    }
    return null;
  }
  const oe = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
  const At = e => !ue(e) && e !== oe;
  function Ze() {
    const {
      caseless: e,
      skipUndefined: t
    } = At(this) && this || {};
    const n = {};
    const r = (o, s) => {
      if (s === "__proto__" || s === "constructor" || s === "prototype") {
        return;
      }
      const i = e && Tt(n, s) || s;
      if (Ce(n[i]) && Ce(o)) {
        n[i] = Ze(n[i], o);
      } else if (Ce(o)) {
        n[i] = Ze({}, o);
      } else if (le(o)) {
        n[i] = o.slice();
      } else if (!t || !ue(o)) {
        n[i] = o;
      }
    };
    for (let o = 0, s = arguments.length; o < s; o++) {
      if (arguments[o]) {
        ge(arguments[o], r);
      }
    }
    return n;
  }
  const gr = (e, t, n, {
    allOwnKeys: r
  } = {}) => {
    ge(t, (o, s) => {
      if (n && q(o)) {
        Object.defineProperty(e, s, {
          value: vt(o, n),
          writable: true,
          enumerable: true,
          configurable: true
        });
      } else {
        Object.defineProperty(e, s, {
          value: o,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    }, {
      allOwnKeys: r
    });
    return e;
  };
  const br = e => {
    if (e.charCodeAt(0) === 65279) {
      e = e.slice(1);
    }
    return e;
  };
  const wr = (e, t, n, r) => {
    e.prototype = Object.create(t.prototype, r);
    Object.defineProperty(e.prototype, "constructor", {
      value: e,
      writable: true,
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(e, "super", {
      value: t.prototype
    });
    if (n) {
      Object.assign(e.prototype, n);
    }
  };
  const yr = (e, t, n, r) => {
    let o;
    let s;
    let i;
    const a = {};
    t = t || {};
    if (e == null) {
      return t;
    }
    do {
      o = Object.getOwnPropertyNames(e);
      s = o.length;
      while (s-- > 0) {
        i = o[s];
        if ((!r || r(i, e, t)) && !a[i]) {
          t[i] = e[i];
          a[i] = true;
        }
      }
      e = n !== false && Qe(e);
    } while (e && (!n || n(e, t)) && e !== Object.prototype);
    return t;
  };
  const xr = (e, t, n) => {
    e = String(e);
    if (n === undefined || n > e.length) {
      n = e.length;
    }
    n -= t.length;
    const r = e.indexOf(t, n);
    return r !== -1 && r === n;
  };
  const Er = e => {
    if (!e) {
      return null;
    }
    if (le(e)) {
      return e;
    }
    let t = e.length;
    if (!St(t)) {
      return null;
    }
    const n = new Array(t);
    while (t-- > 0) {
      n[t] = e[t];
    }
    return n;
  };
  const vr = (e => t => e && t instanceof e)(typeof Uint8Array !== "undefined" && Qe(Uint8Array));
  const kr = (e, t) => {
    const r = (e && e[Ae]).call(e);
    let o;
    while ((o = r.next()) && !o.done) {
      const s = o.value;
      t.call(e, s[0], s[1]);
    }
  };
  const Rr = (e, t) => {
    let n;
    const r = [];
    while ((n = e.exec(t)) !== null) {
      r.push(n);
    }
    return r;
  };
  const Sr = Y("HTMLFormElement");
  const Tr = e => e.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function (n, r, o) {
    return r.toUpperCase() + o;
  });
  const _t = (({
    hasOwnProperty: e
  }) => (t, n) => e.call(t, n))(Object.prototype);
  const Ar = Y("RegExp");
  const Ot = (e, t) => {
    const n = Object.getOwnPropertyDescriptors(e);
    const r = {};
    ge(n, (o, s) => {
      let i;
      if ((i = t(o, s, e)) !== false) {
        r[s] = i || o;
      }
    });
    Object.defineProperties(e, r);
  };
  const _r = e => {
    Ot(e, (t, n) => {
      if (q(e) && ["arguments", "caller", "callee"].indexOf(n) !== -1) {
        return false;
      }
      const r = e[n];
      if (q(r)) {
        t.enumerable = false;
        if ("writable" in t) {
          t.writable = false;
          return;
        }
        t.set ||= () => {
          throw Error("Can not rewrite read-only method '" + n + "'");
        };
      }
    });
  };
  const Or = (e, t) => {
    const n = {};
    const r = o => {
      o.forEach(s => {
        n[s] = true;
      });
    };
    if (le(e)) {
      r(e);
    } else {
      r(String(e).split(t));
    }
    return n;
  };
  const Cr = () => {};
  const Ir = (e, t) => e != null && Number.isFinite(e = +e) ? e : t;
  function Pr(e) {
    return !!e && !!q(e.append) && e[kt] === "FormData" && !!e[Ae];
  }
  const Lr = e => {
    const t = new Array(10);
    const n = (r, o) => {
      if (he(r)) {
        if (t.indexOf(r) >= 0) {
          return;
        }
        if (me(r)) {
          return r;
        }
        if (!("toJSON" in r)) {
          t[o] = r;
          const s = le(r) ? [] : {};
          ge(r, (i, a) => {
            const f = n(i, o + 1);
            if (!ue(f)) {
              s[a] = f;
            }
          });
          t[o] = undefined;
          return s;
        }
      }
      return r;
    };
    return n(e, 0);
  };
  const Nr = Y("AsyncFunction");
  const Mr = e => e && (he(e) || q(e)) && q(e.then) && q(e.catch);
  const Ct = ((e, t) => e ? setImmediate : t ? ((n, r) => {
    oe.addEventListener("message", ({
      source: o,
      data: s
    }) => {
      if (o === oe && s === n && r.length) {
        r.shift()();
      }
    }, false);
    return o => {
      r.push(o);
      oe.postMessage(n, "*");
    };
  })(`axios@${Math.random()}`, []) : n => setTimeout(n))(typeof setImmediate == "function", q(oe.postMessage));
  const Ur = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(oe) : typeof process !== "undefined" && process.nextTick || Ct;
  const u = {
    isArray: le,
    isArrayBuffer: Rt,
    isBuffer: me,
    isFormData: lr,
    isArrayBufferView: er,
    isString: tr,
    isNumber: St,
    isBoolean: nr,
    isObject: he,
    isPlainObject: Ce,
    isEmptyObject: rr,
    isReadableStream: dr,
    isRequest: fr,
    isResponse: pr,
    isHeaders: mr,
    isUndefined: ue,
    isDate: or,
    isFile: sr,
    isBlob: ir,
    isRegExp: Ar,
    isFunction: q,
    isStream: cr,
    isURLSearchParams: ur,
    isTypedArray: vr,
    isFileList: ar,
    forEach: ge,
    merge: Ze,
    extend: gr,
    trim: hr,
    stripBOM: br,
    inherits: wr,
    toFlatObject: yr,
    kindOf: _e,
    kindOfTest: Y,
    endsWith: xr,
    toArray: Er,
    forEachEntry: kr,
    matchAll: Rr,
    isHTMLForm: Sr,
    hasOwnProperty: _t,
    hasOwnProp: _t,
    reduceDescriptors: Ot,
    freezeMethods: _r,
    toObjectSet: Or,
    toCamelCase: Tr,
    noop: Cr,
    toFiniteNumber: Ir,
    findKey: Tt,
    global: oe,
    isContextDefined: At,
    isSpecCompliantForm: Pr,
    toJSONObject: Lr,
    isAsyncFn: Nr,
    isThenable: Mr,
    setImmediate: Ct,
    asap: Ur,
    isIterable: e => e != null && q(e[Ae])
  };
  let R = class Pn extends Error {
    static from(t, n, r, o, s, i) {
      const a = new Pn(t.message, n || t.code, r, o, s);
      a.cause = t;
      a.name = t.name;
      if (i) {
        Object.assign(a, i);
      }
      return a;
    }
    constructor(t, n, r, o, s) {
      super(t);
      this.name = "AxiosError";
      this.isAxiosError = true;
      if (n) {
        this.code = n;
      }
      if (r) {
        this.config = r;
      }
      if (o) {
        this.request = o;
      }
      if (s) {
        this.response = s;
        this.status = s.status;
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
        config: u.toJSONObject(this.config),
        code: this.code,
        status: this.status
      };
    }
  };
  R.ERR_BAD_OPTION_VALUE = "ERR_BAD_OPTION_VALUE";
  R.ERR_BAD_OPTION = "ERR_BAD_OPTION";
  R.ECONNABORTED = "ECONNABORTED";
  R.ETIMEDOUT = "ETIMEDOUT";
  R.ERR_NETWORK = "ERR_NETWORK";
  R.ERR_FR_TOO_MANY_REDIRECTS = "ERR_FR_TOO_MANY_REDIRECTS";
  R.ERR_DEPRECATED = "ERR_DEPRECATED";
  R.ERR_BAD_RESPONSE = "ERR_BAD_RESPONSE";
  R.ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
  R.ERR_CANCELED = "ERR_CANCELED";
  R.ERR_NOT_SUPPORT = "ERR_NOT_SUPPORT";
  R.ERR_INVALID_URL = "ERR_INVALID_URL";
  const Br = null;
  function et(e) {
    return u.isPlainObject(e) || u.isArray(e);
  }
  function It(e) {
    if (u.endsWith(e, "[]")) {
      return e.slice(0, -2);
    } else {
      return e;
    }
  }
  function Pt(e, t, n) {
    if (e) {
      return e.concat(t).map(function (o, s) {
        o = It(o);
        if (!n && s) {
          return "[" + o + "]";
        } else {
          return o;
        }
      }).join(n ? "." : "");
    } else {
      return t;
    }
  }
  function Fr(e) {
    return u.isArray(e) && !e.some(et);
  }
  const Dr = u.toFlatObject(u, {}, null, function (t) {
    return /^is[A-Z]/.test(t);
  });
  function Ie(e, t, n) {
    if (!u.isObject(e)) {
      throw new TypeError("target must be an object");
    }
    t = t || new FormData();
    n = u.toFlatObject(n, {
      metaTokens: true,
      dots: false,
      indexes: false
    }, false, function (d, l) {
      return !u.isUndefined(l[d]);
    });
    const r = n.metaTokens;
    const o = n.visitor || c;
    const s = n.dots;
    const i = n.indexes;
    const f = (n.Blob || typeof Blob !== "undefined" && Blob) && u.isSpecCompliantForm(t);
    if (!u.isFunction(o)) {
      throw new TypeError("visitor must be a function");
    }
    function p(h) {
      if (h === null) {
        return "";
      }
      if (u.isDate(h)) {
        return h.toISOString();
      }
      if (u.isBoolean(h)) {
        return h.toString();
      }
      if (!f && u.isBlob(h)) {
        throw new R("Blob is not supported. Use a Buffer instead.");
      }
      if (u.isArrayBuffer(h) || u.isTypedArray(h)) {
        if (f && typeof Blob == "function") {
          return new Blob([h]);
        } else {
          return Buffer.from(h);
        }
      } else {
        return h;
      }
    }
    function c(h, d, l) {
      let m = h;
      if (h && !l && typeof h == "object") {
        if (u.endsWith(d, "{}")) {
          d = r ? d : d.slice(0, -2);
          h = JSON.stringify(h);
        } else if (u.isArray(h) && Fr(h) || (u.isFileList(h) || u.endsWith(d, "[]")) && (m = u.toArray(h))) {
          d = It(d);
          m.forEach(function (w, v) {
            if (!u.isUndefined(w) && w !== null) {
              t.append(i === true ? Pt([d], v, s) : i === null ? d : d + "[]", p(w));
            }
          });
          return false;
        }
      }
      if (et(h)) {
        return true;
      } else {
        t.append(Pt(l, d, s), p(h));
        return false;
      }
    }
    const g = [];
    const S = Object.assign(Dr, {
      defaultVisitor: c,
      convertValue: p,
      isVisitable: et
    });
    function P(h, d) {
      if (!u.isUndefined(h)) {
        if (g.indexOf(h) !== -1) {
          throw Error("Circular reference detected in " + d.join("."));
        }
        g.push(h);
        u.forEach(h, function (m, b) {
          if ((!u.isUndefined(m) && m !== null && o.call(t, m, u.isString(b) ? b.trim() : b, d, S)) === true) {
            P(m, d ? d.concat(b) : [b]);
          }
        });
        g.pop();
      }
    }
    if (!u.isObject(e)) {
      throw new TypeError("data must be an object");
    }
    P(e);
    return t;
  }
  function Lt(e) {
    const t = {
      "!": "%21",
      "'": "%27",
      "(": "%28",
      ")": "%29",
      "~": "%7E",
      "%20": "+",
      "%00": "\0"
    };
    return encodeURIComponent(e).replace(/[!'()~]|%20|%00/g, function (r) {
      return t[r];
    });
  }
  function tt(e, t) {
    this._pairs = [];
    if (e) {
      Ie(e, this, t);
    }
  }
  const Nt = tt.prototype;
  Nt.append = function (t, n) {
    this._pairs.push([t, n]);
  };
  Nt.toString = function (t) {
    const n = t ? function (r) {
      return t.call(this, r, Lt);
    } : Lt;
    return this._pairs.map(function (o) {
      return n(o[0]) + "=" + n(o[1]);
    }, "").join("&");
  };
  function $r(e) {
    return encodeURIComponent(e).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+");
  }
  function Mt(e, t, n) {
    if (!t) {
      return e;
    }
    const r = n && n.encode || $r;
    const o = u.isFunction(n) ? {
      serialize: n
    } : n;
    const s = o && o.serialize;
    let i;
    if (s) {
      i = s(t, o);
    } else {
      i = u.isURLSearchParams(t) ? t.toString() : new tt(t, o).toString(r);
    }
    if (i) {
      const a = e.indexOf("#");
      if (a !== -1) {
        e = e.slice(0, a);
      }
      e += (e.indexOf("?") === -1 ? "?" : "&") + i;
    }
    return e;
  }
  class Ut {
    constructor() {
      this.handlers = [];
    }
    use(t, n, r) {
      this.handlers.push({
        fulfilled: t,
        rejected: n,
        synchronous: r ? r.synchronous : false,
        runWhen: r ? r.runWhen : null
      });
      return this.handlers.length - 1;
    }
    eject(t) {
      this.handlers[t] &&= null;
    }
    clear() {
      this.handlers &&= [];
    }
    forEach(t) {
      u.forEach(this.handlers, function (r) {
        if (r !== null) {
          t(r);
        }
      });
    }
  }
  const nt = {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false,
    legacyInterceptorReqResOrdering: true
  };
  const zr = {
    isBrowser: true,
    classes: {
      URLSearchParams: typeof URLSearchParams !== "undefined" ? URLSearchParams : tt,
      FormData: typeof FormData !== "undefined" ? FormData : null,
      Blob: typeof Blob !== "undefined" ? Blob : null
    },
    protocols: ["http", "https", "file", "blob", "url", "data"]
  };
  const rt = typeof window !== "undefined" && typeof document !== "undefined";
  const ot = typeof navigator == "object" && navigator || undefined;
  const Vr = rt && (!ot || ["ReactNative", "NativeScript", "NS"].indexOf(ot.product) < 0);
  const jr = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope && typeof self.importScripts == "function";
  const qr = rt && window.location.href || "http://localhost";
  const z = {
    ...Object.freeze(Object.defineProperty({
      __proto__: null,
      hasBrowserEnv: rt,
      hasStandardBrowserEnv: Vr,
      hasStandardBrowserWebWorkerEnv: jr,
      navigator: ot,
      origin: qr
    }, Symbol.toStringTag, {
      value: "Module"
    })),
    ...zr
  };
  function Gr(e, t) {
    return Ie(e, new z.classes.URLSearchParams(), {
      visitor: function (n, r, o, s) {
        if (z.isNode && u.isBuffer(n)) {
          this.append(r, n.toString("base64"));
          return false;
        } else {
          return s.defaultVisitor.apply(this, arguments);
        }
      },
      ...t
    });
  }
  function Kr(e) {
    return u.matchAll(/\w+|\[(\w*)]/g, e).map(t => t[0] === "[]" ? "" : t[1] || t[0]);
  }
  function Hr(e) {
    const t = {};
    const n = Object.keys(e);
    let r;
    const o = n.length;
    let s;
    for (r = 0; r < o; r++) {
      s = n[r];
      t[s] = e[s];
    }
    return t;
  }
  function Bt(e) {
    function t(n, r, o, s) {
      let i = n[s++];
      if (i === "__proto__") {
        return true;
      }
      const a = Number.isFinite(+i);
      const f = s >= n.length;
      i = !i && u.isArray(o) ? o.length : i;
      if (f) {
        if (u.hasOwnProp(o, i)) {
          o[i] = [o[i], r];
        } else {
          o[i] = r;
        }
        return !a;
      } else {
        if (!o[i] || !u.isObject(o[i])) {
          o[i] = [];
        }
        if (t(n, r, o[i], s) && u.isArray(o[i])) {
          o[i] = Hr(o[i]);
        }
        return !a;
      }
    }
    if (u.isFormData(e) && u.isFunction(e.entries)) {
      const n = {};
      u.forEachEntry(e, (r, o) => {
        t(Kr(r), o, n, 0);
      });
      return n;
    }
    return null;
  }
  function Wr(e, t, n) {
    if (u.isString(e)) {
      try {
        (t || JSON.parse)(e);
        return u.trim(e);
      } catch (r) {
        if (r.name !== "SyntaxError") {
          throw r;
        }
      }
    }
    return (n || JSON.stringify)(e);
  }
  const be = {
    transitional: nt,
    adapter: ["xhr", "http", "fetch"],
    transformRequest: [function (t, n) {
      const r = n.getContentType() || "";
      const o = r.indexOf("application/json") > -1;
      const s = u.isObject(t);
      if (s && u.isHTMLForm(t)) {
        t = new FormData(t);
      }
      if (u.isFormData(t)) {
        if (o) {
          return JSON.stringify(Bt(t));
        } else {
          return t;
        }
      }
      if (u.isArrayBuffer(t) || u.isBuffer(t) || u.isStream(t) || u.isFile(t) || u.isBlob(t) || u.isReadableStream(t)) {
        return t;
      }
      if (u.isArrayBufferView(t)) {
        return t.buffer;
      }
      if (u.isURLSearchParams(t)) {
        n.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
        return t.toString();
      }
      let a;
      if (s) {
        if (r.indexOf("application/x-www-form-urlencoded") > -1) {
          return Gr(t, this.formSerializer).toString();
        }
        if ((a = u.isFileList(t)) || r.indexOf("multipart/form-data") > -1) {
          const f = this.env && this.env.FormData;
          return Ie(a ? {
            "files[]": t
          } : t, f && new f(), this.formSerializer);
        }
      }
      if (s || o) {
        n.setContentType("application/json", false);
        return Wr(t);
      } else {
        return t;
      }
    }],
    transformResponse: [function (t) {
      const n = this.transitional || be.transitional;
      const r = n && n.forcedJSONParsing;
      const o = this.responseType === "json";
      if (u.isResponse(t) || u.isReadableStream(t)) {
        return t;
      }
      if (t && u.isString(t) && (r && !this.responseType || o)) {
        const i = (!n || !n.silentJSONParsing) && o;
        try {
          return JSON.parse(t, this.parseReviver);
        } catch (a) {
          if (i) {
            throw a.name === "SyntaxError" ? R.from(a, R.ERR_BAD_RESPONSE, this, null, this.response) : a;
          }
        }
      }
      return t;
    }],
    timeout: 0,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    maxContentLength: -1,
    maxBodyLength: -1,
    env: {
      FormData: z.classes.FormData,
      Blob: z.classes.Blob
    },
    validateStatus: function (t) {
      return t >= 200 && t < 300;
    },
    headers: {
      common: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": undefined
      }
    }
  };
  u.forEach(["delete", "get", "head", "post", "put", "patch"], e => {
    be.headers[e] = {};
  });
  const Jr = u.toObjectSet(["age", "authorization", "content-length", "content-type", "etag", "expires", "from", "host", "if-modified-since", "if-unmodified-since", "last-modified", "location", "max-forwards", "proxy-authorization", "referer", "retry-after", "user-agent"]);
  const Xr = e => {
    const t = {};
    let n;
    let r;
    let o;
    if (e) {
      e.split(`
`).forEach(function (i) {
        o = i.indexOf(":");
        n = i.substring(0, o).trim().toLowerCase();
        r = i.substring(o + 1).trim();
        if (!!n && (!t[n] || !Jr[n])) {
          if (n === "set-cookie") {
            if (t[n]) {
              t[n].push(r);
            } else {
              t[n] = [r];
            }
          } else {
            t[n] = t[n] ? t[n] + ", " + r : r;
          }
        }
      });
    }
    return t;
  };
  const Ft = Symbol("internals");
  function we(e) {
    return e && String(e).trim().toLowerCase();
  }
  function Pe(e) {
    if (e === false || e == null) {
      return e;
    } else if (u.isArray(e)) {
      return e.map(Pe);
    } else {
      return String(e);
    }
  }
  function Yr(e) {
    const t = Object.create(null);
    const n = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
    let r;
    while (r = n.exec(e)) {
      t[r[1]] = r[2];
    }
    return t;
  }
  const Qr = e => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(e.trim());
  function st(e, t, n, r, o) {
    if (u.isFunction(r)) {
      return r.call(this, t, n);
    }
    if (o) {
      t = n;
    }
    if (u.isString(t)) {
      if (u.isString(r)) {
        return t.indexOf(r) !== -1;
      }
      if (u.isRegExp(r)) {
        return r.test(t);
      }
    }
  }
  function Zr(e) {
    return e.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (t, n, r) => n.toUpperCase() + r);
  }
  function eo(e, t) {
    const n = u.toCamelCase(" " + t);
    ["get", "set", "has"].forEach(r => {
      Object.defineProperty(e, r + n, {
        value: function (o, s, i) {
          return this[r].call(this, t, o, s, i);
        },
        configurable: true
      });
    });
  }
  let G = class {
    constructor(t) {
      if (t) {
        this.set(t);
      }
    }
    set(t, n, r) {
      const o = this;
      function s(a, f, p) {
        const c = we(f);
        if (!c) {
          throw new Error("header name must be a non-empty string");
        }
        const g = u.findKey(o, c);
        if (!g || o[g] === undefined || p === true || p === undefined && o[g] !== false) {
          o[g || f] = Pe(a);
        }
      }
      const i = (a, f) => u.forEach(a, (p, c) => s(p, c, f));
      if (u.isPlainObject(t) || t instanceof this.constructor) {
        i(t, n);
      } else if (u.isString(t) && (t = t.trim()) && !Qr(t)) {
        i(Xr(t), n);
      } else if (u.isObject(t) && u.isIterable(t)) {
        let a = {};
        let f;
        let p;
        for (const c of t) {
          if (!u.isArray(c)) {
            throw TypeError("Object iterator must return a key-value pair");
          }
          a[p = c[0]] = (f = a[p]) ? u.isArray(f) ? [...f, c[1]] : [f, c[1]] : c[1];
        }
        i(a, n);
      } else if (t != null) {
        s(n, t, r);
      }
      return this;
    }
    get(t, n) {
      t = we(t);
      if (t) {
        const r = u.findKey(this, t);
        if (r) {
          const o = this[r];
          if (!n) {
            return o;
          }
          if (n === true) {
            return Yr(o);
          }
          if (u.isFunction(n)) {
            return n.call(this, o, r);
          }
          if (u.isRegExp(n)) {
            return n.exec(o);
          }
          throw new TypeError("parser must be boolean|regexp|function");
        }
      }
    }
    has(t, n) {
      t = we(t);
      if (t) {
        const r = u.findKey(this, t);
        return !!r && this[r] !== undefined && (!n || !!st(this, this[r], r, n));
      }
      return false;
    }
    delete(t, n) {
      const r = this;
      let o = false;
      function s(i) {
        i = we(i);
        if (i) {
          const a = u.findKey(r, i);
          if (a && (!n || st(r, r[a], a, n))) {
            delete r[a];
            o = true;
          }
        }
      }
      if (u.isArray(t)) {
        t.forEach(s);
      } else {
        s(t);
      }
      return o;
    }
    clear(t) {
      const n = Object.keys(this);
      let r = n.length;
      let o = false;
      while (r--) {
        const s = n[r];
        if (!t || st(this, this[s], s, t, true)) {
          delete this[s];
          o = true;
        }
      }
      return o;
    }
    normalize(t) {
      const n = this;
      const r = {};
      u.forEach(this, (o, s) => {
        const i = u.findKey(r, s);
        if (i) {
          n[i] = Pe(o);
          delete n[s];
          return;
        }
        const a = t ? Zr(s) : String(s).trim();
        if (a !== s) {
          delete n[s];
        }
        n[a] = Pe(o);
        r[a] = true;
      });
      return this;
    }
    concat(...t) {
      return this.constructor.concat(this, ...t);
    }
    toJSON(t) {
      const n = Object.create(null);
      u.forEach(this, (r, o) => {
        if (r != null && r !== false) {
          n[o] = t && u.isArray(r) ? r.join(", ") : r;
        }
      });
      return n;
    }
    [Symbol.iterator]() {
      return Object.entries(this.toJSON())[Symbol.iterator]();
    }
    toString() {
      return Object.entries(this.toJSON()).map(([t, n]) => t + ": " + n).join(`
`);
    }
    getSetCookie() {
      return this.get("set-cookie") || [];
    }
    get [Symbol.toStringTag]() {
      return "AxiosHeaders";
    }
    static from(t) {
      if (t instanceof this) {
        return t;
      } else {
        return new this(t);
      }
    }
    static concat(t, ...n) {
      const r = new this(t);
      n.forEach(o => r.set(o));
      return r;
    }
    static accessor(t) {
      const r = (this[Ft] = this[Ft] = {
        accessors: {}
      }).accessors;
      const o = this.prototype;
      function s(i) {
        const a = we(i);
        if (!r[a]) {
          eo(o, i);
          r[a] = true;
        }
      }
      if (u.isArray(t)) {
        t.forEach(s);
      } else {
        s(t);
      }
      return this;
    }
  };
  G.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
  u.reduceDescriptors(G.prototype, ({
    value: e
  }, t) => {
    let n = t[0].toUpperCase() + t.slice(1);
    return {
      get: () => e,
      set(r) {
        this[n] = r;
      }
    };
  });
  u.freezeMethods(G);
  function it(e, t) {
    const n = this || be;
    const r = t || n;
    const o = G.from(r.headers);
    let s = r.data;
    u.forEach(e, function (a) {
      s = a.call(n, s, o.normalize(), t ? t.status : undefined);
    });
    o.normalize();
    return s;
  }
  function Dt(e) {
    return !!e && !!e.__CANCEL__;
  }
  let ye = class extends R {
    constructor(t, n, r) {
      super(t ?? "canceled", R.ERR_CANCELED, n, r);
      this.name = "CanceledError";
      this.__CANCEL__ = true;
    }
  };
  function $t(e, t, n) {
    const r = n.config.validateStatus;
    if (!n.status || !r || r(n.status)) {
      e(n);
    } else {
      t(new R("Request failed with status code " + n.status, [R.ERR_BAD_REQUEST, R.ERR_BAD_RESPONSE][Math.floor(n.status / 100) - 4], n.config, n.request, n));
    }
  }
  function to(e) {
    const t = /^([-+\w]{1,25})(:?\/\/|:)/.exec(e);
    return t && t[1] || "";
  }
  function no(e, t) {
    e = e || 10;
    const n = new Array(e);
    const r = new Array(e);
    let o = 0;
    let s = 0;
    let i;
    t = t !== undefined ? t : 1000;
    return function (f) {
      const p = Date.now();
      const c = r[s];
      i ||= p;
      n[o] = f;
      r[o] = p;
      let g = s;
      let S = 0;
      while (g !== o) {
        S += n[g++];
        g = g % e;
      }
      o = (o + 1) % e;
      if (o === s) {
        s = (s + 1) % e;
      }
      if (p - i < t) {
        return;
      }
      const P = c && p - c;
      if (P) {
        return Math.round(S * 1000 / P);
      } else {
        return undefined;
      }
    };
  }
  function ro(e, t) {
    let n = 0;
    let r = 1000 / t;
    let o;
    let s;
    const i = (p, c = Date.now()) => {
      n = c;
      o = null;
      if (s) {
        clearTimeout(s);
        s = null;
      }
      e(...p);
    };
    return [(...p) => {
      const c = Date.now();
      const g = c - n;
      if (g >= r) {
        i(p, c);
      } else {
        o = p;
        s ||= setTimeout(() => {
          s = null;
          i(o);
        }, r - g);
      }
    }, () => o && i(o)];
  }
  const Le = (e, t, n = 3) => {
    let r = 0;
    const o = no(50, 250);
    return ro(s => {
      const i = s.loaded;
      const a = s.lengthComputable ? s.total : undefined;
      const f = i - r;
      const p = o(f);
      const c = i <= a;
      r = i;
      const g = {
        loaded: i,
        total: a,
        progress: a ? i / a : undefined,
        bytes: f,
        rate: p || undefined,
        estimated: p && a && c ? (a - i) / p : undefined,
        event: s,
        lengthComputable: a != null,
        [t ? "download" : "upload"]: true
      };
      e(g);
    }, n);
  };
  const zt = (e, t) => {
    const n = e != null;
    return [r => t[0]({
      lengthComputable: n,
      total: e,
      loaded: r
    }), t[1]];
  };
  const Vt = e => (...t) => u.asap(() => e(...t));
  const oo = z.hasStandardBrowserEnv ? ((e, t) => n => {
    n = new URL(n, z.origin);
    return e.protocol === n.protocol && e.host === n.host && (t || e.port === n.port);
  })(new URL(z.origin), z.navigator && /(msie|trident)/i.test(z.navigator.userAgent)) : () => true;
  const so = z.hasStandardBrowserEnv ? {
    write(e, t, n, r, o, s, i) {
      if (typeof document === "undefined") {
        return;
      }
      const a = [`${e}=${encodeURIComponent(t)}`];
      if (u.isNumber(n)) {
        a.push(`expires=${new Date(n).toUTCString()}`);
      }
      if (u.isString(r)) {
        a.push(`path=${r}`);
      }
      if (u.isString(o)) {
        a.push(`domain=${o}`);
      }
      if (s === true) {
        a.push("secure");
      }
      if (u.isString(i)) {
        a.push(`SameSite=${i}`);
      }
      document.cookie = a.join("; ");
    },
    read(e) {
      if (typeof document === "undefined") {
        return null;
      }
      const t = document.cookie.match(new RegExp("(?:^|; )" + e + "=([^;]*)"));
      if (t) {
        return decodeURIComponent(t[1]);
      } else {
        return null;
      }
    },
    remove(e) {
      this.write(e, "", Date.now() - 86400000, "/");
    }
  } : {
    write() {},
    read() {
      return null;
    },
    remove() {}
  };
  function io(e) {
    if (typeof e != "string") {
      return false;
    } else {
      return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(e);
    }
  }
  function ao(e, t) {
    if (t) {
      return e.replace(/\/?\/$/, "") + "/" + t.replace(/^\/+/, "");
    } else {
      return e;
    }
  }
  function jt(e, t, n) {
    let r = !io(t);
    if (e && (r || n == false)) {
      return ao(e, t);
    } else {
      return t;
    }
  }
  const qt = e => e instanceof G ? {
    ...e
  } : e;
  function se(e, t) {
    t = t || {};
    const n = {};
    function r(p, c, g, S) {
      if (u.isPlainObject(p) && u.isPlainObject(c)) {
        return u.merge.call({
          caseless: S
        }, p, c);
      } else if (u.isPlainObject(c)) {
        return u.merge({}, c);
      } else if (u.isArray(c)) {
        return c.slice();
      } else {
        return c;
      }
    }
    function o(p, c, g, S) {
      if (u.isUndefined(c)) {
        if (!u.isUndefined(p)) {
          return r(undefined, p, g, S);
        }
      } else {
        return r(p, c, g, S);
      }
    }
    function s(p, c) {
      if (!u.isUndefined(c)) {
        return r(undefined, c);
      }
    }
    function i(p, c) {
      if (u.isUndefined(c)) {
        if (!u.isUndefined(p)) {
          return r(undefined, p);
        }
      } else {
        return r(undefined, c);
      }
    }
    function a(p, c, g) {
      if (g in t) {
        return r(p, c);
      }
      if (g in e) {
        return r(undefined, p);
      }
    }
    const f = {
      url: s,
      method: s,
      data: s,
      baseURL: i,
      transformRequest: i,
      transformResponse: i,
      paramsSerializer: i,
      timeout: i,
      timeoutMessage: i,
      withCredentials: i,
      withXSRFToken: i,
      adapter: i,
      responseType: i,
      xsrfCookieName: i,
      xsrfHeaderName: i,
      onUploadProgress: i,
      onDownloadProgress: i,
      decompress: i,
      maxContentLength: i,
      maxBodyLength: i,
      beforeRedirect: i,
      transport: i,
      httpAgent: i,
      httpsAgent: i,
      cancelToken: i,
      socketPath: i,
      responseEncoding: i,
      validateStatus: a,
      headers: (p, c, g) => o(qt(p), qt(c), g, true)
    };
    u.forEach(Object.keys({
      ...e,
      ...t
    }), function (c) {
      if (c === "__proto__" || c === "constructor" || c === "prototype") {
        return;
      }
      const g = u.hasOwnProp(f, c) ? f[c] : o;
      const S = g(e[c], t[c], c);
      if (!u.isUndefined(S) || g === a) {
        n[c] = S;
      }
    });
    return n;
  }
  const Gt = e => {
    const t = se({}, e);
    let {
      data: n,
      withXSRFToken: r,
      xsrfHeaderName: o,
      xsrfCookieName: s,
      headers: i,
      auth: a
    } = t;
    t.headers = i = G.from(i);
    t.url = Mt(jt(t.baseURL, t.url, t.allowAbsoluteUrls), e.params, e.paramsSerializer);
    if (a) {
      i.set("Authorization", "Basic " + btoa((a.username || "") + ":" + (a.password ? unescape(encodeURIComponent(a.password)) : "")));
    }
    if (u.isFormData(n)) {
      if (z.hasStandardBrowserEnv || z.hasStandardBrowserWebWorkerEnv) {
        i.setContentType(undefined);
      } else if (u.isFunction(n.getHeaders)) {
        const f = n.getHeaders();
        const p = ["content-type", "content-length"];
        Object.entries(f).forEach(([c, g]) => {
          if (p.includes(c.toLowerCase())) {
            i.set(c, g);
          }
        });
      }
    }
    if (z.hasStandardBrowserEnv && (r && u.isFunction(r) && (r = r(t)), r || r !== false && oo(t.url))) {
      const f = o && s && so.read(s);
      if (f) {
        i.set(o, f);
      }
    }
    return t;
  };
  const co = typeof XMLHttpRequest !== "undefined" && function (e) {
    return new Promise(function (n, r) {
      const o = Gt(e);
      let s = o.data;
      const i = G.from(o.headers).normalize();
      let {
        responseType: a,
        onUploadProgress: f,
        onDownloadProgress: p
      } = o;
      let c;
      let g;
      let S;
      let P;
      let h;
      function d() {
        if (P) {
          P();
        }
        if (h) {
          h();
        }
        if (o.cancelToken) {
          o.cancelToken.unsubscribe(c);
        }
        if (o.signal) {
          o.signal.removeEventListener("abort", c);
        }
      }
      let l = new XMLHttpRequest();
      l.open(o.method.toUpperCase(), o.url, true);
      l.timeout = o.timeout;
      function m() {
        if (!l) {
          return;
        }
        const w = G.from("getAllResponseHeaders" in l && l.getAllResponseHeaders());
        const A = {
          data: !a || a === "text" || a === "json" ? l.responseText : l.response,
          status: l.status,
          statusText: l.statusText,
          headers: w,
          config: e,
          request: l
        };
        $t(function (O) {
          n(O);
          d();
        }, function (O) {
          r(O);
          d();
        }, A);
        l = null;
      }
      if ("onloadend" in l) {
        l.onloadend = m;
      } else {
        l.onreadystatechange = function () {
          if (!!l && l.readyState === 4 && (l.status !== 0 || !!l.responseURL && l.responseURL.indexOf("file:") === 0)) {
            setTimeout(m);
          }
        };
      }
      l.onabort = function () {
        if (l) {
          r(new R("Request aborted", R.ECONNABORTED, e, l));
          l = null;
        }
      };
      l.onerror = function (v) {
        const A = v && v.message ? v.message : "Network Error";
        const _ = new R(A, R.ERR_NETWORK, e, l);
        _.event = v || null;
        r(_);
        l = null;
      };
      l.ontimeout = function () {
        let v = o.timeout ? "timeout of " + o.timeout + "ms exceeded" : "timeout exceeded";
        const A = o.transitional || nt;
        if (o.timeoutErrorMessage) {
          v = o.timeoutErrorMessage;
        }
        r(new R(v, A.clarifyTimeoutError ? R.ETIMEDOUT : R.ECONNABORTED, e, l));
        l = null;
      };
      if (s === undefined) {
        i.setContentType(null);
      }
      if ("setRequestHeader" in l) {
        u.forEach(i.toJSON(), function (v, A) {
          l.setRequestHeader(A, v);
        });
      }
      if (!u.isUndefined(o.withCredentials)) {
        l.withCredentials = !!o.withCredentials;
      }
      if (a && a !== "json") {
        l.responseType = o.responseType;
      }
      if (p) {
        [S, h] = Le(p, true);
        l.addEventListener("progress", S);
      }
      if (f && l.upload) {
        [g, P] = Le(f);
        l.upload.addEventListener("progress", g);
        l.upload.addEventListener("loadend", P);
      }
      if (o.cancelToken || o.signal) {
        c = w => {
          if (l) {
            r(!w || w.type ? new ye(null, e, l) : w);
            l.abort();
            l = null;
          }
        };
        if (o.cancelToken) {
          o.cancelToken.subscribe(c);
        }
        if (o.signal) {
          if (o.signal.aborted) {
            c();
          } else {
            o.signal.addEventListener("abort", c);
          }
        }
      }
      const b = to(o.url);
      if (b && z.protocols.indexOf(b) === -1) {
        r(new R("Unsupported protocol " + b + ":", R.ERR_BAD_REQUEST, e));
        return;
      }
      l.send(s || null);
    });
  };
  const lo = (e, t) => {
    const {
      length: n
    } = e = e ? e.filter(Boolean) : [];
    if (t || n) {
      let r = new AbortController();
      let o;
      const s = function (p) {
        if (!o) {
          o = true;
          a();
          const c = p instanceof Error ? p : this.reason;
          r.abort(c instanceof R ? c : new ye(c instanceof Error ? c.message : c));
        }
      };
      let i = t && setTimeout(() => {
        i = null;
        s(new R(`timeout of ${t}ms exceeded`, R.ETIMEDOUT));
      }, t);
      const a = () => {
        if (e) {
          if (i) {
            clearTimeout(i);
          }
          i = null;
          e.forEach(p => {
            if (p.unsubscribe) {
              p.unsubscribe(s);
            } else {
              p.removeEventListener("abort", s);
            }
          });
          e = null;
        }
      };
      e.forEach(p => p.addEventListener("abort", s));
      const {
        signal: f
      } = r;
      f.unsubscribe = () => u.asap(a);
      return f;
    }
  };
  const uo = function* (e, t) {
    let n = e.byteLength;
    if (n < t) {
      yield e;
      return;
    }
    let r = 0;
    let o;
    while (r < n) {
      o = r + t;
      yield e.slice(r, o);
      r = o;
    }
  };
  const fo = async function* (e, t) {
    for await (const n of po(e)) {
      yield* uo(n, t);
    }
  };
  const po = async function* (e) {
    if (e[Symbol.asyncIterator]) {
      yield* e;
      return;
    }
    const t = e.getReader();
    try {
      while (true) {
        const {
          done: n,
          value: r
        } = await t.read();
        if (n) {
          break;
        }
        yield r;
      }
    } finally {
      await t.cancel();
    }
  };
  const Kt = (e, t, n, r) => {
    const o = fo(e, t);
    let s = 0;
    let i;
    let a = f => {
      if (!i) {
        i = true;
        if (r) {
          r(f);
        }
      }
    };
    return new ReadableStream({
      async pull(f) {
        try {
          const {
            done: p,
            value: c
          } = await o.next();
          if (p) {
            a();
            f.close();
            return;
          }
          let g = c.byteLength;
          if (n) {
            let S = s += g;
            n(S);
          }
          f.enqueue(new Uint8Array(c));
        } catch (p) {
          a(p);
          throw p;
        }
      },
      cancel(f) {
        a(f);
        return o.return();
      }
    }, {
      highWaterMark: 2
    });
  };
  const Ht = 65536;
  const {
    isFunction: Ne
  } = u;
  const mo = (({
    Request: e,
    Response: t
  }) => ({
    Request: e,
    Response: t
  }))(u.global);
  const {
    ReadableStream: Wt,
    TextEncoder: Jt
  } = u.global;
  const Xt = (e, ...t) => {
    try {
      return !!e(...t);
    } catch {
      return false;
    }
  };
  const ho = e => {
    e = u.merge.call({
      skipUndefined: true
    }, mo, e);
    const {
      fetch: t,
      Request: n,
      Response: r
    } = e;
    const o = t ? Ne(t) : typeof fetch == "function";
    const s = Ne(n);
    const i = Ne(r);
    if (!o) {
      return false;
    }
    const a = o && Ne(Wt);
    const f = o && (typeof Jt == "function" ? (h => d => h.encode(d))(new Jt()) : async h => new Uint8Array(await new n(h).arrayBuffer()));
    const p = s && a && Xt(() => {
      let h = false;
      const d = new n(z.origin, {
        body: new Wt(),
        method: "POST",
        get duplex() {
          h = true;
          return "half";
        }
      }).headers.has("Content-Type");
      return h && !d;
    });
    const c = i && a && Xt(() => u.isReadableStream(new r("").body));
    const g = {
      stream: c && (h => h.body)
    };
    if (o) {
      ["text", "arrayBuffer", "blob", "formData", "stream"].forEach(h => {
        if (!g[h]) {
          g[h] = (d, l) => {
            let m = d && d[h];
            if (m) {
              return m.call(d);
            }
            throw new R(`Response type '${h}' is not supported`, R.ERR_NOT_SUPPORT, l);
          };
        }
      });
    }
    const S = async h => {
      if (h == null) {
        return 0;
      }
      if (u.isBlob(h)) {
        return h.size;
      }
      if (u.isSpecCompliantForm(h)) {
        return (await new n(z.origin, {
          method: "POST",
          body: h
        }).arrayBuffer()).byteLength;
      }
      if (u.isArrayBufferView(h) || u.isArrayBuffer(h)) {
        return h.byteLength;
      }
      if (u.isURLSearchParams(h)) {
        h = h + "";
      }
      if (u.isString(h)) {
        return (await f(h)).byteLength;
      }
    };
    const P = async (h, d) => {
      const l = u.toFiniteNumber(h.getContentLength());
      return l ?? S(d);
    };
    return async h => {
      let {
        url: d,
        method: l,
        data: m,
        signal: b,
        cancelToken: w,
        timeout: v,
        onDownloadProgress: A,
        onUploadProgress: _,
        responseType: O,
        headers: E,
        withCredentials: L = "same-origin",
        fetchOptions: C
      } = Gt(h);
      let W = t || fetch;
      O = O ? (O + "").toLowerCase() : "text";
      let K = lo([b, w && w.toAbortSignal()], v);
      let V = null;
      const J = K && K.unsubscribe && (() => {
        K.unsubscribe();
      });
      let j;
      try {
        if (_ && p && l !== "get" && l !== "head" && (j = await P(E, m)) !== 0) {
          let Q = new n(d, {
            method: "POST",
            body: m,
            duplex: "half"
          });
          let Z;
          if (u.isFormData(m) && (Z = Q.headers.get("content-type"))) {
            E.setContentType(Z);
          }
          if (Q.body) {
            const [B, D] = zt(j, Le(Vt(_)));
            m = Kt(Q.body, Ht, B, D);
          }
        }
        if (!u.isString(L)) {
          L = L ? "include" : "omit";
        }
        const I = s && "credentials" in n.prototype;
        const H = {
          ...C,
          signal: K,
          method: l.toUpperCase(),
          headers: E.normalize().toJSON(),
          body: m,
          duplex: "half",
          credentials: I ? L : undefined
        };
        V = s && new n(d, H);
        let k = await (s ? W(V, C) : W(d, H));
        const ke = c && (O === "stream" || O === "response");
        if (c && (A || ke && J)) {
          const Q = {};
          ["status", "statusText", "headers"].forEach(ce => {
            Q[ce] = k[ce];
          });
          const Z = u.toFiniteNumber(k.headers.get("content-length"));
          const [B, D] = A && zt(Z, Le(Vt(A), true)) || [];
          k = new r(Kt(k.body, Ht, B, () => {
            if (D) {
              D();
            }
            if (J) {
              J();
            }
          }), Q);
        }
        O = O || "text";
        let Ke = await g[u.findKey(g, O) || "text"](k, h);
        if (!ke && J) {
          J();
        }
        return await new Promise((Q, Z) => {
          $t(Q, Z, {
            data: Ke,
            headers: G.from(k.headers),
            status: k.status,
            statusText: k.statusText,
            config: h,
            request: V
          });
        });
      } catch (I) {
        if (J) {
          J();
        }
        throw I && I.name === "TypeError" && /Load failed|fetch/i.test(I.message) ? Object.assign(new R("Network Error", R.ERR_NETWORK, h, V, I && I.response), {
          cause: I.cause || I
        }) : R.from(I, I && I.code, h, V, I && I.response);
      }
    };
  };
  const go = new Map();
  const Yt = e => {
    let t = e && e.env || {};
    const {
      fetch: n,
      Request: r,
      Response: o
    } = t;
    const s = [r, o, n];
    let i = s.length;
    let a = i;
    let f;
    let p;
    let c = go;
    while (a--) {
      f = s[a];
      p = c.get(f);
      if (p === undefined) {
        c.set(f, p = a ? new Map() : ho(t));
      }
      c = p;
    }
    return p;
  };
  Yt();
  const at = {
    http: Br,
    xhr: co,
    fetch: {
      get: Yt
    }
  };
  u.forEach(at, (e, t) => {
    if (e) {
      try {
        Object.defineProperty(e, "name", {
          value: t
        });
      } catch {}
      Object.defineProperty(e, "adapterName", {
        value: t
      });
    }
  });
  const Qt = e => `- ${e}`;
  const bo = e => u.isFunction(e) || e === null || e === false;
  function wo(e, t) {
    e = u.isArray(e) ? e : [e];
    const {
      length: n
    } = e;
    let r;
    let o;
    const s = {};
    for (let i = 0; i < n; i++) {
      r = e[i];
      let a;
      o = r;
      if (!bo(r) && (o = at[(a = String(r)).toLowerCase()], o === undefined)) {
        throw new R(`Unknown adapter '${a}'`);
      }
      if (o && (u.isFunction(o) || (o = o.get(t)))) {
        break;
      }
      s[a || "#" + i] = o;
    }
    if (!o) {
      const i = Object.entries(s).map(([f, p]) => `adapter ${f} ${p === false ? "is not supported by the environment" : "is not available in the build"}`);
      let a = n ? i.length > 1 ? `since :
${i.map(Qt).join(`
`)}` : " " + Qt(i[0]) : "as no adapter specified";
      throw new R("There is no suitable adapter to dispatch the request " + a, "ERR_NOT_SUPPORT");
    }
    return o;
  }
  const Zt = {
    getAdapter: wo,
    adapters: at
  };
  function ct(e) {
    if (e.cancelToken) {
      e.cancelToken.throwIfRequested();
    }
    if (e.signal && e.signal.aborted) {
      throw new ye(null, e);
    }
  }
  function en(e) {
    ct(e);
    e.headers = G.from(e.headers);
    e.data = it.call(e, e.transformRequest);
    if (["post", "put", "patch"].indexOf(e.method) !== -1) {
      e.headers.setContentType("application/x-www-form-urlencoded", false);
    }
    return Zt.getAdapter(e.adapter || be.adapter, e)(e).then(function (r) {
      ct(e);
      r.data = it.call(e, e.transformResponse, r);
      r.headers = G.from(r.headers);
      return r;
    }, function (r) {
      if (!Dt(r)) {
        ct(e);
        if (r && r.response) {
          r.response.data = it.call(e, e.transformResponse, r.response);
          r.response.headers = G.from(r.response.headers);
        }
      }
      return Promise.reject(r);
    });
  }
  const tn = "1.13.5";
  const Me = {};
  ["object", "boolean", "number", "function", "string", "symbol"].forEach((e, t) => {
    Me[e] = function (r) {
      return typeof r === e || "a" + (t < 1 ? "n " : " ") + e;
    };
  });
  const nn = {};
  Me.transitional = function (t, n, r) {
    function o(s, i) {
      return "[Axios v" + tn + "] Transitional option '" + s + "'" + i + (r ? ". " + r : "");
    }
    return (s, i, a) => {
      if (t === false) {
        throw new R(o(i, " has been removed" + (n ? " in " + n : "")), R.ERR_DEPRECATED);
      }
      if (n && !nn[i]) {
        nn[i] = true;
        console.warn(o(i, " has been deprecated since v" + n + " and will be removed in the near future"));
      }
      if (t) {
        return t(s, i, a);
      } else {
        return true;
      }
    };
  };
  Me.spelling = function (t) {
    return (n, r) => {
      console.warn(`${r} is likely a misspelling of ${t}`);
      return true;
    };
  };
  function yo(e, t, n) {
    if (typeof e != "object") {
      throw new R("options must be an object", R.ERR_BAD_OPTION_VALUE);
    }
    const r = Object.keys(e);
    let o = r.length;
    while (o-- > 0) {
      const s = r[o];
      const i = t[s];
      if (i) {
        const a = e[s];
        const f = a === undefined || i(a, s, e);
        if (f !== true) {
          throw new R("option " + s + " must be " + f, R.ERR_BAD_OPTION_VALUE);
        }
        continue;
      }
      if (n !== true) {
        throw new R("Unknown option " + s, R.ERR_BAD_OPTION);
      }
    }
  }
  const Ue = {
    assertOptions: yo,
    validators: Me
  };
  const X = Ue.validators;
  let ie = class {
    constructor(t) {
      this.defaults = t || {};
      this.interceptors = {
        request: new Ut(),
        response: new Ut()
      };
    }
    async request(t, n) {
      try {
        return await this._request(t, n);
      } catch (r) {
        if (r instanceof Error) {
          let o = {};
          if (Error.captureStackTrace) {
            Error.captureStackTrace(o);
          } else {
            o = new Error();
          }
          const s = o.stack ? o.stack.replace(/^.+\n/, "") : "";
          try {
            if (r.stack) {
              if (s && !String(r.stack).endsWith(s.replace(/^.+\n.+\n/, ""))) {
                r.stack += `
${s}`;
              }
            } else {
              r.stack = s;
            }
          } catch {}
        }
        throw r;
      }
    }
    _request(t, n) {
      if (typeof t == "string") {
        n = n || {};
        n.url = t;
      } else {
        n = t || {};
      }
      n = se(this.defaults, n);
      const {
        transitional: r,
        paramsSerializer: o,
        headers: s
      } = n;
      if (r !== undefined) {
        Ue.assertOptions(r, {
          silentJSONParsing: X.transitional(X.boolean),
          forcedJSONParsing: X.transitional(X.boolean),
          clarifyTimeoutError: X.transitional(X.boolean),
          legacyInterceptorReqResOrdering: X.transitional(X.boolean)
        }, false);
      }
      if (o != null) {
        if (u.isFunction(o)) {
          n.paramsSerializer = {
            serialize: o
          };
        } else {
          Ue.assertOptions(o, {
            encode: X.function,
            serialize: X.function
          }, true);
        }
      }
      if (n.allowAbsoluteUrls === undefined) {
        if (this.defaults.allowAbsoluteUrls !== undefined) {
          n.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
        } else {
          n.allowAbsoluteUrls = true;
        }
      }
      Ue.assertOptions(n, {
        baseUrl: X.spelling("baseURL"),
        withXsrfToken: X.spelling("withXSRFToken")
      }, true);
      n.method = (n.method || this.defaults.method || "get").toLowerCase();
      let i = s && u.merge(s.common, s[n.method]);
      if (s) {
        u.forEach(["delete", "get", "head", "post", "put", "patch", "common"], h => {
          delete s[h];
        });
      }
      n.headers = G.concat(i, s);
      const a = [];
      let f = true;
      this.interceptors.request.forEach(function (d) {
        if (typeof d.runWhen == "function" && d.runWhen(n) === false) {
          return;
        }
        f = f && d.synchronous;
        const l = n.transitional || nt;
        if (l && l.legacyInterceptorReqResOrdering) {
          a.unshift(d.fulfilled, d.rejected);
        } else {
          a.push(d.fulfilled, d.rejected);
        }
      });
      const p = [];
      this.interceptors.response.forEach(function (d) {
        p.push(d.fulfilled, d.rejected);
      });
      let c;
      let g = 0;
      let S;
      if (!f) {
        const h = [en.bind(this), undefined];
        h.unshift(...a);
        h.push(...p);
        S = h.length;
        c = Promise.resolve(n);
        while (g < S) {
          c = c.then(h[g++], h[g++]);
        }
        return c;
      }
      S = a.length;
      let P = n;
      while (g < S) {
        const h = a[g++];
        const d = a[g++];
        try {
          P = h(P);
        } catch (l) {
          d.call(this, l);
          break;
        }
      }
      try {
        c = en.call(this, P);
      } catch (h) {
        return Promise.reject(h);
      }
      g = 0;
      S = p.length;
      while (g < S) {
        c = c.then(p[g++], p[g++]);
      }
      return c;
    }
    getUri(t) {
      t = se(this.defaults, t);
      const n = jt(t.baseURL, t.url, t.allowAbsoluteUrls);
      return Mt(n, t.params, t.paramsSerializer);
    }
  };
  u.forEach(["delete", "get", "head", "options"], function (t) {
    ie.prototype[t] = function (n, r) {
      return this.request(se(r || {}, {
        method: t,
        url: n,
        data: (r || {}).data
      }));
    };
  });
  u.forEach(["post", "put", "patch"], function (t) {
    function n(r) {
      return function (s, i, a) {
        return this.request(se(a || {}, {
          method: t,
          headers: r ? {
            "Content-Type": "multipart/form-data"
          } : {},
          url: s,
          data: i
        }));
      };
    }
    ie.prototype[t] = n();
    ie.prototype[t + "Form"] = n(true);
  });
  let xo = class Ln {
    constructor(t) {
      if (typeof t != "function") {
        throw new TypeError("executor must be a function.");
      }
      let n;
      this.promise = new Promise(function (s) {
        n = s;
      });
      const r = this;
      this.promise.then(o => {
        if (!r._listeners) {
          return;
        }
        let s = r._listeners.length;
        while (s-- > 0) {
          r._listeners[s](o);
        }
        r._listeners = null;
      });
      this.promise.then = o => {
        let s;
        const i = new Promise(a => {
          r.subscribe(a);
          s = a;
        }).then(o);
        i.cancel = function () {
          r.unsubscribe(s);
        };
        return i;
      };
      t(function (s, i, a) {
        if (!r.reason) {
          r.reason = new ye(s, i, a);
          n(r.reason);
        }
      });
    }
    throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    }
    subscribe(t) {
      if (this.reason) {
        t(this.reason);
        return;
      }
      if (this._listeners) {
        this._listeners.push(t);
      } else {
        this._listeners = [t];
      }
    }
    unsubscribe(t) {
      if (!this._listeners) {
        return;
      }
      const n = this._listeners.indexOf(t);
      if (n !== -1) {
        this._listeners.splice(n, 1);
      }
    }
    toAbortSignal() {
      const t = new AbortController();
      const n = r => {
        t.abort(r);
      };
      this.subscribe(n);
      t.signal.unsubscribe = () => this.unsubscribe(n);
      return t.signal;
    }
    static source() {
      let t;
      return {
        token: new Ln(function (o) {
          t = o;
        }),
        cancel: t
      };
    }
  };
  function Eo(e) {
    return function (n) {
      return e.apply(null, n);
    };
  }
  function vo(e) {
    return u.isObject(e) && e.isAxiosError === true;
  }
  const lt = {
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
  Object.entries(lt).forEach(([e, t]) => {
    lt[t] = e;
  });
  function rn(e) {
    const t = new ie(e);
    const n = vt(ie.prototype.request, t);
    u.extend(n, ie.prototype, t, {
      allOwnKeys: true
    });
    u.extend(n, t, null, {
      allOwnKeys: true
    });
    n.create = function (o) {
      return rn(se(e, o));
    };
    return n;
  }
  const N = rn(be);
  N.Axios = ie;
  N.CanceledError = ye;
  N.CancelToken = xo;
  N.isCancel = Dt;
  N.VERSION = tn;
  N.toFormData = Ie;
  N.AxiosError = R;
  N.Cancel = N.CanceledError;
  N.all = function (t) {
    return Promise.all(t);
  };
  N.spread = Eo;
  N.isAxiosError = vo;
  N.mergeConfig = se;
  N.AxiosHeaders = G;
  N.formToJSON = e => Bt(u.isHTMLForm(e) ? new FormData(e) : e);
  N.getAdapter = Zt.getAdapter;
  N.HttpStatusCode = lt;
  N.default = N;
  const {
    Axios: Fs,
    AxiosError: Ds,
    CanceledError: $s,
    isCancel: zs,
    CancelToken: Vs,
    VERSION: js,
    all: qs,
    Cancel: Gs,
    isAxiosError: Ks,
    spread: Hs,
    toFormData: Ws,
    AxiosHeaders: Js,
    HttpStatusCode: Xs,
    formToJSON: Ys,
    getAdapter: Qs,
    mergeConfig: Zs
  } = N;
  const Be = N.create({
    baseURL: yt
  });
  N.create({
    baseURL: yt
  });
  N.create();
  (e => e.interceptors.request.use(async t => {
    const n = await re.getItem("local:token");
    if (n) {
      t.headers.set("authorization", `Bearer ${n}`);
    }
    return t;
  }))(Be);
  function ko() {
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
  function on(e) {
    return e && typeof e == "object" && "config" in e;
  }
  function Ro(e, t, n = {}, r = "error") {
    const o = an();
    const s = ko();
    const i = Po();
    const f = {
      ddsource: "chrome-extension",
      ddtags: ["env:production", `version:${wt}`, "browser:chrome", `context:${o}`].join(","),
      hostname: "ext-dotb",
      message: e,
      service: "ext-dotb",
      status: r,
      timestamp: Date.now(),
      context: {
        extensionVersion: wt,
        browser: "chrome",
        environment: "production",
        executionContext: o,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        ...s,
        ...(i.os && {
          platformOS: i.os,
          platformArch: i.arch
        }),
        ...n
      }
    };
    const p = c => {
      const g = {};
      if (!!on(c) && !!c.config) {
        if (c.config.method) {
          g.httpMethod = c.config.method.toUpperCase();
        }
        if (c.config.url) {
          g.httpUrl = c.config.url;
        }
        if (c.config.baseURL) {
          g.httpBaseUrl = c.config.baseURL;
        }
        if (c.config.data) {
          g.httpRequestBody = c.config.data;
        }
        if (c.response) {
          if (c.response.status) {
            g.httpStatus = c.response.status;
          }
          if (c.response.statusText) {
            g.httpStatusText = c.response.statusText;
          }
          if (c.response.data) {
            g.httpResponseBody = c.response.data;
          }
        } else {
          if (c._responseStatus) {
            g.httpStatus = c._responseStatus;
          }
          if (c._responseStatusText) {
            g.httpStatusText = c._responseStatusText;
          }
          if (c._responseData) {
            g.httpResponseBody = c._responseData;
          }
        }
        if (c.code) {
          g.httpErrorCode = c.code;
        }
        if (c.status) {
          g.httpStatusCode = c.status;
        }
      }
      return g;
    };
    if (t) {
      f.error = {
        kind: t.name || "Error",
        message: t.message,
        stack: t.stack
      };
      const c = p(t);
      if (Object.keys(c).length > 0) {
        f.context = {
          ...f.context,
          ...c
        };
      }
    }
    if (n.error && on(n.error)) {
      const c = p(n.error);
      if (Object.keys(c).length > 0) {
        f.context = {
          ...f.context,
          ...c
        };
      }
    }
    return f;
  }
  async function sn(e, t = null, n = {}, r = "error") {
    try {
      const o = Ro(e, t, n, r);
      await Be.post("/logs/datadog", o, {
        timeout: 2000
      });
    } catch {}
  }
  async function So(e, t = null, n = {}) {
    return sn(e, t, n, "error");
  }
  let ut = false;
  re.getItem("local:debugMode").then(e => {
    ut = e ?? false;
  });
  re.watch("local:debugMode", e => {
    ut = e ?? false;
  });
  function Fe() {
    return ut;
  }
  function xe() {
    return new Date().toLocaleString();
  }
  function To(...e) {
    if (Fe()) {
      console.log("[36m%s[0m", `[${xe()}] dotB LEVEL:DEBUG`, ...e);
    }
  }
  function Ao(...e) {
    if (Fe()) {
      console.log("[36m%s[0m", `[${xe()}] dotB LEVEL:LOG`, ...e);
    }
  }
  function _o(...e) {
    if (Fe()) {
      console.log("[33m%s[0m", `[${xe()}] dotB LEVEL:INFO`, ...e);
    }
  }
  function Oo(e, t) {
    const n = typeof e == "string" ? e : JSON.stringify(e);
    if (Fe()) {
      console.log("[35m%s[0m", `[${xe()}] dotB LEVEL:TRACE`, n, t);
    }
    try {
      sn(n, null, t || {}, "debug").catch(() => {});
    } catch {}
  }
  function Co(e, t, n) {
    const r = typeof e == "string" ? e : JSON.stringify(e);
    console.log("[31m%s[0m", `[${xe()}] dotB LEVEL:ERROR`, r, t, n);
    try {
      const o = t instanceof Error ? t : null;
      const s = {
        ...n
      };
      if (t && !(t instanceof Error)) {
        s.error = t;
      }
      So(r, o, s).catch(() => {});
    } catch {}
  }
  const M = {
    debug: To,
    log: Ao,
    info: _o,
    trace: Oo,
    error: Co
  };
  let De = {};
  function an() {
    if (typeof window === "undefined" || typeof document === "undefined" || typeof self !== "undefined" && typeof importScripts == "function") {
      return "background";
    }
    if (window.location.protocol.startsWith("http")) {
      return "content";
    }
    if (window.location.protocol === "chrome-extension:") {
      const e = window.location.pathname;
      if (e.includes("popup")) {
        return "popup";
      }
      if (e.includes("options")) {
        return "options";
      }
    }
    return "unknown";
  }
  async function Io() {
    const e = an();
    try {
      if (e === "background") {
        if (F.runtime.getPlatformInfo) {
          const t = await F.runtime.getPlatformInfo();
          De = {
            os: t.os,
            arch: t.arch
          };
        }
      } else {
        const t = await qn();
        if (t) {
          De = t;
        }
      }
      M.info("Platform detection initialized", De);
    } catch (t) {
      M.error("Failed to initialize platform detection", t);
    }
  }
  Io();
  function Po() {
    return De;
  }
  function Lo() {
    return Be.delete("/users/log_out");
  }
  function cn() {
    return Be.get("/up");
  }
  Mn.map(e => new URL(e).host);
  const {
    host: ti
  } = new URL(Un);
  const {
    host: ni
  } = new URL(Bn);
  async function ln() {
    try {
      await Lo();
    } catch (e) {
      M.error("Failed to revoke Dotb token:", e);
    }
    await re.removeItem("local:token");
    await re.removeItem("local:isDuplicate");
    Re();
  }
  async function No(e) {
    await re.setItem("local:token", e);
    Re();
  }
  async function Mo() {
    return {
      token: (await re.getItem("local:token")) || null
    };
  }
  const Uo = (e, t) => {
    const n = new Array(e.length + t.length);
    for (let r = 0; r < e.length; r++) {
      n[r] = e[r];
    }
    for (let r = 0; r < t.length; r++) {
      n[e.length + r] = t[r];
    }
    return n;
  };
  const Bo = (e, t) => ({
    classGroupId: e,
    validator: t
  });
  const un = (e = new Map(), t = null, n) => ({
    nextPart: e,
    validators: t,
    classGroupId: n
  });
  const $e = "-";
  const dn = [];
  const Fo = "arbitrary..";
  const Do = e => {
    const t = zo(e);
    const {
      conflictingClassGroups: n,
      conflictingClassGroupModifiers: r
    } = e;
    return {
      getClassGroupId: i => {
        if (i.startsWith("[") && i.endsWith("]")) {
          return $o(i);
        }
        const a = i.split($e);
        const f = a[0] === "" && a.length > 1 ? 1 : 0;
        return fn(a, f, t);
      },
      getConflictingClassGroupIds: (i, a) => {
        if (a) {
          const f = r[i];
          const p = n[i];
          if (f) {
            if (p) {
              return Uo(p, f);
            } else {
              return f;
            }
          } else {
            return p || dn;
          }
        }
        return n[i] || dn;
      }
    };
  };
  const fn = (e, t, n) => {
    if (e.length - t === 0) {
      return n.classGroupId;
    }
    const o = e[t];
    const s = n.nextPart.get(o);
    if (s) {
      const p = fn(e, t + 1, s);
      if (p) {
        return p;
      }
    }
    const i = n.validators;
    if (i === null) {
      return;
    }
    const a = t === 0 ? e.join($e) : e.slice(t).join($e);
    const f = i.length;
    for (let p = 0; p < f; p++) {
      const c = i[p];
      if (c.validator(a)) {
        return c.classGroupId;
      }
    }
  };
  const $o = e => e.slice(1, -1).indexOf(":") === -1 ? undefined : (() => {
    const t = e.slice(1, -1);
    const n = t.indexOf(":");
    const r = t.slice(0, n);
    if (r) {
      return Fo + r;
    } else {
      return undefined;
    }
  })();
  const zo = e => {
    const {
      theme: t,
      classGroups: n
    } = e;
    return Vo(n, t);
  };
  const Vo = (e, t) => {
    const n = un();
    for (const r in e) {
      const o = e[r];
      dt(o, n, r, t);
    }
    return n;
  };
  const dt = (e, t, n, r) => {
    const o = e.length;
    for (let s = 0; s < o; s++) {
      const i = e[s];
      jo(i, t, n, r);
    }
  };
  const jo = (e, t, n, r) => {
    if (typeof e == "string") {
      qo(e, t, n);
      return;
    }
    if (typeof e == "function") {
      Go(e, t, n, r);
      return;
    }
    Ko(e, t, n, r);
  };
  const qo = (e, t, n) => {
    const r = e === "" ? t : pn(t, e);
    r.classGroupId = n;
  };
  const Go = (e, t, n, r) => {
    if (Ho(e)) {
      dt(e(r), t, n, r);
      return;
    }
    if (t.validators === null) {
      t.validators = [];
    }
    t.validators.push(Bo(n, e));
  };
  const Ko = (e, t, n, r) => {
    const o = Object.entries(e);
    const s = o.length;
    for (let i = 0; i < s; i++) {
      const [a, f] = o[i];
      dt(f, pn(t, a), n, r);
    }
  };
  const pn = (e, t) => {
    let n = e;
    const r = t.split($e);
    const o = r.length;
    for (let s = 0; s < o; s++) {
      const i = r[s];
      let a = n.nextPart.get(i);
      if (!a) {
        a = un();
        n.nextPart.set(i, a);
      }
      n = a;
    }
    return n;
  };
  const Ho = e => "isThemeGetter" in e && e.isThemeGetter === true;
  const Wo = e => {
    if (e < 1) {
      return {
        get: () => {},
        set: () => {}
      };
    }
    let t = 0;
    let n = Object.create(null);
    let r = Object.create(null);
    const o = (s, i) => {
      n[s] = i;
      t++;
      if (t > e) {
        t = 0;
        r = n;
        n = Object.create(null);
      }
    };
    return {
      get(s) {
        let i = n[s];
        if (i !== undefined) {
          return i;
        }
        if ((i = r[s]) !== undefined) {
          o(s, i);
          return i;
        }
      },
      set(s, i) {
        if (s in n) {
          n[s] = i;
        } else {
          o(s, i);
        }
      }
    };
  };
  const ft = "!";
  const mn = ":";
  const Jo = [];
  const hn = (e, t, n, r, o) => ({
    modifiers: e,
    hasImportantModifier: t,
    baseClassName: n,
    maybePostfixModifierPosition: r,
    isExternal: o
  });
  const Xo = e => {
    const {
      prefix: t,
      experimentalParseClassName: n
    } = e;
    let r = o => {
      const s = [];
      let i = 0;
      let a = 0;
      let f = 0;
      let p;
      const c = o.length;
      for (let d = 0; d < c; d++) {
        const l = o[d];
        if (i === 0 && a === 0) {
          if (l === mn) {
            s.push(o.slice(f, d));
            f = d + 1;
            continue;
          }
          if (l === "/") {
            p = d;
            continue;
          }
        }
        if (l === "[") {
          i++;
        } else if (l === "]") {
          i--;
        } else if (l === "(") {
          a++;
        } else if (l === ")") {
          a--;
        }
      }
      const g = s.length === 0 ? o : o.slice(f);
      let S = g;
      let P = false;
      if (g.endsWith(ft)) {
        S = g.slice(0, -1);
        P = true;
      } else if (g.startsWith(ft)) {
        S = g.slice(1);
        P = true;
      }
      const h = p && p > f ? p - f : undefined;
      return hn(s, P, S, h);
    };
    if (t) {
      const o = t + mn;
      const s = r;
      r = i => i.startsWith(o) ? s(i.slice(o.length)) : hn(Jo, false, i, undefined, true);
    }
    if (n) {
      const o = r;
      r = s => n({
        className: s,
        parseClassName: o
      });
    }
    return r;
  };
  const Yo = e => {
    const t = new Map();
    e.orderSensitiveModifiers.forEach((n, r) => {
      t.set(n, 1000000 + r);
    });
    return n => {
      const r = [];
      let o = [];
      for (let s = 0; s < n.length; s++) {
        const i = n[s];
        const a = i[0] === "[";
        const f = t.has(i);
        if (a || f) {
          if (o.length > 0) {
            o.sort();
            r.push(...o);
            o = [];
          }
          r.push(i);
        } else {
          o.push(i);
        }
      }
      if (o.length > 0) {
        o.sort();
        r.push(...o);
      }
      return r;
    };
  };
  const Qo = e => ({
    cache: Wo(e.cacheSize),
    parseClassName: Xo(e),
    sortModifiers: Yo(e),
    ...Do(e)
  });
  const Zo = /\s+/;
  const es = (e, t) => {
    const {
      parseClassName: n,
      getClassGroupId: r,
      getConflictingClassGroupIds: o,
      sortModifiers: s
    } = t;
    const i = [];
    const a = e.trim().split(Zo);
    let f = "";
    for (let p = a.length - 1; p >= 0; p -= 1) {
      const c = a[p];
      const {
        isExternal: g,
        modifiers: S,
        hasImportantModifier: P,
        baseClassName: h,
        maybePostfixModifierPosition: d
      } = n(c);
      if (g) {
        f = c + (f.length > 0 ? " " + f : f);
        continue;
      }
      let l = !!d;
      let m = r(l ? h.substring(0, d) : h);
      if (!m) {
        if (!l) {
          f = c + (f.length > 0 ? " " + f : f);
          continue;
        }
        m = r(h);
        if (!m) {
          f = c + (f.length > 0 ? " " + f : f);
          continue;
        }
        l = false;
      }
      const b = S.length === 0 ? "" : S.length === 1 ? S[0] : s(S).join(":");
      const w = P ? b + ft : b;
      const v = w + m;
      if (i.indexOf(v) > -1) {
        continue;
      }
      i.push(v);
      const A = o(m, l);
      for (let _ = 0; _ < A.length; ++_) {
        const O = A[_];
        i.push(w + O);
      }
      f = c + (f.length > 0 ? " " + f : f);
    }
    return f;
  };
  const ts = (...e) => {
    let t = 0;
    let n;
    let r;
    let o = "";
    while (t < e.length) {
      if ((n = e[t++]) && (r = gn(n))) {
        if (o) {
          o += " ";
        }
        o += r;
      }
    }
    return o;
  };
  const gn = e => {
    if (typeof e == "string") {
      return e;
    }
    let t;
    let n = "";
    for (let r = 0; r < e.length; r++) {
      if (e[r] && (t = gn(e[r]))) {
        if (n) {
          n += " ";
        }
        n += t;
      }
    }
    return n;
  };
  const bn = (e, ...t) => {
    let n;
    let r;
    let o;
    let s;
    const i = f => {
      const p = t.reduce((c, g) => g(c), e());
      n = Qo(p);
      r = n.cache.get;
      o = n.cache.set;
      s = a;
      return a(f);
    };
    const a = f => {
      const p = r(f);
      if (p) {
        return p;
      }
      const c = es(f, n);
      o(f, c);
      return c;
    };
    s = i;
    return (...f) => s(ts(...f));
  };
  const ns = [];
  const U = e => {
    const t = n => n[e] || ns;
    t.isThemeGetter = true;
    return t;
  };
  const wn = /^\[(?:(\w[\w-]*):)?(.+)\]$/i;
  const yn = /^\((?:(\w[\w-]*):)?(.+)\)$/i;
  const rs = /^\d+\/\d+$/;
  const os = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
  const ss = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
  const is = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/;
  const as = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
  const cs = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
  const de = e => rs.test(e);
  const T = e => !!e && !Number.isNaN(Number(e));
  const ne = e => !!e && Number.isInteger(Number(e));
  const pt = e => e.endsWith("%") && T(e.slice(0, -1));
  const te = e => os.test(e);
  const ls = () => true;
  const us = e => ss.test(e) && !is.test(e);
  const xn = () => false;
  const ds = e => as.test(e);
  const fs = e => cs.test(e);
  const ps = e => !y(e) && !x(e);
  const ms = e => fe(e, Sn, xn);
  const y = e => wn.test(e);
  const ae = e => fe(e, Tn, us);
  const mt = e => fe(e, ys, T);
  const En = e => fe(e, kn, xn);
  const hs = e => fe(e, Rn, fs);
  const ze = e => fe(e, An, ds);
  const x = e => yn.test(e);
  const Ee = e => pe(e, Tn);
  const gs = e => pe(e, xs);
  const vn = e => pe(e, kn);
  const bs = e => pe(e, Sn);
  const ws = e => pe(e, Rn);
  const Ve = e => pe(e, An, true);
  const fe = (e, t, n) => {
    const r = wn.exec(e);
    if (r) {
      if (r[1]) {
        return t(r[1]);
      } else {
        return n(r[2]);
      }
    } else {
      return false;
    }
  };
  const pe = (e, t, n = false) => {
    const r = yn.exec(e);
    if (r) {
      if (r[1]) {
        return t(r[1]);
      } else {
        return n;
      }
    } else {
      return false;
    }
  };
  const kn = e => e === "position" || e === "percentage";
  const Rn = e => e === "image" || e === "url";
  const Sn = e => e === "length" || e === "size" || e === "bg-size";
  const Tn = e => e === "length";
  const ys = e => e === "number";
  const xs = e => e === "family-name";
  const An = e => e === "shadow";
  const _n = () => {
    const e = U("color");
    const t = U("font");
    const n = U("text");
    const r = U("font-weight");
    const o = U("tracking");
    const s = U("leading");
    const i = U("breakpoint");
    const a = U("container");
    const f = U("spacing");
    const p = U("radius");
    const c = U("shadow");
    const g = U("inset-shadow");
    const S = U("text-shadow");
    const P = U("drop-shadow");
    const h = U("blur");
    const d = U("perspective");
    const l = U("aspect");
    const m = U("ease");
    const b = U("animate");
    const w = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"];
    const v = () => ["center", "top", "bottom", "left", "right", "top-left", "left-top", "top-right", "right-top", "bottom-right", "right-bottom", "bottom-left", "left-bottom"];
    const A = () => [...v(), x, y];
    const _ = () => ["auto", "hidden", "clip", "visible", "scroll"];
    const O = () => ["auto", "contain", "none"];
    const E = () => [x, y, f];
    const L = () => [de, "full", "auto", ...E()];
    const C = () => [ne, "none", "subgrid", x, y];
    const W = () => ["auto", {
      span: ["full", ne, x, y]
    }, ne, x, y];
    const K = () => [ne, "auto", x, y];
    const V = () => ["auto", "min", "max", "fr", x, y];
    const J = () => ["start", "end", "center", "between", "around", "evenly", "stretch", "baseline", "center-safe", "end-safe"];
    const j = () => ["start", "end", "center", "stretch", "center-safe", "end-safe"];
    const I = () => ["auto", ...E()];
    const H = () => [de, "auto", "full", "dvw", "dvh", "lvw", "lvh", "svw", "svh", "min", "max", "fit", ...E()];
    const k = () => [e, x, y];
    const ke = () => [...v(), vn, En, {
      position: [x, y]
    }];
    const Ke = () => ["no-repeat", {
      repeat: ["", "x", "y", "space", "round"]
    }];
    const Q = () => ["auto", "cover", "contain", bs, ms, {
      size: [x, y]
    }];
    const Z = () => [pt, Ee, ae];
    const B = () => ["", "none", "full", p, x, y];
    const D = () => ["", T, Ee, ae];
    const ce = () => ["solid", "dashed", "dotted", "double"];
    const Cn = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];
    const $ = () => [T, pt, vn, En];
    const In = () => ["", "none", h, x, y];
    const He = () => ["none", T, x, y];
    const We = () => ["none", T, x, y];
    const bt = () => [T, x, y];
    const Je = () => [de, "full", ...E()];
    return {
      cacheSize: 500,
      theme: {
        animate: ["spin", "ping", "pulse", "bounce"],
        aspect: ["video"],
        blur: [te],
        breakpoint: [te],
        color: [ls],
        container: [te],
        "drop-shadow": [te],
        ease: ["in", "out", "in-out"],
        font: [ps],
        "font-weight": ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black"],
        "inset-shadow": [te],
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose"],
        perspective: ["dramatic", "near", "normal", "midrange", "distant", "none"],
        radius: [te],
        shadow: [te],
        spacing: ["px", T],
        text: [te],
        "text-shadow": [te],
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest"]
      },
      classGroups: {
        aspect: [{
          aspect: ["auto", "square", de, y, x, l]
        }],
        container: ["container"],
        columns: [{
          columns: [T, y, x, a]
        }],
        "break-after": [{
          "break-after": w()
        }],
        "break-before": [{
          "break-before": w()
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
          object: A()
        }],
        overflow: [{
          overflow: _()
        }],
        "overflow-x": [{
          "overflow-x": _()
        }],
        "overflow-y": [{
          "overflow-y": _()
        }],
        overscroll: [{
          overscroll: O()
        }],
        "overscroll-x": [{
          "overscroll-x": O()
        }],
        "overscroll-y": [{
          "overscroll-y": O()
        }],
        position: ["static", "fixed", "absolute", "relative", "sticky"],
        inset: [{
          inset: L()
        }],
        "inset-x": [{
          "inset-x": L()
        }],
        "inset-y": [{
          "inset-y": L()
        }],
        start: [{
          start: L()
        }],
        end: [{
          end: L()
        }],
        top: [{
          top: L()
        }],
        right: [{
          right: L()
        }],
        bottom: [{
          bottom: L()
        }],
        left: [{
          left: L()
        }],
        visibility: ["visible", "invisible", "collapse"],
        z: [{
          z: [ne, "auto", x, y]
        }],
        basis: [{
          basis: [de, "full", "auto", a, ...E()]
        }],
        "flex-direction": [{
          flex: ["row", "row-reverse", "col", "col-reverse"]
        }],
        "flex-wrap": [{
          flex: ["nowrap", "wrap", "wrap-reverse"]
        }],
        flex: [{
          flex: [T, de, "auto", "initial", "none", y]
        }],
        grow: [{
          grow: ["", T, x, y]
        }],
        shrink: [{
          shrink: ["", T, x, y]
        }],
        order: [{
          order: [ne, "first", "last", "none", x, y]
        }],
        "grid-cols": [{
          "grid-cols": C()
        }],
        "col-start-end": [{
          col: W()
        }],
        "col-start": [{
          "col-start": K()
        }],
        "col-end": [{
          "col-end": K()
        }],
        "grid-rows": [{
          "grid-rows": C()
        }],
        "row-start-end": [{
          row: W()
        }],
        "row-start": [{
          "row-start": K()
        }],
        "row-end": [{
          "row-end": K()
        }],
        "grid-flow": [{
          "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
        }],
        "auto-cols": [{
          "auto-cols": V()
        }],
        "auto-rows": [{
          "auto-rows": V()
        }],
        gap: [{
          gap: E()
        }],
        "gap-x": [{
          "gap-x": E()
        }],
        "gap-y": [{
          "gap-y": E()
        }],
        "justify-content": [{
          justify: [...J(), "normal"]
        }],
        "justify-items": [{
          "justify-items": [...j(), "normal"]
        }],
        "justify-self": [{
          "justify-self": ["auto", ...j()]
        }],
        "align-content": [{
          content: ["normal", ...J()]
        }],
        "align-items": [{
          items: [...j(), {
            baseline: ["", "last"]
          }]
        }],
        "align-self": [{
          self: ["auto", ...j(), {
            baseline: ["", "last"]
          }]
        }],
        "place-content": [{
          "place-content": J()
        }],
        "place-items": [{
          "place-items": [...j(), "baseline"]
        }],
        "place-self": [{
          "place-self": ["auto", ...j()]
        }],
        p: [{
          p: E()
        }],
        px: [{
          px: E()
        }],
        py: [{
          py: E()
        }],
        ps: [{
          ps: E()
        }],
        pe: [{
          pe: E()
        }],
        pt: [{
          pt: E()
        }],
        pr: [{
          pr: E()
        }],
        pb: [{
          pb: E()
        }],
        pl: [{
          pl: E()
        }],
        m: [{
          m: I()
        }],
        mx: [{
          mx: I()
        }],
        my: [{
          my: I()
        }],
        ms: [{
          ms: I()
        }],
        me: [{
          me: I()
        }],
        mt: [{
          mt: I()
        }],
        mr: [{
          mr: I()
        }],
        mb: [{
          mb: I()
        }],
        ml: [{
          ml: I()
        }],
        "space-x": [{
          "space-x": E()
        }],
        "space-x-reverse": ["space-x-reverse"],
        "space-y": [{
          "space-y": E()
        }],
        "space-y-reverse": ["space-y-reverse"],
        size: [{
          size: H()
        }],
        w: [{
          w: [a, "screen", ...H()]
        }],
        "min-w": [{
          "min-w": [a, "screen", "none", ...H()]
        }],
        "max-w": [{
          "max-w": [a, "screen", "none", "prose", {
            screen: [i]
          }, ...H()]
        }],
        h: [{
          h: ["screen", "lh", ...H()]
        }],
        "min-h": [{
          "min-h": ["screen", "lh", "none", ...H()]
        }],
        "max-h": [{
          "max-h": ["screen", "lh", ...H()]
        }],
        "font-size": [{
          text: ["base", n, Ee, ae]
        }],
        "font-smoothing": ["antialiased", "subpixel-antialiased"],
        "font-style": ["italic", "not-italic"],
        "font-weight": [{
          font: [r, x, mt]
        }],
        "font-stretch": [{
          "font-stretch": ["ultra-condensed", "extra-condensed", "condensed", "semi-condensed", "normal", "semi-expanded", "expanded", "extra-expanded", "ultra-expanded", pt, y]
        }],
        "font-family": [{
          font: [gs, y, t]
        }],
        "fvn-normal": ["normal-nums"],
        "fvn-ordinal": ["ordinal"],
        "fvn-slashed-zero": ["slashed-zero"],
        "fvn-figure": ["lining-nums", "oldstyle-nums"],
        "fvn-spacing": ["proportional-nums", "tabular-nums"],
        "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
        tracking: [{
          tracking: [o, x, y]
        }],
        "line-clamp": [{
          "line-clamp": [T, "none", x, mt]
        }],
        leading: [{
          leading: [s, ...E()]
        }],
        "list-image": [{
          "list-image": ["none", x, y]
        }],
        "list-style-position": [{
          list: ["inside", "outside"]
        }],
        "list-style-type": [{
          list: ["disc", "decimal", "none", x, y]
        }],
        "text-alignment": [{
          text: ["left", "center", "right", "justify", "start", "end"]
        }],
        "placeholder-color": [{
          placeholder: k()
        }],
        "text-color": [{
          text: k()
        }],
        "text-decoration": ["underline", "overline", "line-through", "no-underline"],
        "text-decoration-style": [{
          decoration: [...ce(), "wavy"]
        }],
        "text-decoration-thickness": [{
          decoration: [T, "from-font", "auto", x, ae]
        }],
        "text-decoration-color": [{
          decoration: k()
        }],
        "underline-offset": [{
          "underline-offset": [T, "auto", x, y]
        }],
        "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
        "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
        "text-wrap": [{
          text: ["wrap", "nowrap", "balance", "pretty"]
        }],
        indent: [{
          indent: E()
        }],
        "vertical-align": [{
          align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", x, y]
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
          content: ["none", x, y]
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
          bg: ke()
        }],
        "bg-repeat": [{
          bg: Ke()
        }],
        "bg-size": [{
          bg: Q()
        }],
        "bg-image": [{
          bg: ["none", {
            linear: [{
              to: ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
            }, ne, x, y],
            radial: ["", x, y],
            conic: [ne, x, y]
          }, ws, hs]
        }],
        "bg-color": [{
          bg: k()
        }],
        "gradient-from-pos": [{
          from: Z()
        }],
        "gradient-via-pos": [{
          via: Z()
        }],
        "gradient-to-pos": [{
          to: Z()
        }],
        "gradient-from": [{
          from: k()
        }],
        "gradient-via": [{
          via: k()
        }],
        "gradient-to": [{
          to: k()
        }],
        rounded: [{
          rounded: B()
        }],
        "rounded-s": [{
          "rounded-s": B()
        }],
        "rounded-e": [{
          "rounded-e": B()
        }],
        "rounded-t": [{
          "rounded-t": B()
        }],
        "rounded-r": [{
          "rounded-r": B()
        }],
        "rounded-b": [{
          "rounded-b": B()
        }],
        "rounded-l": [{
          "rounded-l": B()
        }],
        "rounded-ss": [{
          "rounded-ss": B()
        }],
        "rounded-se": [{
          "rounded-se": B()
        }],
        "rounded-ee": [{
          "rounded-ee": B()
        }],
        "rounded-es": [{
          "rounded-es": B()
        }],
        "rounded-tl": [{
          "rounded-tl": B()
        }],
        "rounded-tr": [{
          "rounded-tr": B()
        }],
        "rounded-br": [{
          "rounded-br": B()
        }],
        "rounded-bl": [{
          "rounded-bl": B()
        }],
        "border-w": [{
          border: D()
        }],
        "border-w-x": [{
          "border-x": D()
        }],
        "border-w-y": [{
          "border-y": D()
        }],
        "border-w-s": [{
          "border-s": D()
        }],
        "border-w-e": [{
          "border-e": D()
        }],
        "border-w-t": [{
          "border-t": D()
        }],
        "border-w-r": [{
          "border-r": D()
        }],
        "border-w-b": [{
          "border-b": D()
        }],
        "border-w-l": [{
          "border-l": D()
        }],
        "divide-x": [{
          "divide-x": D()
        }],
        "divide-x-reverse": ["divide-x-reverse"],
        "divide-y": [{
          "divide-y": D()
        }],
        "divide-y-reverse": ["divide-y-reverse"],
        "border-style": [{
          border: [...ce(), "hidden", "none"]
        }],
        "divide-style": [{
          divide: [...ce(), "hidden", "none"]
        }],
        "border-color": [{
          border: k()
        }],
        "border-color-x": [{
          "border-x": k()
        }],
        "border-color-y": [{
          "border-y": k()
        }],
        "border-color-s": [{
          "border-s": k()
        }],
        "border-color-e": [{
          "border-e": k()
        }],
        "border-color-t": [{
          "border-t": k()
        }],
        "border-color-r": [{
          "border-r": k()
        }],
        "border-color-b": [{
          "border-b": k()
        }],
        "border-color-l": [{
          "border-l": k()
        }],
        "divide-color": [{
          divide: k()
        }],
        "outline-style": [{
          outline: [...ce(), "none", "hidden"]
        }],
        "outline-offset": [{
          "outline-offset": [T, x, y]
        }],
        "outline-w": [{
          outline: ["", T, Ee, ae]
        }],
        "outline-color": [{
          outline: k()
        }],
        shadow: [{
          shadow: ["", "none", c, Ve, ze]
        }],
        "shadow-color": [{
          shadow: k()
        }],
        "inset-shadow": [{
          "inset-shadow": ["none", g, Ve, ze]
        }],
        "inset-shadow-color": [{
          "inset-shadow": k()
        }],
        "ring-w": [{
          ring: D()
        }],
        "ring-w-inset": ["ring-inset"],
        "ring-color": [{
          ring: k()
        }],
        "ring-offset-w": [{
          "ring-offset": [T, ae]
        }],
        "ring-offset-color": [{
          "ring-offset": k()
        }],
        "inset-ring-w": [{
          "inset-ring": D()
        }],
        "inset-ring-color": [{
          "inset-ring": k()
        }],
        "text-shadow": [{
          "text-shadow": ["none", S, Ve, ze]
        }],
        "text-shadow-color": [{
          "text-shadow": k()
        }],
        opacity: [{
          opacity: [T, x, y]
        }],
        "mix-blend": [{
          "mix-blend": [...Cn(), "plus-darker", "plus-lighter"]
        }],
        "bg-blend": [{
          "bg-blend": Cn()
        }],
        "mask-clip": [{
          "mask-clip": ["border", "padding", "content", "fill", "stroke", "view"]
        }, "mask-no-clip"],
        "mask-composite": [{
          mask: ["add", "subtract", "intersect", "exclude"]
        }],
        "mask-image-linear-pos": [{
          "mask-linear": [T]
        }],
        "mask-image-linear-from-pos": [{
          "mask-linear-from": $()
        }],
        "mask-image-linear-to-pos": [{
          "mask-linear-to": $()
        }],
        "mask-image-linear-from-color": [{
          "mask-linear-from": k()
        }],
        "mask-image-linear-to-color": [{
          "mask-linear-to": k()
        }],
        "mask-image-t-from-pos": [{
          "mask-t-from": $()
        }],
        "mask-image-t-to-pos": [{
          "mask-t-to": $()
        }],
        "mask-image-t-from-color": [{
          "mask-t-from": k()
        }],
        "mask-image-t-to-color": [{
          "mask-t-to": k()
        }],
        "mask-image-r-from-pos": [{
          "mask-r-from": $()
        }],
        "mask-image-r-to-pos": [{
          "mask-r-to": $()
        }],
        "mask-image-r-from-color": [{
          "mask-r-from": k()
        }],
        "mask-image-r-to-color": [{
          "mask-r-to": k()
        }],
        "mask-image-b-from-pos": [{
          "mask-b-from": $()
        }],
        "mask-image-b-to-pos": [{
          "mask-b-to": $()
        }],
        "mask-image-b-from-color": [{
          "mask-b-from": k()
        }],
        "mask-image-b-to-color": [{
          "mask-b-to": k()
        }],
        "mask-image-l-from-pos": [{
          "mask-l-from": $()
        }],
        "mask-image-l-to-pos": [{
          "mask-l-to": $()
        }],
        "mask-image-l-from-color": [{
          "mask-l-from": k()
        }],
        "mask-image-l-to-color": [{
          "mask-l-to": k()
        }],
        "mask-image-x-from-pos": [{
          "mask-x-from": $()
        }],
        "mask-image-x-to-pos": [{
          "mask-x-to": $()
        }],
        "mask-image-x-from-color": [{
          "mask-x-from": k()
        }],
        "mask-image-x-to-color": [{
          "mask-x-to": k()
        }],
        "mask-image-y-from-pos": [{
          "mask-y-from": $()
        }],
        "mask-image-y-to-pos": [{
          "mask-y-to": $()
        }],
        "mask-image-y-from-color": [{
          "mask-y-from": k()
        }],
        "mask-image-y-to-color": [{
          "mask-y-to": k()
        }],
        "mask-image-radial": [{
          "mask-radial": [x, y]
        }],
        "mask-image-radial-from-pos": [{
          "mask-radial-from": $()
        }],
        "mask-image-radial-to-pos": [{
          "mask-radial-to": $()
        }],
        "mask-image-radial-from-color": [{
          "mask-radial-from": k()
        }],
        "mask-image-radial-to-color": [{
          "mask-radial-to": k()
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
          "mask-radial-at": v()
        }],
        "mask-image-conic-pos": [{
          "mask-conic": [T]
        }],
        "mask-image-conic-from-pos": [{
          "mask-conic-from": $()
        }],
        "mask-image-conic-to-pos": [{
          "mask-conic-to": $()
        }],
        "mask-image-conic-from-color": [{
          "mask-conic-from": k()
        }],
        "mask-image-conic-to-color": [{
          "mask-conic-to": k()
        }],
        "mask-mode": [{
          mask: ["alpha", "luminance", "match"]
        }],
        "mask-origin": [{
          "mask-origin": ["border", "padding", "content", "fill", "stroke", "view"]
        }],
        "mask-position": [{
          mask: ke()
        }],
        "mask-repeat": [{
          mask: Ke()
        }],
        "mask-size": [{
          mask: Q()
        }],
        "mask-type": [{
          "mask-type": ["alpha", "luminance"]
        }],
        "mask-image": [{
          mask: ["none", x, y]
        }],
        filter: [{
          filter: ["", "none", x, y]
        }],
        blur: [{
          blur: In()
        }],
        brightness: [{
          brightness: [T, x, y]
        }],
        contrast: [{
          contrast: [T, x, y]
        }],
        "drop-shadow": [{
          "drop-shadow": ["", "none", P, Ve, ze]
        }],
        "drop-shadow-color": [{
          "drop-shadow": k()
        }],
        grayscale: [{
          grayscale: ["", T, x, y]
        }],
        "hue-rotate": [{
          "hue-rotate": [T, x, y]
        }],
        invert: [{
          invert: ["", T, x, y]
        }],
        saturate: [{
          saturate: [T, x, y]
        }],
        sepia: [{
          sepia: ["", T, x, y]
        }],
        "backdrop-filter": [{
          "backdrop-filter": ["", "none", x, y]
        }],
        "backdrop-blur": [{
          "backdrop-blur": In()
        }],
        "backdrop-brightness": [{
          "backdrop-brightness": [T, x, y]
        }],
        "backdrop-contrast": [{
          "backdrop-contrast": [T, x, y]
        }],
        "backdrop-grayscale": [{
          "backdrop-grayscale": ["", T, x, y]
        }],
        "backdrop-hue-rotate": [{
          "backdrop-hue-rotate": [T, x, y]
        }],
        "backdrop-invert": [{
          "backdrop-invert": ["", T, x, y]
        }],
        "backdrop-opacity": [{
          "backdrop-opacity": [T, x, y]
        }],
        "backdrop-saturate": [{
          "backdrop-saturate": [T, x, y]
        }],
        "backdrop-sepia": [{
          "backdrop-sepia": ["", T, x, y]
        }],
        "border-collapse": [{
          border: ["collapse", "separate"]
        }],
        "border-spacing": [{
          "border-spacing": E()
        }],
        "border-spacing-x": [{
          "border-spacing-x": E()
        }],
        "border-spacing-y": [{
          "border-spacing-y": E()
        }],
        "table-layout": [{
          table: ["auto", "fixed"]
        }],
        caption: [{
          caption: ["top", "bottom"]
        }],
        transition: [{
          transition: ["", "all", "colors", "opacity", "shadow", "transform", "none", x, y]
        }],
        "transition-behavior": [{
          transition: ["normal", "discrete"]
        }],
        duration: [{
          duration: [T, "initial", x, y]
        }],
        ease: [{
          ease: ["linear", "initial", m, x, y]
        }],
        delay: [{
          delay: [T, x, y]
        }],
        animate: [{
          animate: ["none", b, x, y]
        }],
        backface: [{
          backface: ["hidden", "visible"]
        }],
        perspective: [{
          perspective: [d, x, y]
        }],
        "perspective-origin": [{
          "perspective-origin": A()
        }],
        rotate: [{
          rotate: He()
        }],
        "rotate-x": [{
          "rotate-x": He()
        }],
        "rotate-y": [{
          "rotate-y": He()
        }],
        "rotate-z": [{
          "rotate-z": He()
        }],
        scale: [{
          scale: We()
        }],
        "scale-x": [{
          "scale-x": We()
        }],
        "scale-y": [{
          "scale-y": We()
        }],
        "scale-z": [{
          "scale-z": We()
        }],
        "scale-3d": ["scale-3d"],
        skew: [{
          skew: bt()
        }],
        "skew-x": [{
          "skew-x": bt()
        }],
        "skew-y": [{
          "skew-y": bt()
        }],
        transform: [{
          transform: [x, y, "", "none", "gpu", "cpu"]
        }],
        "transform-origin": [{
          origin: A()
        }],
        "transform-style": [{
          transform: ["3d", "flat"]
        }],
        translate: [{
          translate: Je()
        }],
        "translate-x": [{
          "translate-x": Je()
        }],
        "translate-y": [{
          "translate-y": Je()
        }],
        "translate-z": [{
          "translate-z": Je()
        }],
        "translate-none": ["translate-none"],
        accent: [{
          accent: k()
        }],
        appearance: [{
          appearance: ["none", "auto"]
        }],
        "caret-color": [{
          caret: k()
        }],
        "color-scheme": [{
          scheme: ["normal", "dark", "light", "light-dark", "only-dark", "only-light"]
        }],
        cursor: [{
          cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", x, y]
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
          "scroll-m": E()
        }],
        "scroll-mx": [{
          "scroll-mx": E()
        }],
        "scroll-my": [{
          "scroll-my": E()
        }],
        "scroll-ms": [{
          "scroll-ms": E()
        }],
        "scroll-me": [{
          "scroll-me": E()
        }],
        "scroll-mt": [{
          "scroll-mt": E()
        }],
        "scroll-mr": [{
          "scroll-mr": E()
        }],
        "scroll-mb": [{
          "scroll-mb": E()
        }],
        "scroll-ml": [{
          "scroll-ml": E()
        }],
        "scroll-p": [{
          "scroll-p": E()
        }],
        "scroll-px": [{
          "scroll-px": E()
        }],
        "scroll-py": [{
          "scroll-py": E()
        }],
        "scroll-ps": [{
          "scroll-ps": E()
        }],
        "scroll-pe": [{
          "scroll-pe": E()
        }],
        "scroll-pt": [{
          "scroll-pt": E()
        }],
        "scroll-pr": [{
          "scroll-pr": E()
        }],
        "scroll-pb": [{
          "scroll-pb": E()
        }],
        "scroll-pl": [{
          "scroll-pl": E()
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
          "will-change": ["auto", "scroll", "contents", "transform", x, y]
        }],
        fill: [{
          fill: ["none", ...k()]
        }],
        "stroke-w": [{
          stroke: [T, Ee, ae, mt]
        }],
        stroke: [{
          stroke: ["none", ...k()]
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
  const Es = (e, {
    cacheSize: t,
    prefix: n,
    experimentalParseClassName: r,
    extend: o = {},
    override: s = {}
  }) => {
    ve(e, "cacheSize", t);
    ve(e, "prefix", n);
    ve(e, "experimentalParseClassName", r);
    je(e.theme, s.theme);
    je(e.classGroups, s.classGroups);
    je(e.conflictingClassGroups, s.conflictingClassGroups);
    je(e.conflictingClassGroupModifiers, s.conflictingClassGroupModifiers);
    ve(e, "orderSensitiveModifiers", s.orderSensitiveModifiers);
    qe(e.theme, o.theme);
    qe(e.classGroups, o.classGroups);
    qe(e.conflictingClassGroups, o.conflictingClassGroups);
    qe(e.conflictingClassGroupModifiers, o.conflictingClassGroupModifiers);
    On(e, o, "orderSensitiveModifiers");
    return e;
  };
  const ve = (e, t, n) => {
    if (n !== undefined) {
      e[t] = n;
    }
  };
  const je = (e, t) => {
    if (t) {
      for (const n in t) {
        ve(e, n, t[n]);
      }
    }
  };
  const qe = (e, t) => {
    if (t) {
      for (const n in t) {
        On(e, t, n);
      }
    }
  };
  const On = (e, t, n) => {
    const r = t[n];
    if (r !== undefined) {
      e[n] = e[n] ? e[n].concat(r) : r;
    }
  };
  ((e, ...t) => typeof e == "function" ? bn(_n, e, ...t) : bn(() => Es(_n(), e), ...t))({
    prefix: "tw"
  });
  function vs(e) {
    M.info(`Delaying for ${e / 1000}s`);
    return new Promise(t => setTimeout(t, e));
  }
  async function ht(e) {
    if (!e.includes("vinted")) {
      return;
    }
    const t = async s => {
      for (const i of s) {
        if (i.url === e) {
          const a = {};
          if (!i.pinned) {
            a.pinned = true;
          }
          if (!i.active) {
            a.active = true;
          }
          if (i.autoDiscardable) {
            a.autoDiscardable = false;
          }
          if (Object.keys(a).length > 0 && i.id !== undefined) {
            await F.tabs.update(i.id, a);
          }
          return true;
        }
      }
      return false;
    };
    let n = await F.tabs.query({});
    if (await t(n)) {
      M.info("Tab already exists:", e);
      return;
    }
    if (n.some(s => s.pinned && s.url?.includes("vinted")) && (M.info("Found pinned Vinted tabs, waiting for potential URL restoration..."), await vs(100), n = await F.tabs.query({}), await t(n))) {
      M.info("Tab found on second pass:", e);
      return;
    }
    const o = await F.tabs.create({
      url: e,
      pinned: true
    });
    M.info("Tab not found, creating new one:", e, o);
    if (o.id) {
      await F.tabs.update(o.id, {
        autoDiscardable: false
      });
    }
  }
  const ks = "v_uid";
  function Rs() {
    F.runtime.onMessage.addListener((e, t, n) => {
      if (e.action === ee.GET_USER_ID) {
        const {
          url: r
        } = e.data;
        F.cookies.get({
          url: r,
          name: ks
        }).then(o => n(o?.value)).catch(o => {
          M.error(o);
          return o;
        });
        return true;
      } else if (e.action === ee.MAYBE_PIN_AUTO_MESSAGES_TAB) {
        const {
          origin: r
        } = e.data;
        ht(`${r}${Dn}`).then(() => n(true)).catch(M.error);
        return true;
      } else if (e.action === ee.MAYBE_PIN_RESTOCKER_TAB) {
        const {
          origin: r
        } = e.data;
        ht(`${r}${$n}`).then(() => n(true)).catch(M.error);
        return true;
      } else if (e.action === ee.MAYBE_PIN_AUTOMATIONS_TAB) {
        const {
          origin: r
        } = e.data;
        ht(`${r}${zn}`).then(() => n(true)).catch(M.error);
        return true;
      } else if (e.action === ee.DOWNLOAD) {
        const {
          url: r,
          saveAs: o,
          filename: s
        } = e.data;
        F.downloads.download({
          url: r,
          filename: s,
          saveAs: o
        }).then(i => n(i)).catch(i => {
          M.error(i);
          return i;
        });
        return true;
      } else {
        if (e.action === ee.GET_PLATFORM_INFO) {
          F.runtime.getPlatformInfo().then(r => n({
            os: r.os,
            arch: r.arch
          })).catch(r => {
            M.error(r);
            n({});
          });
          return true;
        }
        if (e.action === ee.VINTED_LOGOUT) {
          M.info("Vinted logout detected, clearing Dotb session");
          ln().then(() => n(true)).catch(r => {
            M.error("Failed to handle Vinted logout:", r);
            n(false);
          });
          return true;
        }
      }
    });
  }
  function Ss() {
    F.runtime.onMessageExternal.addListener((e, t, n) => {
      M.info("onMessageExternal", e, t);
      const r = Xe.slice(0, -1);
      if (t.origin === r) {
        if (e.action === "connectionStatus") {
          Mo().then(({
            token: o
          }) => {
            n({
              action: "connectionStatus",
              data: {
                token: o
              }
            });
          });
        }
        if (e.action === "logout") {
          ln();
        }
        if (e.action === "login") {
          No(e.data.token);
        }
      }
      return true;
    });
  }
  const Ts = Nn(() => {
    M.info("background is running");
    F.runtime.onInstalled.addListener(e => {
      if (e.reason === "install") {
        M.debug("Extension installed");
        F.tabs.create({
          url: `${Xe}docs?ref=ext-install`
        });
        Re();
      } else if (e.reason === "update") {
        M.debug("Extension updated");
        Re();
      }
    });
    F.runtime.onUpdateAvailable.addListener(e => {
      M.info("Update available:", e.version);
    });
    Ss();
    Rs();
    cn().catch(() => {});
    setInterval(cn, 20000);
  });
  function oi() {}
  function Ge(e, ...t) {}
  const As = {
    debug: (...e) => Ge(console.debug, ...e),
    log: (...e) => Ge(console.log, ...e),
    warn: (...e) => Ge(console.warn, ...e),
    error: (...e) => Ge(console.error, ...e)
  };
  let gt;
  try {
    gt = Ts.main();
    if (gt instanceof Promise) {
      console.warn("The background's main() function return a promise, but it must be synchronous");
    }
  } catch (e) {
    As.error("The background crashed on startup!");
    throw e;
  }
  var _s = gt;
  return _s;
}();