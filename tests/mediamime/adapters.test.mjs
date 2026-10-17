import test from 'node:test';
import assert from 'node:assert/strict';
import { fromMediamime } from '../../integrations/genereti_comfy_mediamime/web/js/core/mediamime-import.js';
import { ml5Features, ml5Frame } from '../../integrations/genereti_comfy_mediamime/web/js/core/ml5.js';
import { RegionEngine } from '../../integrations/genereti_comfy_mediamime/web/js/core/engine.js';

test('a Mediamime score becomes a score', () => {
  const snap = { kind: 'mediamime-score', version: 1, shapes: [
    { id: 'a', type: 'rect', name: 'Gate A', points: [{ x: 0.1, y: 0.1 }, { x: 0.4, y: 0.5 }], interaction: { stream: 'pose', landmark: 'left_wrist', events: [{ type: 'midiNote', trigger: 'enterExit', channel: 2, note: 61, velocityMode: 'constant', velocityValue: 96 }, { type: 'midiCc', trigger: 'inside', channel: 1, cc: 74, ccValueMode: 'normX', ccValue: 100 }] } },
    { id: 'b', type: 'ellipse', points: [{ x: 0.5, y: 0.5 }, { x: 0.9, y: 0.9 }], interaction: { stream: 'rightHand', landmark: 'index_finger_tip'.replace('_finger', ''), events: [] } },
    { id: 'c', type: 'line', points: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }], interaction: { stream: 'pointer', landmark: 'pointer', events: [] } },
    { id: 'd', type: 'freehand', closed: true, points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }], interaction: { stream: 'face', landmark: '1', events: [] } },
  ] };
  const { score, skipped } = fromMediamime(snap);
  assert.deepEqual(skipped.map(s => s.name), ['c']);
  assert.equal(score.regions.length, 3);
  const a = score.regions[0];
  assert.equal(a.shape.points.length, 4);
  assert.deepEqual(a.tracker.points, ['pose.left_wrist']);
  assert.deepEqual(a.actions.map(x => [x.type, x.trigger]), [['midiNote', 'enterExit'], ['midiCc', 'inside']]);
  assert.equal(a.actions[0].velocity.value, 96);
  assert.equal(a.actions[1].value.source, 'x');
  assert.deepEqual(score.regions[1].tracker.points, ['hands.*.index_tip']);
  assert.throws(() => fromMediamime({ kind: 'other' }), /Not a Mediamime/);
  // and it runs
  const e = new RegionEngine(score);
  const msgs = [];
  const f = x => ({ features: { 'pose.left_wrist.x': x, 'pose.left_wrist.y': 0.3, 'pose.left_wrist.visibility': 1 }, source: { width: 640, height: 480, frame_timestamp_ms: x * 1000 } });
  [0.05, 0.2, 0.3, 0.7].forEach(x => msgs.push(...e.tick(f(x), x * 1000).messages));
  assert.deepEqual(msgs.filter(m => m.kind === 'midiNote').map(m => m.phase), ['on', 'off']);
});

test('ml5 results become features', () => {
  const f = ml5Features({ width: 640, height: 480,
    poses: [{ keypoints: [{ name: 'nose', x: 320, y: 240, confidence: 0.9 }, { name: 'left_wrist', x: 64, y: 48, confidence: 0.8 }] }],
    hands: [{ handedness: 'Right', keypoints: [{ name: 'index_finger_tip', x: 640, y: 480 }, { name: 'wrist', x: 0, y: 0 }] }, { handedness: 'Left', keypoints: [{ name: 'wrist', x: 320, y: 0 }] }] });
  assert.equal(f['pose.nose.x'], 0.5); assert.equal(f['pose.nose.y'], 0.5); assert.equal(f['pose.left_wrist.visibility'], 0.8);
  assert.equal(f['hands.0.wrist.x'], 0.5);   // left first
  assert.equal(f['hands.1.index_tip.x'], 1);
  const frame = ml5Frame({ width: 640, height: 480, poses: [], hands: [] }, 1234);
  assert.equal(frame.source.frame_timestamp_ms, 1234); assert.equal(frame.features['pose.count'], 0);
});
