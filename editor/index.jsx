import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Excalidraw,exportToCanvas,serializeAsJSON,restore,convertToExcalidrawElements,getCommonBounds,CaptureUpdateAction} from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import './style.css';

const outputMode=document.getElementById('outputMode');
let outputFrame=null,outputElement=null,setLiveOutput,lastOutput='';
try{outputMode.checked=localStorage.getItem('genereti-editor-output')==='true';}catch{}
const SIZE=512,channel='genereti-drawing-v1';
let api,revision=0,rendering=false,dirty=false,timer,lastSignature='',saveTimer,pointerActive=false;
let editorTheme='light';
try{editorTheme=localStorage.getItem('genereti-editor-theme')||'light';}catch{}
const liveEdits=document.getElementById('liveEdits');
try{liveEdits.checked=localStorage.getItem('genereti-editor-live')!=='false';}catch{}
const status=document.getElementById('status');
const say=text=>status.textContent=text;
const send=payload=>window.parent.postMessage({channel,...payload},location.origin);
// An export-only invisible boundary establishes a fixed world-space crop.
const boundary=convertToExcalidrawElements([{type:'rectangle',x:0,y:0,width:SIZE,height:SIZE,opacity:0,strokeColor:'transparent',backgroundColor:'transparent',roughness:0}])[0];
function scene(){return JSON.parse(serializeAsJSON(api.getSceneElements().filter(e=>!e.customData?.generetiOutput),api.getAppState(),api.getFiles(),'local'));}
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('genereti-drawing',1);r.onupgradeneeded=()=>r.result.createObjectStore('scenes');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function persist(value){const db=await openDB();try{await new Promise((resolve,reject)=>{const tx=db.transaction('scenes','readwrite');tx.objectStore('scenes').put(value,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
async function stored(){const db=await openDB();try{return await new Promise((resolve,reject)=>{const r=db.transaction('scenes').objectStore('scenes').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
function fit(){
 if(!api)return;
 const {width,height}=document.getElementById('editor').getBoundingClientRect();
 const worldWidth=outputMode.checked?1072:SIZE;
 const zoom=Math.max(.1,Math.min((width-50)/worldWidth,(height-150)/SIZE,1.4));
 api.updateScene({appState:{zoom:{value:zoom},scrollX:(width/zoom-worldWidth)/2,scrollY:(height/zoom-SIZE)/2+15/zoom}});
}
function outline(state){
 const zoom=state.zoom.value;
 const rect=document.getElementById('artboard');
 Object.assign(rect.style,{left:`${state.scrollX*zoom}px`,top:`${state.scrollY*zoom}px`,width:`${SIZE*zoom}px`,height:`${SIZE*zoom}px`});
}
async function rasterize(){
 if(!api||rendering)return;
 rendering=true;dirty=false;
 const version=revision,value=scene();
 try{
  const elements=value.elements.filter(e=>!e.isDeleted);
  const bounds=getCommonBounds([...elements,boundary]);
  // Fixed artboard: zoom, panning, and out-of-bounds shapes never recenter output.
  if(bounds[2]-bounds[0]>8192||bounds[3]-bounds[1]>8192)throw new Error('Move distant shapes closer to the 512px artboard before rendering.');
  const canvas=await exportToCanvas({elements:[...elements,boundary],appState:{...value.appState,exportBackground:true,exportWithDarkMode:false,exportScale:1},files:value.files,exportPadding:0});
  const cropped=document.createElement('canvas');cropped.width=cropped.height=SIZE;
  const ctx=cropped.getContext('2d');ctx.fillStyle=value.appState.viewBackgroundColor||'#ffffff';ctx.fillRect(0,0,SIZE,SIZE);
  ctx.drawImage(canvas,-bounds[0],-bounds[1],SIZE,SIZE,0,0,SIZE,SIZE);
  {send({type:'frame',image:cropped.toDataURL('image/png'),scene:value,revision:version,artboard:{x:0,y:0,width:SIZE,height:SIZE}});say('Live guide · editable shapes');}
 }catch(error){say(error.message);send({type:'error',message:error.message});}
 finally{rendering=false;if(dirty||version!==revision)schedule();}
}
function schedule(){
 dirty=true;
 if(!liveEdits.checked&&pointerActive)return;
 // Throttle instead of restarting the timer on each drag event.
 if(liveEdits.checked&&timer)return;
 clearTimeout(timer);timer=setTimeout(()=>{timer=null;rasterize();},liveEdits.checked?33:80);
}
document.addEventListener('pointerdown',()=>{pointerActive=true;if(!liveEdits.checked){clearTimeout(timer);timer=null;}},true);
for(const event of ['pointerup','pointercancel'])document.addEventListener(event,()=>{pointerActive=false;if(dirty)schedule();},true);
liveEdits.onchange=()=>{try{localStorage.setItem('genereti-editor-live',String(liveEdits.checked));}catch{}if(dirty)schedule();};
function onChange(elements,state,files){
 outline(state);
 const live=elements.filter(e=>e.customData?.generetiOutput);
 outputFrame=live.find(e=>e.type==='frame')||outputFrame;outputElement=live.find(e=>e.type==='embeddable')||outputElement;
 if(state.theme!==editorTheme){editorTheme=state.theme;try{localStorage.setItem('genereti-editor-theme',editorTheme);}catch{}}
 document.getElementById('theme').textContent=state.theme==='dark'?'Light mode':'Dark mode';
 const signature=JSON.stringify([elements.filter(e=>!e.customData?.generetiOutput).map(e=>[e.id,e.version,e.versionNonce,e.isDeleted]),state.viewBackgroundColor,Object.keys(files)]);
 if(signature===lastSignature)return;
 lastSignature=signature;revision++;schedule();
 clearTimeout(saveTimer);saveTimer=setTimeout(()=>persist(scene()).catch(()=>say('Drawing is in memory; local autosave unavailable. Save a drawing file to keep it.')),400);
}
async function load(value){
 if(!value||value.type!=='excalidraw'||!Array.isArray(value.elements)||value.elements.length>10000)throw new Error('Choose a valid .excalidraw drawing with fewer than 10,000 elements.');
 const restored=restore(value,null,null);
 api.resetScene();api.addFiles(Object.values(restored.files||{}));
 api.updateScene({elements:restored.elements,appState:{...restored.appState,theme:api.getAppState().theme,viewBackgroundColor:restored.appState.viewBackgroundColor||'#ffffff'}});
 ensureOutputFrame();fit();lastSignature='';revision++;schedule();
}
function download(value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='genereti-drawing.excalidraw';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function ensureOutputFrame(){
 if(!api)return;
 const elements=api.getSceneElements().filter(e=>!e.customData?.generetiOutput);
 if(outputMode.checked){
  if(!outputFrame){
   [outputFrame]=convertToExcalidrawElements([{type:'frame',children:[],x:560,y:0,width:SIZE,height:SIZE,name:'Generated · live',customData:{generetiOutput:true}}]);
   outputFrame={...outputFrame,x:560,y:0,width:SIZE,height:SIZE};
   [outputElement]=convertToExcalidrawElements([{type:'rectangle',x:560,y:0,width:SIZE,height:SIZE,link:'https://genereti.local/live-output',customData:{generetiOutput:true},frameId:outputFrame.id}]);outputElement={...outputElement,type:'embeddable',frameId:outputFrame.id};
  }
  api.updateScene({elements:[...elements,outputElement,outputFrame],captureUpdate:CaptureUpdateAction.NEVER});
 }else api.updateScene({elements,captureUpdate:CaptureUpdateAction.NEVER});
}
outputMode.onchange=()=>{try{localStorage.setItem('genereti-editor-output',String(outputMode.checked));}catch{}ensureOutputFrame();fit();send({type:'output-mode',enabled:outputMode.checked});};
function showOutput(data){lastOutput=data.image;setLiveOutput?.(lastOutput);}
window.addEventListener('message',async({data,origin,source})=>{
 if(origin!==location.origin||source!==window.parent||data?.channel!==channel)return;
 try{if(data.type==='output')await showOutput(data);if(data.type==='shortcut')shortcut(data.event,true);if(data.type==='fit')fit();if(data.type==='load')await load(data.scene);if(data.type==='save')download(scene());if(data.type==='refresh')schedule();}
 catch(error){say(error.message);send({type:'error',message:error.message});}
});
document.getElementById('fit').onclick=fit;
document.getElementById('theme').onclick=()=>api.updateScene({appState:{theme:api.getAppState().theme==='dark'?'light':'dark'}});
// Listen across this isolated iframe, including after its own toolbar takes focus.
function palette(popup){
 if(!api)return;
 const state=api.getAppState();
 if(state.activeTool.type==='selection'&&!Object.values(state.selectedElementIds).some(Boolean))api.setActiveTool({type:'freedraw'});
 requestAnimationFrame(()=>api.updateScene({appState:{openMenu:'shape',openPopup:popup}}));
}
for(const [id,popup] of [['stroke','elementStroke'],['fill','elementBackground']])document.getElementById(id).onclick=()=>palette(popup);
function shortcut(event,forwarded=false){
 if(!api||event.ctrlKey||event.metaKey)return;
 const target=document.activeElement;
 if(!forwarded&&target?.matches('input,textarea,select,[contenteditable="true"]'))return;
 if(event.code==='KeyD'&&event.shiftKey&&event.altKey){event.preventDefault?.();event.stopImmediatePropagation?.();document.getElementById('theme').click();return;}
 const key=event.key?.toLowerCase();
 if(!event.altKey&&!event.shiftKey&&['s','g'].includes(key)&&!api.getAppState().openPopup){event.preventDefault?.();event.stopImmediatePropagation?.();palette(key==='s'?'elementStroke':'elementBackground');}
}
document.addEventListener('keydown',event=>shortcut(event),true);
document.getElementById('save').onclick=()=>download(scene());
document.getElementById('open').onclick=()=>document.getElementById('file').click();
document.getElementById('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>20_000_000)throw new Error('Drawing files must be under 20MB.');await load(JSON.parse(await f.text()));}catch(error){say(error.message);}e.target.value='';};
async function initializeEditor(value){
 api=value;window.generetiDrawing={getScene:scene,getCanvasElements:()=>structuredClone(api.getSceneElements()),load,fit};
 try{const previous=await stored();if(previous)await load(previous);}catch{say('Local autosave unavailable.');}
 requestAnimationFrame(()=>{ensureOutputFrame();fit();schedule();send({type:'ready'});send({type:'output-mode',enabled:outputMode.checked});});
}
function DrawingEditor(){
 const [output,setOutput]=useState(lastOutput);setLiveOutput=setOutput;
 return <Excalidraw renderEmbeddable={(element)=>element.customData?.generetiOutput?<div style={{width:'100%',height:'100%',background:'#202326',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>{output?<img src={output} alt="Live generated output" style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<span style={{color:'#eceeeb'}}>Waiting for generation…</span>}</div>:null} validateEmbeddable={link=>link==='https://genereti.local/live-output'} excalidrawAPI={initializeEditor} onChange={onChange} initialData={{appState:{viewBackgroundColor:'#ffffff',currentItemStrokeColor:'#111111',currentItemStrokeWidth:2,currentItemRoughness:1,theme:editorTheme}}} UIOptions={{canvasActions:{loadScene:false,saveToActiveFile:false,export:false,toggleTheme:true}}} detectScroll={false} handleKeyboardGlobally={true} />;
}
createRoot(document.getElementById('editor')).render(<DrawingEditor/>);
new ResizeObserver(()=>{if(api)fit();}).observe(document.getElementById('editor'));

new ResizeObserver(entries=>{document.getElementById('editor').style.bottom=`${entries[0].contentRect.height}px`;}).observe(document.getElementById('toolbar'));
