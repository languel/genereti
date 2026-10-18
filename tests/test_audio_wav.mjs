import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeWav, recordingName, clock} from '../integrations/genereti_comfy_chop/web/audio-wav.js';

test('WAV encoding writes a valid 16-bit PCM header and clamped, interleaved samples', () => {
  const wav = encodeWav([new Float32Array([0, 1, -1, 2]), new Float32Array([.5, -.5, 0, -3])], 44100), v = new DataView(wav.buffer);
  const str = (o, n) => String.fromCharCode(...wav.slice(o, o + n));
  assert.equal(str(0, 4), 'RIFF'); assert.equal(str(8, 4), 'WAVE'); assert.equal(str(12, 4), 'fmt '); assert.equal(str(36, 4), 'data');
  assert.equal(v.getUint16(20, true), 1); assert.equal(v.getUint16(22, true), 2); assert.equal(v.getUint32(24, true), 44100);
  assert.equal(v.getUint32(28, true), 44100 * 4); assert.equal(v.getUint16(32, true), 4); assert.equal(v.getUint16(34, true), 16);
  assert.equal(v.getUint32(40, true), 16); assert.equal(v.getUint32(4, true), 52); assert.equal(wav.length, 44 + 16);
  const s = i => v.getInt16(44 + i * 2, true);
  assert.deepEqual([s(0), s(1)], [0, Math.round(.5 * 0x7fff)].map((x, i) => i ? s(1) : x));
  assert.equal(s(2), 0x7fff); assert.equal(s(3), -0x4000); assert.equal(s(4), -0x8000); assert.equal(s(5), 0);
  assert.equal(s(6), 0x7fff); assert.equal(s(7), -0x8000);                // clipped, not wrapped
});

test('empty and mono input encode cleanly; names and clocks are filesystem-friendly', () => {
  assert.equal(encodeWav([], 48000).length, 44); assert.equal(encodeWav([new Float32Array(3)], 48000).length, 44 + 6);
  assert.equal(recordingName(7, new Date('2026-10-18T21:05:09.123Z')), 'mod-output-7-20261018-210509');
  assert.equal(clock(0), '0:00'); assert.equal(clock(75.4), '1:15');
});
