import test from 'node:test';
import assert from 'node:assert/strict';
import {TemporalHistory,cleanupGPU} from '../integrations/genereti_comfy_texture/web/cleanup.js';

test('temporal history advances on new dispatch serials, not reused texture handles or display ticks',()=>{
 const history=new TemporalHistory();let calls=0;const texture={};
 const meta={serial:1,signature:'a',source:'1:0',width:10,height:10};
 const render=(prev,index)=>{calls++;return {texture,width:10,height:10,previous:prev,index};};
 const first=history.update(meta,render);assert.equal(first.previous,null);
 assert.equal(history.update(meta,render),first);assert.equal(calls,1);
 const second=history.update({...meta,serial:2},render);assert.equal(second.previous,first);assert.notEqual(second.index,first.index);
 for(const changed of [{serial:3,source:'2:0'},{serial:4,signature:'b'},{serial:5,width:20}]){
  assert.equal(history.update({...meta,...changed},render).previous,null);
 }
 history.reset();assert.equal(history.update(meta,render).previous,null);
});

test('cleanup sizes output explicitly and skips disabled optional stages',()=>{
 const passes=[];const gpu={target(key,width,height){return {texture:{key},width,height};},pass(a,b,p,t){passes.push(p[0]);},run(a,b,p,key){passes.push(p[0]);return {...a,texture:{key}};}};
 const a={width:32,height:16};const values={width:128,height:64,method:'bicubic',smoothing:0,antialias:0,sharpen:0};
 const out=cleanupGPU(gpu,a,values,'test:');assert.equal(out.width,128);assert.equal(out.height,64);assert.deepEqual(passes,[15]);
 passes.length=0;cleanupGPU(gpu,a,{...values,smoothing:.2,color_threshold:.12,antialias:.3,sharpen:.1},'test:');assert.deepEqual(passes,[16,15,17,18]);
});
