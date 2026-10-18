// Display formats for transport positions, loop points and tap tempo. Pure; the UI wires these to the clock.
import {formatSecondsAsBBU, TIME_PPQ} from './timeValue.js';
import {formatTimecode} from './transport.js';

export const FPS_OPTIONS = Object.freeze([24, 25, 30, 50, 60]);
export const TIME_FORMATS = Object.freeze([
  {id: 'timecode', label: 'Timecode', hint: 'hh:mm:ss:ff'},
  {id: 'seconds', label: 'Seconds', hint: 's'},
  {id: 'bars', label: 'Bars · beats · ticks', hint: 'bar.beat.tick (zero based)'},
  {id: 'frames', label: 'Frames', hint: 'f'},
  {id: 'samples', label: 'Samples', hint: 'samples'},
  {id: 'ticks', label: 'Ticks', hint: '480 per quarter note'},
]);
// The ruler understands three notations; the others fall back to its nearest one.
export const RULER_MODE = Object.freeze({timecode: 'seconds', seconds: 'seconds', bars: 'beats', frames: 'frame', samples: 'seconds', ticks: 'beats'});
export const isTimeFormat = id => TIME_FORMATS.some(f => f.id === id);

/** A time expression (accepted by parseTimeValue) for `seconds` in the chosen format. */
export function timeExpression(seconds, format, {fps = 30, tempo = 120, signature = {numerator: 4, denominator: 4}, sampleRate = 48000} = {}) {
  const t = Math.max(0, Number(seconds) || 0);
  switch (format) {
    case 'seconds': return `${Number(t.toFixed(3))} s`;
    case 'bars': return formatSecondsAsBBU(t, {tempo, signature, fps});
    case 'frames': return `${Math.round(t * fps)} f`;
    case 'samples': return `${Math.round(t * sampleRate)} samples`;
    case 'ticks': return `${Math.round(t * tempo / 60 * TIME_PPQ)} ticks`;
    default: return formatTimecode(t, fps);
  }
}

/**
 * Tap tempo. `taps` are earlier tap times in ms; a pause longer than `gap` starts a new measurement.
 * Returns the updated taps and a BPM (rounded to 0.1, within 20..400) once there are two or more.
 */
export function tapTempo(taps, now, {gap = 2000, keep = 8} = {}) {
  const recent = taps.length && now - taps[taps.length - 1] <= gap ? taps : [];
  const next = [...recent, now].slice(-keep);
  if (next.length < 2) return {taps: next, bpm: null};
  const mean = (next[next.length - 1] - next[0]) / (next.length - 1);
  if (!(mean > 0)) return {taps: next, bpm: null};
  return {taps: next, bpm: Math.min(400, Math.max(20, Math.round(60000 / mean * 10) / 10))};
}
