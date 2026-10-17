// The homunculus: a canonical figure in body-frame units (the torso one unit long, hips at the origin, shoulders at v = 1),
// the same space as `space: 'body'` regions. It is the board you draw body-anchored regions on, and the map you pick landmarks
// from. Pure geometry; the SVG picker is in ../ui/picker.js.
import { HAND_NAMES, POSE_NAMES, restPose } from './puppet.js';

/** The body board, in Poliplan world units, relative to its top-left corner: hips at (originX, originY), one torso = scale. */
export const BODY_BOARD = { width: 800, height: 1150, scale: 250, originX: 400, originY: 540 };

// MediaPipe's connections between the 33 pose landmarks and the 21 hand landmarks, by index.
export const POSE_EDGES = [[0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20], [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]];
export const HAND_EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];

/** The body figure: joints as { id: 'pose.left_wrist', name, u, v } and bones as pairs of joint indexes. */
export function bodyFigure() {
  const rest = restPose();
  return { joints: POSE_NAMES.map(name => ({ id: `pose.${name}`, name, u: rest[name][0], v: rest[name][1] })), edges: POSE_EDGES };
}

/**
 * A hand drawn flat, wrist at the origin and the middle finger pointing up (v), about one palm long per segment unit. The ids
 * are wildcards ('hands.*.index_tip': whichever hand) so a pick matches either hand.
 */
export function handFigure() {
  const fingers = { thumb: [-0.95, 0.35], index: [-0.3, 1.0], middle: [0, 1.05], ring: [0.28, 1.0], pinky: [0.55, 0.9] };
  const joints = HAND_NAMES.map(name => {
    if (name === 'wrist') return { id: 'hands.*.wrist', name, u: 0, v: 0 };
    const [finger, part] = name.split('_');
    const [angle, length] = fingers[finger];
    const steps = finger === 'thumb' ? { cmc: 0.3, mcp: 0.55, ip: 0.8, tip: 1 } : { mcp: 0.55, pip: 0.8, dip: 0.93, tip: 1.05 };
    const base = finger === 'thumb' ? [-0.2, 0.15] : [angle * 0.45, 0.45];
    const dir = finger === 'thumb' ? [-0.75, 0.66] : [angle * 0.55, 1];
    const n = Math.hypot(...dir);
    const t = (steps[part] ?? 0.5) * length * 0.9;
    return { id: `hands.*.${name}`, name, u: base[0] + (dir[0] / n) * t, v: base[1] + (dir[1] / n) * t };
  });
  return { joints, edges: HAND_EDGES };
}

/** A body-frame (u, v) as a Poliplan world point, for a body board whose top-left corner is at (x, y). */
export function bodyToWorld(board, u, v) {
  return [board.x + BODY_BOARD.originX + u * BODY_BOARD.scale, board.y + BODY_BOARD.originY - v * BODY_BOARD.scale];
}

export function worldToBody(board, x, y) {
  return [(x - board.x - BODY_BOARD.originX) / BODY_BOARD.scale, (board.y + BODY_BOARD.originY - y) / BODY_BOARD.scale];
}

/** The body board as `regionsFromPoliplan` wants it. */
export function bodyBoardFor(board) {
  return { id: board.id ?? 'body', origin: [board.x + BODY_BOARD.originX, board.y + BODY_BOARD.originY], scale: BODY_BOARD.scale };
}

/** The six pads of the drum dance on the body, in torso units: [name, u, v, radius, midi note]. */
export const DRUM_PADS = [
  ['belly', 0, 0.42, 0.27, 36],
  ['thigh left', 0.3, -0.5, 0.26, 38],
  ['thigh right', -0.3, -0.5, 0.26, 42],
  ['chest', 0, 0.85, 0.24, 45],
  ['shoulder left', 0.5, 1.02, 0.2, 49],
  ['shoulder right', -0.5, 1.02, 0.2, 51],
];
