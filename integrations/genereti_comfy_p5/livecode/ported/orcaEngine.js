// Adapted from Underscores; Copyright (c) 2026 Underscores contributors.
// MIT terms: ../UNDERSCORES-LICENSE.
// A small, browser-native adaptation of the Orca grid model.  It keeps the
// authored grid as text, while its frame mutations live in the runtime so a
// running program never generates a history entry on every tick.
//
// Original interaction and operator semantics: Orca by Hundredrabbits,
// Copyright (c) 2017 Hundredrabbits, MIT.  See ../THIRD-PARTY-NOTICES.md.

const BASE_36 = "0123456789abcdefghijklmnopqrstuvwxyz";
const NOTE_TABLE = Object.freeze({
  A: "A0", a: "a0", B: "B0", C: "C0", c: "c0", D: "D0", d: "d0", E: "E0", F: "F0", f: "f0", G: "G0", g: "g0",
  H: "A0", h: "a0", I: "B0", J: "C1", j: "c1", K: "D1", k: "d1", L: "E1", M: "F1", m: "f1", N: "G1", n: "g1",
  O: "A1", o: "a1", P: "B1", Q: "C2", q: "c2", R: "D2", r: "d2", S: "E2", T: "F2", t: "f2", U: "G2", u: "g2",
  V: "A2", v: "a2", W: "B2", X: "C3", x: "c3", Y: "D3", y: "d3", Z: "E3", e: "F0", l: "F1", s: "F2", z: "F3", b: "C1", i: "C1", p: "C2", w: "C3",
});
const PITCHES = ["C", "c", "D", "d", "E", "F", "f", "G", "g", "A", "a", "B"];

export const ORCA_GRID_WIDTH = 32;
export const ORCA_GRID_HEIGHT = 16;
export const ORCA_GRID_MIN_WIDTH = 4;
export const ORCA_GRID_MIN_HEIGHT = 2;
export const ORCA_GRID_MAX_SIZE = 128;

export const normalizeOrcaGridSize = ({ width, height } = {}) => ({
  width: Math.max(ORCA_GRID_MIN_WIDTH, Math.min(ORCA_GRID_MAX_SIZE, Math.round(Number(width) || ORCA_GRID_WIDTH))),
  height: Math.max(ORCA_GRID_MIN_HEIGHT, Math.min(ORCA_GRID_MAX_SIZE, Math.round(Number(height) || ORCA_GRID_HEIGHT))),
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const allowedGlyph = value => String(value || ".").slice(0, 1).replace(/[\r\n\t]/g, "") || ".";

export const createEmptyOrcaSource = ({ width = ORCA_GRID_WIDTH, height = ORCA_GRID_HEIGHT } = {}) => (
  Array.from({ length: height }, () => ".".repeat(width)).join("\n")
);

export const parseOrcaGrid = (source, { width = ORCA_GRID_WIDTH, height = ORCA_GRID_HEIGHT } = {}) => {
  const lines = String(source || "").replace(/\r/g, "").split("\n");
  const requestedWidth = Number(width);
  const requestedHeight = Number(height);
  const gridWidth = Number.isFinite(requestedWidth) && requestedWidth > 0
    ? Math.max(1, Math.min(ORCA_GRID_MAX_SIZE, Math.round(requestedWidth)))
    : Math.max(1, Math.min(ORCA_GRID_MAX_SIZE, ...lines.map(line => Array.from(line).length)));
  const gridHeight = Number.isFinite(requestedHeight) && requestedHeight > 0
    ? Math.max(1, Math.min(ORCA_GRID_MAX_SIZE, Math.round(requestedHeight)))
    : Math.max(1, Math.min(ORCA_GRID_MAX_SIZE, lines.length));
  const cells = Array.from({ length: gridHeight }, (_, y) => Array.from({ length: gridWidth }, (_, x) => allowedGlyph(Array.from(lines[y] || "")[x])));
  return { width: gridWidth, height: gridHeight, cells };
};

export const serializeOrcaGrid = grid => grid.cells.map(row => row.join("")).join("\n");

export const patchOrcaCell = (source, x, y, glyph, options) => {
  const grid = parseOrcaGrid(source, options);
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return serializeOrcaGrid(grid);
  grid.cells[y][x] = allowedGlyph(glyph);
  return serializeOrcaGrid(grid);
};

export const patchOrcaSelection = (source, selection, glyph, options) => {
  const grid = parseOrcaGrid(source, options);
  const minX = clamp(Math.min(selection?.x ?? 0, (selection?.x ?? 0) + (selection?.width ?? 0)), 0, grid.width - 1);
  const maxX = clamp(Math.max(selection?.x ?? 0, (selection?.x ?? 0) + (selection?.width ?? 0)), 0, grid.width - 1);
  const minY = clamp(Math.min(selection?.y ?? 0, (selection?.y ?? 0) + (selection?.height ?? 0)), 0, grid.height - 1);
  const maxY = clamp(Math.max(selection?.y ?? 0, (selection?.y ?? 0) + (selection?.height ?? 0)), 0, grid.height - 1);
  for (let row = minY; row <= maxY; row += 1) for (let column = minX; column <= maxX; column += 1) grid.cells[row][column] = allowedGlyph(glyph);
  return serializeOrcaGrid(grid);
};

export const normalizeOrcaSelection = (selection, grid) => {
  const x = clamp(Math.round(selection?.x || 0), 0, grid.width - 1);
  const y = clamp(Math.round(selection?.y || 0), 0, grid.height - 1);
  const width = clamp(Math.round(selection?.width || 0), -x, grid.width - 1 - x);
  const height = clamp(Math.round(selection?.height || 0), -y, grid.height - 1 - y);
  return {
    x,
    y,
    width: width === 0 ? 0 : width,
    height: height === 0 ? 0 : height,
  };
};

const valueOf = glyph => {
  const value = BASE_36.indexOf(String(glyph || ".").toLowerCase());
  return value < 0 ? 0 : value;
};

const keyOf = value => BASE_36[((Math.floor(value) % 36) + 36) % 36];

const randomBetween = (frame, x, y, min, max) => {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  const range = upper - lower + 1;
  let seed = Math.imul((Math.floor(frame) + 1) ^ 0x9e3779b9, 0x85ebca6b);
  seed ^= Math.imul(x + 1, 0xc2b2ae35);
  seed ^= Math.imul(y + 1, 0x27d4eb2f);
  seed ^= seed >>> 16;
  return lower + ((seed >>> 0) % range);
};

export const orcaNoteToMidi = (glyph, octave = 3) => {
  const entry = NOTE_TABLE[glyph];
  if (!entry) return null;
  const note = entry[0];
  const offset = Number(entry[1]) || 0;
  const pitch = PITCHES.indexOf(note);
  if (pitch < 0) return null;
  return clamp((clamp(Math.floor(octave) + offset, 0, 8) * 12) + pitch + 24, 0, 127);
};

const hasBangNeighbor = (read, x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => read(x + dx, y + dy) === "*");

// The first native pass covers the frame-safe arithmetic, timing, movement,
// and MIDI/CC/PB operators. Unsupported valid glyphs remain visible and are
// deliberately left untouched instead of being silently rewritten.
export const runOrcaFrame = (source, { frame = 0, width, height } = {}) => {
  const grid = parseOrcaGrid(source, { width, height });
  const next = grid.cells.map(row => row.slice());
  const locks = new Set();
  const events = [];
  const read = (x, y) => x < 0 || y < 0 || x >= grid.width || y >= grid.height ? "." : next[y][x];
  const write = (x, y, glyph) => {
    if (x < 0 || y < 0 || x >= grid.width || y >= grid.height || locks.has(`${x}:${y}`)) return;
    next[y][x] = allowedGlyph(glyph);
  };
  const output = (x, y, glyph, sensitive) => write(x, y, sensitive && /[A-Z]/.test(read(x + 1, y - 1)) ? String(glyph).toUpperCase() : glyph);
  const active = (glyph, x, y) => /[A-Z]/.test(glyph) || hasBangNeighbor(read, x, y);
  const east = (x, y, fallback = ".") => read(x + 1, y) === "." ? fallback : read(x + 1, y);

  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const glyph = read(x, y);
      const op = glyph.toLowerCase();
      if (glyph === "." || !active(glyph, x, y)) continue;
      if (op === "a" || op === "b" || op === "l" || op === "m") {
        const a = valueOf(read(x - 1, y));
        const b = valueOf(read(x + 1, y));
        const result = op === "a" ? a + b : op === "b" ? Math.abs(b - a) : op === "l" ? Math.min(a, b) : a * b;
        output(x, y + 1, keyOf(result), true);
      } else if (op === "c") {
        const rate = Math.max(1, valueOf(read(x - 1, y)));
        const modulo = valueOf(read(x + 1, y));
        output(x, y + 1, keyOf(modulo ? Math.floor(frame / rate) % modulo : 0), true);
      } else if (op === "d") {
        const rate = Math.max(1, valueOf(read(x - 1, y)));
        const modulo = Math.max(1, valueOf(read(x + 1, y)));
        write(x, y + 1, frame % (rate * modulo) === 0 ? "*" : ".");
        locks.add(`${x}:${y + 1}`);
      } else if (op === "i") {
        const step = valueOf(read(x - 1, y));
        const modulo = valueOf(read(x + 1, y));
        const current = valueOf(read(x, y + 1));
        output(x, y + 1, modulo ? keyOf((current + step) % modulo) : "0", true);
      } else if (op === "r") {
        const min = valueOf(read(x - 1, y));
        const max = valueOf(read(x + 1, y));
        output(x, y + 1, keyOf(randomBetween(frame, x, y, min, max)), true);
      } else if (["e", "n", "s", "w"].includes(op)) {
        const directions = { e: [1, 0], n: [0, -1], s: [0, 1], w: [-1, 0] };
        const [dx, dy] = directions[op];
        const targetX = x + dx;
        const targetY = y + dy;
        if (read(targetX, targetY) === ".") {
          write(x, y, ".");
          write(targetX, targetY, glyph);
          locks.add(`${targetX}:${targetY}`);
        } else write(x, y, "*");
      } else if (glyph === ":" || glyph === "%") {
        const channel = valueOf(read(x + 1, y));
        const octave = valueOf(read(x + 2, y));
        const noteGlyph = read(x + 3, y);
        const midi = orcaNoteToMidi(noteGlyph, octave);
        if (channel < 16 && midi !== null) events.push({
          type: "note",
          mono: glyph === "%",
          channel: channel + 1,
          note: midi,
          velocity: clamp(Math.ceil((127 * valueOf(east(x + 3, y, "f"))) / 35), 0, 127),
          durationFrames: Math.max(0, valueOf(read(x + 5, y) === "." ? "1" : read(x + 5, y))),
        });
      } else if (glyph === "!") {
        const channel = valueOf(read(x + 1, y));
        if (channel < 16) events.push({ type: "cc", channel: channel + 1, controller: 64 + valueOf(read(x + 2, y)), value: clamp(Math.ceil((127 * valueOf(read(x + 3, y))) / 35), 0, 127) });
      } else if (glyph === "?") {
        const channel = valueOf(read(x + 1, y));
        if (channel < 16) events.push({ type: "pitchbend", channel: channel + 1, lsb: clamp(Math.ceil((127 * valueOf(read(x + 2, y))) / 35), 0, 127), msb: clamp(Math.ceil((127 * valueOf(read(x + 3, y))) / 35), 0, 127) });
      }
    }
  }
  return { source: serializeOrcaGrid({ ...grid, cells: next }), frame: frame + 1, events, width: grid.width, height: grid.height };
};

export const ORCA_OPERATOR_REFERENCE = Object.freeze([
  ["A", "add"], ["B", "subtract"], ["C", "clock"], ["D", "delay"], ["E/N/S/W", "move"], ["I", "increment"], ["L", "lesser"], ["M", "multiply"], ["R", "random"],
  [":", "MIDI note"], ["%", "mono MIDI note"], ["!", "MIDI CC"], ["?", "pitch bend"], ["*", "bang"], ["#", "comment"],
]);
