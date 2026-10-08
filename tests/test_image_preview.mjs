import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {previewWidgetHeight} from '../integrations/genereti_comfy_p5/web/js/widget-layout.js';
import {readFileSync} from 'node:fs';

function fixture(clock=performance){
 const elements=[],draws=[],outputs=[];let extension,frame,release=0,closed=0;const localPreview={visible:true,minimized:false};
 const element=tag=>{const e={tag,children:[],style:{},classList:{add(){}},setAttribute(k,v){this[k]=v;},append(...items){this.children.push(...items);},getContext(){return {clearRect(){draws.push('clear');},drawImage(image){draws.push(image);}};}};elements.push(e);return e;};
 const context=vm.createContext({previewWidgetHeight,document:{createElement:element},window:{addEventListener(){}},performance:clock,app:{registerExtension(value){extension=value;}},previewState(){localPreview.actions=element('preview-actions');return localPreview;},previewControls(canvas){return {toolbar:element('toolbar'),publish(value){outputs.push(value);},close(){closed++;}};},subscribeLive(node,callback){frame=callback;return ()=>release++;},Image:class{set src(value){this.naturalWidth=12;this.naturalHeight=8;this.onload();}}});
 const source=readFileSync(new URL('../integrations/genereti_comfy_stream/web/js/image-preview.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');vm.runInContext(source,context);
 const node={size:[400,480],comfyClass:'GeneretiLiveImagePreview',widgets:[{name:'preview_size'},{name:'jpeg_quality'}],addDOMWidget(name,type,container){this.container=container;return {options:{},margin:10};}};extension.nodeCreated(node);
 return {node,elements,draws,outputs,localPreview,frame:bitmap=>frame({bitmap,producedAt:clock.now()}),counts:()=>({release,closed})};
}

test('Live preview clears alpha and forwards direct frames, Queue decodes once, cleanup releases viewers',()=>{
 const f=fixture();assert.equal(f.node.title,'ꘇ image preview');assert.equal(f.node.widgets.length,1);
 assert.deepEqual(f.node.container.children.map(e=>e.tag),['button','toolbar','preview-actions','canvas','details']);
 const details=f.elements.find(e=>e.tag==='details');assert.equal(Boolean(details.open),false);
 const bitmap={width:16,height:9};f.frame(bitmap);assert.equal(f.draws[0],'clear');assert.equal(f.draws[1],bitmap);assert.equal(f.outputs[0].bitmap,bitmap);
 f.node._generetiSetExecutionMode('Comfy Queue');f.node.onExecuted({genereti_preview:['data:image/png;base64,alpha']});
 assert.equal(f.draws[2],'clear');assert.equal(f.outputs[1].src,'data:image/png;base64,alpha');
 f.node.onRemoved();assert.deepEqual(f.counts(),{release:1,closed:1});
});


test('Frozen or minimized local preview keeps forwarding fresh frames to outputs',()=>{
 const f=fixture();f.frame({width:10,height:10});const paints=f.draws.length;
 f.localPreview.visible=false;f.frame({width:20,height:20});
 assert.equal(f.draws.length,paints);assert.equal(f.outputs.at(-1).bitmap.width,20);
 f.localPreview.minimized=true;f.frame({width:30,height:30});
 assert.equal(f.draws.length,paints);assert.equal(f.outputs.at(-1).bitmap.width,30);
});

test('Live FPS reflects recent frames after an idle gap instead of the session average',()=>{
 let now=100;const f=fixture({now:()=>now});const bitmap={width:10,height:10};
 f.frame(bitmap);now=1100;f.frame(bitmap);
 now=60000;f.frame(bitmap);
 for(let i=1;i<=60;i++){now=60000+i*1000/30;f.frame(bitmap);}
 const status=f.elements.find(e=>e.tag==='span');
 assert.match(status.textContent,/^30\.0 fps/);
 assert.equal(f.outputs.length,63);
});
