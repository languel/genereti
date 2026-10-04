// Adapted from Underscores; Copyright (c) 2026 Underscores contributors.
// MIT terms: ../UNDERSCORES-LICENSE.
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
export const manimApiBindings = api => Object.entries(api || {})
  .filter(([name]) => IDENTIFIER.test(name) && name !== "default");

export const compileManimSource = (source, api = {}) => {
  const bindings = manimApiBindings(api);
  const names = bindings.map(([name]) => name);
  const values = bindings.map(([, value]) => value);
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const run = new AsyncFunction(
    ...names,
    "scene",
    "__",
    "cue",
    "MANIM",
    `"use strict";\n${String(source || "")}\n//# sourceURL=genereti-manim-livecode.js`,
  );
  return ({ scene, bridge, cue }) => run(...values, scene, bridge, cue, api);
};

export const createManimCueController = ({ mode = "auto", onCue } = {}) => {
  let progressionMode = mode === "cue" ? "cue" : "auto";
  let index = -1;
  let pending = null;
  let disposed = false;

  const release = value => {
    if (!pending) return false;
    const resolve = pending.resolve;
    pending = null;
    resolve(value);
    return true;
  };

  return {
    async cue(label = "", options = {}) {
      if (disposed) return { index, label: String(label || ""), disposed: true };
      index += 1;
      const detail = {
        index,
        id: String(options.id || label || `cue-${index}`),
        label: String(label || options.id || `Cue ${index + 1}`),
        options: options && typeof options === "object" ? { ...options } : {},
      };
      onCue?.(detail);
      if (progressionMode !== "cue" || options.auto === true) return detail;
      await new Promise(resolve => { pending = { resolve, detail }; });
      return detail;
    },
    next() {
      return release({ action: "next" });
    },
    setMode(value) {
      progressionMode = value === "cue" ? "cue" : "auto";
      if (progressionMode === "auto") release({ action: "auto" });
    },
    get mode() { return progressionMode; },
    get index() { return index; },
    get pendingCue() { return pending?.detail || null; },
    dispose() {
      disposed = true;
      release({ action: "dispose" });
    },
  };
};

