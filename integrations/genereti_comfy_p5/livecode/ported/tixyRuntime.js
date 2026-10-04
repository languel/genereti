// Adapted from Underscores; Copyright (c) 2026 Underscores contributors.
// MIT terms: ../UNDERSCORES-LICENSE.
// Tixy-compatible expression runtime.  The original tixy.land surface is a
// deliberately tiny `(t, i, x, y) => value` program evaluated over a 16x16
// grid by default.  Keep the evaluator small and deterministic while exposing the same
// Underscores bridge used by the other Livecode runtimes.

export const TIXY_GRID_SIZE = 16;
export const TIXY_MIN_GRID_SIZE = 1;
export const TIXY_MAX_GRID_SIZE = 64;
export const TIXY_CELL_SIZE = 16;
export const TIXY_CELL_GAP = 1;
export const TIXY_DEFAULT_SOURCE = `// @param gridSize = 16 (1..64, step: 1)
// @param color1 = __.currentColor (color)
// @param color0 = __.colors.accent.css (color)
// @param backgroundColor = transparent (color)
sin(t + x / 4) * cos(t + y / 4)`;

const TIXY_MATH_NAMES = Object.freeze([
  "abs", "acos", "acosh", "asin", "asinh", "atan", "atan2", "atanh",
  "cbrt", "ceil", "clz32", "cos", "cosh", "exp", "expm1", "floor",
  "fround", "hypot", "imul", "log", "log1p", "log2", "log10", "max", "min", "pow",
  "random", "round", "sign", "sin", "sinh", "sqrt", "tan", "tanh", "trunc",
  "E", "LN10", "LN2", "LOG10E", "LOG2E", "PI", "SQRT1_2", "SQRT2",
]);

const hasArrowFunction = source => /^(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.test(source);
const hasFunctionExpression = source => /^function(?:\s+[\w$]+)?\s*\(/.test(source);

const normalizeTixySource = source => String(source ?? "").trim();

// Bind Math once at compilation, outside the cell loop. Lexical bindings also
// avoid repeated `with` scope lookups for every dot on every animation frame.
const makeBodyFunction = source => new Function("Math", `
  const { ${TIXY_MATH_NAMES.join(",")} } = Math;
  return function(t, i, x, y, __) { ${source} };
`)(Math); // eslint-disable-line no-new-func
const makeExpressionFunction = source => makeBodyFunction(`return (${source});`);

export const compileTixySource = source => {
  const normalized = normalizeTixySource(source);
  if (!normalized) throw new Error("Enter a Tixy expression before running this node.");
  let evaluator;
  if (hasArrowFunction(normalized) || hasFunctionExpression(normalized)) {
    const factory = new Function("Math", `const { ${TIXY_MATH_NAMES.join(",")} } = Math; return (${normalized});`); // eslint-disable-line no-new-func
    const candidate = factory(Math);
    if (typeof candidate !== "function") throw new Error("Tixy function source must evaluate to a function.");
    evaluator = (t, i, x, y, bridge) => candidate(t, i, x, y, bridge);
  } else if (/\b(?:return|const|let|var|if|for|while|;)/.test(normalized)) {
    const body = makeBodyFunction(normalized);
    evaluator = (t, i, x, y, bridge) => body(t, i, x, y, bridge);
  } else {
    const expression = makeExpressionFunction(normalized);
    evaluator = (t, i, x, y, bridge) => expression(t, i, x, y, bridge);
  }
  return Object.freeze({
    source: normalized,
    evaluate: evaluator,
  });
};

export const validateTixySource = source => {
  try {
    compileTixySource(source);
    return { valid: true, error: "" };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) };
  }
};

export const evaluateTixyValue = (compiled, context) => {
  try {
    const value = Number(compiled?.evaluate?.(context.time, context.index, context.x, context.y, context.bridge));
    return Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
  } catch {
    return 0;
  }
};

const normalizeGridDimension = (value, fallback = TIXY_GRID_SIZE) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(TIXY_MIN_GRID_SIZE, Math.min(TIXY_MAX_GRID_SIZE, Math.round(numeric)));
};

const parseGridSize = value => {
  if (Array.isArray(value)) {
    return {
      width: normalizeGridDimension(value[0], TIXY_GRID_SIZE),
      height: normalizeGridDimension(value[1] ?? value[0], TIXY_GRID_SIZE),
    };
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      width: normalizeGridDimension(value.width ?? value.x ?? value.size, TIXY_GRID_SIZE),
      height: normalizeGridDimension(value.height ?? value.y ?? value.size, TIXY_GRID_SIZE),
    };
  }
  const text = String(value ?? "").trim();
  const pair = /^(\d+)\s*[x×]\s*(\d+)$/i.exec(text);
  if (pair) return { width: normalizeGridDimension(pair[1]), height: normalizeGridDimension(pair[2]) };
  const dimension = normalizeGridDimension(value, TIXY_GRID_SIZE);
  return { width: dimension, height: dimension };
};

export const resolveTixyGrid = (parameters = {}) => {
  const shared = parseGridSize(parameters.gridSize ?? parameters.size ?? TIXY_GRID_SIZE);
  return Object.freeze({
    width: normalizeGridDimension(parameters.gridWidth ?? parameters.width, shared.width),
    height: normalizeGridDimension(parameters.gridHeight ?? parameters.height, shared.height),
  });
};

export const tixyGridExtent = (size = TIXY_GRID_SIZE) => (
  normalizeGridDimension(size) * (TIXY_CELL_SIZE + TIXY_CELL_GAP) - TIXY_CELL_GAP
);

export const tixyGridDimensions = (width = TIXY_GRID_SIZE, height = width) => Object.freeze({
  width: tixyGridExtent(width),
  height: tixyGridExtent(height),
});

export const tixyGridArea = (width = TIXY_GRID_SIZE, height = width) => (
  normalizeGridDimension(width) * normalizeGridDimension(height)
);
