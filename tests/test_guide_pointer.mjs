import test from 'node:test';import assert from 'node:assert/strict';
import {samplePath,appendPoint} from '../integrations/genereti_comfy_agent/web/js/guide-pointer.js';
import {validateActions} from '../integrations/genereti_comfy_agent/web/js/guide-actions.js';
import {playActions,createRecorder} from '../integrations/genereti_comfy_agent/web/js/guide-cua.js';
const target={nodeType:'Noise',ref:'noise',widget:'scale',part:'parameter'};
test('curved pointer paths interpolate recorded time and preserve turns',()=>{const p=[[0,0,0],[.2,.8,200],[1,1,1000]];assert.deepEqual(samplePath(p,.1),[.1,.4]);assert.deepEqual(samplePath(p,.2),[.2,.8]);assert.deepEqual(samplePath(p,1),[1,1]);});
test('path recorder stays bounded while preserving its first and latest point',()=>{const p=[[0,0,0]];for(let i=1;i<200;i++)appendPoint(p,[i/200,.5],i*40);assert.equal(p.length,96);assert.deepEqual(p[0],[0,0,0]);assert.equal(p.at(-1)[2],5000);});
test('pointer actions reject oversized paths, invalid timing and synthetic selectors',()=>{
 const a={kind:'pointer',target,gesture:'drag',from:[0,.5],to:[1,.5],path:[[0,.5,0],[1,.5,600]],fromValue:3,value:8};assert.equal(validateActions([a])[0].value,8);
 for(const path of [[[0,.5,1],[1,.5,600]],[[0,.5,0],[2,.5,600]],[[0,.5,0],[1,.5,6000]],Array(97).fill([0,0,0]),[[0,0,0],[.5,.5,100],[1,1,50]]])assert.throws(()=>validateActions([{...a,path}]));
 assert.throws(()=>validateActions([{...a,gesture:'move'}]));assert.throws(()=>validateActions([{...a,target:{nodeType:'Noise'}}]));
});
function setup(){
 const listeners=new Map(),row={querySelector:()=>({textContent:'scale'})},el={getBoundingClientRect:()=>({left:100,top:50,width:200,height:40})},h={dataset:{nodeId:'1'},querySelector:()=>el,querySelectorAll:()=>[row]};
 const eventTarget={closest:s=>s==='.lg-node'?h:s==='[data-testid="node-widget"]'?row:null};
 let time=1000,value=3;const realDate=Date.now;Date.now=()=>time;globalThis.CSS={escape:x=>x};
 globalThis.window={addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k)};
 globalThis.document={querySelector:s=>s==='.genereti-tutorial-cursor'?null:h,createElement:()=>({style:{},remove(){}}),body:{append(){}}};
 const node={id:1,type:'Noise',comfyClass:'Noise',properties:{generetiLessonRef:'noise'},inputs:[],widgets:[{name:'scale',options:{min:1,max:20},get value(){return value;},set value(v){value=v;},callback(){}}]};
 const app={graph:{_nodes:[node],getNodeById:()=>node},canvas:{}};
 return {app,node,listeners,event:(x,y)=>({button:0,target:eventTarget,clientX:x,clientY:y}),advance:(ms)=>time+=ms,setValue:v=>value=v,value:()=>value,restore:()=>{Date.now=realDate;}};
}
test('recording captures hover paths and curved drags with one semantic numeric change',()=>{
 const s=setup(),recorder=createRecorder(s.app,{id:99});try{recorder.start();s.listeners.get('pointermove')(s.event(100,60));s.advance(100);s.listeners.get('pointermove')(s.event(130,70));s.advance(100);s.listeners.get('pointerdown')(s.event(130,70));s.advance(100);s.listeners.get('pointermove')(s.event(150,80));s.setValue(8);s.advance(100);s.listeners.get('pointerup')(s.event(200,70));const steps=recorder.stop(),actions=steps.flatMap(s=>s.actions);const drag=actions.find(a=>a.kind==='pointer'&&a.gesture==='drag');assert.ok(actions.some(a=>a.kind==='pointer'&&a.gesture==='move'));assert.equal(drag.path.length,3);assert.equal(drag.fromValue,3);assert.equal(drag.value,8);assert.equal(drag.target.widget,'scale');assert.ok(!actions.some(a=>a.kind==='set-widget'));assert.equal(s.listeners.size,0);}finally{recorder.cancel();s.restore();}
});
test('instant pointer playback changes only its named numeric widget and rejects bad endpoints',async()=>{
 const s=setup();try{await playActions(s.app,[{kind:'pointer',target,gesture:'drag',from:[0,.5],to:[1,.5],fromValue:3,value:8}],{instant:true});assert.equal(s.value(),8);await assert.rejects(playActions(s.app,[{kind:'pointer',target,gesture:'drag',from:[0,.5],to:[1,.5],fromValue:100,value:8}],{instant:true}),/limits/);}finally{s.restore();}
});
