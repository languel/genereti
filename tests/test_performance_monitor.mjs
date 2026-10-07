import test from 'node:test';
import assert from 'node:assert/strict';
import {FrameMonitor} from '../integrations/genereti_comfy_performance/web/core/monitor.js';
import {PerformanceService} from '../integrations/genereti_comfy_performance/web/service.js';
test('browser cadence, slow frames and source delivery rates are separate',()=>{
 const m=new FrameMonitor();[100,116,132,232].forEach(t=>m.frame(t));[100,200,300].forEach(t=>m.source('noise',t));m.task(220,60);m.duration('transport',250,2);const s=m.read(300);
 assert.equal(s.samples,3);assert.equal(s.meanMs,44);assert.equal(s.p95Ms,100);assert.equal(s.slowFrames,1);assert.equal(s.longTasks,1);assert.equal(s.sources[0].fps,10);assert.equal(s.work.transport.meanMs,2);
 const idle=m.read(6000);assert.equal(idle.fps,0);assert.equal(idle.sources.length,0);assert.equal(idle.longTasks,0);m.reset();m.frame(9000);assert.equal(m.read(9000).samples,0);
});
test('monitor history is bounded for fast producers',()=>{
 const m=new FrameMonitor({maxSamples:10});for(let i=1;i<100;i++){m.frame(i);m.source('texture',i);}assert.equal(m.read(100).samples,10);assert.equal(m.read(100).sources[0].frames,10);
});
test('automation retains its value bank and separates UI refreshes from control ticks',()=>{
 const previous=globalThis.window;globalThis.window={dispatchEvent(){}};
 const node={id:1,title:'Source',properties:{generetiLessonRef:'source'},widgets:[{name:'gain',value:1}],inputs:[]},service=new PerformanceService({graph:{_nodes:[node],extra:{},change(){}}});service.ready=true;
 try{const {clip}=service.addAutomation(node,'gain');clip.keys=[{time:0,value:.5}];service.clock.seek(1);let controls=0,ui=0;service.subscribe(()=>controls++);service.subscribeUI(()=>ui++);service.lastUI=performance.now();service.tick();const bank=node._generetiPerformanceValues;service.tick();assert.equal(node._generetiPerformanceValues,bank);assert.equal(controls,2);assert.equal(ui,0);service.publish();assert.equal(ui,1);node.inputs=[{name:'gain',link:1}];service.tick();assert.equal(node._generetiPerformanceValues,undefined);}
 finally{service.dispose();globalThis.window=previous;}
});
