import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {LoopCapture} from '../integrations/genereti_comfy_stream/web/js/record-loop.js';

test('recorder modes capture requested tracks and loop mode waits for a wrap',()=>{
 let extension,frame,poll,snapshot={playing:true,epoch:1,iteration:0,loop:{enabled:true,start:0,end:4}},downloads=0,tapCloses=0;
 const make=tag=>({tag,style:{},children:[],attributes:{},value:'',append(...v){this.children.push(...v);},setAttribute(k,v){this.attributes[k]=v;},add(v){this.children.push(v);if(!this.value)this.value=v.value;},addEventListener(){},getContext(){return {drawImage(){}};},captureStream(){return {getVideoTracks:()=>[{kind:'video',stop(){}}]};},click(){downloads++;}});
 class FakeStream{constructor(tracks){this.tracks=tracks;}getTracks(){return this.tracks;}getAudioTracks(){return this.tracks.filter(t=>t.kind==='audio');}getVideoTracks(){return this.tracks.filter(t=>t.kind==='video');}}
 let last;class FakeRecorder{static isTypeSupported(){return true;}constructor(stream,opts){this.stream=stream;this.mimeType=opts.mimeType;this.opts=opts;this.state='inactive';last=this;}start(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable({data:new Blob(['capture'])});this.onstop();}}
 const output={id:1,comfyClass:'GeneretiAudioOutput'}, graph={getNodeById:id=>id===1?output:null,change(){}},node={comfyClass:'GeneretiLiveRecorder',properties:{},graph,inputs:[{name:'image'},{name:'audio'}],getInputLink:i=>i===1?{origin_id:1}:null,addDOMWidget(_n,_t,root){this.root=root;return {};}};
 const window={MediaRecorder:FakeRecorder,generetiPerformance:{clock:{read:()=>snapshot}},generetiModularAudio:{isRunning:n=>n===output,recordingTap(){return {stream:new FakeStream([{kind:'audio',stop(){}}]),close(){tapCloses++;}};}}};
 const context=vm.createContext({app:{registerExtension:e=>extension=e},window,document:{createElement:make},Option:class{constructor(text,value){this.text=text;this.value=value;}},MediaRecorder:FakeRecorder,MediaStream:FakeStream,Blob,URL:{createObjectURL:()=>'',revokeObjectURL(){}},performance:{now:()=>0},setInterval:fn=>(poll=fn,1),clearInterval(){},setTimeout(){},subscribeLive:(_n,f)=>(frame=f,()=>{}),ensureControlStyle(){},LoopCapture});
 const src=readFileSync(new URL('../integrations/genereti_comfy_stream/web/js/live-recorder.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');vm.runInContext(src,context);extension.nodeCreated(node);frame({bitmap:{width:320,height:180}});
 const [mode,timing,size,quality,,button]=node.root.children[0].children,canvas=node.root.children[1];
 assert.deepEqual([canvas.width,canvas.height],[320,180]);
 button.onclick();assert.deepEqual(Array.from(last.stream.getTracks(),t=>t.kind),['video','audio']);assert.equal(last.opts.videoBitsPerSecond,12e6);assert.equal(last.opts.audioBitsPerSecond,192000);button.onclick();assert.equal(downloads,1);assert.equal(tapCloses,1);
 mode.value='video';size.value='1080';size.onchange();quality.value='50';assert.deepEqual([canvas.width,canvas.height],[1920,1080]);button.onclick();assert.deepEqual(Array.from(last.stream.getTracks(),t=>t.kind),['video']);assert.equal(last.opts.videoBitsPerSecond,50e6);assert.equal(last.opts.audioBitsPerSecond,undefined);button.onclick();
 mode.value='audio';button.onclick();assert.deepEqual(Array.from(last.stream.getTracks(),t=>t.kind),['audio']);button.onclick();
 timing.value='loop';const previous=last;button.onclick();poll();assert.equal(last,previous);snapshot={...snapshot,iteration:1};poll();assert.notEqual(last,previous);snapshot={...snapshot,iteration:2};poll();assert.equal(last.state,'inactive');assert.equal(downloads,4);
});
