import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateGuide,guideMarkdown} from '../integrations/genereti_comfy_agent/web/js/guide-model.js';
import {parseParameters} from '../integrations/genereti_comfy_p5/web/js/code-parameters.js';
import {firstPaintFallback} from '../integrations/genereti_comfy_p5/livecode/first-paint.js';

const load=name=>JSON.parse(readFileSync(new URL('../integrations/genereti_comfy_agent/web/lessons/'+name+'.json',import.meta.url),'utf8'));
test('Livecode lessons target exact instances and valid annotated parameter sockets',()=>{
 for(const key of ['shader-buffers','p5-pipeline','av-livecode']){
  const flow=load(key),guide=validateGuide(load(key+'-guide')),refs=new Map(flow.nodes.map(n=>[n.properties.generetiLessonRef,n]));
  assert.equal(guide.steps.length,5);assert.match(guideMarkdown(guide),/Hint:/);
  assert.deepEqual(JSON.parse(flow.nodes.find(n=>n.type==='GeneretiDatLesson').widgets_values_named.guide),load(key+'-guide'));
  for(const n of flow.nodes.filter(n=>n.type==='GeneretiLivecode')){
   const names=parseParameters(n.widgets_values_named.code).map(p=>p.name);
   assert.deepEqual(names,Object.keys(n.properties.generetiLivecodeParameters.slots));
   for(const [name,slot]of Object.entries(n.properties.generetiLivecodeParameters.slots))assert.ok(n.inputs.some(i=>i.name===`controls.value${slot}`&&i.label===name));
  }
  for(const step of guide.steps){assert.equal(refs.get(step.target.ref)?.type,step.target.nodeType);assert.ok(step.hint.length);for(const action of step.actions??[]){assert.equal(refs.get(action.target.ref)?.type,action.target.nodeType);if(action.source)assert.equal(refs.get(action.source.ref)?.type,action.source.nodeType);}}
 }
});
test('shader history refers to the composite; wired image graph remains acyclic',()=>{
 const flow=load('shader-buffers'),ref=flow.nodes.find(n=>n.type==='GeneretiTextureFeedbackRef'),composite=flow.nodes.find(n=>n.type==='GeneretiTextureComposite');
 assert.equal(JSON.parse(ref.widgets_values_named.reference).ref,composite.properties.generetiLessonRef);
 const visit=(id,seen=new Set())=>{assert.ok(!seen.has(id),'cyclic IMAGE wire');const path=new Set(seen).add(id);for(const link of flow.links.filter(l=>l[1]===id))visit(link[3],path);};
 for(const n of flow.nodes)visit(n.id);
});
test('audio lesson never replays audio activation and routes analysis to visual energy',()=>{
 const flow=load('av-livecode'),guide=validateGuide(load('av-livecode-guide'));
 assert.equal(guide.steps[0].actions,undefined);
 const visual=flow.nodes.find(n=>n.type==='GeneretiLivecode'),link=flow.links.find(l=>l[3]===visual.id&&visual.inputs[l[4]].name==='controls.value0');
 assert.equal(flow.nodes.find(n=>n.id===link[1]).type,'GeneretiChopMath');assert.equal(link[2],1);
 assert.ok(!guide.steps.flatMap(s=>s.actions??[]).some(a=>a.kind==='run-code'||a.kind==='view'));
});
test('offscreen first paint runs only for a pending candidate and can be cancelled',()=>{
 let callback,painted=0,cancelled,waiting=true;
 const options={schedule:fn=>(callback=fn,17),cancel:id=>cancelled=id};
 const stop=firstPaintFallback(()=>painted++,()=>waiting,options);callback();assert.equal(painted,1);
 waiting=false;callback();assert.equal(painted,1);stop();assert.equal(cancelled,17);
});
