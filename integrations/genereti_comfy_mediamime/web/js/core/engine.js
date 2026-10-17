// The engine: a score and a stream of perception frames in, events and output messages out. Pure and deterministic: time is
// the frames' own time (source.frame_timestamp_ms), so a recorded stream gives the same events as a live one.
//
// A region is hit by tracker points (landmarks). Per point it knows inside / outside, with an optional dwell before entering
// and a hysteresis margin before leaving. The phases are entry, exit and inside (throttled); each action decides which it
// answers. A point that disappears for `LOST_MS` leaves, so no note is ever left hanging.
import { cellsInside, insideShape, shapeMetrics } from './geometry.js';
import { frameFor, resolvePoints, toFrame } from './frames.js';
import { midi7, resolveValue, restingValue } from './values.js';

export const LOST_MS = 250;
const COVERAGE_BAND = 0.05;

export class RegionEngine {
  constructor(score) { this.set(score); }

  set(score) { this.score = score; this.reset(); }

  reset() {
    this.points = new Map();      // `${region}|${point}` → state
    this.actions = new Map();     // `${region}|${point}|${action}` → { last, lastInside }
    this.notes = new Map();       // active notes, by action key → message to end it
    this.cells = new Map();       // mask coverage cells per region and grid
    this.activity = new Map();
    this.coverage = new Map();
    this.lastT = null;
  }

  /** Messages that end every held note (disable, stop, a lost source). */
  release(t = this.lastT ?? 0) {
    const messages = [];
    for (const [key, off] of this.notes) messages.push({ ...off, t });
    this.notes.clear();
    return messages;
  }

  /**
   * frame: { features, source: { width, height, frame_timestamp_ms }, mask?: { width, height, data } } or null for no fresh frame.
   * now: the wall clock in ms (only for noticing a source that stopped). Returns { events, messages, regions }.
   */
  tick(frame, now = 0) {
    const events = [], messages = [];
    const emit = (region, key, phase, metrics, t, point, reason) => this.fire(region, key, phase, metrics, t, point, reason, events, messages);
    if (!frame?.features || !frame.source) {
      this.sweepLost(now, emit);
      return { events, messages, regions: this.snapshot() };
    }
    const t = frame.source.frame_timestamp_ms;
    if (t === this.lastT) return { events, messages, regions: this.snapshot() };
    const dt = this.lastT == null ? 0 : Math.max(1, t - this.lastT) / 1000;
    this.lastT = t;
    const { width: W, height: H } = frame.source;
    const frames = new Map();
    const frameOf = (space, minConfidence) => {
      const k = space + '|' + minConfidence;
      if (!frames.has(k)) frames.set(k, space === 'image' ? 'image' : frameFor(space, frame.features, W, H, minConfidence));
      return frames.get(k);
    };
    for (const region of this.score.regions) {
      if (!region.enabled) { this.endRegion(region, t, emit, 'disabled'); continue; }
      const seen = new Set();
      if (region.tracker.kind === 'coverage') {
        this.coverageStep(region, frame, t, now, emit, seen);
      } else {
        const fr = frameOf(region.space, region.tracker.min_confidence);
        if (fr) {
          const wanted = new Map();
          for (const spec of region.tracker.points) for (const p of resolvePoints(frame.features, spec, { virtual: this.score.virtual, minConfidence: region.tracker.min_confidence })) wanted.set(p.id, p);
          for (const p of wanted.values()) this.pointStep(region, p, fr, W, H, t, dt, now, emit, seen);
        }
      }
      // Points that were inside and are not seen: gone for LOST_MS leaves.
      for (const [key, s] of this.points) {
        if (s.region !== region.id || seen.has(key)) continue;
        s.lastPos = null;
        if (s.inside && now - s.seenAt >= LOST_MS) { s.inside = false; emit(region, key, 'exit', { nx: 0, ny: 0, dist: 1, speed: 0 }, t, { id: s.pointId }, 'lost'); }
        else if (!s.inside) this.points.delete(key);
      }
      this.updateActivity(region);
    }
    return { events, messages, regions: this.snapshot() };
  }

  pointStep(region, p, fr, W, H, t, dt, now, emit, seen) {
    const key = region.id + '|' + p.id;
    seen.add(key);
    const s = this.points.get(key) ?? { region: region.id, pointId: p.id, inside: false, candidate: null, lastPos: null, speed: 0, seenAt: now };
    this.points.set(key, s);
    s.seenAt = now;
    const [x, y] = fr === 'image' ? [p.x, p.y] : toFrame(fr, p.x, p.y);
    if (s.lastPos && dt > 0) {
      const dx = (x - s.lastPos[0]), dy = (y - s.lastPos[1]);
      const raw = (fr === 'image' ? Math.hypot(dx * W, dy * H) / H : Math.hypot(dx, dy)) / dt;   // heights per second, or torso lengths per second
      s.peak = Math.max(raw, s.speed);
      s.speed = s.speed * 0.5 + raw * 0.5;
    } else { s.peak = 0; s.speed = 0; }
    s.lastPos = [x, y];
    s.ix = p.x; s.iy = p.y;
    const margin = s.inside ? region.tracker.hysteresis : 0;
    const now_in = insideShape(region.shape, x, y, margin);
    const metrics = { ...shapeMetrics(region.shape, x, y), speed: Math.max(s.speed, s.peak ?? 0), z: p.z, x, y };
    const point = { id: p.id, x: p.x, y: p.y };
    if (now_in) {
      if (!s.inside) {
        s.candidate ??= t;
        if (t - s.candidate >= region.tracker.dwell_ms) { s.inside = true; s.candidate = null; s.enteredAt = t; emit(region, key, 'entry', metrics, t, point); }
      } else emit(region, key, 'inside', { ...metrics, speed: s.speed }, t, point);
    } else {
      s.candidate = null;
      if (s.inside) { s.inside = false; emit(region, key, 'exit', { ...metrics, speed: s.speed }, t, point); }
    }
    s.metrics = metrics;
  }

  coverageStep(region, frame, t, now, emit, seen) {
    const mask = frame.mask;
    const key = region.id + '|coverage';
    seen.add(key);
    const s = this.points.get(key) ?? { region: region.id, pointId: 'coverage', inside: false, candidate: null, lastPos: null, speed: 0, seenAt: now };
    this.points.set(key, s);
    if (!mask?.data) { s.seenAt = now - LOST_MS; return; }
    s.seenAt = now;
    const ck = `${region.id}:${mask.width}x${mask.height}`;
    let cells = this.cells.get(ck);
    if (!cells) { cells = cellsInside(region.shape, mask.width, mask.height); this.cells.set(ck, cells); }
    let on = 0;
    for (const i of cells) if (mask.data[i] > 127) on++;
    const coverage = cells.length ? on / cells.length : 0;
    this.coverage.set(region.id, coverage);
    const metrics = { nx: 0.5, ny: 0.5, dist: 0, speed: 0, coverage, z: 0 };
    const point = { id: 'coverage', x: 0.5, y: 0.5 };
    const threshold = region.tracker.threshold;
    if (coverage >= threshold) {
      if (!s.inside) {
        s.candidate ??= t;
        if (t - s.candidate >= region.tracker.dwell_ms) { s.inside = true; s.candidate = null; emit(region, key, 'entry', metrics, t, point); }
      } else emit(region, key, 'inside', metrics, t, point);
    } else {
      s.candidate = null;
      if (s.inside && coverage < threshold - COVERAGE_BAND) { s.inside = false; emit(region, key, 'exit', metrics, t, point); }
      else if (s.inside) emit(region, key, 'inside', metrics, t, point);
    }
    s.metrics = metrics;
  }

  sweepLost(now, emit) {
    const t = this.lastT ?? 0;
    for (const [key, s] of this.points) {
      if (!s.inside) continue;
      if (now - s.seenAt >= LOST_MS) {   // gone since the last frame it was in
        const region = this.score.regions.find(r => r.id === s.region);
        s.inside = false;
        if (region) emit(region, key, 'exit', { nx: 0, ny: 0, dist: 1, speed: 0 }, t, { id: s.pointId }, 'lost');
      }
    }
    for (const region of this.score.regions) this.updateActivity(region);
  }

  endRegion(region, t, emit, reason) {
    for (const [key, s] of this.points) {
      if (s.region !== region.id) continue;
      if (s.inside) { s.inside = false; emit(region, key, 'exit', { nx: 0, ny: 0, dist: 1, speed: 0 }, t, { id: s.pointId }, reason); }
      this.points.delete(key);
    }
  }

  updateActivity(region) {
    let on = false;
    for (const s of this.points.values()) if (s.region === region.id && s.inside) on = true;
    const a = this.activity.get(region.id) ?? 0;
    this.activity.set(region.id, on ? Math.min(1, a + 0.5) : Math.max(0, a - 0.08));
  }

  snapshot() {
    const regions = {};
    for (const region of this.score.regions) {
      const points = [];
      let active = false;
      for (const s of this.points.values()) {
        if (s.region !== region.id) continue;
        if (s.inside) active = true;
        if (s.ix != null) points.push({ id: s.pointId, x: s.ix, y: s.iy, inside: s.inside, speed: s.speed });
      }
      regions[region.id] = { active, activity: this.activity.get(region.id) ?? 0, points, coverage: this.coverage.get(region.id) };
    }
    return regions;
  }

  // ---- events and actions ---------------------------------------------------------------------------------------------

  fire(region, key, phase, metrics, t, point, reason, events, messages) {
    const event = { t, phase, region: region.id, name: region.name, point: point.id, x: point.x, y: point.y, metrics: { nx: metrics.nx, ny: metrics.ny, dist: metrics.dist, speed: metrics.speed ?? 0, coverage: metrics.coverage }, ...(reason ? { reason } : {}) };
    if (phase !== 'inside') events.push(event);
    for (const action of region.actions) {
      if (action.enabled === false) continue;
      const akey = key + '|' + action.id;
      const st = this.actions.get(akey) ?? { last: -Infinity, lastInside: -Infinity };
      this.actions.set(akey, st);
      const out = this.answer(action, akey, st, region, phase, metrics, t, point, reason);
      if (out) messages.push(...out);
    }
  }

  answer(action, akey, st, region, phase, metrics, t, point, reason) {
    const trig = action.trigger;
    const entry = phase === 'entry', exit = phase === 'exit', inside = phase === 'inside';
    let mode = null;   // 'on' | 'off' | 'pulse' | 'value'
    if (trig === 'enter' && entry) mode = 'pulse';
    else if (trig === 'exit' && exit) mode = 'pulse';
    else if (trig === 'enterExit' && entry) mode = 'on';
    else if (trig === 'enterExit' && exit) mode = 'off';
    else if (trig === 'hit' && entry && (metrics.speed ?? 0) >= action.min_speed) mode = 'pulse';
    else if (trig === 'inside' && (inside || entry)) mode = 'value';
    // A note that was started must be ended whatever the gates say.
    if (exit && this.notes.has(akey)) {
      const off = this.notes.get(akey);
      this.notes.delete(akey);
      return [{ ...off, t }];
    }
    if (!mode) return null;
    if ((entry || (mode === 'pulse' && !inside)) && t - st.last < action.cooldown_ms) return null;
    if (mode === 'value') { if (t - st.lastInside < action.rate_ms) return null; st.lastInside = t; }
    if (entry || mode === 'pulse') st.last = t;
    return this.build(action, akey, region, phase, mode, metrics, t, point, reason);
  }

  build(action, akey, region, phase, mode, metrics, t, point) {
    const base = { t, region: region.id, name: region.name, action: action.id, point: point.id };
    switch (action.type) {
      case 'midiNote': {
        if (mode === 'off') return null;
        const velocity = Math.max(1, midi7(resolveValue(action.velocity, metrics)));
        const on = { ...base, kind: 'midiNote', phase: 'on', channel: action.channel, note: action.note, velocity, length_ms: mode === 'on' ? 0 : action.length_ms, key: akey };
        const off = { ...base, kind: 'midiNote', phase: 'off', channel: action.channel, note: action.note, velocity: 0 };
        if (mode === 'on' || action.length_ms === 0) this.notes.set(akey, off);
        return [on];
      }
      case 'midiCc': {
        const spec = action.value;
        const v = mode === 'off' ? restingValue(spec) : resolveValue(spec, metrics);
        return [{ ...base, kind: 'midiCc', channel: action.channel, cc: action.cc, value: midi7(v) }];
      }
      case 'osc': {
        const args = action.args.map(a => (typeof a === 'string' ? a : mode === 'off' ? restingValue(a) : resolveValue(a, metrics)));
        return [{ ...base, kind: 'osc', address: action.address.replaceAll('{region}', region.name.replace(/[^\w-]+/g, '_')), args, phase: mode === 'off' ? 'exit' : phase }];
      }
      case 'ws': {
        const fields = Object.fromEntries(Object.entries(action.fields).map(([k, v]) => [k, typeof v === 'string' ? v : resolveValue(v, metrics)]));
        return [{ ...base, kind: 'ws', phase: mode === 'off' ? 'exit' : phase, values: { x: metrics.nx, y: metrics.ny, distance: metrics.dist, speed: metrics.speed ?? 0, coverage: metrics.coverage }, fields }];
      }
      case 'event':
        return [{ ...base, kind: 'event', event: action.name || region.name, phase: mode === 'off' ? 'exit' : phase === 'entry' ? 'entry' : phase, values: { x: metrics.nx, y: metrics.ny, distance: metrics.dist, speed: metrics.speed ?? 0, coverage: metrics.coverage } }];
      default: return null;
    }
  }
}
