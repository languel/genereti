// Adapted from Underscores. See UNDERSCORES-LICENSE and README.md.
export const TIME_VALUE_VERSION = 1;
export const TIME_PPQ = 480;

export const DEFAULT_TIME_CONTEXT = Object.freeze({
  tempo: 120,
  signature: Object.freeze({ numerator: 4, denominator: 4 }),
  fps: 30,
  sampleRate: 48000,
});

const NOTE_TICKS = Object.freeze({
  "1nd": 2880, "1n": 1920, "1nt": 1280,
  "2nd": 1440, "2n": 960, "2nt": 640,
  "4nd": 720, "4n": 480, "4nt": 320,
  "8nd": 360, "8n": 240, "8nt": 160,
  "16nd": 180, "16n": 120, "16nt": 80,
  "32nd": 90, "32n": 60, "32nt": 40,
  "64nd": 45, "64n": 30,
  "128n": 15,
});

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, minimum, maximum, fallback) => Math.min(maximum, Math.max(minimum, finite(value, fallback)));
const trimNumber = value => {
  const rounded = Math.abs(value) < 1e-12 ? 0 : Number(value.toFixed(9));
  return String(rounded);
};

export const normalizeTimeContext = context => {
  const source = context && typeof context === "object" ? context : {};
  const signature = source.signature && typeof source.signature === "object" ? source.signature : {};
  const denominator = [1, 2, 4, 8, 16, 32].includes(Number(signature.denominator))
    ? Number(signature.denominator)
    : DEFAULT_TIME_CONTEXT.signature.denominator;
  return {
    tempo: clamp(source.tempo, 1, 1000, DEFAULT_TIME_CONTEXT.tempo),
    signature: {
      numerator: Math.round(clamp(signature.numerator, 1, 64, DEFAULT_TIME_CONTEXT.signature.numerator)),
      denominator,
    },
    fps: clamp(source.fps, 1, 240, DEFAULT_TIME_CONTEXT.fps),
    sampleRate: clamp(source.sampleRate, 1, 768000, DEFAULT_TIME_CONTEXT.sampleRate),
  };
};

const timingUnits = context => {
  const normalized = normalizeTimeContext(context);
  const quarter = 60 / normalized.tempo;
  const beat = quarter * 4 / normalized.signature.denominator;
  return {
    ...normalized,
    quarter,
    beat,
    bar: beat * normalized.signature.numerator,
    tick: quarter / TIME_PPQ,
  };
};

const descriptor = (kind, seconds, dependencies = [], fields = {}) => ({
  kind,
  seconds,
  dependencies,
  ...fields,
});

const parseClock = (expression, context) => {
  const parts = expression.split(":");
  if (parts.length < 2 || parts.length > 4 || parts.some(part => !/^\d+(?:\.\d+)?$/.test(part))) return null;
  const values = parts.map(Number);
  if (parts.length === 4) {
    const [hours, minutes, seconds, frames] = values;
    if (minutes >= 60 || seconds >= 60 || frames >= context.fps) return null;
    return descriptor("smpte", hours * 3600 + minutes * 60 + seconds + frames / context.fps, ["fps"], { values, componentCount: 4 });
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = values;
    if (minutes >= 60 || seconds >= 60) return null;
    return descriptor("clock", hours * 3600 + minutes * 60 + seconds, [], { values, componentCount: 3 });
  }
  const [minutes, seconds] = values;
  if (seconds >= 60) return null;
  return descriptor("clock", minutes * 60 + seconds, [], { values, componentCount: 2 });
};

const parseExpressionDescriptorUncached = (rawExpression, contextValue) => {
  const expression = String(rawExpression ?? "").trim().replace(/\s+/g, " ");
  let lower = expression.toLowerCase();
  if(lower==="bar"||lower==="beat")lower="1 "+lower;
  const context = timingUnits(contextValue);
  if (!expression) return { ok: false, error: "Enter a time value." };

  let match = lower.match(/^([+-]?\d+(?:\.\d+)?)$/);
  if (match) return { ok: true, descriptor: descriptor("seconds", Number(match[1]), [], { amount: Number(match[1]), unit: "s" }) };

  match = lower.match(/^([+-]?\d+(?:\.\d+)?)\s*(s|sec|secs|second|seconds)$/);
  if (match) return { ok: true, descriptor: descriptor("seconds", Number(match[1]), [], { amount: Number(match[1]), unit: "s" }) };

  match = lower.match(/^([+-]?\d+(?:\.\d+)?)\s*(ms|msec|msecs|millisecond|milliseconds)$/);
  if (match) return { ok: true, descriptor: descriptor("milliseconds", Number(match[1]) / 1000, [], { amount: Number(match[1]), unit: "ms" }) };

  match = lower.match(/^([+-]?\d+(?:\.\d+)?)\s*(f|frame|frames)$/);
  if (match) return { ok: true, descriptor: descriptor("frames", Number(match[1]) / context.fps, ["fps"], { amount: Number(match[1]), unit: "f" }) };

  match = lower.match(/^([+-]?\d+(?:\.\d+)?)\s*(sample|samples)$/);
  if (match) return { ok: true, descriptor: descriptor("samples", Number(match[1]) / context.sampleRate, ["sampleRate"], { amount: Number(match[1]), unit: "samples" }) };

  match = lower.match(/^([+-]?\d+(?:\.\d+)?)\s*(hz|hertz)$/);
  if (match && Number(match[1]) !== 0) return { ok: true, descriptor: descriptor("frequency", 1 / Number(match[1]), [], { amount: Number(match[1]), unit: "hz" }) };

  match = lower.match(/^([+-]?\d+(?:\.\d+)?)\s*(bar|bars)$/);
  if (match) return { ok: true, descriptor: descriptor("bars", Number(match[1]) * context.bar, ["tempo", "signature"], { amount: Number(match[1]), unit: "bars" }) };

  match = lower.match(/^([+-]?\d+(?:\.\d+)?)\s*(beat|beats)$/);
  if (match) return { ok: true, descriptor: descriptor("beats", Number(match[1]) * context.beat, ["tempo", "signature"], { amount: Number(match[1]), unit: "beats" }) };

  match = lower.match(/^(?:(\d+(?:\.\d+)?)\s+)?(1nd|1n|1nt|2nd|2n|2nt|4nd|4n|4nt|8nd|8n|8nt|16nd|16n|16nt|32nd|32n|32nt|64nd|64n|128n)$/);
  if (match) {
    const coefficient = match[1] == null ? 1 : Number(match[1]);
    const token = match[2];
    return { ok: true, descriptor: descriptor("note", coefficient * NOTE_TICKS[token] * context.tick, ["tempo"], { amount: coefficient, token }) };
  }

  match = lower.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (match) {
    const values = match.slice(1).map(Number);
    const seconds = values[0] * context.bar + values[1] * context.beat + values[2] * context.tick;
    return { ok: true, descriptor: descriptor("bbu", seconds, ["tempo", "signature"], { values, list: false }) };
  }

  match = lower.match(/^(\d+)\s+(\d+)\s+(\d+)\s+bbu$/);
  if (match) {
    const values = match.slice(1).map(Number);
    const seconds = values[0] * context.bar + values[1] * context.beat + values[2] * context.tick;
    return { ok: true, descriptor: descriptor("bbu", seconds, ["tempo", "signature"], { values, list: true }) };
  }

  match = lower.match(/^(\d+)\s+(\d+)\s+(\d+)(?:\s+(\d+))?\s+hh:mm:ss$/);
  if (match) {
    const values = match.slice(1, 5).map(value => Number(value || 0));
    if (values[1] >= 60 || values[2] >= 60 || values[3] >= 1000) return { ok: false, error: "Clock minutes, seconds, or milliseconds are out of range." };
    return { ok: true, descriptor: descriptor("clockList", values[0] * 3600 + values[1] * 60 + values[2] + values[3] / 1000, [], { values }) };
  }

  if (lower.includes(":")) {
    const clock = parseClock(lower, context);
    if (clock) return { ok: true, descriptor: clock };
  }

  match = lower.match(/^([+-]?\d+(?:\.\d+)?)\s*ticks?$/);
  if (match) return { ok: true, descriptor: descriptor("ticks", Number(match[1]) * context.tick, ["tempo"], { amount: Number(match[1]), unit: "ticks" }) };
  return { ok: false, error: `Unrecognized time expression: ${expression}` };
};

const parsedExpressionCache = new Map();
const parseExpressionDescriptor = (rawExpression, contextValue) => {
  const context = normalizeTimeContext(contextValue);
  const expression = String(rawExpression ?? "").trim().replace(/\s+/g, " ");
  const key = `${expression.toLowerCase()}|${context.tempo}|${context.signature.numerator}/${context.signature.denominator}|${context.fps}|${context.sampleRate}`;
  if (parsedExpressionCache.has(key)) return parsedExpressionCache.get(key);
  const parsed = parseExpressionDescriptorUncached(expression, context);
  if (parsedExpressionCache.size >= 2048) parsedExpressionCache.delete(parsedExpressionCache.keys().next().value);
  parsedExpressionCache.set(key, parsed);
  return parsed;
};

export const createTimeValue = (input = 0, fallbackSeconds, context) => {
  if (input && typeof input === "object" && input.version === TIME_VALUE_VERSION && typeof input.expression === "string") {
    const parsed = parseExpressionDescriptor(input.expression, context);
    const fallback = Number.isFinite(Number(input.fallbackSeconds))
      ? Number(input.fallbackSeconds)
      : parsed.ok ? parsed.descriptor.seconds : finite(fallbackSeconds);
    return { version: TIME_VALUE_VERSION, expression: input.expression.trim(), fallbackSeconds: fallback };
  }
  const expression = typeof input === "number" ? `${trimNumber(input)} s` : String(input ?? "0").trim();
  const parsed = parseExpressionDescriptor(expression, context);
  const fallback = Number.isFinite(Number(fallbackSeconds))
    ? Number(fallbackSeconds)
    : parsed.ok ? parsed.descriptor.seconds : 0;
  return { version: TIME_VALUE_VERSION, expression, fallbackSeconds: fallback };
};

export const parseTimeValue = (input, context) => {
  const value = createTimeValue(input, undefined, context);
  const parsed = parseExpressionDescriptor(value.expression, context);
  return parsed.ok
    ? { ok: true, value: { ...value, fallbackSeconds: parsed.descriptor.seconds }, descriptor: parsed.descriptor }
    : { ok: false, value, error: parsed.error };
};

export const validateTimeValue = (input, context) => parseTimeValue(input, context).ok;

export const resolveTimeValue = (input, context) => {
  const parsed = parseTimeValue(input, context);
  return parsed.ok ? parsed.descriptor.seconds : finite(parsed.value?.fallbackSeconds);
};

export const timeValueDependencies = (input, context) => {
  const parsed = parseTimeValue(input, context);
  return parsed.ok ? [...parsed.descriptor.dependencies] : [];
};

export const formatTimeValue = input => createTimeValue(input).expression;

// Keep authored precision intact while presenting machine-generated floating
// point values at a readable precision when an editor is not active.
export const formatTimeValueForDisplay = input => String(input ?? "").replace(
  /(?<![\d.])-?\d+\.\d{4,}(?![\d.eE])/g,
  token => trimNumber(Number(Number(token).toFixed(3))),
);

// Preserve the resolved duration while moving between the compact time
// notations used throughout the transport and score inspectors.
export const cycleTimeValueUnit = (input, contextValue) => {
  const parsed = parseTimeValue(input, contextValue);
  const seconds = Math.max(0, parsed.ok ? parsed.descriptor.seconds : resolveTimeValue(input, contextValue));
  const context = timingUnits(contextValue);
  const current = ["bbu", "bars", "beats", "note"].includes(parsed.descriptor?.kind)
    ? "beats"
    : ["smpte", "clock", "clockList"].includes(parsed.descriptor?.kind)
      ? "timecode"
      : parsed.descriptor?.kind === "frames"
        ? "frames"
        : "seconds";
  const cycle = ["seconds", "beats", "timecode", "frames"];
  const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
  if (next === "seconds") return createTimeValue(`${trimNumber(seconds)} s`, undefined, context);
  if (next === "frames") return createTimeValue(`${Math.round(seconds * context.fps)} f`, undefined, context);
  if (next === "timecode") {
    const totalFrames = Math.max(0, Math.round(seconds * context.fps));
    const frames = totalFrames % Math.round(context.fps);
    const wholeSeconds = Math.floor(totalFrames / context.fps);
    const hours = Math.floor(wholeSeconds / 3600);
    const minutes = Math.floor((wholeSeconds - hours * 3600) / 60);
    const secs = wholeSeconds - hours * 3600 - minutes * 60;
    return createTimeValue(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(frames).padStart(2, "0")}`, undefined, context);
  }
  let remainder = seconds;
  const bars = Math.floor(remainder / context.bar + 1e-9);
  remainder -= bars * context.bar;
  const beats = Math.floor(remainder / context.beat + 1e-9);
  remainder -= beats * context.beat;
  const ticks = Math.round(remainder / context.tick);
  return createTimeValue(`${bars}.${beats}.${ticks}`, undefined, context);
};

const formatClock = (seconds, componentCount) => {
  const total = Math.max(0, seconds);
  if (componentCount === 2) {
    const minutes = Math.floor(total / 60);
    const remainder = total - minutes * 60;
    return `${minutes}:${remainder.toFixed(Number.isInteger(remainder) ? 0 : 3).padStart(2, "0")}`;
  }
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total - hours * 3600) / 60);
  const remainder = total - hours * 3600 - minutes * 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${remainder.toFixed(Number.isInteger(remainder) ? 0 : 3).padStart(2, "0")}`;
};

const expressionForSeconds = (parsed, seconds, contextValue) => {
  const data = parsed.descriptor;
  const context = timingUnits(contextValue);
  if (data.kind === "milliseconds") return `${trimNumber(seconds * 1000)} ms`;
  if (data.kind === "frames") return `${Math.round(seconds * context.fps)} f`;
  if (data.kind === "samples") return `${Math.round(seconds * context.sampleRate)} samples`;
  if (data.kind === "frequency") return `${trimNumber(seconds === 0 ? 0 : 1 / seconds)} hz`;
  if (data.kind === "bars") return `${trimNumber(seconds / context.bar)} bars`;
  if (data.kind === "beats") return `${trimNumber(seconds / context.beat)} beats`;
  if (data.kind === "note") return `${trimNumber(seconds / (NOTE_TICKS[data.token] * context.tick))} ${data.token}`.replace(/^1 /, "");
  if (data.kind === "bbu") {
    let remainder = Math.max(0, seconds);
    const bars = Math.floor(remainder / context.bar + 1e-9);
    remainder -= bars * context.bar;
    const beats = Math.floor(remainder / context.beat + 1e-9);
    remainder -= beats * context.beat;
    const ticks = Math.round(remainder / context.tick);
    return data.list ? `${bars} ${beats} ${ticks} bbu` : `${bars}.${beats}.${ticks}`;
  }
  if (data.kind === "clock" || data.kind === "clockList") {
    if (data.kind === "clockList") {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds - hours * 3600) / 60);
      const secs = Math.floor(seconds - hours * 3600 - minutes * 60);
      const millis = Math.round((seconds - Math.floor(seconds)) * 1000);
      return `${hours} ${minutes} ${secs} ${millis} hh:mm:ss`;
    }
    return formatClock(seconds, data.componentCount);
  }
  if (data.kind === "smpte") {
    const totalFrames = Math.max(0, Math.round(seconds * context.fps));
    const frames = totalFrames % Math.round(context.fps);
    const wholeSeconds = Math.floor(totalFrames / context.fps);
    const hours = Math.floor(wholeSeconds / 3600);
    const minutes = Math.floor((wholeSeconds - hours * 3600) / 60);
    const secs = wholeSeconds - hours * 3600 - minutes * 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
  }
  return `${trimNumber(seconds)} s`;
};

export const adjustTimeValue = (input, delta = 1, options = {}) => {
  const context = options.context;
  const parsed = parseTimeValue(input, context);
  if (!parsed.ok) return parsed.value;
  const fine = options.fine === true;
  const direction = finite(delta);
  const data = parsed.descriptor;
  const units = timingUnits(context);
  let stepSeconds = 1;
  if (data.kind === "milliseconds") stepSeconds = (fine ? 0.1 : 1) / 1000;
  else if (data.kind === "frames") stepSeconds = 1 / units.fps;
  else if (data.kind === "samples") stepSeconds = 1 / units.sampleRate;
  else if (data.kind === "frequency") {
    const nextHz = Math.max(0.000001, data.amount + direction * (fine ? 0.1 : 1));
    return createTimeValue(`${trimNumber(nextHz)} hz`, undefined, context);
  } else if (data.kind === "bars" || data.kind === "bbu") stepSeconds = fine ? units.beat : units.bar;
  else if (data.kind === "beats") stepSeconds = fine ? units.tick : units.beat;
  else if (data.kind === "note") {
    const coefficient = Math.max(0, data.amount + direction * (fine ? 0.5 : 1));
    return createTimeValue(`${trimNumber(coefficient)} ${data.token}`.replace(/^1 /, ""), undefined, context);
  } else if (data.kind === "clock" || data.kind === "clockList") {
    const count = data.kind === "clock" ? data.componentCount : 4;
    stepSeconds = count >= 3 ? (fine ? 60 : 3600) : (fine ? 1 : 60);
  } else if (data.kind === "smpte") stepSeconds = fine ? 1 / units.fps : 1;
  else if (data.kind === "seconds") stepSeconds = fine ? 0.001 : 1;
  const signedKinds = new Set(["seconds", "milliseconds", "frames", "samples", "bars", "beats"]);
  const seconds = signedKinds.has(data.kind)
    ? data.seconds + direction * stepSeconds
    : Math.max(0, data.seconds + direction * stepSeconds);
  return createTimeValue(expressionForSeconds(parsed, seconds, context), seconds, context);
};

export const quantizeTimeValue = (input, quantum, context) => {
  const parsed = parseTimeValue(input, context);
  const quantumSeconds = typeof quantum === "number" ? quantum : resolveTimeValue(quantum, context);
  if (!parsed.ok || !(quantumSeconds > 0)) return parsed.value;
  const seconds = Math.round(parsed.descriptor.seconds / quantumSeconds) * quantumSeconds;
  return createTimeValue(expressionForSeconds(parsed, seconds, context), seconds, context);
};

export const migrateNumericTimeValue = (value, fallback = 0) => createTimeValue(`${trimNumber(finite(value, fallback))} s`, finite(value, fallback));

export const formatSecondsAsBBU = (seconds, contextValue) => {
  const context = timingUnits(contextValue);
  let remainder = Math.max(0, finite(seconds));
  const bars = Math.floor(remainder / context.bar + 1e-9);
  remainder -= bars * context.bar;
  const beats = Math.floor(remainder / context.beat + 1e-9);
  remainder -= beats * context.beat;
  let ticks = Math.round(remainder / context.tick);
  let nextBars = bars;
  let nextBeats = beats;
  const ticksPerBeat = Math.round(context.beat / context.tick);
  if (ticks >= ticksPerBeat) {
    ticks = 0;
    nextBeats += 1;
  }
  if (nextBeats >= context.signature.numerator) {
    nextBars += Math.floor(nextBeats / context.signature.numerator);
    nextBeats %= context.signature.numerator;
  }
  return `${nextBars}.${nextBeats}.${ticks}`;
};
