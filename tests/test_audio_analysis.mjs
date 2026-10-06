import {test} from 'node:test';
import assert from 'node:assert/strict';
import {levels,analysisFrame,bandLevel,magnitudes,analysisRoots} from '../integrations/genereti_comfy_chop/web/audio-analysis.js';
test('stereo RMS, peak and correlation distinguish silence, mono and inverse phase',()=>{
 assert.deepEqual(levels(new Float32Array(16)),{rms:0,peak:0,correlation:0});
 const wave=Float32Array.from({length:1024},(_,i)=>Math.sin(i*Math.PI*2/64));
 const same=levels(wave,wave),inverse=levels(wave,Float32Array.from(wave,x=>-x));
 assert(Math.abs(same.rms-Math.SQRT1_2)<1e-6);assert.equal(same.peak,1);assert.equal(same.correlation,1);assert.equal(inverse.correlation,-1);
});
test('spectrum maps decibels to amplitude and bins to Hz, including silence',()=>{
 const db=Float32Array.of(-Infinity,0,-20,-40),left=new Float32Array(8);
 assert.deepEqual([...magnitudes(db)].map(x=>Math.round(x*100)),[0,100,10,1]);
 const data=analysisFrame('Spectrum',left,left,db,48000,1.5);
 assert.equal(data.domain,'frequency');assert.deepEqual([...data.channels.frequency],[0,6000,12000,18000]);assert.equal(data.binHz,6000);
 assert.equal(bandLevel(data.channels.magnitude,48000,8,1000,10000),1);
});
test('waveform frames own snapshots; analysis exposes CHOP bands and scalars',()=>{
 const left=new Float32Array(1024).fill(.5),right=new Float32Array(1024).fill(-.5),db=new Float32Array(512).fill(-Infinity);db[2]=0;
 const scope=analysisFrame('Scope',left,right,db,48000,2);left.fill(0);assert.equal(scope.channels.left[0],.5);
 const data=analysisFrame('Analyze',right,right,db,48000,2);
 assert.equal(data.sampleRate,40);assert.equal(data.channels.rms[0],.5);assert.equal(data.channels.peak[0],.5);assert(data.channels.low[0]>0);assert.equal(data.channels.mid[0],0);assert.equal(data.channels.high[0],0);
});

test('side taps inspect only audio connected to an explicitly active output',()=>{
 const defs=new Map([[1,{kind:'Synth'}],[2,{kind:'Output',inputs:{input:1}}],[3,{kind:'Scope',inputs:{input:1}}],[4,{kind:'Spectrum',inputs:{input:3}}],[5,{kind:'Synth'}],[6,{kind:'Analyze',inputs:{input:5}}]]);
 assert.deepEqual([...analysisRoots(defs,new Set([2]))],[2,3,4]);assert.equal(analysisRoots(defs,new Set()).size,0);
});
