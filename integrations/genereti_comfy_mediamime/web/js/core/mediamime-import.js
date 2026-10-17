// Opens a score saved by the original Mediamime (a browser MIDI performance tool: shapes over a camera feed, each with a
// stream, a landmark and a stack of MIDI event cards) as a score of this engine. Pointer and keyboard shapes have no body
// to follow and are reported, not converted.
import { defaultAction, normalizeAction, parseScore, newId } from './score.js';
import { ellipsePolygon, rectPolygon } from './geometry.js';

const modes = { normX: 'x', normY: 'y', distance: 'distance' };
const triggers = { enter: 'enter', exit: 'exit', enterExit: 'enterExit', inside: 'inside' };

const prefixFor = (stream, landmark) => {
  if (!landmark) return null;
  if (stream === 'pose') return `pose.${landmark}`;
  if (stream === 'leftHand' || stream === 'rightHand') return `hands.*.${landmark.replace(/^(left|right)_/, '')}`;
  if (stream === 'face') return `face.${landmark}`;
  return null;
};

const valueSpec = (mode, constant, out = [0, 127]) => (mode && modes[mode] ? { source: modes[mode], in: [0, 1], out, curve: 'linear' } : { source: 'constant', value: Number(constant) || 0 });

function shapePolygon(shape) {
  const pts = (shape.points ?? []).map(p => [Number(p.x), Number(p.y)]).filter(p => p.every(Number.isFinite));
  if (shape.type === 'ellipse' && pts.length === 2) {
    const [a, b] = pts;
    return ellipsePolygon((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.abs(b[0] - a[0]) / 2, Math.abs(b[1] - a[1]) / 2, Number(shape.rotation) || 0);
  }
  if (shape.type === 'rect' && pts.length === 2) return rectPolygon(Math.min(pts[0][0], pts[1][0]), Math.min(pts[0][1], pts[1][1]), Math.max(pts[0][0], pts[1][0]), Math.max(pts[0][1], pts[1][1]));
  return pts;
}

/** Returns { score, skipped: [{ name, reason }] }. */
export function fromMediamime(snapshot) {
  if (snapshot?.kind !== 'mediamime-score' || !Array.isArray(snapshot.shapes)) throw new Error('Not a Mediamime score');
  const skipped = [], regions = [];
  for (const shape of snapshot.shapes) {
    const name = shape.name || shape.id || 'shape';
    const it = shape.interaction ?? {};
    const point = prefixFor(it.stream, it.landmark);
    if (!point) { skipped.push({ name, reason: it.stream === 'pointer' || it.stream === 'keyboard' ? `${it.stream} streams have no body to follow` : 'no landmark' }); continue; }
    const open = shape.type === 'line' || (shape.type === 'freehand' && !shape.closed);
    const points = shapePolygon(shape);
    if (points.length < (open ? 1 : 3)) { skipped.push({ name, reason: 'no geometry' }); continue; }
    const actions = [];
    for (const e of it.events ?? []) {
      const trigger = triggers[e.trigger] ?? 'enter';
      if (e.type === 'midiNote') actions.push(normalizeAction({ ...defaultAction('midiNote'), trigger, channel: e.channel, note: e.note, velocity: valueSpec(e.velocityMode, e.velocityValue, [1, 127]), length_ms: trigger === 'enterExit' ? 0 : 150, cooldown_ms: 0 }));
      if (e.type === 'midiCc') actions.push(normalizeAction({ ...defaultAction('midiCc'), trigger, channel: e.channel, cc: e.cc, value: valueSpec(e.ccValueMode, e.ccValue) }));
    }
    regions.push({ id: String(shape.id || newId('reg')), name, enabled: it.enabled !== false, space: 'image', shape: open ? { type: 'polyline', points, width: Math.max(0.01, (Number(shape.style?.strokeWidth) || 2) / 200) } : { type: 'polygon', points }, tracker: { points: [point], hysteresis: 0.005 }, actions });
  }
  return { score: parseScore({ version: 1, name: 'imported', regions }), skipped };
}
