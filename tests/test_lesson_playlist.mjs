import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('lesson outline opens indexed steps and follows playback without an active guide',async()=>{
 let extension,tick,current=null,started;const elements=[];
 const element=()=>{const el={style:{},children:[],append(...els){this.children.push(...els);},replaceChildren(){this.children=[];},setAttribute(k,v){this[k]=v;},get firstElementChild(){return this.children[0];}};elements.push(el);return el;};
 const guide={id:'test',title:'Test',steps:[{title:'One',text:'First'},{title:'Two',text:'Second'}]};
 const context=vm.createContext({app:{registerExtension(e){extension=e;}},window:{generetiGuides:{current:()=>current,list:async()=>[],register(){},start:async(id,index)=>{started=[id,index];current={id,index};}}},document:{createElement:element},ensureControlStyle(){},documentExportControls:element,createRecorder(){return {cancel(){}};},validateGuide:JSON.parse,guideMarkdown:()=>'',Option:class{},setInterval(fn){tick=fn;},clearInterval(){}});
 // JSON has already been parsed by the author surface.
 context.validateGuide=value=>value;
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_dat/web/lesson.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),context);
 const node={comfyClass:'GeneretiDatLesson',properties:{},widgets:[{name:'guide',value:JSON.stringify(guide)}],addDOMWidget(){return {};}};
 extension.nodeCreated(node);tick(); // no active playback must not throw
 const outline=elements.find(e=>e.children.length===2&&e.children.every(c=>c.firstElementChild?.title==='Open this tutorial step'));
 await outline.children[1].firstElementChild.onclick({stopPropagation(){}});
 assert.deepEqual(started,['test',1]);tick();assert.equal(outline.children[1].firstElementChild['aria-current'],'step');assert.equal(outline.children[0].firstElementChild['aria-current'],'false');
 current=null;tick();assert.equal(outline.children[1].firstElementChild['aria-current'],'false');
});
