import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function fixture(native=false){
 const elements=[];
 const element=tag=>{const e={tag,children:[],style:{},classList:{add(){}},setAttribute(k,v){this[k]=v;},append(...items){this.children.push(...items);},insertBefore(item){this.children.push(item);},getContext(){return {drawImage(){}};}};elements.push(e);return e;};
 const frames=[],requests=[],projectors=[],timers=[];
 const drawing={id:1,comfyClass:'GeneretiDrawing',_generetiDrawing:{captureDataUrl:async()=> 'data:image/png;base64,drawing'}};
 const node={id:2,comfyClass:native?'GeneretiSDXSGenerate':'GeneretiLiveGenerator',inputs:[{name:'image',link:1}],widgets:['prompt','mode','style','preprocess','seed','strength','control_scale'].map((name,i)=>({name,value:['ink','sketch','base',true,42,.65,1][i]})),addDOMWidget(name,type,container){this.container=container;return {};}};
 if(native)node.widgets.push({name:'model_path',value:'256/unet.mlpackage'});
 const context=vm.createContext({document:{createElement:element},window:{addEventListener(){}},app:{registerExtension(){},graph:{links:{1:{origin_id:1}},getNodeById(id){return drawing;}}},ensureControlStyle(){},projectorLink(){projectors.push(1);return {};},publishLive(n,b){frames.push([n.id,b]);},AbortController,AbortSignal,performance,setInterval(){return 1;},clearInterval(){},setTimeout(fn){timers.push(fn);return 1;},clearTimeout(){},createImageBitmap:async()=>({width:8,height:8,close(){this.closed=true;}}),fetch:async(url,options)=>{requests.push([url,options]);return {ok:true,json:async()=>({ready:true,size:256}),blob:async()=>new Blob(),headers:{get(){return '1';}}};},Blob});
 const source=readFileSync(new URL('../integrations/genereti_comfy_stream/web/js/live-preview.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');
 vm.runInContext(source,context);context.attachLivePreview(node);
 return {context,node,elements,frames,requests,projectors,timers,button:elements.find(e=>e.tag==='button')};
}

test('generator publishes inference to viewers without embedding a viewer or projector',async()=>{
 const f=fixture();assert.equal(f.projectors.length,0);assert.equal(f.node.container.children.some(e=>e.tag==='canvas'),false);
 await f.button.onclick();for(let i=0;i<12;i++)await Promise.resolve();
 assert.equal(f.frames.length,1);assert.equal(f.frames[0][0],2);assert.equal(f.frames[0][1].closed,true);
 const payload=JSON.parse(f.requests.find(([u])=>u.endsWith('/api/generate'))[1].body);
 assert.equal(payload.image,'data:image/png;base64,drawing');assert.equal(payload.mode,'sketch');
 f.node._generetiSetExecutionMode('Comfy Queue');assert.equal(f.button.disabled,true);assert.equal(f.button.textContent,'▶');
 f.node.onRemoved();
});

const settle=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
test('a Live viewer starts the generator; release stops it and Queue blocks inference',async()=>{
 const f=fixture();f.node._generetiLiveSource.retain();await settle();
 assert.equal(f.frames.length,1);assert.equal(f.button.textContent,'■');
 f.node._generetiLiveSource.release();assert.equal(f.button.textContent,'▶');
 f.node._generetiExecutionMode='Comfy Queue';f.node._generetiSetExecutionMode('Comfy Queue');
 const calls=f.requests.length;f.node._generetiLiveSource.retain();await settle();assert.equal(f.requests.length,calls);
 f.node._generetiExecutionMode='Live';f.node._generetiSetExecutionMode('Live');await settle();assert.equal(f.frames.length,2);
 await f.button.onclick();assert.equal(f.button.textContent,'▶');
 f.node._generetiLiveSource.retain();await settle();assert.equal(f.frames.length,2,'manual pause survives new subscriptions');
 f.node.onRemoved();
});

test('shared runtime viewer subscription receives generator frames automatically',async()=>{
 const f=fixture();const bus=new EventTarget();
 f.context.window=bus;f.context.CustomEvent=class extends Event{constructor(type,options){super(type);this.detail=options.detail;}};
 f.context.setInterval=()=>1;f.context.clearInterval=()=>{};
 const graph={links:{1:{origin_id:1,origin_slot:0},2:{origin_id:2,origin_slot:0}},getNodeById(id){return id===2?f.node:null;}};
 // Generator capture still resolves the real source using its existing app graph.
 f.node.graph=graph;f.context.app.graph.links=graph.links;
 const viewer={id:3,comfyClass:'GeneretiLiveImagePreview',inputs:[{name:'image',link:2}],graph};
 const runtime=readFileSync(new URL('../integrations/genereti_comfy_p5/web/js/live-runtime.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');
 vm.runInContext(runtime,f.context);
 f.context.app.graph.getNodeById=id=>id===2?f.node:{id:1,comfyClass:'GeneretiDrawing',_generetiDrawing:{captureDataUrl:async()=> 'data:image/png;base64,drawing'}};
 const delivered=[];const unsubscribe=f.context.subscribeLive(viewer,event=>delivered.push(event));await settle();
 assert.equal(delivered.length,1);assert.equal(delivered[0].nodeId,2);assert.equal(delivered[0].outputSlot,0);
 unsubscribe();assert.equal(f.button.textContent,'▶');f.node.onRemoved();
});

test('native generator streams via Comfy routes with connected model bundle',async()=>{
 const f=fixture(true);f.node._generetiLiveSource.retain();await settle();
 assert.equal(f.frames.length,1);
 assert.equal(f.requests[0][0],'/genereti/coreml/status');
 const [url,options]=f.requests.find(([u])=>u.endsWith('/generate'));assert.equal(url,'/genereti/coreml/generate');
 const payload=JSON.parse(options.body);assert.equal(payload.model_path,'256/unet.mlpackage');assert.equal(payload.family,'sdxs');assert.equal('resolution' in payload,false);assert.equal('adapter' in payload,false);assert.equal(payload.image,'data:image/png;base64,drawing');
 f.node.onRemoved();
});


test('held prompt stays applied until Send and movement advances smooth noise phase',async()=>{
 const f=fixture();
 const toggle=f.elements.find(e=>e.tag==='button'&&e.textContent==='↯');
 const send=f.elements.find(e=>e.tag==='button'&&e.textContent==='↑');
 toggle.onclick();f.node.widgets.find(w=>w.name==='prompt').value='draft';
 f.node.widgets.push({name:'movement',value:2});
 f.node._generetiLiveSource.retain();await settle();
 const payloads=()=>f.requests.filter(([u])=>u.endsWith('/generate')).map(([,o])=>JSON.parse(o.body));
 assert.equal(payloads()[0].prompt,'ink');assert.equal(payloads()[0].noise_phase,.07);
 assert.equal(f.node.widgets.find(w=>w.name==='prompt').serializeValue(),'ink');
 send.onclick();await f.timers.at(-1)();await settle();
 assert.equal(payloads()[1].prompt,'draft');assert.equal(payloads()[1].noise_phase,.14);
 f.node.onRemoved();
});

test('top transport keeps old positional workflows and preserves named drafts',()=>{
 const f=fixture();
 f.context.Option=class{constructor(text,value){this.text=text;this.value=value;}};
 const original=f.context.document.createElement;
 f.context.document.createElement=tag=>{const e=original(tag);e.add=()=>{};e.addEventListener=()=>{};return e;};
 const source=readFileSync(new URL('../integrations/genereti_comfy_p5/web/js/live-runtime.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');
 vm.runInContext(source,f.context);
 const node={comfyClass:'GeneretiSDXSGenerate',widgets:[{name:'prompt',value:'initial'},{name:'movement',value:0},{name:'invert',value:false}],addDOMWidget(name,type,element,options){const w={name,element,options,value:'Live'};this.widgets.push(w);return w;}};
 f.context.attachExecutionMode(node);
 assert.equal(node.widgets[0].name,'genereti_delivery');
 // Mimic LiteGraph assigning a legacy transport value to a newly added field.
 node.widgets.find(w=>w.name==='invert').value='Live';
 node.widgets.find(w=>w.name==='movement').value=undefined;
 node.onConfigure({widgets_values:['saved','Comfy Queue'],properties:{genereti_widget_values:{invert:'Live',movement:null}}});
 assert.equal(node.widgets.find(w=>w.name==='invert').value,false);
 assert.equal(node.widgets.find(w=>w.name==='prompt').value,'saved');
 assert.equal(node.widgets.find(w=>w.name==='movement').value,0);
 assert.equal(node._generetiExecutionMode,'Comfy Queue');
 const saved={};node.onSerialize(saved);
 assert.equal(saved.properties.genereti_widget_values.prompt,'saved');
 assert.deepEqual(Array.from(saved.widgets_values),['saved',0,false,'Comfy Queue']);
 f.node.onRemoved();
});


test('native live payload repairs a stale transport string in invert',async()=>{
 const f=fixture(true);f.node.widgets.push({name:'invert',value:'Live'});
 f.node._generetiLiveSource.retain();await settle();
 const payload=JSON.parse(f.requests.find(([u])=>u.endsWith('/generate'))[1].body);
 assert.equal(payload.invert,false);assert.equal(f.frames.length,1);f.node.onRemoved();
});
