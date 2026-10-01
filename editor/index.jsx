import {icon} from '../web/icons.js';
import {timing,count} from '../web/performance.js';
import React,{useState,useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {Excalidraw,exportToCanvas,serializeAsJSON,restore,convertToExcalidrawElements,getCommonBounds,CaptureUpdateAction,Sidebar,Footer} from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import './style.css';

const host=document.body.dataset.host==='excalidraw';
const drawingFile=()=>document.getElementById(host?'drawingFile':'file');
const runtimeElement=e=>e.customData?.generetiOutput||e.customData?.generetiSource||e.customData?.generetiGuide;
const outputMode=document.getElementById('outputMode');
let guideElement=null,guideEnabled=false,guideImage='',setGuideImage;
let outputFrame=null,outputElement=null,setLiveOutput,lastOutput='',sourceElement=null,sourceKind='editor',sourceImage='',setSourceImage;
try{outputMode.checked=host||localStorage.getItem('genereti-editor-output')==='true';}catch{}
const SIZE=512,channel='genereti-drawing-v1';
let overlayEnabled=false,frameLabels=!host,detachedLayout=null,lastLayout='',frameInputMode=false,inputFrameId='',keepPanelOpen=true,panelRestorePending=false;
try{if(host){overlayEnabled=localStorage.getItem('genereti-output-overlay')==='true';frameLabels=localStorage.getItem('genereti-frame-labels')==='true';frameInputMode=localStorage.getItem('genereti-frame-input')==='true';inputFrameId=localStorage.getItem('genereti-input-frame')||'';detachedLayout=JSON.parse(localStorage.getItem('genereti-output-placement')||'null');}}catch{}
const geometry=e=>({x:e.x,y:e.y,width:e.width,height:e.height,angle:e.angle,locked:e.locked});
function rememberOutputPlacement(){
 if(!host||overlayEnabled||!outputFrame||!outputElement)return;
 const layout={frame:geometry(outputFrame),element:geometry(outputElement)},signature=JSON.stringify(layout);
 if(signature===lastLayout)return;lastLayout=signature;detachedLayout=layout;
 try{localStorage.setItem('genereti-output-placement',signature);}catch{}
}
function restoreGeometry(value,fallback){
 return value&&['x','y','width','height','angle'].every(k=>Number.isFinite(value[k]))&&value.width>0&&value.height>0?{...fallback,...value}:fallback;
}
let api,revision=0,rendering=false,dirty=false,timer,lastSignature='',saveTimer,pointerActive=false;
let editorTheme='light',displayedTheme='',outlineSignature='';
try{editorTheme=localStorage.getItem('genereti-editor-theme')||'light';}catch{}
const liveEdits=document.getElementById('liveEdits');
try{liveEdits.checked=localStorage.getItem('genereti-editor-live')!=='false';}catch{}
const status=document.getElementById(host?'drawingStatus':'status');
const say=text=>status.textContent=text;
const send=payload=>window.parent.postMessage({channel,...payload},location.origin);
// An export-only invisible boundary establishes a fixed world-space crop.
const boundary=convertToExcalidrawElements([{type:'rectangle',x:0,y:0,width:SIZE,height:SIZE,opacity:0,strokeColor:'transparent',backgroundColor:'transparent',roughness:0}])[0];
function scene(){return JSON.parse(serializeAsJSON(api.getSceneElements().filter(e=>!runtimeElement(e)).map(e=>e.frameId===outputFrame?.id?{...e,frameId:null}:e),api.getAppState(),api.getFiles(),'local'));}
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('genereti-drawing',1);r.onupgradeneeded=()=>r.result.createObjectStore('scenes');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function persist(value){const db=await openDB();try{await new Promise((resolve,reject)=>{const tx=db.transaction('scenes','readwrite');tx.objectStore('scenes').put(value,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
async function stored(){const db=await openDB();try{return await new Promise((resolve,reject)=>{const r=db.transaction('scenes').objectStore('scenes').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
function inputCrop(){
 const frame=frameInputMode&&api?.getSceneElements().find(e=>e.id===inputFrameId&&e.type==='frame'&&!e.isDeleted);
 return frame?{x:frame.x,y:frame.y,width:frame.width,height:frame.height}:{x:0,y:0,width:SIZE,height:SIZE};
}
function updateFrameList(elements){
 if(!host)return;
 const select=document.getElementById('inputFrameSelect'),frames=elements.filter(e=>e.type==='frame'&&!runtimeElement(e)&&!e.isDeleted);
 const signature=JSON.stringify(frames.map(e=>[e.id,e.name]));
 if(select.dataset.frames!==signature){select.dataset.frames=signature;select.replaceChildren(...frames.map((e,i)=>new Option(e.name||`Frame ${i+1}`,e.id)));}
 select.value=inputFrameId;select.hidden=!frameInputMode;
}
function ensureInputFrame(){
 if(!api||!frameInputMode)return;
 const elements=api.getSceneElements();
 if(!elements.some(e=>e.id===inputFrameId&&e.type==='frame'&&!e.isDeleted)){
  const existing=elements.find(e=>e.type==='frame'&&!runtimeElement(e)&&!e.isDeleted);
  if(existing)inputFrameId=existing.id;
  else{let [frame]=convertToExcalidrawElements([{type:'frame',children:[],name:'Input',customData:{generetiInput:true}}]);frame={...frame,x:0,y:0,width:SIZE,height:SIZE};inputFrameId=frame.id;api.updateScene({elements:[...elements,frame],captureUpdate:CaptureUpdateAction.IMMEDIATELY});}
 }
 try{localStorage.setItem('genereti-input-frame',inputFrameId);}catch{}
 updateFrameList(api.getSceneElements());
}
function togglePanel(){keepPanelOpen=api?.getAppState().openSidebar?.name!=='genereti';api?.updateScene({appState:{openSidebar:keepPanelOpen?{name:'genereti'}:null}});}
if(host)document.addEventListener('pointerdown',event=>{if(event.target.closest?.('[data-testid="sidebar-close"]')?.closest('.sidebar')?.querySelector('.host-panel'))keepPanelOpen=false;},true);
function fit(){
 if(!api)return;
 const rect=document.getElementById('editor').getBoundingClientRect();
 const width=rect.width-(host&&api.getAppState().openSidebar?.name==='genereti'?360:0),height=rect.height;
 const crop=inputCrop(),rects=[crop];if(outputMode.checked&&!overlayEnabled)rects.push(outputElement||{x:560,y:0,width:SIZE,height:SIZE});if(guideEnabled)rects.push({x:0,y:560,width:SIZE,height:SIZE});
 const minX=Math.min(...rects.map(e=>e.x)),minY=Math.min(...rects.map(e=>e.y)),worldWidth=Math.max(...rects.map(e=>e.x+e.width))-minX,worldHeight=Math.max(...rects.map(e=>e.y+e.height))-minY;
 const zoom=Math.max(.1,Math.min((width-50)/worldWidth,(height-150)/worldHeight,1.4));
 api.updateScene({appState:{zoom:{value:zoom},scrollX:(width/zoom-worldWidth)/2-minX,scrollY:(height/zoom-worldHeight)/2-minY+15/zoom}});
}
function outline(state){
 const zoom=state.zoom.value,crop=inputCrop();
 const signature=JSON.stringify([state.scrollX,state.scrollY,zoom,crop]);if(signature===outlineSignature)return;outlineSignature=signature;
 const rect=document.getElementById('artboard');
 Object.assign(rect.style,{left:`${(state.scrollX+crop.x)*zoom}px`,top:`${(state.scrollY+crop.y)*zoom}px`,width:`${crop.width*zoom}px`,height:`${crop.height*zoom}px`});
}
async function rasterize(){
 if(!api||rendering)return;
 if(host&&document.getElementById('source').value!=='editor'&&!frameInputMode){dirty=false;return;}
 rendering=true;dirty=false;
 const started=performance.now(),version=revision,value=scene();
 try{
  const crop=inputCrop(),cropBoundary=frameInputMode?{...boundary,...crop}:boundary;
  const elements=value.elements.filter(e=>!e.isDeleted&&(!frameInputMode||e.type!=='frame')).filter(e=>{if(!frameInputMode)return true;const b=getCommonBounds([e]);return b[2]>=crop.x&&b[0]<=crop.x+crop.width&&b[3]>=crop.y&&b[1]<=crop.y+crop.height;}).map(e=>frameInputMode?{...e,frameId:null}:e);
  const bounds=getCommonBounds([...elements,cropBoundary]);
  // Fixed artboard: zoom, panning, and out-of-bounds shapes never recenter output.
  if(bounds[2]-bounds[0]>8192||bounds[3]-bounds[1]>8192)throw new Error('Move distant shapes closer to the 512px artboard before rendering.');
  const canvas=await exportToCanvas({elements:[...elements,cropBoundary],appState:{...value.appState,exportBackground:!frameInputMode,exportWithDarkMode:false,exportScale:1},files:value.files,exportPadding:0});
  const cropped=document.createElement('canvas');cropped.width=cropped.height=SIZE;
  const ctx=cropped.getContext('2d');ctx.fillStyle=value.appState.viewBackgroundColor||'#ffffff';ctx.fillRect(0,0,SIZE,SIZE);
  ctx.drawImage(canvas,crop.x-bounds[0],crop.y-bounds[1],crop.width,crop.height,0,0,SIZE,SIZE);
  let layer=null;if(frameInputMode){const transparent=document.createElement('canvas');transparent.width=transparent.height=SIZE;transparent.getContext('2d').drawImage(canvas,crop.x-bounds[0],crop.y-bounds[1],crop.width,crop.height,0,0,SIZE,SIZE);layer=transparent.toDataURL('image/png');}
  {send({type:'frame',image:cropped.toDataURL('image/png'),scene:value,revision:version,layer,artboard:crop});timing('raster',performance.now()-started);count('raster');say('Live guide · editable shapes');}
 }catch(error){say(error.message);send({type:'error',message:error.message});}
 finally{rendering=false;if(dirty||version!==revision)schedule();}
}
function schedule(){
 dirty=true;
 if(!liveEdits.checked&&pointerActive)return;
 // Throttle instead of restarting the timer on each drag event.
 if(liveEdits.checked&&timer)return;
 clearTimeout(timer);timer=setTimeout(()=>{timer=null;rasterize();},liveEdits.checked?1000/Math.min(24,Number(document.getElementById('maxfpsValue')?.value)||24):80);
}
document.addEventListener('pointerdown',()=>{pointerActive=true;if(!liveEdits.checked){clearTimeout(timer);timer=null;}},true);
for(const event of ['pointerup','pointercancel'])document.addEventListener(event,()=>{pointerActive=false;if(dirty)schedule();},true);
liveEdits.onchange=()=>{try{localStorage.setItem('genereti-editor-live',String(liveEdits.checked));}catch{}if(dirty)schedule();};
function onChange(elements,state,files){
 if(host&&keepPanelOpen&&!state.openSidebar&&!panelRestorePending){panelRestorePending=true;requestAnimationFrame(()=>{panelRestorePending=false;if(keepPanelOpen&&api&&!api.getAppState().openSidebar)api.updateScene({appState:{openSidebar:{name:'genereti'}}});});}
 updateFrameList(elements);outline(state);
 const live=elements.filter(e=>e.customData?.generetiOutput);
 outputFrame=live.find(e=>e.type==='frame')||outputFrame;outputElement=live.find(e=>e.type==='embeddable')||outputElement;
 if(overlayEnabled&&outputMode.checked&&outputElement){const crop=inputCrop();if(['x','y','width','height'].some(k=>outputElement[k]!==crop[k])){ensureOutputFrame();return;}}
 rememberOutputPlacement();
 if(state.theme!==editorTheme){editorTheme=state.theme;try{localStorage.setItem('genereti-editor-theme',editorTheme);}catch{}}
 if(host)document.body.dataset.theme=state.theme;
 const themeButton=document.getElementById('theme'),nextTheme=state.theme==='dark'?'light':'dark';
 if(host&&displayedTheme!==state.theme){displayedTheme=state.theme;themeButton.innerHTML=icon(nextTheme==='light'?'sun':'moon');themeButton.title=`Switch to ${nextTheme} mode (Shift + Alt + D)`;themeButton.setAttribute('aria-label',`Switch to ${nextTheme} mode`);}else if(!host)themeButton.textContent=nextTheme==='light'?'Light mode':'Dark mode';
 const signature=JSON.stringify([elements.filter(e=>!runtimeElement(e)).map(e=>[e.id,e.version,e.versionNonce,e.isDeleted]),state.viewBackgroundColor,Object.keys(files)]);
 if(signature===lastSignature)return;
 lastSignature=signature;revision++;schedule();
 clearTimeout(saveTimer);saveTimer=setTimeout(()=>persist(scene()).catch(()=>say('Drawing is in memory; local autosave unavailable. Save a drawing file to keep it.')),400);
}
async function load(value){
 if(!value||value.type!=='excalidraw'||!Array.isArray(value.elements)||value.elements.length>10000)throw new Error('Choose a valid .excalidraw drawing with fewer than 10,000 elements.');
 const restored=restore(value,null,null);
 api.resetScene();api.addFiles(Object.values(restored.files||{}));
 api.updateScene({elements:restored.elements,appState:{...restored.appState,theme:api.getAppState().theme,viewBackgroundColor:restored.appState.viewBackgroundColor||'#ffffff'}});
 ensureInputFrame();if(host)api.updateScene({appState:{frameRendering:{...api.getAppState().frameRendering,name:frameLabels}}});ensureOutputFrame();fit();lastSignature='';revision++;schedule();
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
   if(host&&detachedLayout){outputFrame=restoreGeometry(detachedLayout.frame,outputFrame);outputElement={...restoreGeometry(detachedLayout.element,outputElement),frameId:outputFrame.id};}
  }
  if(overlayEnabled){
   outputElement={...outputElement,...inputCrop(),angle:0,locked:true,frameId:null};
   api.updateScene({elements:[outputElement,...elements],appState:{selectedElementIds:{}},captureUpdate:CaptureUpdateAction.NEVER});
  }else api.updateScene({elements:[...elements,outputElement,outputFrame],captureUpdate:CaptureUpdateAction.NEVER});
 }else api.updateScene({elements,captureUpdate:CaptureUpdateAction.NEVER});
}
function setOverlay(enabled){
 if(!api)return;
 if(enabled&&!overlayEnabled)rememberOutputPlacement();
 overlayEnabled=enabled;document.body.classList.toggle('host-overlay',enabled);if(host){document.getElementById('overlayOutput').checked=enabled;document.getElementById('overlayOutputButton').setAttribute('aria-pressed',String(enabled));}
 if(!enabled&&detachedLayout){outputFrame=restoreGeometry(detachedLayout.frame,outputFrame);outputElement={...restoreGeometry(detachedLayout.element,outputElement),frameId:outputFrame.id};}
 try{localStorage.setItem('genereti-output-overlay',String(enabled));}catch{}
 ensureOutputFrame();fit();
}
if(host){
 document.body.classList.toggle('host-overlay',overlayEnabled);
 const overlay=document.getElementById('overlayOutput'),labels=document.getElementById('outputLabels');
 overlay.checked=overlayEnabled;labels.checked=frameLabels;
 document.getElementById('overlayOutputButton').setAttribute('aria-pressed',String(overlayEnabled));document.getElementById('overlayOutputButton').onclick=()=>setOverlay(!overlayEnabled);
 const frameToggle=document.getElementById('frameInputMode'),frameSelect=document.getElementById('inputFrameSelect');frameToggle.checked=frameInputMode;document.body.classList.toggle('host-frame-input',frameInputMode);
 frameToggle.onchange=()=>{frameInputMode=frameToggle.checked;document.body.classList.toggle('host-frame-input',frameInputMode);try{localStorage.setItem('genereti-frame-input',String(frameInputMode));}catch{}ensureInputFrame();updateFrameList(api.getSceneElements());if(overlayEnabled)ensureOutputFrame();outline(api.getAppState());lastSignature='';schedule();send({type:'frame-input-mode',enabled:frameInputMode});};
 frameSelect.onchange=()=>{inputFrameId=frameSelect.value;try{localStorage.setItem('genereti-input-frame',inputFrameId);}catch{}if(overlayEnabled)ensureOutputFrame();outline(api.getAppState());lastSignature='';schedule();};
 overlay.onchange=()=>setOverlay(overlay.checked);
 const order=document.getElementById('overlayInputOrder');try{order.value=localStorage.getItem('genereti-overlay-input-order')||'above';}catch{}document.body.dataset.inputOrder=order.value;order.onchange=()=>{document.body.dataset.inputOrder=order.value;try{localStorage.setItem('genereti-overlay-input-order',order.value);}catch{}};
 labels.onchange=()=>{frameLabels=labels.checked;try{localStorage.setItem('genereti-frame-labels',String(frameLabels));}catch{}api?.updateScene({appState:{frameRendering:{...api.getAppState().frameRendering,name:frameLabels}},captureUpdate:CaptureUpdateAction.NEVER});};
}
outputMode.onchange=()=>{try{localStorage.setItem('genereti-editor-output',String(outputMode.checked));}catch{}ensureOutputFrame();fit();send({type:'output-mode',enabled:outputMode.checked});};
function showOutput(data){lastOutput=data.image;setLiveOutput?.(lastOutput);}
window.addEventListener('message',async({data,origin,source})=>{
 if(origin!==location.origin||source!==window.parent||data?.channel!==channel)return;
 try{if(data.type==='guide-mode')showGuide(data);if(data.type==='guide'){guideImage=data.image;setGuideImage?.(guideImage);}if(data.type==='source')showSource(data);if(data.type==='output')await showOutput(data);if(data.type==='shortcut')shortcut(data.event,true);if(data.type==='fit')fit();if(data.type==='load')await load(data.scene);if(data.type==='save')download(scene());if(data.type==='refresh')schedule();}
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
document.getElementById(host?'drawingSave':'save').onclick=()=>download(scene());
document.getElementById('open').onclick=()=>drawingFile().click();
drawingFile().onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>20_000_000)throw new Error('Drawing files must be under 20MB.');await load(JSON.parse(await f.text()));}catch(error){say(error.message);}e.target.value='';};
async function initializeEditor(value){
 api=value;window.generetiDrawing={getScene:scene,getCanvasElements:()=>structuredClone(api.getSceneElements()),load,fit};
 try{const previous=await stored();if(previous)await load(previous);}catch{say('Local autosave unavailable.');}
 requestAnimationFrame(()=>{if(host)api.updateScene({appState:{openSidebar:{name:'genereti'},frameRendering:{...api.getAppState().frameRendering,name:frameLabels}}});ensureInputFrame();ensureOutputFrame();fit();schedule();send({type:'ready'});send({type:'frame-input-mode',enabled:frameInputMode});send({type:'output-mode',enabled:outputMode.checked});});
}
function showSource(data){
 if(!host)return;sourceKind=data.kind;sourceImage=data.image||sourceImage;
 const elements=api?.getSceneElements().filter(e=>!e.customData?.generetiSource)||[];
 if(!api)return;
 if(sourceKind!=='editor'&&sourceKind!=='text'){
  if(!sourceElement){[sourceElement]=convertToExcalidrawElements([{type:'rectangle',x:0,y:0,width:SIZE,height:SIZE,locked:true,link:'https://genereti.local/live-source',customData:{generetiSource:true}}]);sourceElement={...sourceElement,type:'embeddable'};}
  // Reuse the live source element; it is excluded from editable guide exports.
  const crop=inputCrop();const moved=Object.entries(crop).some(([k,v])=>sourceElement[k]!==v);sourceElement={...sourceElement,...crop};
  if(moved||!api.getSceneElements().some(e=>e.id===sourceElement.id))api.updateScene({elements:[sourceElement,...elements],captureUpdate:CaptureUpdateAction.NEVER});
 }else if(api.getSceneElements().some(e=>e.customData?.generetiSource))api.updateScene({elements,captureUpdate:CaptureUpdateAction.NEVER});
 setSourceImage?.({kind:sourceKind,image:sourceImage});
}
function showGuide(data){
 if(!host||!api)return;guideEnabled=data.enabled;
 const elements=api.getSceneElements().filter(e=>!e.customData?.generetiGuide);
 if(guideEnabled){
  if(!guideElement){[guideElement]=convertToExcalidrawElements([{type:'rectangle',x:0,y:560,width:SIZE,height:SIZE,locked:true,link:'https://genereti.local/live-guide',customData:{generetiGuide:true}}]);guideElement={...guideElement,type:'embeddable'};}
  api.updateScene({elements:[...elements,guideElement],captureUpdate:CaptureUpdateAction.NEVER});
 }else api.updateScene({elements,captureUpdate:CaptureUpdateAction.NEVER});
 fit();
}
function mountNode(name,node){const nodes=window.generetiHostNodes;if(!nodes)return;if(node)node.append(nodes[name]);else nodes.parking.append(nodes[name]);}
const mountPanel=node=>mountNode('panel',node),mountHeader=node=>mountNode('header',node),mountToolbar=node=>mountNode('toolbar',node);
const previewNodes=new Map();
function refreshPreview(kind,image){
 const entry=previewNodes.get(kind);if(!entry)return;
 if(image&&entry.img.src!==image)entry.img.src=image;
 entry.img.hidden=!image;entry.empty.hidden=Boolean(image);
}
setLiveOutput=image=>refreshPreview('output',image);
setSourceImage=value=>refreshPreview('source',value.image);
setGuideImage=image=>refreshPreview('guide',image);
function LivePreview({kind}){
 return <div className="host-source" style={{width:'100%',height:'100%',pointerEvents:'none'}} ref={node=>{if(!node){previewNodes.delete(kind);return;}previewNodes.set(kind,{img:node.querySelector('img'),empty:node.querySelector('span')});refreshPreview(kind,kind==='output'?lastOutput:kind==='source'?sourceImage:guideImage);}}><img alt={kind==='output'?'Live generated output':kind==='source'?'Live input source':'Prepared model guide'} style={{width:'100%',height:'100%',objectFit:'contain'}}/><span>{kind==='output'?'Waiting for generation…':kind==='source'?'Enable or choose your source in Genereti':'Guide · run generation to preview'}</span></div>;
}
const renderLiveEmbeddable=element=>element.customData?.generetiGuide?<LivePreview kind="guide"/>:element.customData?.generetiSource?<LivePreview kind="source"/>:element.customData?.generetiOutput?<LivePreview kind="output"/>:null;
function DrawingEditor(){
 count('hostRenders');
 const [docked,setDocked]=useState(true);
 const footer=useMemo(()=>host&&<Footer><div className="host-tools"><div ref={mountToolbar}/><div ref={mountHeader}/><button className="sidebar-trigger" onClick={togglePanel} title="Genereti controls" aria-label="Show or hide Genereti controls" dangerouslySetInnerHTML={{__html:icon('panel')}}/></div></Footer>,[]);
 return <Excalidraw renderEmbeddable={renderLiveEmbeddable} validateEmbeddable={link=>['https://genereti.local/live-output','https://genereti.local/live-source','https://genereti.local/live-guide'].includes(link)} excalidrawAPI={initializeEditor} onChange={onChange} initialData={{appState:{viewBackgroundColor:'#ffffff',currentItemStrokeColor:'#111111',currentItemStrokeWidth:2,currentItemRoughness:1,theme:editorTheme}}} UIOptions={{canvasActions:{loadScene:false,saveToActiveFile:false,export:false,toggleTheme:true}}} detectScroll={false} handleKeyboardGlobally={true}>{host&&<Sidebar name="genereti" docked={docked} onDock={setDocked}><Sidebar.Header>Genereti · live image lab</Sidebar.Header><div ref={mountPanel}/></Sidebar>}{footer}</Excalidraw>;
}
createRoot(document.getElementById('editor')).render(<DrawingEditor/>);
new ResizeObserver(()=>{if(api)fit();}).observe(document.getElementById('editor'));

if(!host)new ResizeObserver(entries=>{document.getElementById('editor').style.bottom=`${entries[0].contentRect.height}px`;}).observe(document.getElementById('toolbar'));
