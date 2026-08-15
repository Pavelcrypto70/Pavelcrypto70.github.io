// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      AD: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      AE: x0 => globalThis.parseFloat(x0),
      AF: x0 => x0.pressure,
      AG: () => globalThis.Intl,
      AH: (x0,x1) => x0.add(x1),
      AI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      AJ: () => new Array(),
      AK: x0 => x0.body,
      B: s => printToConsole(s),
      BB: x0 => new Uint16Array(x0),
      BC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      BD: x0 => x0.tabIndex,
      BE: (x0,x1) => x0.getComputedStyle(x1),
      BF: x0 => x0.tiltY,
      BG: (x0,x1) => x0.segment(x1),
      BH: x0 => x0.data,
      BI: (a, s, e) => a.slice(s, e),
      BJ: (x0,x1) => new WebSocket(x0,x1),
      BK: (x0,x1) => new OffscreenCanvas(x0,x1),
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: x0 => new Int32Array(x0),
      CC: (x0,x1) => x0.querySelector(x1),
      CD: (x0,x1) => x0.contains(x1),
      CE: x0 => x0.documentElement,
      CF: x0 => x0.tiltX,
      CG: x0 => x0.index,
      CH: (x0,x1) => { x0.scrollTop = x1 },
      CI: (o, p) => p in o,
      CJ: x0 => x0.reason,
      CK: x0 => x0.assetBase,
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      DC: (x0,x1) => x0.item(x1),
      DD: x0 => x0.activeElement,
      DE: x0 => x0.computedStyleMap(),
      DF: x0 => x0.pointerType,
      DG: x0 => x0.next(),
      DH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      DI: x0 => x0.groups,
      DJ: x0 => x0.code,
      DK: x0 => x0.loader,
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: x0 => new Uint32Array(x0),
      EC: x0 => x0.length,
      ED: x0 => x0.parentNode,
      EE: (x0,x1) => x0.get(x1),
      EF: x0 => x0.pointerId,
      EG: x0 => x0.value,
      EH: (x0,x1) => { x0.value = x1 },
      EI: x0 => x0.pop(),
      EJ: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      EK: () => globalThis._flutter,
      F: () => new Error().stack,
      FB: x0 => new Float32Array(x0),
      FC: (x0,x1) => x0.querySelectorAll(x1),
      FD: x0 => x0.tagName,
      FE: (o, p) => p in o,
      FF: x0 => x0.getCoalescedEvents(),
      FG: x0 => x0.done,
      FH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      FI: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      FJ: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      G: s => JSON.stringify(s),
      GB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      GC: (x0,x1) => x0.getAttribute(x1),
      GD: x0 => x0.target,
      GE: (x0,x1) => { x0.textContent = x1 },
      GF: (x0,x1) => x0.getModifierState(x1),
      GG: (o, m, a) => o[m].apply(o, a),
      GH: (x0,x1) => { x0.value = x1 },
      GI: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      GJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: x0 => new Float64Array(x0),
      HC: x0 => x0.remove(),
      HD: x0 => x0.clientY,
      HE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      HF: s => s.trimLeft(),
      HG: x0 => x0.iterator,
      HH: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      HI: (x0,x1,x2) => x0.open(x1,x2),
      HJ: (o, t) => typeof o === t,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      IC: (x0,x1) => x0.appendChild(x1),
      ID: x0 => x0.clientX,
      IE: x0 => x0.matches,
      IF: s => s.toUpperCase(),
      IG: () => globalThis.Symbol,
      IH: x0 => x0.value,
      II: () => globalThis.window,
      IJ: x0 => x0.data,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: x0 => new ArrayBuffer(x0),
      JC: (x0,x1) => x0.append(x1),
      JD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      JE: (x0,x1) => x0.matchMedia(x1),
      JF: (x0,x1) => x0[x1],
      JG: (x0,x1) => new Intl.Segmenter(x0,x1),
      JH: x0 => x0.selectionDirection,
      JI: x0 => x0.abort(),
      JJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      KC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      KD: x0 => x0.getBoundingClientRect(),
      KE: x0 => x0.matches,
      KF: x0 => x0.index,
      KG: x0 => x0.Segmenter,
      KH: x0 => x0.selectionStart,
      KI: () => new AbortController(),
      KJ: (x0,x1,x2) => x0.close(x1,x2),
      L: o => o === undefined,
      LB: (x0,x1,x2) => new DataView(x0,x1,x2),
      LC: x0 => x0.style,
      LD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      LE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      LF: x0 => x0.flags,
      LG: x0 => x0.buffer,
      LH: x0 => x0.selectionEnd,
      LI: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      LJ: (x0,x1) => x0.close(x1),
      M: o => String(o),
      MB: (o, p) => o[p],
      MC: x0 => x0.debugShowSemanticsNodes,
      MD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      ME: f => f.dartFunction,
      MF: (a, s) => a.join(s),
      MG: x0 => x0.wasmMemory,
      MH: x0 => x0.value,
      MI: (x0,x1) => globalThis.fetch(x0,x1),
      MJ: x0 => x0.close(),
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      NC: o => o,
      ND: Date.now,
      NE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      NF: (x0,x1) => x0.error(x1),
      NG: () => globalThis.window._flutter_skwasmInstance,
      NH: x0 => x0.selectionDirection,
      NI: (x0,x1) => x0.get(x1),
      NJ: (x0,x1) => x0.send(x1),
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      OC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      OD: (handle) => clearTimeout(handle),
      OE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      OF: () => globalThis.console,
      OG: () => new TextDecoder(),
      OH: x0 => x0.selectionStart,
      OI: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      OJ: x0 => x0.readyState,
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: o => o.byteOffset,
      PC: (x0,x1) => x0.warn(x1),
      PD: (x0,x1) => x0.closest(x1),
      PE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      PF: s => s.trimRight(),
      PG: (a, i) => a.splice(i, 1),
      PH: x0 => x0.selectionEnd,
      PI: (x0,x1) => x0.forEach(x1),
      PJ: (x0,x1) => { x0.binaryType = x1 },
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.buffer,
      QC: x0 => x0.console,
      QD: x0 => x0.bottom,
      QE: (o, i) => o[i],
      QF: x0 => x0.blur(),
      QG: a => a.pop(),
      QH: x0 => x0.keyCode,
      QI: x0 => x0.name,
      QJ: x0 => new BroadcastChannel(x0),
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: Function.prototype.call.bind(DataView.prototype.getUint8),
      RC: () => globalThis.window,
      RD: x0 => x0.top,
      RE: o => o.length,
      RF: x0 => x0.button,
      RG: (map, o, v) => map.set(o, v),
      RH: (x0,x1) => x0.scrollIntoView(x1),
      RI: x0 => x0.statusText,
      RJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: (b, o) => new DataView(b, o),
      SC: (o, c) => o instanceof c,
      SD: x0 => x0.right,
      SE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      SF: x0 => x0.innerHeight,
      SG: (map, o) => map.get(o),
      SH: x0 => x0.multiViewEnabled,
      SI: x0 => x0.url,
      SJ: x0 => x0.close(),
      T: x0 => new Promise(x0),
      TB: (b, o, l) => new DataView(b, o, l),
      TC: (x0,x1) => x0.exec(x1),
      TD: x0 => x0.left,
      TE: x0 => x0.language,
      TF: x0 => x0.innerWidth,
      TG: () => new WeakMap(),
      TH: (x0,x1) => x0.replaceWith(x1),
      TI: x0 => x0.status,
      TJ: (x0,x1) => x0.postMessage(x1),
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      UC: x0 => x0.length,
      UD: x0 => x0.clientY,
      UE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      UF: x0 => x0.height,
      UG: x0 => x0.debugSkipFontRetryDelay,
      UH: (x0,x1) => { x0.type = x1 },
      UI: x0 => x0.getReader(),
      UJ: (x0,x1) => { x0.onmessage = x1 },
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      VC: (x0,x1) => { x0.lastIndex = x1 },
      VD: x0 => x0.clientX,
      VE: () => globalThis.window.FinalizationRegistry,
      VF: x0 => x0.width,
      VG: x0 => x0.status,
      VH: (x0,x1) => { x0.className = x1 },
      VI: x0 => x0.read(),
      VJ: (x0,x1) => x0.transferFromImageBitmap(x1),
      W: x0 => new Array(x0),
      WB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      WC: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      WD: x0 => x0.changedTouches,
      WE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      WF: x0 => x0.clientHeight,
      WG: (x0,x1,x2) => x0.set(x1,x2),
      WH: (x0,x1) => { x0.tabIndex = x1 },
      WI: x0 => x0.value,
      WJ: (x0,x1) => x0.getContext(x1),
      X: o => [o],
      XB: (t, s) => t.set(s),
      XC: o => o instanceof RegExp,
      XD: x0 => x0.offsetY,
      XE: x0 => new window.FinalizationRegistry(x0),
      XF: x0 => x0.clientWidth,
      XG: x0 => x0.arrayBuffer(),
      XH: (x0,x1) => { x0.name = x1 },
      XI: x0 => x0.done,
      XJ: (x0,x1) => { x0.height = x1 },
      Y: (o0, o1) => [o0, o1],
      YB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      YC: (string, times) => string.repeat(times),
      YD: x0 => x0.offsetX,
      YE: (x0,x1) => x0.unregister(x1),
      YF: (x0,x1) => { x0.content = x1 },
      YG: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      YH: (x0,x1) => { x0.placeholder = x1 },
      YI: x0 => x0.cancel(),
      YJ: (x0,x1) => { x0.width = x1 },
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      ZC: x0 => x0.dotAll,
      ZD: x0 => x0.type,
      ZE: (x0,x1) => x0.contains(x1),
      ZF: (x0,x1) => { x0.name = x1 },
      ZG: (x0,x1) => x0.fetch(x1),
      ZH: (x0,x1) => { x0.autocomplete = x1 },
      ZI: x0 => x0.body,
      ZJ: x0 => x0.height,
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      aC: x0 => x0.unicode,
      aD: x0 => x0.maxTouchPoints,
      aE: (s) => +s,
      aF: x0 => x0.head,
      aG: x0 => x0.fontFallbackBaseUrl,
      aH: (x0,x1) => { x0.name = x1 },
      aI: x0 => x0.headers,
      aJ: x0 => x0.width,
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: Function.prototype.call.bind(DataView.prototype.getUint32),
      bC: x0 => x0.ignoreCase,
      bD: x0 => x0.platform,
      bE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      bF: (x0,x1) => x0.removeChild(x1),
      bG: (handle) => clearInterval(handle),
      bH: (x0,x1) => { x0.placeholder = x1 },
      bI: x0 => x0.signal,
      bJ: x0 => x0.rasterEndMilliseconds,
      c: o => o,
      cB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      cC: x0 => x0.multiline,
      cD: x0 => x0.body,
      cE: s => s.trim(),
      cF: x0 => x0.firstChild,
      cG: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      cH: (x0,x1) => { x0.action = x1 },
      cI: (x0,x1) => x0.getRandomValues(x1),
      cJ: x0 => x0.rasterStartMilliseconds,
      d: (o, p) => o[p],
      dB: Function.prototype.call.bind(DataView.prototype.getInt32),
      dC: (string, token) => string.split(token),
      dD: () => globalThis.document,
      dE: x0 => x0.classList,
      dF: x0 => x0.viewConstraints,
      dG: () => Date.now(),
      dH: (x0,x1) => { x0.method = x1 },
      dI: () => globalThis.crypto,
      dJ: x0 => x0.imageBitmaps,
      e: () => globalThis,
      eB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      eC: o => o instanceof Array,
      eD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      eE: x0 => x0.preventDefault(),
      eF: x0 => x0.hostElement,
      eG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      eH: (x0,x1) => { x0.noValidate = x1 },
      eI: l => new DataView(new ArrayBuffer(l)),
      eJ: x0 => x0.canvasKitMaximumSurfaces,
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => o instanceof Uint16Array,
      fC: (a, i) => a[i],
      fD: x0 => x0.hasFocus(),
      fE: x0 => x0.parent,
      fF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      fH: (x0,x1) => x0.removeAttribute(x1),
      fI: (a, l) => a.length = l,
      fJ: x0 => x0.hostElement,
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: Function.prototype.call.bind(DataView.prototype.getUint16),
      gC: a => a.length,
      gD: x0 => x0.relatedTarget,
      gE: x0 => x0.timeStamp,
      gF: x0 => ({runApp: x0}),
      gG: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      gH: x0 => x0.isConnected,
      gI: (x0,x1,x2) => x0.insertBefore(x1,x2),
      gJ: x0 => x0.location,
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: o => o instanceof Int16Array,
      hC: (x0,x1) => x0.test(x1),
      hD: x0 => x0.shiftKey,
      hE: (x0,x1) => x0.hasAttribute(x1),
      hF: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      hG: x0 => x0.history,
      hH: x0 => x0.click(),
      hI: x0 => x0.id,
      hJ: (x0,x1) => x0.getModifierState(x1),
      i: (l, r) => l === r,
      iB: Function.prototype.call.bind(DataView.prototype.getInt16),
      iC: x0 => x0.userAgent,
      iD: (decoder, codeUnits) => decoder.decode(codeUnits),
      iE: x0 => x0.buttons,
      iF: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      iG: x0 => x0.search,
      iH: (x0,x1) => x0.getElementsByClassName(x1),
      iI: x0 => x0.offsetHeight,
      iJ: x0 => x0.metaKey,
      j: x0 => x0.random(),
      jB: o => o instanceof Uint8ClampedArray,
      jC: x0 => x0.navigator,
      jD: () => new TextDecoder("utf-8", {fatal: true}),
      jE: x0 => x0.ctrlKey,
      jF: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      jG: x0 => x0.location,
      jH: (x0,x1) => x0.dispatchEvent(x1),
      jI: x0 => x0.offsetWidth,
      jJ: x0 => x0.altKey,
      k: o => o,
      kB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      kC: Function.prototype.call.bind(String.prototype.toLowerCase),
      kD: () => new TextDecoder("utf-8", {fatal: false}),
      kE: x0 => x0.y,
      kF: () => typeof dartUseDateNowForTicks !== "undefined",
      kG: x0 => x0.pathname,
      kH: (x0,x1) => x0.createEvent(x1),
      kI: x0 => x0.stopPropagation(),
      kJ: x0 => x0.ctrlKey,
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: Function.prototype.call.bind(DataView.prototype.setInt32),
      lC: Object.is,
      lD: (a, i, v) => a[i] = v,
      lE: x0 => x0.x,
      lF: () => Date.now(),
      lG: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      lH: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      lI: x0 => x0.disabled,
      lJ: x0 => x0.isComposing,
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setUint32),
      mC: x0 => x0.vendor,
      mD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      mE: x0 => x0.scrollTop,
      mF: () => 1000 * performance.now(),
      mG: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      mH: x0 => x0.readText(),
      mI: (x0,x1) => { x0.min = x1 },
      mJ: x0 => x0.code,
      n: (x0,x1) => x0.prepend(x1),
      nB: Function.prototype.call.bind(DataView.prototype.setInt16),
      nC: (x0,x1) => x0.createTextNode(x1),
      nD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      nE: x0 => x0.offsetTop,
      nF: (x0,x1) => x0.requestAnimationFrame(x1),
      nG: o => Object.keys(o),
      nH: x0 => x0.clipboard,
      nI: (x0,x1) => { x0.max = x1 },
      nJ: x0 => x0.repeat,
      o: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      oB: Function.prototype.call.bind(DataView.prototype.setUint16),
      oC: (x0,x1) => { x0.id = x1 },
      oD: x0 => x0.visibilityState,
      oE: x0 => x0.scrollLeft,
      oF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      oG: x0 => x0.state,
      oH: (x0,x1) => x0.writeText(x1),
      oI: (x0,x1) => { x0.disabled = x1 },
      oJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      p: b => !!b,
      pB: Function.prototype.call.bind(DataView.prototype.setUint8),
      pC: (x0,x1) => { x0.nonce = x1 },
      pD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      pE: x0 => x0.offsetLeft,
      pF: x0 => x0.now(),
      pG: x0 => x0.hash,
      pH: x0 => x0.unlock(),
      pI: (x0,x1) => { x0.scrollLeft = x1 },
      pJ: x0 => x0.userAgent,
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setInt8),
      qC: x0 => x0.nonce,
      qD: x0 => x0.disconnect(),
      qE: x0 => x0.offsetParent,
      qF: x0 => x0.performance,
      qG: x0 => x0.state,
      qH: (x0,x1) => x0.lock(x1),
      qI: (x0,x1) => { x0.spellcheck = x1 },
      qJ: x0 => x0.navigator,
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.getInt8),
      rC: () => globalThis.window.flutterConfiguration,
      rD: x0 => new Intl.Locale(x0),
      rE: (o, p, r) => o.replaceAll(p, () => r),
      rF: x0 => new Uint8Array(x0),
      rG: (x0,x1) => x0.go(x1),
      rH: x0 => x0.orientation,
      rI: (x0,x1) => { x0.disabled = x1 },
      rJ: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      s: () => ({}),
      sB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      sC: (x0,x1) => x0.attachShadow(x1),
      sD: x0 => x0.region,
      sE: x0 => x0.deltaMode,
      sF: (x0,x1,x2) => x0.slice(x1,x2),
      sG: x0 => x0.parentElement,
      sH: (x0,x1) => x0.querySelector(x1),
      sI: (x0,x1) => x0.getItem(x1),
      sJ: (x0,x1) => x0.key(x1),
      t: (o, p, v) => o[p] = v,
      tB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      tC: (x0,x1) => x0.createElement(x1),
      tD: x0 => x0.script,
      tE: x0 => x0.deltaY,
      tF: (x0,x1) => x0.decode(x1),
      tG: (x0,x1) => x0.querySelectorAll(x1),
      tH: (x0,x1) => { x0.title = x1 },
      tI: x0 => x0.localStorage,
      tJ: x0 => x0.length,
      u: () => [],
      uB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      uC: x0 => x0.scale,
      uD: x0 => x0.language,
      uE: x0 => x0.deltaX,
      uF: (x0,x1) => x0.adoptText(x1),
      uG: (d, digits) => d.toFixed(digits),
      uH: (x0,x1) => x0.vibrate(x1),
      uI: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      uJ: () => globalThis.removeSplashFromWeb(),
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.visualViewport,
      vD: x0 => x0.languages,
      vE: x0 => x0.wheelDeltaY,
      vF: x0 => x0.first(),
      vG: x0 => x0.maxHeight,
      vH: x0 => x0.content,
      vI: x0 => x0.history,
      vJ: x0 => x0.length,
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.devicePixelRatio,
      wD: (x0,x1) => x0.observe(x1),
      wE: x0 => x0.wheelDeltaX,
      wF: x0 => x0.next(),
      wG: x0 => x0.maxWidth,
      wH: x0 => x0.document,
      wI: x0 => x0.href,
      wJ: x0 => x0.getReader(),
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.height,
      xD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      xE: x0 => x0.key,
      xF: x0 => x0.current(),
      xG: x0 => x0.minHeight,
      xH: x0 => new WeakRef(x0),
      xI: x0 => x0.location,
      xJ: x0 => x0.value,
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.width,
      yD: x0 => new ResizeObserver(x0),
      yE: x0 => x0.identifier,
      yF: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      yG: x0 => x0.minWidth,
      yH: x0 => x0.deref(),
      yI: (x0,x1) => x0.removeItem(x1),
      yJ: x0 => x0.done,
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.screen,
      zD: (x0,x1) => x0.getPropertyValue(x1),
      zE: x0 => x0.touches,
      zF: x0 => x0.v8BreakIterator,
      zG: (x0,x1) => x0.removeProperty(x1),
      zH: () => globalThis.WeakRef,
      zI: (x0,x1,x2) => x0.setItem(x1,x2),
      zJ: x0 => x0.read(),

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
