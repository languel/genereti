import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NoteHistory,paintNotes} from '../integrations/genereti_comfy_chop/web/note-visualizer-core.js';
import {axisSample} from '../integrations/genereti_comfy_chop/web/audio-analysis.js';
const midi=(a,b)=>({channels:{'ch1.note60':Float32Array.of(a),'ch1.note64':Float32Array.of(b),'ch1.cc74':Float32Array.of(.7)}});
test('rolling history keeps polyphonic held notes, releases them and prunes expired geometry',()=>{
 const h=new NoteHistory();h.update(midi(.8,.4),0);h.update(midi(.9,.4),1);assert.equal(h.notes.length,2);assert.equal(h.active.size,2);assert.equal(h.notes[0].velocity,Math.fround(.9));h.update(midi(0,.4),2);assert.equal(h.active.size,1);assert.equal(h.notes[0].released,2);assert.equal(h.controls[0].name,'ch1.cc74');h.update(null,3);assert.equal(h.active.size,0);h.update(null,20);assert.equal(h.notes.length,0);
});
test('note shapes draw velocity geometry and fade after release without changing data',()=>{
 const h=new NoteHistory();h.update(midi(.8,0),0);h.update(midi(0,0),.5);const calls=[];const ctx=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args,o.globalAlpha]),set:(o,k,v)=>(o[k]=v,true)}),canvas={width:640,height:360,getContext:()=>ctx};for(const shape of ['bar','circle','diamond'])paintNotes(canvas,h,.7,{shape,fade:1},'#ddd');assert(calls.some(c=>c[0]==='arc'));assert(calls.some(c=>c[0]==='closePath'));assert(calls.some(c=>c[0]==='fillRect'&&c.at(-1)<1));assert.equal(h.notes[0].note,60);
});
test('Lissajous axes independently select channels, difference, mid, side, delay and time',()=>{
 const l=[.2,.6,-.2],r=[.4,.2,.8];assert.equal(axisSample(l,r,'left',1),.6);assert.equal(axisSample(l,r,'right',1),.2);assert.equal(axisSample(l,r,'mid',1),.4);assert(Math.abs(axisSample(l,r,'side',1)-.2)<1e-6);assert(Math.abs(axisSample(l,r,'left_delta',1)-.4)<1e-6);assert.equal(axisSample(l,r,'right_delay',1),.4);assert.equal(axisSample(l,r,'time',0),-1);assert.equal(axisSample(l,r,'time',2),1);assert.equal(axisSample(l,r,'zero',1),0);
});
