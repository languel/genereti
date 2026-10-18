import test from 'node:test';
import assert from 'node:assert/strict';
import * as c from '../integrations/genereti_comfy_chop/web/audio-ui-core.js';

const near = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) <= e, `${a} vs ${b}`);

test('value scales round-trip on linear, log and power curves', () => {
  for (const curve of ['lin', 'log', 'pow']) for (const v of [20, 440, 2200, 18000]) near(c.fromNorm(c.toNorm(v, 20, 18000, curve), 20, 18000, curve), v, 1e-6 * v);
  near(c.toNorm(632.45553, 20, 20000, 'log'), .5, 1e-4);
  assert.equal(c.toNorm(-5, 0, 1), 0); assert.equal(c.fromNorm(9, 0, 1), 1);
  assert.equal(c.snap(.123, .01), .12);
});

test('formatting is compact and readable', () => {
  assert.equal(c.formatValue(2200, 'hz'), '2.20k'); assert.equal(c.formatValue(440, 'hz'), '440');
  assert.equal(c.formatValue(.02, 's'), '20ms'); assert.equal(c.formatValue(1.5, 's'), '1.50s');
  assert.equal(c.formatValue(0, 'pan'), 'C'); assert.equal(c.formatValue(-.5, 'pan'), 'L50'); assert.equal(c.formatValue(1, 'pan'), 'R100');
  assert.equal(c.formatValue(1, 'db'), '0.0'); assert.equal(c.formatValue(0, 'db'), '−∞');
});

test('fader curve is monotonic and inverts', () => {
  let prev = -1; for (let p = 0; p <= 1; p += .1) { const g = c.faderToGain(p); assert.ok(g >= prev); prev = g; near(c.gainToFader(g), p, 1e-9); }
  near(c.faderToGain(1), 2); assert.ok(c.gainToFader(1) > .7 && c.gainToFader(1) < .78);
});

test('envelope handles map to ADSR and back, and respect limits', () => {
  const env = {attack: .05, decay: .3, sustain: .5, release: .8}, W = 200, H = 80, p = c.envelopePoints(env, W, H);
  assert.ok(p.peak.x > p.start.x && p.sustain.x > p.peak.x && p.hold.x > p.sustain.x && p.end.x > p.hold.x);
  assert.ok(p.end.x <= W);
  assert.ok(p.peak.y < p.sustain.y);                               // peak above sustain
  const dragged = c.envelopeDrag('peak', p.peak.x, p.peak.y, env, W, H);
  near(dragged.attack, env.attack, 1e-6); near(dragged.sustain, env.sustain);
  const s = c.envelopeDrag('sustain', p.sustain.x, p.sustain.y, env, W, H); near(s.decay, env.decay, 1e-6); near(s.sustain, .5, 1e-6);
  const e = c.envelopeDrag('end', p.end.x, p.end.y, env, W, H); near(e.release, env.release, 1e-6);
  const far = c.envelopeDrag('peak', 9999, 0, env, W, H); assert.equal(far.attack, 5);
  const back = c.envelopeDrag('peak', -50, 0, env, W, H); assert.equal(back.attack, .001);
  assert.equal(c.envelopeDrag('sustain', 100, -500, env, W, H).sustain, 1); assert.equal(c.envelopeDrag('sustain', 100, 500, env, W, H).sustain, 0);
  assert.equal(c.nearestHandle(p, p.peak.x + 3, p.peak.y - 2), 'peak'); assert.equal(c.nearestHandle(p, 0, 0, 5), null);
});

test('biquad response has the right shape per mode', () => {
  const m = (t, f) => c.biquadMagnitude(t, 1000, .707, f);
  near(m('lowpass', 20), 1, .01); assert.ok(m('lowpass', 8000) < .02); near(m('lowpass', 1000), .707, .01);
  assert.ok(m('highpass', 50) < .01); near(m('highpass', 15000), 1, .02);
  near(m('bandpass', 1000), 1, .02); assert.ok(m('bandpass', 50) < .1);
  assert.ok(m('notch', 1000) < .01); near(m('notch', 50), 1, .02);
  assert.ok(c.biquadMagnitude('lowpass', 1000, 8, 1000) > 5);       // resonance peaks
  const curve = c.filterCurve('lowpass', 1000, .707); assert.equal(curve.length, 96); near(curve[0].x, 0); near(curve.at(-1).x, 1);
  assert.ok(c.dbToY(0, 100) < c.dbToY(-30, 100));
});

test('drum patterns parse, format, mute, resize and cycle', () => {
  const rows = c.parseDrumPattern('kick:1002;snare~:0300;openhat:0001');
  assert.deepEqual(rows.map(r => [r.name, r.note, r.muted]), [['kick', 36, false], ['snare', 38, true], ['openhat', 46, false]]);
  assert.equal(c.formatDrumPattern(rows), 'kick:1002;snare~:0300;openhat:0001');
  assert.equal(c.formatDrumPattern(c.resizeRows(rows, 6)), 'kick:100210;snare~:030003;openhat:000100');
  assert.deepEqual(c.resizeRows(rows, 2).map(r => r.steps.length), [2, 2, 2]);
  assert.throws(() => c.parseDrumPattern('banjo:1000')); assert.throws(() => c.parseDrumPattern('kick:1004')); assert.throws(() => c.parseDrumPattern('kick:'));
  assert.deepEqual([0, 1, 2, 3].map(c.nextStepValue), [1, 2, 3, 0]);
  assert.ok(c.parseDrumPattern('kick:1000100010001000;snare:0000100000001000;hat:1010101010101010').length === 3);   // old default still valid
});

test('note patterns, names and pitch window', () => {
  assert.deepEqual(c.parseNotePattern('60 - 67,72'), [60, -1, 67, 72]); assert.equal(c.formatNotePattern([60, -1, 67]), '60 - 67');
  assert.throws(() => c.parseNotePattern('128')); assert.throws(() => c.parseNotePattern(''));
  assert.equal(c.noteName(60), 'C4'); assert.equal(c.noteName(61), 'C♯4'); assert.ok(c.isBlackKey(61) && !c.isBlackKey(62));
  const w = c.pitchWindow([60, 72, -1]); assert.ok(w.low <= 58 && w.high >= 74 && w.low % 12 === 0);
  assert.deepEqual(c.pitchWindow([-1]), {low: 48, high: 71});
  assert.equal(c.snapToScale(61, 0, [0, 2, 4, 5, 7, 9, 11]), 60);   // C♯ in C major snaps down
  assert.equal(c.snapToScale(66, 0, [0, 2, 4, 5, 7, 9, 11]), 65);
  assert.equal(c.snapToScale(63, 0, [0, 3, 7]), 63);
});
