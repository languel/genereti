import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {sampleDue} from '../integrations/genereti_comfy_inputs/web/js/capture-frame.js';
function fixture(){
 let extension,now=0,stops=0,previewPaints=0;const frames=[],elements=[];const preview={visible:true,minimized:false};
 class Option{constructor(text,value){this.text=text;this.value=value;}}
 const element=tag=>{const e={tag,style:{},children:[],value:'',videoWidth:1920,videoHeight:1080,readyState:2,play:async()=>{},setAttribute(){},addEventListener(){},append(...xs){this.children.push(...xs);},add(o){this.children.push(o);if(this.children.length===1)this.value=o.value;},replaceChildren(...xs){this.children=xs;},getContext(){return {drawImage(){previewPaints++;}};}};elements.push(e);return e;};
 const track={stop(){stops++;},addEventListener(){}};const stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
 const node={id:1,comfyClass:'GeneretiCameraCapture',properties:{},widgets:[],size:[400,400],addDOMWidget(name,type,container){const w={name,options:{},container};this.widgets.push(w);return w;}};
 const context=vm.createContext({app:{registerExtension(e){extension=e;},graph:{_nodes:[]}},api:{},Option,document:{createElement:element},window:{addEventListener(){},removeEventListener(){}},navigator:{mediaDevices:{getUserMedia:async()=>stream,enumerateDevices:async()=>[]}},performance:{now:()=>now},ensureControlStyle(){},previewState(){return preview;},sampleDue,drawSample(canvas,video,size,flip){canvas.width=size;canvas.height=Math.round(size*video.videoHeight/video.videoWidth);canvas.flipped=flip;},disposeSample(){},createImageBitmap:async canvas=>({width:canvas.width,height:canvas.height,flipped:canvas.flipped,close(){}}),publishLive(n,b){frames.push({width:b.width,flipped:b.flipped});},setInterval(){return 1;},clearInterval(){}});
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_inputs/web/js/capture.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),context);
 extension.getCustomWidgets().GENERETI_CAMERA_CAPTURE(node,'capture');extension.nodeCreated(node);
 return {node,elements,preview,frames,time(t){now=t;},counts:()=>({stops,previewPaints})};
}
test('Single camera transport stops the device; local freeze skips paint while sampled workflow frames continue',async()=>{
 const f=fixture();assert.equal(f.node._generetiTransportState().title,'Start camera');await f.node._generetiToggleTransport();
 assert.equal(f.node._generetiTransportState().title,'Stop camera · release device');
 f.node._generetiLiveSource.retain();await new Promise(setImmediate);
 const painted=f.counts().previewPaints;f.preview.visible=false;f.time(1000);await f.node._generetiCapture.sample();
 assert.equal(f.counts().previewPaints,painted);assert.equal(f.frames.length,2);
 const flip=f.elements.find(e=>e.title?.startsWith('Flip horizontally'));flip.onclick();await new Promise(setImmediate);assert.equal(f.frames.at(-1).flipped,true);
 const rate=f.elements.find(e=>e.title?.startsWith('Sampling rate'));rate.value='1';rate.onchange();await f.node._generetiCapture.sample();const count=f.frames.length;
 f.time(1500);await f.node._generetiCapture.sample();assert.equal(f.frames.length,count);
 f.time(2000);await f.node._generetiCapture.sample();assert.equal(f.frames.length,count+1);
 await f.node._generetiToggleTransport();assert.equal(f.counts().stops,1);f.time(3000);await f.node._generetiCapture.sample();assert.equal(f.frames.length,count+1);
});
