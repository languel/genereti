import test from 'node:test';
import assert from 'node:assert/strict';
import {wavePoints} from '../integrations/genereti_comfy_chop/web/audio-cable-wave-core.js';
test('waveform follows a spline, stays anchored and uses real samples',()=>{
 const silent=wavePoints([0,0],[100,0],'right','left',{},new Float32Array(256));
 const signal=wavePoints([0,0],[100,0],'right','left',{},new Float32Array(256).fill(.5));
 assert.deepEqual(silent[0],[0,0]);assert.deepEqual(silent.at(-1),[100,0]);assert.deepEqual(signal[0],[0,0]);assert.ok(Math.abs(signal.at(-1)[1])<1e-10);assert.ok(signal.some(p=>p[1]>2));
});
