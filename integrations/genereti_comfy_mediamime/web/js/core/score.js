// The score: regions drawn on (or around) the body, each with a tracker (which landmarks trigger it) and actions (what it
// sends). Portable JSON, version 1; no DOM. A region's shape is a polygon (or a polyline stroke) in normalized image
// coordinates, or in a body or hand frame (see frames.js).
import { ellipsePolygon, polygonBounds } from './geometry.js';

export const VERSION = 1;
export const TRIGGERS = ['enter', 'exit', 'enterExit', 'inside', 'hit'];
export const ACTION_TYPES = ['midiNote', 'midiCc', 'osc', 'ws', 'event'];
export const VALUE_SOURCES = ['constant', 'x', 'y', 'distance', 'speed', 'depth', 'coverage'];
export const CURVES = ['linear', 'exp', 'log', 'smooth'];
export const LIMITS = { regions: 128, actions: 16, points: 512, trackers: 16 };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const num = (v, d, a, b) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? clamp(Number(v), a, b) : d);
const str = (v, d, max = 120) => (typeof v === 'string' && v.length <= max ? v : d);
const oneOf = (v, list, d) => (list.includes(v) ? v : d);

export const newId = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

/** A value: a number, or { source, in: [a, b], out: [c, d], curve, value } (constant uses value). */
export function normalizeValue(v, fallback = 100) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (!v || typeof v !== 'object') return fallback;
  const source = oneOf(v.source, VALUE_SOURCES, 'constant');
  const pair = (p, d) => (Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) ? [Number(p[0]), Number(p[1])] : d);
  return {
    source,
    ...(source === 'constant' ? { value: num(v.value, fallback, -1e6, 1e6) } : {}),
    in: pair(v.in, source === 'speed' ? [0, 3] : [0, 1]),
    out: pair(v.out, [0, 127]),
    curve: oneOf(v.curve, CURVES, 'linear'),
  };
}

const defaults = {
  midiNote: { channel: 1, note: 60, velocity: { source: 'speed', in: [0, 3], out: [40, 127], curve: 'linear' }, length_ms: 120 },
  midiCc: { channel: 1, cc: 1, value: { source: 'x', in: [0, 1], out: [0, 127], curve: 'linear' } },
  osc: { address: '/mediamime', args: [{ source: 'x', in: [0, 1], out: [0, 1], curve: 'linear' }, { source: 'y', in: [0, 1], out: [0, 1], curve: 'linear' }] },
  ws: { fields: {} },
  event: { name: '' },
};

export function defaultAction(type = 'midiNote', region = 'region') {
  const base = { id: newId('act'), type, trigger: type === 'midiNote' ? 'hit' : type === 'midiCc' || type === 'osc' ? 'inside' : 'enterExit', cooldown_ms: type === 'midiNote' ? 60 : 0, rate_ms: 60, min_speed: 0.15 };
  return normalizeAction({ ...base, ...structuredClone(defaults[type]), ...(type === 'event' ? { name: region } : {}) });
}

export function normalizeAction(a) {
  const type = oneOf(a?.type, ACTION_TYPES, 'event');
  const out = {
    id: str(a?.id, newId('act'), 80),
    type,
    trigger: oneOf(a?.trigger, TRIGGERS, 'enterExit'),
    cooldown_ms: num(a?.cooldown_ms, 0, 0, 60000),
    rate_ms: num(a?.rate_ms, 60, 10, 10000),
    min_speed: num(a?.min_speed, 0.15, 0, 100),
    enabled: a?.enabled !== false,
  };
  if (type === 'midiNote') Object.assign(out, { channel: num(a.channel, 1, 1, 16) | 0, note: num(a.note, 60, 0, 127) | 0, velocity: normalizeValue(a.velocity, 100), length_ms: num(a.length_ms, 120, 0, 60000) });
  if (type === 'midiCc') Object.assign(out, { channel: num(a.channel, 1, 1, 16) | 0, cc: num(a.cc, 1, 0, 127) | 0, value: normalizeValue(a.value, 127) });
  if (type === 'osc') Object.assign(out, { address: str(a.address, '/mediamime', 120).startsWith('/') ? str(a.address, '/mediamime', 120) : '/mediamime', args: (Array.isArray(a.args) ? a.args : []).slice(0, 8).map(v => (typeof v === 'string' ? v.slice(0, 120) : normalizeValue(v, 0))) });
  if (type === 'ws') Object.assign(out, { fields: a.fields && typeof a.fields === 'object' ? Object.fromEntries(Object.entries(a.fields).slice(0, 16).map(([k, v]) => [String(k).slice(0, 40), typeof v === 'string' ? v.slice(0, 120) : normalizeValue(v, 0)])) : {} });
  if (type === 'event') Object.assign(out, { name: str(a.name, '', 80) });
  return out;
}

export function normalizeShape(s) {
  const type = s?.type === 'polyline' ? 'polyline' : 'polygon';
  const points = (Array.isArray(s?.points) ? s.points : []).slice(0, LIMITS.points).map(p => [Number(p[0]), Number(p[1])]).filter(p => p.every(Number.isFinite));
  if (type === 'polygon' && points.length < 3) throw new Error('A polygon needs at least 3 points');
  if (type === 'polyline' && points.length < 1) throw new Error('A polyline needs a point');
  return { type, points, ...(type === 'polyline' ? { width: num(s.width, 0.03, 0.001, 2) } : {}) };
}

export function normalizeTracker(t) {
  const kind = t?.kind === 'coverage' ? 'coverage' : 'point';
  return {
    kind,
    points: (Array.isArray(t?.points) ? t.points : ['pose.right_wrist']).slice(0, LIMITS.trackers).map(p => str(p, '', 120)).filter(Boolean),
    min_confidence: num(t?.min_confidence, 0.4, 0, 1),
    hysteresis: num(t?.hysteresis, 0.01, 0, 1),
    dwell_ms: num(t?.dwell_ms, 0, 0, 10000),
    threshold: num(t?.threshold, 0.2, 0, 1),
  };
}

export function normalizeRegion(r, i = 0) {
  const space = typeof r?.space === 'string' && /^(image|body|hand\.\d)$/.test(r.space) ? r.space : 'image';
  return {
    id: str(r?.id, newId('reg'), 80),
    name: str(r?.name, `region ${i + 1}`, 80),
    enabled: r?.enabled !== false,
    space,
    shape: normalizeShape(r?.shape),
    tracker: normalizeTracker(r?.tracker),
    actions: (Array.isArray(r?.actions) ? r.actions : []).slice(0, LIMITS.actions).map(normalizeAction),
    color: str(r?.color, '', 32),
  };
}

export function defaultOutputs() {
  return { midi: { enabled: true, port: 'all' }, osc: { enabled: false, host: '127.0.0.1', port: 9000 }, ws: { enabled: false, url: '' }, relay: { enabled: true }, events: { enabled: true } };
}

export function normalizeOutputs(o = {}) {
  const d = defaultOutputs();
  return {
    midi: { enabled: o.midi?.enabled ?? d.midi.enabled, port: str(o.midi?.port, 'all', 200) },
    osc: { enabled: Boolean(o.osc?.enabled), host: str(o.osc?.host, d.osc.host, 120), port: num(o.osc?.port, d.osc.port, 1, 65535) | 0 },
    ws: { enabled: Boolean(o.ws?.enabled), url: str(o.ws?.url, '', 300) },
    relay: { enabled: o.relay?.enabled ?? d.relay.enabled },
    events: { enabled: o.events?.enabled ?? d.events.enabled },
  };
}

export function defaultScore() {
  return { version: VERSION, name: 'mediamime', streams: { primary: 'body', mask: '', derived: 'mediamime' }, board: { width: 1000, height: 750 }, virtual: {}, regions: [], outputs: defaultOutputs() };
}

export function parseScore(value) {
  const d = typeof value === 'string' ? (value.trim() ? JSON.parse(value) : defaultScore()) : value ?? defaultScore();
  if (!d || typeof d !== 'object' || (d.version ?? VERSION) !== VERSION) throw new Error('Expected a version 1 score');
  if ((d.regions?.length ?? 0) > LIMITS.regions) throw new Error(`At most ${LIMITS.regions} regions`);
  const ids = new Set(), regions = [];
  (d.regions ?? []).forEach((r, i) => { const n = normalizeRegion(r, i); if (!ids.has(n.id)) { ids.add(n.id); regions.push(n); } });
  const virtual = {};
  for (const [k, v] of Object.entries(d.virtual ?? {}).slice(0, 32)) {
    if ((v?.type === 'mid' || v?.type === 'lerp') && Array.isArray(v.of) && v.of.length === 2) virtual[String(k).slice(0, 40)] = { type: v.type, of: v.of.map(String), ...(v.type === 'lerp' ? { t: num(v.t, 0.5, -2, 3) } : {}) };
  }
  return {
    version: VERSION,
    name: str(d.name, 'mediamime', 80),
    streams: { primary: str(d.streams?.primary, 'body', 80), mask: str(d.streams?.mask, '', 80), derived: str(d.streams?.derived, 'mediamime', 80) },
    board: { width: num(d.board?.width, 1000, 100, 8000), height: num(d.board?.height, 750, 100, 8000) },
    virtual,
    regions,
    outputs: normalizeOutputs(d.outputs),
  };
}

// ---- from Poliplan ---------------------------------------------------------------------------------------------------

/** Ramer–Douglas–Peucker, to keep drawn outlines light. */
export function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let worst = -1, index = -1;
    const [ax, ay] = points[a], [bx, by] = points[b], len = Math.hypot(bx - ax, by - ay) || 1e-12;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((points[i][0] - ax) * (by - ay) - (points[i][1] - ay) * (bx - ax)) / len;
      if (d > worst) { worst = d; index = i; }
    }
    if (worst > tolerance) { keep[index] = true; stack.push([a, index], [index, b]); }
  }
  return points.filter((_, i) => keep[i]);
}

/**
 * The shapes in a Poliplan document, as region geometry. Boards: `image` (id 'main', size imageSize) holds image-space
 * regions, `body` (the body board: its torso length in board units, origin at the hips) holds body-space regions. Planes
 * and closed lines become polygons, open lines polylines, points small discs. Notes, guides and hidden marks are skipped.
 * Returns [{ id, name, space, shape, board }].
 */
export function regionsFromPoliplan(doc, { image = { width: 1000, height: 750 }, body = null, lineWidth = 0.03 } = {}) {
  const out = [];
  const boards = { main: { space: 'image', toUnit: ([x, y]) => [x / image.width, y / image.height], tolerance: 0.002 } };
  if (body) {
    boards[body.id] = { space: 'body', toUnit: ([x, y]) => [(x - body.origin[0]) / body.scale, (body.origin[1] - y) / body.scale], tolerance: 0.01 };
  }
  for (const e of doc?.elements ?? []) {
    const board = boards[e.board ?? 'main'];
    if (!board || e.hidden || !['plane', 'line', 'point', 'gesture'].includes(e.role) || !e.points?.length) continue;
    let pts = e.points.map(board.toUnit);
    let shape;
    if (e.role === 'point') {
      const [x, y] = pts[0];
      shape = { type: 'polygon', points: ellipsePolygon(x, y, board.space === 'image' ? 0.03 : 0.12, board.space === 'image' ? 0.03 * (image.width / image.height) : 0.12, 0, 24) };
    } else if (e.closed || e.role === 'plane') {
      if (pts.length > 3 && pts[0][0] === pts.at(-1)[0] && pts[0][1] === pts.at(-1)[1]) pts = pts.slice(0, -1);
      pts = simplify(pts, board.tolerance);
      if (pts.length < 3) continue;
      shape = { type: 'polygon', points: pts };
    } else {
      pts = simplify(pts, board.tolerance);
      shape = { type: 'polyline', points: pts, width: board.space === 'image' ? lineWidth : lineWidth * 4 };
    }
    out.push({ id: e.id, name: e.label || e.why || '', space: board.space, shape, board: e.board ?? 'main', color: e.fill || e.color || '' });
  }
  return out;
}

/** Update a score's regions from the extracted shapes: new shapes get an inert region, old ones keep their tracker and actions. */
export function reconcile(score, extracted) {
  const old = new Map(score.regions.map(r => [r.id, r]));
  const regions = extracted.slice(0, LIMITS.regions).map((x, i) => {
    const prev = old.get(x.id);
    if (prev) return { ...prev, space: x.space, shape: x.shape, ...(x.name ? { name: x.name } : {}), color: x.color || prev.color };
    return normalizeRegion({ id: x.id, name: x.name || `region ${i + 1}`, space: x.space, shape: x.shape, color: x.color, tracker: { points: x.space === 'image' ? ['pose.right_wrist', 'pose.left_wrist'] : ['pose.right_wrist', 'pose.left_wrist', 'hands.*.index_tip'] }, actions: [] }, i);
  });
  return { ...score, regions };
}

export const boundsOf = region => polygonBounds(region.shape.points);
