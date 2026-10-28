import test from 'node:test';import assert from 'node:assert/strict';
import {Transport,MusicalCursor} from '../integrations/genereti_comfy_performance/web/core/clock.js';
import {parseTimeValue,resolveTimeValue} from '../integrations/genereti_comfy_performance/web/core/timeValue.js';
import {evaluateAutomation,addKey,clipTime} from '../integrations/genereti_comfy_performance/web/core/automation.js';
import {quantizeNote,noteFrequency} from '../integrations/genereti_comfy_performance/web/core/music.js';
import {parseExpression,evaluateExpression,expressionWGSL} from '../integrations/genereti_comfy_texture/web/expression.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('anchor clock recovers stalls; pause holds and tempo edits keep quarter-note phase',()=>{let now=0;const c=new Transport({bpm:120},()=>now);c.play();now=10;near(c.read().seconds,10);near(c.read().quarterNotes,20);c.tempo(60);near(c.read().quarterNotes,20);now=12;near(c.read().quarterNotes,22);near(c.secondsAt(22),12);c.pause();now=20;near(c.read().seconds,12);c.play();now=21;near(c.read().seconds,13);c.seek(3);assert.equal(c.read().playing,false);near(c.read().seconds,3);});
test('multiple missed loop wraps are counted, seek is a distinct epoch',()=>{let now=0;const c=new Transport({loop:{enabled:true,start:2,end:4}},()=>now);c.play();now=11;near(c.read().seconds,3);assert.equal(c.read().iteration,4);c.settle();now=13;assert.equal(c.read().iteration,5);const epoch=c.epoch;c.seek(2);assert.equal(c.read().iteration,0);assert.ok(c.epoch>epoch);});
test('musical durations have explicit PPQ, meter, triplets and strict-next boundaries',()=>{const c=new Transport({bpm:120,signature:{numerator:6,denominator:8}},()=>0);near(resolveTimeValue('bar',c.context()),1.5);near(resolveTimeValue('8nt',c.context()),1/6);near(resolveTimeValue('480 ticks',c.context()),.5);assert.equal(parseTimeValue('ticks',c.context()).ok,false);near(c.nextBoundary('bar').quarterNotes,3);});
test('deadline cursors deduplicate, skip stalled notes and cancel at seek/loop',()=>{let now=0;const c=new Transport({bpm:120},()=>now),cursor=new MusicalCursor();c.play();const a=cursor.deadlines(c);assert.equal(a.length,1);assert.equal(cursor.deadlines(c).length,0);now=2;const b=cursor.deadlines(c);assert.ok(b.every(e=>e.delay>=.015));assert.equal(b[0].index,16);assert.ok(cursor.missed>=15);c.seek(0,{pause:false});assert.notEqual(cursor.deadlines(c)[0].id,a[0].id);c.setLoop({enabled:true,start:0,end:.5});now=2.45;assert.ok(cursor.deadlines(c).every(e=>c.secondsAt(e.index/4)<.5));});
test('automation local offsets, stretch, hold, mute/solo and numeric interpolation',()=>{const doc={duration:8,tracks:[{id:'a',target:{ref:'node',param:'cutoff'}},{id:'b',solo:true,target:{ref:'other',param:'scale'}}],clips:[{id:'a',trackId:'a',timing:{start:0,duration:8},keys:[{time:0,value:1},{time:8,value:9}]},{id:'b',trackId:'b',timing:{start:2,durationMode:'hold',sourceOffset:1,rate:2},keys:[{time:0,value:0},{time:8,value:8}]}]};assert.deepEqual(evaluateAutomation(doc,1),[]);near(evaluateAutomation(doc,3)[0].value,3);doc.tracks[1].solo=false;near(evaluateAutomation(doc,3)[0].value,4);const clip=doc.clips[1];clip.sourceDuration=2;clip.timing.loopMode='loop';near(clipTime(clip,3,8),1);addKey(clip,1.005,4);addKey(clip,1.01,5);assert.equal(clip.keys.filter(x=>Math.abs(x.time-1)<.025).length,1);});
test('shared scale quantization includes negative notes and tuning',()=>{near(quantizeNote(61,{root:0,scale:'major'}),60);near(quantizeNote(-1,{root:0,scale:'major'}),-1);near(noteFrequency(69,{tuning:432}),432);});
test('expression __ fields compile safely without general object access',()=>{const tree=parseExpression('sin(__.time)+__.beat+z');near(evaluateExpression(tree,{g_time:0,g_beat:3,z:2}),5);assert.match(expressionWGSL(tree),/g_beat/);assert.throws(()=>parseExpression('__.constructor'));assert.throws(()=>parseExpression('window.time'));});

import {glslSource} from '../integrations/genereti_comfy_p5/livecode/glsl-source.js';
test('GLSL shared clock uniforms are declared once alongside existing aliases',()=>{const source=glslSource('uniform float u_generetiBeat; void main(){gl_FragColor=vec4(u_generetiBeat,u_generetiTime,iTime,1.);}');assert.equal((source.match(/uniform float u_generetiBeat;/g)||[]).length,1);assert.match(source,/uniform float u_generetiTime;/);assert.match(source,/#define iTime u_time/);});

import {PerformanceService,validateDocument} from '../integrations/genereti_comfy_performance/web/service.js';
test('automation remains transient, respects wires, and saves recorded tails across loops',()=>{
 const previous=globalThis.window;globalThis.window={dispatchEvent(){}};
 const node={id:1,title:'Noise',properties:{generetiLessonRef:'noise'},widgets:[{name:'scale',value:4}],inputs:[]},app={graph:{_nodes:[node],extra:{},change(){}}},service=new PerformanceService(app);service.ready=true;
 try{const {clip}=service.addAutomation(node,'scale');clip.keys=[{time:0,value:2},{time:4,value:10}];service.clock.seek(2);service.tick();near(node._generetiPerformanceValues.scale,6);assert.equal(node.widgets[0].value,4);node.inputs=[{name:'scale',link:2}];service.tick();assert.equal(node._generetiPerformanceValues,undefined);assert.equal(service.conflicts.length,1);node.inputs=[];service.record(node,'scale');service.recording.monotonic-=9;node.widgets[0].value=8;service.stopRecord();const take=service.document.clips.at(-1);assert.ok(take.timing.duration>=9);assert.equal(take.keys.at(-1).value,8);assert.ok(app.graph.extra.generetiPerformance.clips.length===2);const copy=validateDocument(JSON.parse(JSON.stringify(service.document)));assert.equal(copy.version,1);assert.equal(copy.clips.at(-1).keys.at(-1).value,8);const before=service.document;assert.throws(()=>service.load({version:3}));assert.equal(service.document,before);
 }finally{service.dispose();globalThis.window=previous;}
});

test('timeline links a named transport and synchronizes tempo both ways',()=>{
 const app={graph:{_nodes:[],extra:{},change(){}}},service=new PerformanceService(app);
 const transport={id:7,title:'Drum clock',comfyClass:'GeneretiAudioTransport',widgets:[{name:'bpm',value:138},{name:'clock_name',value:'local'}],setDirtyCanvas(){}};
 app.graph._nodes.push(transport);
 try{assert.equal(service.linkProjectTransport(transport),true);assert.equal(service.transportFor(transport),service.clock);assert.equal(service.clock.read().bpm,138);
 service.clock.tempo(94);service.syncProjectTransports();assert.equal(transport.widgets[0].value,94);
 transport.widgets[0].value=121;service.syncProjectTransports();assert.equal(service.clock.read().bpm,121);assert.equal(app.graph.extra.generetiPerformance.transport.bpm,121);
 service.clock.setLoop({enabled:true,start:2,end:4});service.clock.seek(3);assert.equal(service.transportFor(transport).read().seconds,3);assert.equal(service.transportFor(transport).loop.enabled,true);
 transport.widgets[1].value='local';service.syncProjectTransports();assert.notEqual(service.transportFor(transport),service.clock);
 }finally{service.dispose();}
});

test('named live curves appear in the shared performance snapshot',()=>{const app={graph:{_nodes:[],extra:{},change(){}}},service=new PerformanceService(app);const node={id:12,graph:app.graph,widgets:[{name:'name',value:'shape'}]};try{service.liveCurves=new Map([[node,{get:()=>({input:.5,value:.25,points:[[0,0],[1,1]]})}]]);assert.equal(service.snapshot().curves.shape.value,.25);node.graph={};assert.equal(service.snapshot().curves.shape,undefined);}finally{service.dispose();}});
