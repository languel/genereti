import test from 'node:test';
import assert from 'node:assert/strict';
import {LoopCapture} from '../integrations/genereti_comfy_stream/web/js/record-loop.js';
const snapshot=(iteration=0,changes={})=>({playing:true,epoch:1,iteration,loop:{enabled:true,start:0,end:8},...changes});
test('auto capture waits for one complete loop and then stops',()=>{const c=new LoopCapture(snapshot());assert.equal(c.update(snapshot()),null);assert.equal(c.update(snapshot(1)),'start');assert.equal(c.update(snapshot(1)),null);assert.equal(c.update(snapshot(2)),'stop');});
test('auto capture cancels on transport changes and missed start boundaries',()=>{assert.throws(()=>new LoopCapture(snapshot(0,{playing:false})),/Play/);for(const changed of [{playing:false},{epoch:2},{loop:{enabled:true,start:0,end:4}}]){const c=new LoopCapture(snapshot());assert.equal(c.update(snapshot(0,changed)),'cancel');}assert.equal(new LoopCapture(snapshot()).update(snapshot(2)),'cancel');});
