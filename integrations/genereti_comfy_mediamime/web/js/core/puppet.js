// A puppet: a synthetic body that produces perception-v1 pose (and hand) features. For trying a score without a camera
// (drag its wrists in the homunculus), for tests, and for teaching. Joint positions are in the body frame (u right, v up,
// the torso one unit long, hips at the origin), then placed in the image by a centre, a scale and a tilt.

export const POSE_NAMES = ['nose', 'left_eye_inner', 'left_eye', 'left_eye_outer', 'right_eye_inner', 'right_eye', 'right_eye_outer', 'left_ear', 'right_ear', 'mouth_left', 'mouth_right', 'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky', 'left_index', 'right_index', 'left_thumb', 'right_thumb', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle', 'left_heel', 'right_heel', 'left_foot_index', 'right_foot_index'];
export const HAND_NAMES = ['wrist', 'thumb_cmc', 'thumb_mcp', 'thumb_ip', 'thumb_tip', 'index_mcp', 'index_pip', 'index_dip', 'index_tip', 'middle_mcp', 'middle_pip', 'middle_dip', 'middle_tip', 'ring_mcp', 'ring_pip', 'ring_dip', 'ring_tip', 'pinky_mcp', 'pinky_pip', 'pinky_dip', 'pinky_tip'];

// In the image the person's left is on the right: left landmarks have positive u.
const side = (name, [u, v]) => [name.startsWith('left') ? u : -u, v];
const half = {
  eye_inner: [0.07, 1.64], eye: [0.12, 1.65], eye_outer: [0.17, 1.64], ear: [0.26, 1.58], mouth: [0.09, 1.4],
  shoulder: [0.5, 1], elbow: [0.62, 0.45], wrist: [0.66, -0.05], pinky: [0.7, -0.15], index: [0.69, -0.18], thumb: [0.64, -0.15],
  hip: [0.28, 0], knee: [0.3, -1.0], ankle: [0.3, -1.95], heel: [0.28, -2.02], foot_index: [0.34, -2.1],
};

/** The rest pose in body-frame units. */
export function restPose() {
  const out = { nose: [0, 1.55] };
  for (const name of POSE_NAMES) {
    if (name === 'nose') continue;
    const [lr, ...rest] = name.split('_'), key = rest.join('_');
    const p = half[key] ?? half[key.replace('mouth_', 'mouth')];
    out[name] = side(name, p ?? [0.1, 1]);
  }
  out.mouth_left = [0.09, 1.4]; out.mouth_right = [-0.09, 1.4];
  return out;
}

const UPPER = 0.62, LOWER = 0.6;

/** Two-bone IK in the body frame: the elbow for a shoulder and a wrist target, bending outward. */
export function elbowFor(shoulder, target, outwardSign) {
  const dx = target[0] - shoulder[0], dy = target[1] - shoulder[1];
  let d = Math.hypot(dx, dy);
  const reach = UPPER + LOWER - 1e-3;
  const dist = Math.max(Math.abs(UPPER - LOWER) + 1e-3, Math.min(reach, d));
  const dir = d > 1e-9 ? [dx / d, dy / d] : [0, -1];
  const cosA = (UPPER * UPPER + dist * dist - LOWER * LOWER) / (2 * UPPER * dist);
  const A = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const cands = [A, -A].map(a => { const c = Math.cos(a), s = Math.sin(a); return [shoulder[0] + UPPER * (dir[0] * c - dir[1] * s), shoulder[1] + UPPER * (dir[0] * s + dir[1] * c)]; });
  return cands.sort((p, q) => outwardSign * (q[0] - shoulder[0]) - outwardSign * (p[0] - shoulder[0]) || p[1] - q[1])[0];
}

/**
 * Features for a puppet. state: { cx, cy (the hips, normalized image), scale (torso length in image heights), tilt (radians),
 * left, right (wrist targets [u, v], or null for rest), hands (also produce hands.0 / hands.1), visibility }. width, height: the image.
 */
export function puppetFeatures(state, width, height) {
  const { cx = 0.5, cy = 0.6, scale = 0.2, tilt = 0, hands = false, visibility = 1 } = state;
  const body = restPose();
  const sh = { left: body.left_shoulder, right: body.right_shoulder };
  for (const which of ['left', 'right']) {
    const target = state[which];
    if (!target) continue;
    const sign = which === 'left' ? 1 : -1;
    body[`${which}_wrist`] = target;
    body[`${which}_elbow`] = elbowFor(sh[which], target, sign);
    // Fingers follow the forearm.
    const e = body[`${which}_elbow`], dir = [target[0] - e[0], target[1] - e[1]], l = Math.hypot(...dir) || 1, d = [dir[0] / l, dir[1] / l], n = [-d[1], d[0]];
    body[`${which}_index`] = [target[0] + d[0] * 0.14 + n[0] * 0.02, target[1] + d[1] * 0.14 + n[1] * 0.02];
    body[`${which}_pinky`] = [target[0] + d[0] * 0.1 - n[0] * 0.05, target[1] + d[1] * 0.1 - n[1] * 0.05];
    body[`${which}_thumb`] = [target[0] + d[0] * 0.08 + n[0] * 0.06, target[1] + d[1] * 0.08 + n[1] * 0.06];
  }
  const cos = Math.cos(tilt), sin = Math.sin(tilt);
  // body (u, v) → image: up is (0, -1) at tilt 0.
  const place = ([u, v]) => {
    const ru = u * cos - v * sin, rv = u * sin + v * cos;
    const px = cx * width + ru * scale * height, py = cy * height - rv * scale * height;
    return [px / width, py / height];
  };
  const features = {};
  for (const name of POSE_NAMES) {
    const [x, y] = place(body[name]);
    Object.assign(features, { [`pose.${name}.x`]: x, [`pose.${name}.y`]: y, [`pose.${name}.z`]: 0, [`pose.${name}.visibility`]: visibility, [`pose.${name}.presence`]: visibility });
  }
  features['pose.count'] = 1;
  if (hands) {
    ['left', 'right'].forEach((which, i) => {
      const w = body[`${which}_wrist`], m = body[`${which}_index`], dirv = [m[0] - w[0], m[1] - w[1]], l = Math.hypot(...dirv) || 1, d = [dirv[0] / l, dirv[1] / l], n = [-d[1], d[0]];
      const palm = 0.17;
      HAND_NAMES.forEach((name, k) => {
        const finger = name.split('_')[0], seg = ['mcp', 'pip', 'dip', 'tip', 'cmc', 'ip'].indexOf(name.split('_')[1] ?? 'wrist');
        const lateral = { thumb: 0.5, index: 0.25, middle: 0, ring: -0.25, pinky: -0.5 }[finger] ?? 0;
        const along = finger === 'wrist' ? 0 : finger === 'thumb' ? 0.35 + seg * 0.1 : 1 + (seg === 4 ? 0 : seg) * 0.45 - (name.endsWith('mcp') ? 0.1 : 0);
        const p = place([w[0] + d[0] * palm * along + n[0] * palm * lateral * 0.6, w[1] + d[1] * palm * along + n[1] * palm * lateral * 0.6]);
        Object.assign(features, { [`hands.${i}.${name}.x`]: p[0], [`hands.${i}.${name}.y`]: p[1], [`hands.${i}.${name}.z`]: 0 });
      });
    });
    features['hands.count'] = 2;
  }
  return features;
}

/** A frame in the shape the engine reads (perception-v1), from a puppet. */
export function puppetFrame(state, t, width = 640, height = 480, extra = {}) {
  return { features: puppetFeatures(state, width, height), source: { id: 'puppet', output_slot: 0, revision: 0, width, height, frame_timestamp_ms: t }, ...extra };
}

/** The drum dance: the hands strike the body in turn. at(t) → { left, right } wrist targets. */
export function drumDance({ period = 480, rest = 0.95 } = {}) {
  const pads = [
    ['right', [0.0, 0.42]], ['left', [0.3, -0.5]], ['right', [-0.3, -0.5]], ['left', [0.0, 0.85]],
    ['right', [0.5, 1.02]], ['left', [-0.5, 1.02]],
  ];
  return {
    pads: pads.map(([hand, target], i) => ({ hand, target, index: i })),
    at(t) {
      const k = Math.floor(t / period), phase = (t % period) / period;
      const [hand, target] = pads[k % pads.length];
      const pulse = Math.pow(Math.sin(Math.PI * phase), 2);
      const out = { left: [rest, -0.1], right: [-rest, -0.1] };
      const from = out[hand];
      out[hand] = [from[0] + (target[0] - from[0]) * pulse, from[1] + (target[1] - from[1]) * pulse];
      return out;
    },
  };
}
