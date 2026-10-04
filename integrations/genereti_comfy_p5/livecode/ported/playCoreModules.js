// Adapted from Underscores; Copyright (c) 2026 Underscores contributors.
// MIT terms: ../UNDERSCORES-LICENSE.
// Built-in, offline helpers compatible with the public utility modules from
// https://github.com/ertdfgcvb/play.core (Apache-2.0). They are deliberately
// plain values rather than network imports so a saved Underscores scene and the
// single-file build carry the same program dependencies everywhere.

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const mix = (first, second, amount) => first * (1 - amount) + second * amount;

const num = {
  map: (value, inA, inB, outA, outB) => outA + (outB - outA) * ((value - inA) / (inB - inA)),
  fract: value => value - Math.floor(value),
  clamp,
  sign: value => value > 0 ? 1 : value < 0 ? -1 : 0,
  mix,
  step: (edge, value) => value < edge ? 0 : 1,
  smoothstep: (edge0, edge1, value) => {
    const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return amount * amount * (3 - 2 * amount);
  },
  smootherstep: (edge0, edge1, value) => {
    const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
  },
  mod: (first, second) => first % second,
};
num.default = num;
Object.freeze(num);

const vec2 = Object.freeze({
  vec2: (x, y) => ({ x, y }),
  copy: (value, out = { x: 0, y: 0 }) => Object.assign(out, value),
  add: (a, b, out = { x: 0, y: 0 }) => Object.assign(out, { x: a.x + b.x, y: a.y + b.y }),
  sub: (a, b, out = { x: 0, y: 0 }) => Object.assign(out, { x: a.x - b.x, y: a.y - b.y }),
  mul: (a, b, out = { x: 0, y: 0 }) => Object.assign(out, { x: a.x * b.x, y: a.y * b.y }),
  div: (a, b, out = { x: 0, y: 0 }) => Object.assign(out, { x: a.x / b.x, y: a.y / b.y }),
  addN: (a, value, out = { x: 0, y: 0 }) => Object.assign(out, { x: a.x + value, y: a.y + value }),
  subN: (a, value, out = { x: 0, y: 0 }) => Object.assign(out, { x: a.x - value, y: a.y - value }),
  mulN: (a, value, out = { x: 0, y: 0 }) => Object.assign(out, { x: a.x * value, y: a.y * value }),
  divN: (a, value, out = { x: 0, y: 0 }) => Object.assign(out, { x: a.x / value, y: a.y / value }),
  dot: (a, b) => a.x * b.x + a.y * b.y,
  length: value => Math.hypot(value.x, value.y),
  lengthSq: value => value.x * value.x + value.y * value.y,
  dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  distSq: (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2,
  norm: (value, out = { x: 0, y: 0 }) => {
    const length = Math.hypot(value.x, value.y) || 1;
    return Object.assign(out, { x: value.x / length, y: value.y / length });
  },
  neg: (value, out = { x: 0, y: 0 }) => Object.assign(out, { x: -value.x, y: -value.y }),
  rot: (value, angle, out = { x: 0, y: 0 }) => {
    const sine = Math.sin(angle), cosine = Math.cos(angle);
    return Object.assign(out, { x: value.x * cosine - value.y * sine, y: value.x * sine + value.y * cosine });
  },
  mix: (a, b, amount, out = { x: 0, y: 0 }) => Object.assign(out, { x: mix(a.x, b.x, amount), y: mix(a.y, b.y, amount) }),
  abs: (value, out = { x: 0, y: 0 }) => Object.assign(out, { x: Math.abs(value.x), y: Math.abs(value.y) }),
  max: (a, b, out = { x: 0, y: 0 }) => Object.assign(out, { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y) }),
  min: (a, b, out = { x: 0, y: 0 }) => Object.assign(out, { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) }),
  fract: (value, out = { x: 0, y: 0 }) => Object.assign(out, { x: value.x - Math.floor(value.x), y: value.y - Math.floor(value.y) }),
  floor: (value, out = { x: 0, y: 0 }) => Object.assign(out, { x: Math.floor(value.x), y: Math.floor(value.y) }),
  ceil: (value, out = { x: 0, y: 0 }) => Object.assign(out, { x: Math.ceil(value.x), y: Math.ceil(value.y) }),
  round: (value, out = { x: 0, y: 0 }) => Object.assign(out, { x: Math.round(value.x), y: Math.round(value.y) }),
});

const vec3 = Object.freeze({
  vec3: (x, y, z) => ({ x, y, z }),
  copy: (value, out = { x: 0, y: 0, z: 0 }) => Object.assign(out, value),
  add: (a, b, out = { x: 0, y: 0, z: 0 }) => Object.assign(out, { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
  sub: (a, b, out = { x: 0, y: 0, z: 0 }) => Object.assign(out, { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),
  mul: (a, b, out = { x: 0, y: 0, z: 0 }) => Object.assign(out, { x: a.x * b.x, y: a.y * b.y, z: a.z * b.z }),
  div: (a, b, out = { x: 0, y: 0, z: 0 }) => Object.assign(out, { x: a.x / b.x, y: a.y / b.y, z: a.z / b.z }),
  addN: (a, value, out = { x: 0, y: 0, z: 0 }) => Object.assign(out, { x: a.x + value, y: a.y + value, z: a.z + value }),
  subN: (a, value, out = { x: 0, y: 0, z: 0 }) => Object.assign(out, { x: a.x - value, y: a.y - value, z: a.z - value }),
  mulN: (a, value, out = { x: 0, y: 0, z: 0 }) => Object.assign(out, { x: a.x * value, y: a.y * value, z: a.z * value }),
  divN: (a, value, out = { x: 0, y: 0, z: 0 }) => Object.assign(out, { x: a.x / value, y: a.y / value, z: a.z / value }),
  dot: (a, b) => a.x * b.x + a.y * b.y + a.z * b.z,
  cross: (a, b, out = { x: 0, y: 0, z: 0 }) => Object.assign(out, { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }),
  length: value => Math.hypot(value.x, value.y, value.z),
  lengthSq: value => value.x * value.x + value.y * value.y + value.z * value.z,
  dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z),
  distSq: (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2,
  norm: (value, out = { x: 0, y: 0, z: 0 }) => {
    const length = Math.hypot(value.x, value.y, value.z) || 1;
    return Object.assign(out, { x: value.x / length, y: value.y / length, z: value.z / length });
  },
  neg: (value, out = { x: 0, y: 0, z: 0 }) => Object.assign(out, { x: -value.x, y: -value.y, z: -value.z }),
});

const sort = (characters, fontFamily = "monospace", ascending = false) => {
  if (typeof document === "undefined") return String(characters);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return characters;
  const size = 30;
  canvas.width = canvas.height = size * 2;
  const ranked = [...characters].map((character, index) => {
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "white";
    context.font = `${size}px ${fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(character, size, size);
    const brightness = context.getImageData(0, 0, canvas.width, canvas.height).data
      .reduce((total, value, dataIndex) => total + (dataIndex % 4 === 0 ? value : 0), 0);
    return { character, index, brightness };
  });
  return ranked.sort((a, b) => ascending ? a.brightness - b.brightness : b.brightness - a.brightness)
    .map(entry => entry.character).join("");
};

const sdf = Object.freeze({
  sdCircle: (point, radius) => vec2.length(point) - radius,
  sdBox: (point, size) => {
    const distance = { x: Math.abs(point.x) - size.x, y: Math.abs(point.y) - size.y };
    const outside = { x: Math.max(distance.x, 0), y: Math.max(distance.y, 0) };
    return vec2.length(outside) + Math.min(Math.max(distance.x, distance.y), 0);
  },
  sdSegment: (point, a, b, thickness) => {
    const pa = vec2.sub(point, a), ba = vec2.sub(b, a);
    const amount = clamp(vec2.dot(pa, ba) / vec2.dot(ba, ba), 0, 1);
    return vec2.length(vec2.sub(pa, vec2.mulN(ba, amount))) - thickness;
  },
  opSmoothUnion: (first, second, amount) => {
    const h = clamp(.5 + .5 * (second - first) / amount, 0, 1);
    return mix(second, first, h) - amount * h * (1 - h);
  },
  opSmoothSubtraction: (first, second, amount) => {
    const h = clamp(.5 - .5 * (second + first) / amount, 0, 1);
    return mix(second, -first, h) + amount * h * (1 - h);
  },
  opSmoothIntersection: (first, second, amount) => {
    const h = clamp(.5 - .5 * (second - first) / amount, 0, 1);
    return mix(second, first, h) + amount * h * (1 - h);
  },
});

const string = Object.freeze({
  wrap: (value, width = 0) => {
    if (!width) return string.measure(value);
    const lines = String(value).split("\n").flatMap(line => {
      const words = line.split(" "); const wrapped = []; let current = "";
      words.forEach(word => {
        const next = current ? `${current} ${word}` : word;
        if (current && next.length > width) { wrapped.push(current); current = word; }
        else current = next;
      });
      return [...wrapped, current];
    });
    return { text: lines.join("\n"), numLines: lines.length, maxWidth: Math.max(0, ...lines.map(line => line.length)) };
  },
  measure: value => {
    const lines = String(value).split("\n");
    return { text: String(value), numLines: lines.length, maxWidth: Math.max(0, ...lines.map(line => line.length)) };
  },
});

const buffer = {
  get: (x, y, target, cols, rows) => x < 0 || x >= cols || y < 0 || y >= rows ? {} : target[x + y * cols],
  set: (value, x, y, target, cols, rows) => { if (x >= 0 && x < cols && y >= 0 && y < rows) target[x + y * cols] = value; },
  merge: (value, x, y, target, cols, rows) => { if (x >= 0 && x < cols && y >= 0 && y < rows) target[x + y * cols] = { ...(typeof target[x + y * cols] === "object" ? target[x + y * cols] : { char: target[x + y * cols] }), ...value }; },
};
buffer.setRect = (value, x, y, width, height, target, cols, rows) => {
  for (let row = y; row < y + height; row += 1) for (let column = x; column < x + width; column += 1) buffer.set(value, column, row, target, cols, rows);
};
buffer.mergeRect = (value, x, y, width, height, target, cols, rows) => {
  for (let row = y; row < y + height; row += 1) for (let column = x; column < x + width; column += 1) buffer.merge(value, column, row, target, cols, rows);
};
buffer.mergeText = (text, x, y, target, cols, rows) => String(typeof text === "object" ? text.text : text).split("\n").forEach((line, row) => [...line].forEach((char, column) => buffer.merge({ ...(typeof text === "object" ? text : {}), char }, x + column, y + row, target, cols, rows)));
Object.freeze(buffer);

const DRAWBOX_BORDERS = Object.freeze({
  double: { topLeft: "╔", topRight: "╗", bottomRight: "╝", bottomLeft: "╚", top: "═", bottom: "═", left: "║", right: "║" },
  single: { topLeft: "┌", topRight: "┐", bottomRight: "┘", bottomLeft: "└", top: "─", bottom: "─", left: "│", right: "│" },
  round: { topLeft: "╭", topRight: "╮", bottomRight: "╯", bottomLeft: "╰", top: "─", bottom: "─", left: "│", right: "│" },
  none: { topLeft: " ", topRight: " ", bottomRight: " ", bottomLeft: " ", top: " ", bottom: " ", left: " ", right: " " },
});

const drawBox = (text, style = {}, target, cols, rows) => {
  const settings = {
    x: 2, y: 1, width: 0, height: 0, paddingX: 2, paddingY: 1,
    backgroundColor: "white", color: "black", fontWeight: "normal", borderStyle: "round",
    ...style,
  };
  const measurement = string.measure(text);
  const width = settings.width || measurement.maxWidth + settings.paddingX * 2;
  const height = settings.height || measurement.numLines + settings.paddingY * 2;
  const x2 = settings.x + width - 1, y2 = settings.y + height - 1;
  const border = DRAWBOX_BORDERS[settings.borderStyle] || DRAWBOX_BORDERS.round;
  const paint = { char: " ", color: settings.color, backgroundColor: settings.backgroundColor, fontWeight: settings.fontWeight };
  buffer.setRect(paint, settings.x, settings.y, width, height, target, cols, rows);
  buffer.merge({ char: border.topLeft }, settings.x, settings.y, target, cols, rows);
  buffer.merge({ char: border.topRight }, x2, settings.y, target, cols, rows);
  buffer.merge({ char: border.bottomRight }, x2, y2, target, cols, rows);
  buffer.merge({ char: border.bottomLeft }, settings.x, y2, target, cols, rows);
  buffer.mergeRect({ char: border.top }, settings.x + 1, settings.y, width - 2, 1, target, cols, rows);
  buffer.mergeRect({ char: border.bottom }, settings.x + 1, y2, width - 2, 1, target, cols, rows);
  buffer.mergeRect({ char: border.left }, settings.x, settings.y + 1, 1, height - 2, target, cols, rows);
  buffer.mergeRect({ char: border.right }, x2, settings.y + 1, 1, height - 2, target, cols, rows);
  buffer.mergeText({ text, color: settings.color, backgroundColor: settings.backgroundColor, fontWeight: settings.fontWeight }, settings.x + settings.paddingX, settings.y + settings.paddingY, target, cols, rows);
};

const drawInfo = (context, cursor, target, style) => {
  const runtimeFps = Number(context?.runtime?.fps) || Number(context?.settings?.fps) || 0;
  const aspect = Number(context?.metrics?.aspect) || 0;
  const text = [
    `FPS         ${Math.round(runtimeFps)}`,
    `frame       ${context?.frame ?? 0}`,
    `time        ${Math.floor(context?.time ?? 0)}`,
    `size        ${context?.cols ?? 0}×${context?.rows ?? 0}`,
    `font aspect ${aspect.toFixed(2)}`,
    `cursor      ${Math.floor(cursor?.x ?? 0)},${Math.floor(cursor?.y ?? 0)}`,
  ].join("\n");
  drawBox(text, { width: 24, ...style }, target, context?.cols || 0, context?.rows || 0);
};

const drawbox = Object.freeze({ drawBox, drawInfo });

const color = Object.freeze({
  rgb: (r, g, b, a = 1) => ({ r, g, b, a }),
  hex: (r, g, b, a = 1) => `#${[r, g, b].map(value => Math.round(value).toString(16).padStart(2, "0")).join("")}${a < 1 ? Math.round(a * 255).toString(16).padStart(2, "0") : ""}`,
  css: (r, g, b, a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`,
  rgb2css: value => `rgba(${value.r}, ${value.g}, ${value.b}, ${value.a ?? 1})`,
  rgb2hex: value => color.hex(value.r, value.g, value.b, value.a ?? 1),
  rgb2gray: value => Math.round(value.r * .2126 + value.g * .7152 + value.b * .0722) / 255,
  int2rgb: value => ({ r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255, a: 1 }),
  colorFromHsv: (hue, saturation = 1, value = 1, alpha = 1) => {
    const chroma = value * saturation;
    const sector = ((hue % 360) + 360) % 360 / 60;
    const x = chroma * (1 - Math.abs(sector % 2 - 1));
    const [r, g, b] = sector < 1 ? [chroma, x, 0]
      : sector < 2 ? [x, chroma, 0]
        : sector < 3 ? [0, chroma, x]
          : sector < 4 ? [0, x, chroma]
            : sector < 5 ? [x, 0, chroma] : [chroma, 0, x];
    const offset = value - chroma;
    return `rgba(${Math.round((r + offset) * 255)}, ${Math.round((g + offset) * 255)}, ${Math.round((b + offset) * 255)}, ${alpha})`;
  },
});

export const PLAY_CORE_MODULES = Object.freeze({
  "/src/modules/num.js": num,
  "/src/modules/sort.js": Object.freeze({ sort }),
  "/src/modules/vec2.js": vec2,
  "/src/modules/vec3.js": vec3,
  "/src/modules/sdf.js": sdf,
  "/src/modules/string.js": string,
  "/src/modules/buffer.js": buffer,
  "/src/modules/drawbox.js": drawbox,
  "/src/modules/color.js": color,
});

export const PLAY_CORE_MODULE_SPECIFIERS = Object.freeze(Object.keys(PLAY_CORE_MODULES));

export const resolvePlayCoreModule = specifier => PLAY_CORE_MODULES[specifier] || null;
