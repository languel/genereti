// Adapted from Underscores. See UNDERSCORES-LICENSE and README.md.
export const MIDI_REALTIME = Object.freeze({
  clock: 0xf8,
  start: 0xfa,
  continue: 0xfb,
  stop: 0xfc,
  songPosition: 0xf2,
});

export const clampTempo = value => Math.min(400, Math.max(20, Number(value) || 120));

export const TRANSPORT_LAUNCH_QUANTIZATION_OPTIONS = Object.freeze([
  Object.freeze({ value: "1/16", label: "1/16" }),
  Object.freeze({ value: "1/8", label: "1/8" }),
  Object.freeze({ value: "1/4", label: "1/4 beat" }),
  Object.freeze({ value: "1/2", label: "1/2 beat" }),
  Object.freeze({ value: "bar", label: "1 bar" }),
  Object.freeze({ value: "2bars", label: "2 bars" }),
  Object.freeze({ value: "4bars", label: "4 bars" }),
  Object.freeze({ value: "custom", label: "Custom beats" }),
]);

const TRANSPORT_LAUNCH_QUANTIZATION_VALUES = new Set(
  TRANSPORT_LAUNCH_QUANTIZATION_OPTIONS.map(option => option.value),
);

export const normalizeTransportLaunchQuantization = value => {
  const raw = value && typeof value === "object" ? value : {};
  const parsedCustomBeats = Number(raw.customBeats);
  const customBeats = Number.isFinite(parsedCustomBeats) && parsedCustomBeats > 0
    ? parsedCustomBeats
    : 4;
  return {
    enabled: raw.enabled === true,
    interval: TRANSPORT_LAUNCH_QUANTIZATION_VALUES.has(raw.interval) ? raw.interval : "bar",
    customBeats: Math.min(128, Math.max(0.0625, customBeats)),
  };
};

export const transportLaunchQuantizationSeconds = (
  quantization,
  { tempo = 120, signature = { numerator: 4, denominator: 4 } } = {},
) => {
  const normalized = normalizeTransportLaunchQuantization(quantization);
  const meter = normalizeTimeSignature(signature);
  const beatSeconds = 60 / clampTempo(tempo) * 4 / meter.denominator;
  const barSeconds = beatSeconds * meter.numerator;
  const interval = normalized.interval;
  if (interval === "1/16") return beatSeconds / 4;
  if (interval === "1/8") return beatSeconds / 2;
  if (interval === "1/2") return beatSeconds * 2;
  if (interval === "bar") return barSeconds;
  if (interval === "2bars") return barSeconds * 2;
  if (interval === "4bars") return barSeconds * 4;
  if (interval === "custom") return beatSeconds * normalized.customBeats;
  return beatSeconds;
};

export const nextTransportLaunchTime = (
  time,
  quantization,
  context = {},
) => {
  const normalized = normalizeTransportLaunchQuantization(quantization);
  if (!normalized.enabled) return Math.max(0, Number(time) || 0);
  const quantum = Math.max(Number.EPSILON, transportLaunchQuantizationSeconds(normalized, context));
  const current = Math.max(0, Number(time) || 0);
  const next = (Math.floor((current + quantum * 1e-9) / quantum) + 1) * quantum;
  return Number(next.toFixed(9));
};

export const advanceTransportPlaybackTime = (
  currentTime,
  deltaSeconds,
  { rate = 1, loopEnabled = false, loopStart = 0, loopEnd = 0 } = {},
) => {
  const next = Math.max(0, Number(currentTime) || 0)
    + Math.max(0, Number(deltaSeconds) || 0) * Math.max(0, Number(rate) || 0);
  const start = Math.max(0, Number(loopStart) || 0);
  const end = Math.max(start, Number(loopEnd) || 0);
  if (loopEnabled && end > start && next >= end) {
    return start + ((next - start) % (end - start));
  }
  return next;
};

export const normalizeTimeSignature = signature => ({
  numerator: Math.min(32, Math.max(1, Math.round(Number(signature?.numerator) || 4))),
  denominator: [1, 2, 4, 8, 16].includes(Number(signature?.denominator))
    ? Number(signature.denominator)
    : 4,
});

export const formatTimecode = (seconds, fps = 30) => {
  const safeFps = [24, 25, 30, 50, 60].includes(Number(fps)) ? Number(fps) : 30;
  const totalFrames = Math.max(0, Math.floor((Number(seconds) || 0) * safeFps + 1e-7));
  const frames = totalFrames % safeFps;
  const totalSeconds = Math.floor(totalFrames / safeFps);
  const secs = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return [hours, minutes, secs, frames].map(value => String(value).padStart(2, "0")).join(":");
};

export const secondsToFrame = (seconds, fps = 30) => {
  const safeFps = [24, 25, 30, 50, 60].includes(Number(fps)) ? Number(fps) : 30;
  return Math.max(0, Math.floor((Number(seconds) || 0) * safeFps + 1e-7));
};

export const frameToSeconds = (frame, fps = 30) => {
  const safeFps = [24, 25, 30, 50, 60].includes(Number(fps)) ? Number(fps) : 30;
  return Math.max(0, Number(frame) || 0) / safeFps;
};

export const secondsToMusicalPosition = (seconds, tempo = 120, signature = { numerator: 4, denominator: 4 }) => {
  const bpm = clampTempo(tempo);
  const meter = normalizeTimeSignature(signature);
  const quarterNotes = Math.max(0, Number(seconds) || 0) * bpm / 60;
  const meterBeats = quarterNotes * meter.denominator / 4;
  const beatsPerBar = meter.numerator;
  const barIndex = Math.floor(meterBeats / beatsPerBar);
  const beatWithinBar = meterBeats - barIndex * beatsPerBar;
  const beatIndex = Math.floor(beatWithinBar);
  const sixteenthWithinBeat = Math.floor((beatWithinBar - beatIndex) * 16) + 1;
  return {
    bar: barIndex + 1,
    beat: beatIndex + 1,
    sixteenth: Math.min(16, sixteenthWithinBeat),
    quarterNotes,
  };
};

export const formatMusicalPosition = (seconds, tempo, signature) => {
  const position = secondsToMusicalPosition(seconds, tempo, signature);
  return `${position.bar}.${position.beat}.${position.sixteenth}`;
};

export const musicalPositionToSeconds = (value, tempo = 120, signature = { numerator: 4, denominator: 4 }) => {
  const meter = normalizeTimeSignature(signature);
  const [barValue = 1, beatValue = 1, sixteenthValue = 1] = String(value).trim().split(/[.:]/).map(Number);
  const bar = Math.max(1, Math.floor(barValue) || 1);
  const beat = Math.min(meter.numerator, Math.max(1, Math.floor(beatValue) || 1));
  const sixteenth = Math.min(16, Math.max(1, Math.floor(sixteenthValue) || 1));
  const meterBeats = (bar - 1) * meter.numerator + (beat - 1) + (sixteenth - 1) / 16;
  const quarterNotes = meterBeats * 4 / meter.denominator;
  return quarterNotes * 60 / clampTempo(tempo);
};

export const parseTimecode = (value, fps = 30) => {
  const safeFps = [24, 25, 30, 50, 60].includes(Number(fps)) ? Number(fps) : 30;
  const parts = String(value).trim().split(":").map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isFinite(part))) return 0;
  const [hours, minutes, seconds, frames] = parts;
  return Math.max(0, hours * 3600 + minutes * 60 + seconds + Math.min(safeFps - 1, Math.max(0, frames)) / safeFps);
};

export const formatTimelinePosition = (seconds, mode, { fps = 30, tempo = 120, signature } = {}) => {
  if (mode === "frame") return String(secondsToFrame(seconds, fps));
  if (mode === "beats") return formatSecondsAsBBU(seconds, { tempo, signature, fps });
  return formatTimecode(seconds, fps);
};

export const parseTimelinePosition = (value, mode, { fps = 30, tempo = 120, signature } = {}) => {
  if (mode === "frame") return frameToSeconds(value, fps);
  if (mode === "beats") return Math.max(0, resolveTimeValue(String(value), { tempo, signature, fps }));
  return parseTimecode(value, fps);
};

const niceTimelineStep = rawStep => {
  const safeStep = Math.max(Number.EPSILON, Number(rawStep) || 1);
  const magnitude = 10 ** Math.floor(Math.log10(safeStep));
  const normalized = safeStep / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return factor * magnitude;
};

export const getTimelineSubdivision = (
  duration,
  mode = "timecode",
  { fps = 30, tempo = 120, signature } = {},
  targetCount = 12,
) => {
  const safeDuration = Math.max(0.001, Number(duration) || 0.001);
  const safeTarget = Math.max(2, Math.floor(Number(targetCount) || 12));
  if (mode === "beats") {
    const meter = normalizeTimeSignature(signature);
    const beatSeconds = 60 / clampTempo(tempo) * 4 / meter.denominator;
    return { minor: beatSeconds, major: beatSeconds * meter.numerator };
  }
  if (mode === "frame") {
    const safeFps = [24, 25, 30, 50, 60].includes(Number(fps)) ? Number(fps) : 30;
    return { minor: 1 / safeFps, major: 1 };
  }
  const minor = niceTimelineStep(safeDuration / safeTarget);
  return { minor, major: minor * 5 };
};

export const snapTimelineTime = (time, duration, mode, options = {}, subdivision = "major") => {
  const safeDuration = Math.max(0, Number(duration) || 0);
  const divisions = getTimelineSubdivision(safeDuration, mode, options);
  const quantum = subdivision === "minor" ? divisions.minor : divisions.major;
  const snapped = Math.round((Number(time) || 0) / quantum) * quantum;
  return Math.min(safeDuration, Math.max(0, Number(snapped.toFixed(9))));
};

// Keep the playhead comfortably inside a manually chosen timeline window when
// follow mode is enabled. The window width is preserved, so playback follows
// without changing the user's zoom level.
export const followTimelineViewRange = (viewRange, currentTime, duration, enabled = true) => {
  if (!enabled || !Number.isFinite(Number(currentTime))) return viewRange;
  const playhead = Math.max(0, Number(currentTime));
  // The transport can legitimately run past the authored score end (for
  // example while a linked live node is still playing). Treat that position
  // as a virtual extension of the timeline so follow mode can still move the
  // view instead of clamping the playhead to the old end.
  const safeDuration = Math.max(0.001, Number(duration) || 0.001, playhead);
  const previousStart = Math.max(0, Math.min(safeDuration, Number(viewRange?.start) || 0));
  const previousEnd = Math.max(previousStart + Number.EPSILON, Math.min(safeDuration, Number(viewRange?.end) || safeDuration));
  const width = previousEnd - previousStart;
  if (width >= safeDuration - Number.EPSILON || (playhead >= previousStart && playhead <= previousEnd)) return viewRange;
  const targetStart = playhead < previousStart
    ? playhead - width * 0.25
    : playhead - width * 0.75;
  const start = Math.max(0, Math.min(Math.max(0, safeDuration - width), targetStart));
  return { start, end: start + width };
};

export const createTimelineTicks = (duration, count = 12, options = {}) => {
  const safeDuration = Math.max(0.001, Number(duration) || 0.001);
  const safeCount = Math.max(2, Math.floor(Number(count) || 12));
  const mode = options.mode;
  if (mode) {
    const rangeStart = Math.max(0, Math.min(safeDuration, Number(options.rangeStart) || 0));
    const rangeEnd = Math.max(rangeStart + Number.EPSILON, Math.min(safeDuration, Number(options.rangeEnd) || safeDuration));
    const visibleDuration = Math.max(Number.EPSILON, rangeEnd - rangeStart);
    const pixelWidth = Math.max(1, Number(options.pixelWidth) || safeCount * 64);
    const minLineSpacing = Math.max(2, Number(options.minLineSpacing) || 8);
    const minLabelSpacing = Math.max(minLineSpacing, Number(options.minLabelSpacing) || 52);
    const { minor, major } = getTimelineSubdivision(visibleDuration, mode, options, safeCount);
    const epsilon = minor * 1e-6;
    const minorPixels = minor / visibleDuration * pixelWidth;
    const minorStride = Math.max(1, Math.ceil(minLineSpacing / Math.max(Number.EPSILON, minorPixels)));
    const renderedMinor = minor * minorStride;
    const tickMap = new Map();
    const addTick = (time, forceMajor = false) => {
      const safeTime = Math.min(rangeEnd, Math.max(rangeStart, time));
      const key = Number(safeTime.toFixed(9));
      const majorIndex = Math.round(safeTime / major);
      const isMajor = forceMajor || Math.abs(safeTime - majorIndex * major) <= epsilon;
      const existing = tickMap.get(key);
      tickMap.set(key, {
        time: safeTime,
        percent: (safeTime - rangeStart) / visibleDuration * 100,
        major: isMajor || existing?.major || false,
        showLabel: existing?.showLabel || false,
      });
    };

    const firstMinor = Math.ceil((rangeStart - epsilon) / renderedMinor) * renderedMinor;
    for (let time = firstMinor, index = 0; time <= rangeEnd + epsilon && index < 4097; time += renderedMinor, index += 1) {
      addTick(time);
    }

    const majorPixels = major / visibleDuration * pixelWidth;
    const majorStride = Math.max(1, Math.ceil(minLineSpacing / Math.max(Number.EPSILON, majorPixels)));
    const renderedMajor = major * majorStride;
    const firstMajor = Math.ceil((rangeStart - epsilon) / renderedMajor) * renderedMajor;
    for (let time = firstMajor, index = 0; time <= rangeEnd + epsilon && index < 4097; time += renderedMajor, index += 1) {
      addTick(time, true);
    }

    const ticks = [...tickMap.values()].sort((a, b) => a.time - b.time);
    const labelFromMinor = minorPixels >= minLabelSpacing;
    const labelQuantum = labelFromMinor
      ? minor
      : major * Math.max(1, Math.ceil(minLabelSpacing / Math.max(Number.EPSILON, majorPixels)));
    return ticks.map(tick => ({
      ...tick,
      showLabel: Math.abs(tick.time / labelQuantum - Math.round(tick.time / labelQuantum)) <= 1e-6,
    }));
  }
  return Array.from({ length: safeCount + 1 }, (_, index) => ({
    time: safeDuration * index / safeCount,
    percent: index * 100 / safeCount,
  }));
};

export const midiClockIntervalMs = tempo => 60000 / (clampTempo(tempo) * 24);

export const songPositionToSeconds = (lsb, msb, tempo) => {
  const sixteenthNotes = (Number(lsb) & 0x7f) | ((Number(msb) & 0x7f) << 7);
  const quarterNotes = sixteenthNotes / 4;
  return quarterNotes * 60 / clampTempo(tempo);
};

export const estimateMidiClockTempo = (previousTimestamp, timestamp, previousTempo = 120) => {
  const delta = Number(timestamp) - Number(previousTimestamp);
  if (!Number.isFinite(delta) || delta <= 0 || delta > 1000) return clampTempo(previousTempo);
  const instantaneous = 60000 / (delta * 24);
  return clampTempo(previousTempo * 0.85 + instantaneous * 0.15);
};

const median = values => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

export const createMidiClockReceiverState = (tempo = 120) => ({
  tempo: clampTempo(tempo),
  lastTimestamp: null,
  intervals: [],
});

/**
 * Advances the 24 PPQN MIDI-clock receiver without conflating clock phase and
 * the user-visible tempo. MIDI Clock does not contain a numeric BPM value, so
 * tempo following is deliberately opt-in. When enabled, a median-gated window
 * rejects browser scheduling spikes before applying a damped estimate.
 */
export const advanceMidiClockReceiver = (
  previousState,
  timestamp,
  { followTempo = false, minSamples = 12, maxSamples = 48 } = {},
) => {
  const state = previousState || createMidiClockReceiverState();
  const nextTimestamp = Number(timestamp);
  const priorTimestamp = Number(state.lastTimestamp);
  const delta = nextTimestamp - priorTimestamp;
  let intervals = Array.isArray(state.intervals) ? [...state.intervals] : [];

  if (Number.isFinite(delta) && state.lastTimestamp !== null) {
    if (delta > 500) {
      intervals = [];
    } else if (delta >= 5 && delta <= 250) {
      intervals.push(delta);
      intervals = intervals.slice(-Math.max(minSamples, maxSamples));
    }
  }

  let tempo = clampTempo(state.tempo);
  let ready = false;
  if (followTempo && intervals.length >= minSamples) {
    const center = median(intervals);
    const inliers = intervals.filter(value => value >= center * 0.75 && value <= center * 1.25);
    if (inliers.length >= minSamples) {
      const meanInterval = inliers.reduce((sum, value) => sum + value, 0) / inliers.length;
      const measuredTempo = clampTempo(60000 / (meanInterval * 24));
      tempo = clampTempo(tempo * 0.8 + measuredTempo * 0.2);
      ready = true;
    }
  }

  return {
    state: {
      tempo,
      lastTimestamp: Number.isFinite(nextTimestamp) ? nextTimestamp : state.lastTimestamp,
      intervals,
    },
    tempo,
    secondsPerPulse: 60 / (tempo * 24),
    ready,
  };
};
import { formatSecondsAsBBU, resolveTimeValue } from "./timeValue.js";
