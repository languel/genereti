import test from 'node:test';
import assert from 'node:assert/strict';
import {wavePoints,connectionPolyline,wavePolylinePoints} from '../integrations/genereti_comfy_chop/web/audio-cable-wave-core.js';
test('waveform follows a spline, stays anchored and uses real samples',()=>{
 const silent=wavePoints([0,0],[100,0],'right','left',{},new Float32Array(256));
 const signal=wavePoints([0,0],[100,0],'right','left',{},new Float32Array(256).fill(.5));
 assert.deepEqual(silent[0],[0,0]);assert.deepEqual(silent.at(-1),[100,0]);assert.deepEqual(signal[0],[0,0]);assert.ok(Math.abs(signal.at(-1)[1])<1e-10);assert.ok(signal.some(p=>p[1]>2));
});

for(const mode of ['linear','straight'])test(`${mode} waveforms follow native bends, anchor corners and use real samples`,()=>{
 const start=[10,20],end=[210,140],corners=connectionPolyline(start,end,'right','left',mode),quiet=wavePoints(start,end,'right','left',{},new Float32Array(128),14,mode),loud=wavePoints(start,end,'right','left',{},new Float32Array(128).fill(.5),14,mode);
 assert.deepEqual(loud[0],start);assert.deepEqual(loud.at(-1),end);
 for(const corner of corners)assert(loud.some(p=>Math.hypot(p[0]-corner[0],p[1]-corner[1])<1e-8));
 assert(loud.some((p,i)=>Math.hypot(p[0]-quiet[i][0],p[1]-quiet[i][1])>1));
 assert(loud.every(p=>p.every(Number.isFinite)));assert(loud.length<300);
});
test('polyline sampling respects supplied native geometry, reversed links and coincident points',()=>{
 const geometry=[[50,20],[50,20],[20,20],[20,-80]],points=wavePoints([50,20],[20,-80],'up','down',{polyline:geometry},new Float32Array(32),14,'straight');
 assert.deepEqual(points[0],geometry[0]);assert.deepEqual(points.at(-1),geometry.at(-1));assert(points.every(([x,y])=>Math.abs(y-20)<1e-8||Math.abs(x-20)<1e-8));
 assert.deepEqual(wavePolylinePoints([[5,5],[5,5]],Float32Array.of(.5)),[[5,5],[5,5]]);
});
