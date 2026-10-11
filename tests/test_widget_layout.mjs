import test from 'node:test';
import assert from 'node:assert/strict';
import {allocatedWidgetHeight,intrinsicRowHeight,previewWidgetHeight} from '../integrations/genereti_comfy_p5/web/js/widget-layout.js';
test('classic editor uses allocated content space including DOM margins',()=>{
 assert.equal(allocatedWidgetHeight({computedHeight:304,margin:10}),284);
 assert.equal(allocatedWidgetHeight({computedHeight:NaN,margin:10}),300);
});
test('transport height does not feed its assigned height back into node sizing',()=>{
 const element={scrollHeight:146,children:[{offsetHeight:30},{offsetHeight:30},{hidden:true,offsetHeight:120}]};
 assert.equal(intrinsicRowHeight(element),40);
 element.scrollHeight=300;assert.equal(intrinsicRowHeight(element),40);
});
test('preview allocation includes controls, aspect ratio and DOM margins',()=>{
 assert.equal(previewWidgetHeight(400,.75),407);
 assert.equal(previewWidgetHeight(10,.75),122);
});

test('Vue editor fills its row while controls retain intrinsic heights and collapse stays compact',async()=>{
 const {attachEditorFill}=await import('../integrations/genereti_comfy_p5/web/js/widget-layout.js');
 const original={raf:globalThis.requestAnimationFrame,cancel:globalThis.cancelAnimationFrame,observer:globalThis.ResizeObserver};
 const queued=[];let minimum=208,collapsed=false;
 globalThis.requestAnimationFrame=fn=>{queued.push(fn);return queued.length;};globalThis.cancelAnimationFrame=()=>{};globalThis.ResizeObserver=class{observe(){}disconnect(){}};
 try{
  const style={setProperty(k,v){this[k]=v;}},surface={dataset:{},style:{},parentElement:{style:{}},closest(selector){return selector==='.lg-node'?host:selector==='.lg-node-widget'?row:null;}};
  const row={style:{},querySelector(){return surface;}},grid={style,children:[{querySelector(){return null;}},row]},host={querySelector(){return grid;}};
  const node={size:[400,900]};const fill=attachEditorFill(node,{computedHeight:300},surface,{minimum:()=>minimum,collapsed:()=>collapsed});queued.shift()();
  assert.equal(style['grid-template-rows'],'min-content minmax(208px,1fr)');assert.equal(surface.style.height,'100%');assert.equal(row.style.height,'100%');assert.equal(surface.parentElement.style.minHeight,'0');assert.deepEqual(node.size,[400,900]);
  minimum=400;fill.sync();queued.shift()();assert.equal(style['grid-template-rows'],'min-content minmax(400px,1fr)');
  collapsed=true;fill.sync();queued.shift()();assert.equal(style['grid-template-rows'],'min-content min-content');fill.dispose();
 }finally{globalThis.requestAnimationFrame=original.raf;globalThis.cancelAnimationFrame=original.cancel;globalThis.ResizeObserver=original.observer;}
});
