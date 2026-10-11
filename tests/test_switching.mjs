import test from 'node:test';
import assert from 'node:assert/strict';
import {switchPair,sourceSlots,interpolateData,switchChop} from '../integrations/genereti_comfy_texture/web/switching.js';
test('switch selection clamps, floors and skips unconnected dynamic slots',()=>{
 assert.deepEqual(switchPair(1.25,'float',3),[1,2,.25]);assert.deepEqual(switchPair(1.9,'int',3),[1,2,0]);assert.deepEqual(switchPair(9,'float',2),[1,1,0]);assert.throws(()=>switchPair(NaN,'float',2));assert.throws(()=>switchPair(0,'int',0));
 assert.deepEqual(sourceSlots({inputs:[{name:'sources.source10',link:10},{name:'sources.source2',link:2},{name:'sources.source3',link:null}]}).map(x=>x.link),[2,10]);
});
test('DAT interpolation blends nested numbers, preserves types and uses nearer structure',()=>{
 const a={x:0,nested:{v:[0,2],label:'a',enabled:false},onlyA:1},b={x:8,nested:{v:[8,6],label:'b',enabled:true},onlyB:9};
 assert.deepEqual(interpolateData(a,b,.25),{x:2,nested:{v:[2,3],label:'a',enabled:false},onlyA:1});assert.deepEqual(interpolateData(a,b,.5),{x:4,nested:{v:[4,4],label:'b',enabled:true},onlyB:9});assert.strictEqual(interpolateData(a,b,0),a);assert.deepEqual(interpolateData([1],[3,4],.75),[3,4]);
});
test('CHOP integer passes through and float resamples matching named channels',()=>{
 const a={channels:{x:new Float32Array([0,0,0])},sampleRate:60,start:4},b={channels:{x:new Float32Array([0,8])},sampleRate:30,start:4};
 assert.strictEqual(switchChop([a,b],1,'int'),b);const mixed=switchChop([a,b],.25,'float');assert.deepEqual([...mixed.channels.x],[0,1,2]);assert.equal(mixed.sampleRate,60);assert.equal(mixed.start,4);assert.throws(()=>switchChop([a,{channels:{y:[1]}}],.5,'float'));assert.deepEqual([...a.channels.x],[0,0,0]);
});
