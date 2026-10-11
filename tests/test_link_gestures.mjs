import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {crossedLinks,applyLinkGesture} from '../integrations/genereti_comfy_agent/web/js/link-gesture-core.js';

test('crossing detection follows native rendered paths, including shared reroute segments',()=>{
 const item={path:{x:50},linkIds:new Set([1,2])},g={links:new Map([[1,{id:1}],[2,{id:2}]])};let restored=false;
 const c={graph:g,ds:{scale:2},renderedPaths:new Set([item]),ctx:{save(){},restore(){restored=true;},setTransform(){},isPointInStroke(path,x,y){return Math.abs(x-path.x)<1&&y===20;}}};
 const hits=crossedLinks(c,[0,20],[100,20]);assert.equal(hits.length,1);assert.deepEqual(hits[0].ids,[1,2]);assert.equal(restored,true);
 assert.equal(crossedLinks(c,[0,40],[10,40]).length,0);
});

test('cut processes shared branches once in one native undo transaction',()=>{
 const actions=[],graph={links:new Map([[1,{}],[2,{}]]),removeLink(id){actions.push(id);this.links.delete(id);}};
 const c={graph,emitBeforeChange(){actions.push('before');},emitAfterChange(){actions.push('after');},setDirty(){actions.push('dirty');}};
 assert.equal(applyLinkGesture(c,'cut',[{ids:[1,2]},{ids:[1]}]),2);assert.deepEqual(actions,['before',1,2,'after','dirty']);
});

test('reroute delegates to native segment splitting without recreating IMAGE nodes or links',()=>{
 const shared={id:8},actions=[],graph={links:new Map([[1,{}],[2,{}]]),createReroute(pos,item){actions.push([pos,item]);return {id:9};}};
 const c={graph,emitBeforeChange(){},emitAfterChange(){},setDirty(){}};
 assert.equal(applyLinkGesture(c,'reroute',[{item:shared,pos:[10,20],ids:[1,2]},{item:{},pos:[30,40],ids:[1]}]),1);
 assert.deepEqual(actions,[[[10,20],shared]]);
});

test('saved toggle leaves native events alone when off and cancels a pending cut',async()=>{
 const listeners=new Map(),path={},link={id:1,path,color:'#abcdef'},graph={links:new Map([[1,link]]),removeLink(id){this.links.delete(id);}};
 const el={focus(){},setPointerCapture(){},hasPointerCapture(){return false;}};
 const canvas={canvas:el,graph,ds:{scale:1},renderedPaths:new Set([link]),ctx:{save(){},restore(){},setTransform(){},isPointInStroke(){return true;}},convertEventToCanvasOffset(e){return [e.clientX,0];},emitBeforeChange(){},emitAfterChange(){},setDirty(){}};
 let enabled=true,extension;
 const app={canvas,ui:{settings:{getSettingValue(){return enabled;}}},registerExtension(e){extension=e;}};
 const code=(await readFile(new URL('../integrations/genereti_comfy_agent/web/js/link-gestures.js',import.meta.url),'utf8')).replace(/^import .*;$/gm,'').replace(/^export /gm,'');
 const overlays=new Set();
 const document={body:{appendChild(el){overlays.add(el);}},createElementNS(namespaceURI){return {namespaceURI,style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},appendChild(){},remove(){overlays.delete(this);}};}};
 vm.runInNewContext(code,{app,document,crossedLinks,applyLinkGesture,WeakSet,Set,Map,performance:{now:()=>1000},window:{addEventListener(type,fn){const list=listeners.get(type)??[];list.push(fn);listeners.set(type,list);},removeEventListener(){}}});
 extension.setup();assert.equal(extension.settings[0].defaultValue,true);
 const emit=type=>{let consumed=false;const e={target:el,button:2,ctrlKey:true,pointerId:1,clientX:10,preventDefault(){consumed=true;},stopImmediatePropagation(){}};for(const fn of listeners.get(type)??[])fn(e);return consumed;};
 enabled=false;assert.equal(emit('pointerdown'),false);assert.equal(graph.links.size,1);
 enabled=true;assert.equal(emit('pointerdown'),true);emit('pointermove');assert.equal(link.color,'#ff6262');assert.equal(overlays.size,1);enabled=false;emit('pointerup');assert.equal(graph.links.size,1);assert.equal(link.color,'#abcdef');assert.equal(overlays.size,0);
 enabled=true;emit('pointerdown');emit('pointermove');for(const fn of listeners.get('keydown'))fn({key:'Escape',preventDefault(){},stopImmediatePropagation(){}});assert.equal(link.color,'#abcdef');assert.equal(overlays.size,0);assert.equal(graph.links.size,1);
 emit('pointerdown');emit('pointermove');emit('pointerup');assert.equal(graph.links.size,0);assert.equal(link.color,'#abcdef');assert.equal(overlays.size,0);
});
