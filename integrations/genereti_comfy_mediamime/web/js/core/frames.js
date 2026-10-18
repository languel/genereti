// Reference frames for regions, and the landmark points that trigger them. Features are perception-v1's flat numeric
// paths ('pose.left_wrist.x', 'hands.0.index_tip.y', …), normalized, x right, y down. Regions may live in the image or in a
// frame that follows the body: the torso (the homunculus' space) or a hand.

export const MIN_CONFIDENCE = 0.4;

/** A landmark by feature prefix ('pose.left_wrist'), or null when it is missing or not confident. */
export function pointOf(features, prefix, minConfidence = MIN_CONFIDENCE) {
  const x = features?.[prefix + '.x'], y = features?.[prefix + '.y'];
  if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  const confidence = Math.min(features[prefix + '.visibility'] ?? 1, features[prefix + '.presence'] ?? 1);
  if (confidence < minConfidence) return null;
  const z = features[prefix + '.z'];
  return { x, y, z: Number.isFinite(z) ? z : 0, confidence };
}

/**
 * Landmark specs to concrete points. 'pose.left_wrist' is itself; 'hands.*.index_tip' is every detected hand's index tip;
 * 'virtual.belly' is a point the score defines (virtual: { belly: { type: 'mid', of: [a, b] } }).
 * Returns [{ id, x, y, z, confidence }].
 */
export function resolvePoints(features, spec, { virtual = {}, minConfidence = MIN_CONFIDENCE } = {}) {
  if (spec.startsWith('virtual.')) {
    const p = virtualPoint(features, virtual[spec.slice(8)], virtual, minConfidence, 0);
    return p ? [{ id: spec, ...p }] : [];
  }
  if (spec.includes('*')) {
    const [head, tail] = spec.split('*');   // 'hands.' + '.index_tip'
    const seen = new Set();
    for (const key of Object.keys(features ?? {})) {
      if (!key.startsWith(head) || !key.endsWith('.x')) continue;
      const rest = key.slice(head.length, -2);
      const at = tail ? rest.indexOf(tail) : rest.length;
      if (at < 0 || (tail && rest.slice(at) !== tail)) continue;
      if (!/^\d+$/.test(rest.slice(0, at))) continue;   // hands.0 and hands.left are the same hand: the wildcard means the numbered ones
      seen.add(head + rest.slice(0, at) + tail);
    }
    return [...seen].sort().flatMap(id => { const p = pointOf(features, id, minConfidence); return p ? [{ id, ...p }] : []; });
  }
  const p = pointOf(features, spec, minConfidence);
  return p ? [{ id: spec, ...p }] : [];
}

/** Points the score defines out of landmarks: mid (between), lerp (between, at t), offset (from a point, by a vector of the torso). */
function virtualPoint(features, def, virtual, minConfidence, depth) {
  if (!def || depth > 4) return null;
  const get = name => (name.startsWith('virtual.') ? virtualPoint(features, virtual[name.slice(8)], virtual, minConfidence, depth + 1) : pointOf(features, name, minConfidence));
  if (def.type === 'mid' || def.type === 'lerp') {
    const [a, b] = def.of.map(get);
    if (!a || !b) return null;
    const t = def.type === 'mid' ? 0.5 : def.t ?? 0.5;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, confidence: Math.min(a.confidence, b.confidence) };
  }
  return null;
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * The torso frame, from the shoulders and hips, in pixels: origin mid-hips, `up` toward the mid-shoulders, `right` the image's
 * right when the person stands upright, scale the torso length. A point maps to (u, v) in torso units: shoulders at v = 1.
 */
export function bodyFrame(features, width, height, minConfidence = MIN_CONFIDENCE) {
  const ls = pointOf(features, 'pose.left_shoulder', minConfidence), rs = pointOf(features, 'pose.right_shoulder', minConfidence);
  const lh = pointOf(features, 'pose.left_hip', minConfidence), rh = pointOf(features, 'pose.right_hip', minConfidence);
  if (!ls || !rs || !lh || !rh) return null;
  const S = [((ls.x + rs.x) / 2) * width, ((ls.y + rs.y) / 2) * height], M = [((lh.x + rh.x) / 2) * width, ((lh.y + rh.y) / 2) * height];
  const L = dist(S, M);
  if (L < 1e-6) return null;
  const up = [(S[0] - M[0]) / L, (S[1] - M[1]) / L];
  return { kind: 'body', origin: M, up, right: [-up[1], up[0]], scale: L, width, height };
}

/** A hand's frame: origin the wrist, `up` toward the middle knuckle, scale the palm length. */
export function handFrame(features, index, width, height, minConfidence = MIN_CONFIDENCE) {
  const w = pointOf(features, `hands.${index}.wrist`, minConfidence), m = pointOf(features, `hands.${index}.middle_mcp`, minConfidence);
  if (!w || !m) return null;
  const O = [w.x * width, w.y * height], P = [m.x * width, m.y * height], L = dist(O, P);
  if (L < 1e-6) return null;
  const up = [(P[0] - O[0]) / L, (P[1] - O[1]) / L];
  return { kind: 'hand', origin: O, up, right: [-up[1], up[0]], scale: L, width, height };
}

/** Normalized image coordinates into a frame's (u, v). */
export function toFrame(frame, x, y) {
  const dx = x * frame.width - frame.origin[0], dy = y * frame.height - frame.origin[1];
  return [(dx * frame.right[0] + dy * frame.right[1]) / frame.scale, (dx * frame.up[0] + dy * frame.up[1]) / frame.scale];
}

/** A frame's (u, v) back to normalized image coordinates. */
export function fromFrame(frame, u, v) {
  const px = frame.origin[0] + (u * frame.right[0] + v * frame.up[0]) * frame.scale;
  const py = frame.origin[1] + (u * frame.right[1] + v * frame.up[1]) * frame.scale;
  return [px / frame.width, py / frame.height];
}

/** Which frame a region's space needs: 'image' (none), 'body', or 'hand.N'. */
export function frameFor(space, features, width, height, minConfidence = MIN_CONFIDENCE) {
  if (space === 'body') return bodyFrame(features, width, height, minConfidence);
  if (space?.startsWith('hand.')) return handFrame(features, Number(space.slice(5)), width, height, minConfidence);
  return null;
}
