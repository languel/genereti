import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ProbeStats} from '../integrations/genereti_comfy_stream/web/js/probe-stats.js';
test('Probe counts delivered frames, computes cadence and clears idle history',()=>{
 const s=new ProbeStats();for(let i=0;i<61;i++)s.record(i*1000/30,i*1000/30-4);
 const r=s.read(2000);assert.ok(Math.abs(r.rate-30)<1e-8);assert.ok(r.jitter<1e-8);assert.equal(r.delay,4);assert.equal(r.total,61);
 assert.equal(s.read(5000).rate,0);s.record(6000);assert.equal(s.read(6000).rate,0);s.record(6100);assert.equal(s.read(6100).rate,10);s.reset();assert.equal(s.read(6100).total,0);
});
