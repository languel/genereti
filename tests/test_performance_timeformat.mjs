import test from 'node:test';
import assert from 'node:assert/strict';
import {timeExpression, tapTempo, TIME_FORMATS, RULER_MODE, FPS_OPTIONS} from '../integrations/genereti_comfy_performance/web/core/timeformat.js';
import {parseTimeValue, resolveTimeValue} from '../integrations/genereti_comfy_performance/web/core/timeValue.js';
import {Transport} from '../integrations/genereti_comfy_performance/web/core/clock.js';

const ctx = {fps: 25, tempo: 120, signature: {numerator: 3, denominator: 4}, sampleRate: 48000};

test('every display format yields an expression the time-value parser accepts and resolves back', () => {
  for (const {id} of TIME_FORMATS) {
    const e = timeExpression(12.34, id, ctx);
    assert.ok(parseTimeValue(e, ctx).ok, `${id}: ${e}`);
    const tolerance = id === 'timecode' || id === 'frames' ? 1 / ctx.fps : id === 'bars' ? .01 : 1e-3;
    assert.ok(Math.abs(resolveTimeValue(e, ctx) - 12.34) <= tolerance, `${id}: ${e}`);
  }
});

test('formats follow tempo, meter, fps and sample rate', () => {
  assert.equal(timeExpression(1, 'frames', {fps: 24}), '24 f');
  assert.equal(timeExpression(2, 'samples', {sampleRate: 44100}), '88200 samples');
  assert.equal(timeExpression(1, 'ticks', {tempo: 120}), '960 ticks');
  assert.equal(timeExpression(3, 'bars', {tempo: 120, signature: {numerator: 3, denominator: 4}}), '2.0.0');
  assert.equal(timeExpression(61.5, 'timecode', {fps: 30}), '00:01:01:15');
  assert.equal(timeExpression(-5, 'seconds'), '0 s');          // never negative
  assert.equal(timeExpression(1, 'bogus', {fps: 30}), '00:00:01:00');
});

test('ruler modes cover every format', () => {
  for (const {id} of TIME_FORMATS) assert.ok(['seconds', 'beats', 'frame'].includes(RULER_MODE[id]));
});

test('tap tempo averages the recent intervals and restarts after a pause', () => {
  let r = tapTempo([], 0); assert.equal(r.bpm, null);
  r = tapTempo(r.taps, 500); assert.equal(r.bpm, 120);
  r = tapTempo(r.taps, 1000); assert.equal(r.bpm, 120);
  r = tapTempo(r.taps, 1400); assert.ok(Math.abs(r.bpm - 128.6) < .1);     // 1400/3 ms mean
  r = tapTempo(r.taps, 9000); assert.equal(r.bpm, null); assert.deepEqual(r.taps, [9000]);   // gap > 2 s
  assert.equal(tapTempo([0], 100).bpm, 400);                                // clamped
  assert.equal(tapTempo([0], 2000).bpm, 30);
  assert.equal(tapTempo([0], 1990, {gap: 5000}).bpm, 30.2);
  let t = []; for (let i = 0; i < 20; i++) t = tapTempo(t, i * 600).taps; assert.equal(t.length, 8);
});

test('the clock keeps fps in context, snapshot and serialized state', () => {
  const t = new Transport({fps: 24});
  assert.equal(t.context().fps, 24); assert.equal(t.read().fps, 24); assert.equal(t.serialize().fps, 24);
  t.configure({fps: 29.97}); assert.equal(t.fps, 24);                        // unsupported rates are ignored
  t.configure({fps: 60}); assert.equal(t.context().fps, 60);
  const restored = new Transport(t.serialize()); assert.equal(restored.fps, 60);
  assert.equal(new Transport({}).fps, 30);
  assert.deepEqual([...FPS_OPTIONS], [24, 25, 30, 50, 60]);
});
