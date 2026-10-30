// Pure math for the modular-audio panels: no DOM, so it can be tested and reused.
export const clamp = (n, a, b) => Math.max(a, Math.min(b, Number.isFinite(Number(n)) ? Number(n) : a));

/** Map a value to 0..1 on a linear or logarithmic (positive range) or power scale. */
export function toNorm(value, min, max, curve = 'lin') {
  const v = clamp(value, min, max);
  if (curve === 'log' && min > 0) return Math.log(v / min) / Math.log(max / min);
  if (curve === 'pow') return Math.sqrt((v - min) / (max - min));
  return (v - min) / (max - min);
}
export function fromNorm(norm, min, max, curve = 'lin') {
  const n = clamp(norm, 0, 1);
  if (curve === 'log' && min > 0) return min * (max / min) ** n;
  if (curve === 'pow') return min + n * n * (max - min);
  return min + n * (max - min);
}
/** Round to the step of a widget (and to a sensible display precision). */
export const snap = (value, step = 0) => step > 0 ? Math.round(value / step) * step : value;
export function formatValue(value, unit = '') {
  const v = Number(value);
  if (unit === 'hz') return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 1 : 2)}k` : `${Math.round(v)}`;
  if (unit === 's') return v >= 1 ? `${v.toFixed(2)}s` : `${Math.round(v * 1000)}ms`;
  if (unit === 'pan') return Math.abs(v) < .005 ? 'C' : `${v < 0 ? 'L' : 'R'}${Math.round(Math.abs(v) * 100)}`;
  if (unit === 'db') return v <= 0.0005 ? '−∞' : `${(20 * Math.log10(v)).toFixed(1)}`;
  return Math.abs(v) >= 100 ? String(Math.round(v)) : String(Number(v.toFixed(2)));
}

/** Gain (linear) <-> fader position (0..1): a power curve so the useful range gets travel; unity sits ~75% at max 2. */
export const gainToFader = (g, max = 2) => Math.pow(clamp(g, 0, max) / max, 1 / 2.4);
export const faderToGain = (p, max = 2) => max * Math.pow(clamp(p, 0, 1), 2.4);

// ---- ADSR geometry ----
// Time axis is not linear: each stage gets a fixed share of the width and its time maps on a log scale,
// so 1 ms and 5 s are both easy to draw. Handles: attack peak, decay/sustain corner, release end.
export const ENV_LIMITS = Object.freeze({attack: [0.001, 5], decay: [0.001, 5], release: [0.005, 5]});
const SHARE = {attack: .28, decay: .28, hold: .14, release: .3};
const time = (name, v) => toNorm(v, ...ENV_LIMITS[name], 'log');
const untime = (name, n) => fromNorm(n, ...ENV_LIMITS[name], 'log');

export function envelopePoints({attack, decay, sustain, release}, w, h, pad = 4) {
  const iw = w - pad * 2, ih = h - pad * 2, y = v => pad + (1 - clamp(v, 0, 1)) * ih;
  const x0 = pad, x1 = x0 + time('attack', attack) * SHARE.attack * iw;
  const x2 = x1 + time('decay', decay) * SHARE.decay * iw, x3 = x2 + SHARE.hold * iw;
  const x4 = x3 + time('release', release) * SHARE.release * iw;
  return {start: {x: x0, y: y(0)}, peak: {x: x1, y: y(1)}, sustain: {x: x2, y: y(sustain)}, hold: {x: x3, y: y(sustain)}, end: {x: x4, y: y(0)}};
}
/** New ADSR values when a handle is dragged to (px, py) inside a w×h box. */
export function envelopeDrag(handle, px, py, env, w, h, pad = 4) {
  const iw = w - pad * 2, ih = h - pad * 2, level = clamp(1 - (py - pad) / ih, 0, 1);
  const p = envelopePoints(env, w, h, pad), next = {...env};
  if (handle === 'peak') next.attack = untime('attack', (px - p.start.x) / (SHARE.attack * iw));
  else if (handle === 'sustain') { next.decay = untime('decay', (px - p.peak.x) / (SHARE.decay * iw)); next.sustain = level; }
  else if (handle === 'end') next.release = untime('release', (px - p.hold.x) / (SHARE.release * iw));
  for (const k of ['attack', 'decay', 'release']) next[k] = clamp(next[k], ...ENV_LIMITS[k]);
  next.sustain = clamp(next.sustain, 0, 1);
  return next;
}
export function nearestHandle(points, px, py, radius = 12) {
  let best = null, d = radius * radius;
  for (const name of ['peak', 'sustain', 'end']) { const p = points[name], dd = (p.x - px) ** 2 + (p.y - py) ** 2; if (dd <= d) { d = dd; best = name; } }
  return best;
}

// ---- Biquad response (RBJ cookbook), the same family Web Audio's BiquadFilterNode uses ----
export function biquadMagnitude(type, f0, q, freq, sampleRate = 48000) {
  const w0 = 2 * Math.PI * clamp(f0, 1, sampleRate / 2 - 1) / sampleRate, cos = Math.cos(w0), alpha = Math.sin(w0) / (2 * Math.max(.0001, q));
  let b0, b1, b2;
  if (type === 'highpass') { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = b0; }
  else if (type === 'bandpass') { b0 = alpha; b1 = 0; b2 = -alpha; }
  else if (type === 'notch') { b0 = 1; b1 = -2 * cos; b2 = 1; }
  else { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = b0; }                 // lowpass
  const a0 = 1 + alpha, a1 = -2 * cos, a2 = 1 - alpha;
  const w = 2 * Math.PI * freq / sampleRate, c1 = Math.cos(w), s1 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
  const nr = b0 + b1 * c1 + b2 * c2, ni = -(b1 * s1 + b2 * s2), dr = a0 + a1 * c1 + a2 * c2, di = -(a1 * s1 + a2 * s2);
  return Math.sqrt((nr * nr + ni * ni) / (dr * dr + di * di));
}
/** dB curve over a log frequency axis: [{x:0..1, db}] with `count` points from 20 Hz to 20 kHz. */
export function filterCurve(type, cutoff, q, count = 96, sampleRate = 48000) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const x = i / (count - 1), f = 20 * 1000 ** x, mag = biquadMagnitude(type, cutoff, q, f, sampleRate);
    out.push({x, db: 20 * Math.log10(Math.max(1e-6, mag))});
  }
  return out;
}
export const DB_RANGE = Object.freeze([-36, 18]);
export const dbToY = (db, h, pad = 4) => pad + (1 - (clamp(db, ...DB_RANGE) - DB_RANGE[0]) / (DB_RANGE[1] - DB_RANGE[0])) * (h - pad * 2);

// ---- Step patterns ----
// Drum rows: "kick:1002;snare~:0001" - digits are 0 off, 1 hit, 2 accent, 3 ghost; a trailing ~ on the name mutes the row.
export const DRUM_ROWS = Object.freeze({
  kick: 36, rim: 37, snare: 38, clap: 39, tomlo: 41, hat: 42, tomhi: 45, openhat: 46, ride: 51, cowbell: 56,
});
export const DRUM_LEVEL = Object.freeze({1: 1, 2: 1.35, 3: .4});
export function parseDrumPattern(text) {
  const rows = String(text).split(';').map(r => r.trim()).filter(Boolean).map(r => r.split(':'));
  if (!rows.length || rows.length > 16) throw Error('Use 1..16 drum rows');
  return rows.map(([rawName, bits]) => {
    const muted = rawName.endsWith('~'), name = rawName.replace(/~$/, '');
    if (!DRUM_ROWS[name] || !bits) throw Error(`Row "${rawName}": invalid drum pattern`);
    const tokens=bits.includes(',')||bits.startsWith('v')?bits.split(','):[...bits];
    if(!tokens.length||tokens.length>1024||tokens.some(x=>!(/^[0-3]$/.test(x)||/^v(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(x))))throw Error(`Row "${rawName}": use 0 1 2 3 or v0..1`);
    return {name, note: DRUM_ROWS[name], steps: tokens.map(x=>x[0]==='v'?Number(x.slice(1)):Number(x)), muted};
  });
}
export const formatDrumPattern = rows => rows.map(r => `${r.name}${r.muted ? '~' : ''}:${r.steps.every(x=>Number.isInteger(x)&&x>=0&&x<=3)?r.steps.join(''):r.steps.map(x=>Number.isInteger(x)?String(x):'v'+Number(x.toFixed(2))).join(',')}`).join(';');
/** Resize every row to `length`, repeating the existing pattern when it grows. */
export function resizeRows(rows, length) {
  const n = clamp(Math.round(length), 1, 1024);
  return rows.map(r => ({...r, steps: Array.from({length: n}, (_, i) => r.steps.length ? r.steps[i % r.steps.length] : 0)}));
}
export const nextStepValue = v => ({0: 1, 1: 2, 2: 3, 3: 0}[v] ?? 0);

// Optional per-step velocity uses pitch@velocity; legacy pitch-only strings remain valid.
export function parseNoteSteps(text) {
  const tokens = String(text).replaceAll(',', ' ').trim().split(/\s+/).filter(Boolean);
  if (!tokens.length || tokens.length > 1024) throw Error('Use 1..1024 notes or rests');
  return tokens.map(token => {
    if (token === '-' || token === '.') return {pitch:-1, velocity:1};
    const match = /^(\d+(?:\.\d+)?)(?:@(0(?:\.\d+)?|1(?:\.0+)?))?$/.exec(token);
    if (!match || Number(match[1]) > 127) throw Error('Use MIDI pitches 0..127, optionally @velocity 0..1, or -');
    return {pitch:Number(match[1]), velocity:match[2] === undefined ? 1 : Number(match[2])};
  });
}
export const parseNotePattern = text => parseNoteSteps(text).map(step => step.pitch);
export const formatNoteSteps = steps => steps.map(s => s.pitch < 0 ? '-' : `${s.pitch}${s.velocity == null || s.velocity === 1 ? '' : '@' + Number(s.velocity.toFixed(2))}`).join(' ');
export const formatNotePattern = steps => steps.map(n => n < 0 ? '-' : n).join(' ');
const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const noteName = n => `${NAMES[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}`;
export const isBlackKey = n => [1, 3, 6, 8, 10].includes(((n % 12) + 12) % 12);
/** Visible pitch window for a pattern: at least two octaves, padded around the used notes, snapped to C. */
export function pitchWindow(steps, minSpan = 24) {
  const used = steps.filter(n => n >= 0);
  if (!used.length) return {low: 48, high: 48 + minSpan - 1};
  let low = Math.floor((Math.min(...used) - 2) / 12) * 12, high = Math.max(...used) + 2;
  if (high - low + 1 < minSpan) high = low + minSpan - 1;
  return {low: clamp(low, 0, 127 - 11), high: clamp(high, 11, 127)};
}
/** Snap a pitch to a scale (degrees 0..11 relative to root); picks the nearest, ties go down. */
export function snapToScale(note, root = 0, degrees = [0, 2, 3, 5, 7, 8, 10]) {
  const rel = ((note - root) % 12 + 12) % 12, base = note - rel;
  let best = degrees[0], dist = 99;
  for (const d of [...degrees, degrees[0] + 12, degrees[degrees.length - 1] - 12]) { const dd = Math.abs(d - rel); if (dd < dist || (dd === dist && d < best)) { best = d; dist = dd; } }
  return clamp(base + best, 0, 127);
}

/** Parse an explicit physical unit, converting to the control's stored unit. */
export function parseUnitValue(text, unit = '', bpm = 120) {
  if(unit==='division'){const note=String(text).trim().match(/^1\/(\d+)(t)?$/i);if(note)return Number(note[1])/4*(note[2]?1.5:1);}
  const match=String(text).trim().toLowerCase().match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*([a-z%]*)$/);
  if(!match)return NaN;
  const value=Number(match[1]),suffix=match[2];
  if(!suffix)return value;
  if(suffix===unit&&unit!=='db')return value;
  if(unit==='db'&&suffix==='db')return 10**(value/20);
  if(suffix==='%'&&!unit)return value/100;
  const seconds={ms:.001,s:1,sec:1,secs:1,min:60,minutes:60};
  const rates={hz:1,cps:1,khz:1000,bpm:1/60};
  let period;
  if(suffix in seconds)period=value*seconds[suffix];
  else if(suffix in rates)period=1/(value*rates[suffix]);
  else if(['beat','beats'].includes(suffix))period=value*60/bpm;
  else return NaN;
  if(unit==='s')return period;
  if(unit==='hz')return 1/period;
  if(unit==='bpm')return 60/period;
  if(unit==='division')return 60/(bpm*period);
  return NaN;
}
