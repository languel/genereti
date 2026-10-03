import {icon} from '../web/icons.js';
import {timing,count} from '../web/performance.js';
import React,{useState,useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {Excalidraw,exportToCanvas,exportToSvg,serializeAsJSON,restore,convertToExcalidrawElements,getCommonBounds,CaptureUpdateAction,Sidebar,Footer,MainMenu} from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import './style.css';

const host=document.body.dataset.host==='excalidraw';
const comfy=document.body.dataset.host==='comfy';
if(comfy)document.documentElement.dataset.drawingStandalone=String(window.parent===window);
let setSatoriState,satori=comfy;
if(comfy)document.body.classList.add('satori');
function toggleSatori(enabled=!satori){satori=enabled;document.body.classList.toggle('satori',enabled);setSatoriState?.(enabled);if(comfy)send({type:'satori',enabled});}
// Keep imperative controls alive when Excalidraw replaces its responsive Footer.
const drawingToolbar=comfy?document.getElementById('toolbar'):null;
const drawingToolbarParking=comfy?document.createElement('div'):null;
if(drawingToolbarParking){drawingToolbarParking.hidden=true;document.body.append(drawingToolbarParking);}
const drawingFile=()=>document.getElementById(host?'drawingFile':'file');
const runtimeElement=e=>e.customData?.generetiOutput||e.customData?.generetiSource||e.customData?.generetiGuide||e.customData?.generetiMaskPaper||e.customData?.generetiAutoMask;
const outputMode=document.getElementById('outputMode');
let guideElement=null,guideEnabled=false,guideImage='',setGuideImage;
let outputFrame=null,outputElement=null,setLiveOutput,lastOutput='',sourceElement=null,sourceKind='editor',sourceImage='',setSourceImage;
try{outputMode.checked=!comfy&&(host||localStorage.getItem('genereti-editor-output')==='true');}catch{}
const SIZE=512,channel='genereti-drawing-v1';
let overlayEnabled=false,frameLabels=!host,detachedLayout=null,lastLayout='',frameInputMode=false,inputFrameId='',keepPanelOpen=true,panelRestorePending=false;
try{if(host){overlayEnabled=localStorage.getItem('genereti-output-overlay')==='true';frameLabels=localStorage.getItem('genereti-frame-labels')==='true';frameInputMode=localStorage.getItem('genereti-frame-input')==='true';inputFrameId=localStorage.getItem('genereti-input-frame')||'';detachedLayout=JSON.parse(localStorage.getItem('genereti-output-placement')||'null');}}catch{}
if(comfy){frameInputMode=true;for(const [id,glyph,label] of [['theme','moon','Editor theme'],['stroke','stroke','Stroke color (S)'],['fill','fill','Fill color (G)'],['fit','fit','Fit output frame'],['open','open','Open drawing'],['save','save','Save drawing']]){const button=document.getElementById(id);button.innerHTML=icon(glyph);button.title=label;button.setAttribute('aria-label',label);}}
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
let outputSize={width:512,height:512,aspect:'free'};
let autoImageMask=false,autoMaskElement=null,lastAutoMask='';
let maskFrameId='',maskPaper=null,activeDrawingFrame='image',exportMatchTheme=false,drawingDemand=new Set();
let api,revision=0,rendering=false,dirty=false,timer,lastSignature='',saveTimer,pointerActive=false;
let editorTheme='light',displayedTheme='',outlineSignature='';
try{editorTheme=localStorage.getItem('genereti-editor-theme')||'light';}catch{}
const liveEdits=document.getElementById('liveEdits');
try{liveEdits.checked=localStorage.getItem('genereti-editor-live')!=='false';}catch{}
if(comfy){
 const button=document.createElement('button');button.id='liveEditsToggle';button.innerHTML=icon('live');button.title='Update while drawing · Shift + Alt + U. Off: update on release';button.setAttribute('aria-label','Update while drawing');
 liveEdits.parentElement.hidden=true;liveEdits.parentElement.after(button);
 button.setAttribute('aria-pressed',String(liveEdits.checked));button.onclick=()=>{liveEdits.checked=!liveEdits.checked;liveEdits.dispatchEvent(new Event('change'));};
 for(const [id,glyph,label] of [['paintImage','image','Fit Image frame · Alt + 1'],['paintMask','mask','Fit Mask frame · Alt + 2'],['autoMask','autoMask','Auto Image → Mask'],['satori','satori','Satori · Alt + Z'],['paper','paper','Transparent paper'],['grid','grid','Show grid']]){const b=document.getElementById(id);b.innerHTML=icon(glyph);b.title=label;b.setAttribute('aria-label',label);}
 const help=document.createElement('button');help.id='drawingHelp';help.textContent='?';help.title='Drawing shortcuts and help';help.setAttribute('aria-label',help.title);help.onclick=()=>api?.updateScene({appState:{openDialog:{name:'help'}}});drawingToolbar.insertBefore(help,document.getElementById('satori'));
 document.getElementById('satori').onclick=()=>toggleSatori();
 document.getElementById('autoMask').onclick=()=>{autoImageMask=!autoImageMask;document.getElementById('autoMask').setAttribute('aria-pressed',String(autoImageMask));syncAutoMask();revision++;send({type:'scene',scene:scene(),frameId:inputFrameId,maskFrameId,exportMatchTheme});schedule();};
 document.getElementById('autoMask').setAttribute('aria-pressed','false');
 document.getElementById('grid').onclick=()=>api.updateScene({appState:{gridModeEnabled:!api.getAppState().gridModeEnabled}});
 document.getElementById('paper').onclick=()=>{const transparent=api.getAppState().viewBackgroundColor==='transparent';api.updateScene({appState:{viewBackgroundColor:transparent?'#ffffff':'transparent'}});};
 const exit=document.createElement('button');exit.id='satoriExit';exit.textContent='·';exit.title='Exit Satori · Alt + Z';exit.setAttribute('aria-label','Exit Satori');exit.onclick=()=>toggleSatori(false);document.body.append(exit);
}

const status=document.getElementById(host?'drawingStatus':'status');
const say=text=>status.textContent=text;
const send=payload=>window.parent.postMessage({channel,...payload},location.origin);
// An export-only invisible boundary establishes a fixed world-space crop.
const boundary=convertToExcalidrawElements([{type:'rectangle',x:0,y:0,width:SIZE,height:SIZE,opacity:0,strokeColor:'transparent',backgroundColor:'transparent',roughness:0}])[0];
function scene(){const value=JSON.parse(serializeAsJSON(api.getSceneElements().filter(e=>!runtimeElement(e)).map(e=>e.frameId===outputFrame?.id?{...e,frameId:null}:e),api.getAppState(),api.getFiles(),'local'));if(comfy){value.appState.theme=api.getAppState().theme;value.genereti={autoImageMask,outputSize};}return value;}
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('genereti-drawing',1);r.onupgradeneeded=()=>r.result.createObjectStore('scenes');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function persist(value){const db=await openDB();try{await new Promise((resolve,reject)=>{const tx=db.transaction('scenes','readwrite');tx.objectStore('scenes').put(value,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
async function stored(){const db=await openDB();try{return await new Promise((resolve,reject)=>{const r=db.transaction('scenes').objectStore('scenes').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
function normalizeSize(size={}){const dim=n=>Math.max(64,Math.min(2048,Math.round(Number(n)||512)));return {width:dim(size.width),height:dim(size.height),aspect:size.aspect||'free'};}
function inputCrop(kind='image'){
 const frameId=comfy&&kind==='mask'?maskFrameId:inputFrameId;
 const frame=frameInputMode&&api?.getSceneElements().find(e=>e.id===frameId&&e.type==='frame'&&!e.isDeleted);
 return frame?{x:frame.x,y:frame.y,width:frame.width,height:frame.height}:{x:0,y:0,width:SIZE,height:SIZE};
}
function updateFrameList(elements){
 if(!host&&!comfy)return;
 const select=document.getElementById('inputFrameSelect'),frames=elements.filter(e=>e.type==='frame'&&!runtimeElement(e)&&!e.isDeleted);
 const signature=JSON.stringify(frames.map(e=>[e.id,e.name]));
 if(select.dataset.frames!==signature){select.dataset.frames=signature;select.replaceChildren(...frames.map((e,i)=>new Option(e.name||`Frame ${i+1}`,e.id)));}
 select.value=inputFrameId;select.hidden=comfy||!frameInputMode;
 if(comfy){const maskSelect=document.getElementById('maskFrameSelect');if(maskSelect.dataset.frames!==signature){maskSelect.dataset.frames=signature;maskSelect.replaceChildren(...frames.map((e,i)=>new Option(e.name||`Frame ${i+1}`,e.id)));}maskSelect.value=maskFrameId;}
}
function ensureInputFrame(){
 if(!api||!frameInputMode)return;
 const elements=api.getSceneElements();
 if(!elements.some(e=>e.id===inputFrameId&&e.type==='frame'&&!e.isDeleted)){
  const existing=elements.find(e=>e.type==='frame'&&!runtimeElement(e)&&!e.isDeleted);
  if(existing)inputFrameId=existing.id;
  else{let [frame]=convertToExcalidrawElements([{type:'frame',children:[],name:comfy?'Image':'Input',customData:{generetiInput:true}}]);frame={...frame,x:0,y:0,width:SIZE,height:SIZE};inputFrameId=frame.id;api.updateScene({elements:[...elements,frame],captureUpdate:CaptureUpdateAction.IMMEDIATELY});}
 }
 if(comfy){
  if(!api.getSceneElements().some(e=>e.id===maskFrameId&&e.type==='frame'&&!e.isDeleted)){
   const existing=api.getSceneElements().find(e=>e.type==='frame'&&e.id!==inputFrameId&&e.name==='Mask');
   if(existing)maskFrameId=existing.id;else{let [frame]=convertToExcalidrawElements([{type:'frame',children:[],name:'Mask'}]);frame={...frame,x:0,y:1024,width:SIZE,height:SIZE};maskFrameId=frame.id;api.updateScene({elements:[...api.getSceneElements(),frame],captureUpdate:CaptureUpdateAction.NEVER});}
  }
  protectDrawingFrames(api.getSceneElements(),api.getAppState());
  syncMaskPaper();syncAutoMask();
 }
 try{if(!comfy)localStorage.setItem('genereti-input-frame',inputFrameId);}catch{}
 updateFrameList(api.getSceneElements());
}
// Output regions are workspace infrastructure, not selectable drawing content.
function protectDrawingFrames(elements,state){
 if(!comfy||!api)return false;
 let changed=false;
 const imageFrame=elements.find(e=>e.id===inputFrameId),maskFrame=elements.find(e=>e.id===maskFrameId);
 const maskX=imageFrame?.x||0,maskY=(imageFrame?.y||0)+outputSize.height+Math.max(512,outputSize.height);
 const dx=maskX-(maskFrame?.x||0),dy=maskY-(maskFrame?.y||0);
 const protectedIds=new Set([inputFrameId,maskFrameId].filter(Boolean));
 const next=elements.map(element=>{
  if(maskFrame&&element.frameId===maskFrameId&&(dx||dy)){changed=true;return {...element,x:element.x+dx,y:element.y+dy};}
  if(element.type!=='frame'||!protectedIds.has(element.id))return element;
  const role=element.id===inputFrameId?'image':'mask';
  const name=role==='image'?'Image':'Mask';
  const position=role==='mask'?{x:maskX,y:maskY}:{x:element.x,y:element.y};
  if(element.locked&&element.name===name&&element.width===outputSize.width&&element.height===outputSize.height&&element.x===position.x&&element.y===position.y&&element.customData?.generetiDrawingFrame===role)return element;
  changed=true;return {...element,...position,name,width:outputSize.width,height:outputSize.height,locked:true,customData:{...element.customData,generetiDrawingFrame:role}};
 });
 const selected={...state.selectedElementIds};
 for(const id of protectedIds)if(selected[id]){delete selected[id];changed=true;}
 if(changed)api.updateScene({elements:next,appState:{selectedElementIds:selected},captureUpdate:CaptureUpdateAction.NEVER});
 return changed;
}
function syncAutoMask(){
 if(!comfy||!api)return;
 const elements=api.getSceneElements().filter(e=>!e.customData?.generetiAutoMask);
 if(autoImageMask){
  if(!autoMaskElement){[autoMaskElement]=convertToExcalidrawElements([{type:'rectangle',x:0,y:0,width:SIZE,height:SIZE,locked:true,link:'https://genereti.local/auto-mask',customData:{generetiAutoMask:true}}]);autoMaskElement={...autoMaskElement,type:'embeddable'};}
  autoMaskElement={...autoMaskElement,...inputCrop('mask')};
  api.updateScene({elements:[...elements,autoMaskElement],captureUpdate:CaptureUpdateAction.NEVER});
 }else if(api.getSceneElements().some(e=>e.customData?.generetiAutoMask))api.updateScene({elements,captureUpdate:CaptureUpdateAction.NEVER});
}
function syncMaskPaper(){
 if(!comfy||!api)return;
 const frame=api.getSceneElements().find(e=>e.id===maskFrameId&&!e.isDeleted);if(!frame)return;
 if(!maskPaper){[maskPaper]=convertToExcalidrawElements([{type:'rectangle',x:frame.x,y:frame.y,width:frame.width,height:frame.height,backgroundColor:'#000000',fillStyle:'solid',strokeColor:'transparent',roughness:0,locked:true,customData:{generetiMaskPaper:true}}]);}
 const current=api.getSceneElements().find(e=>e.id===maskPaper.id);
 if(current&&['x','y','width','height'].every(k=>current[k]===frame[k]))return;
 maskPaper={...maskPaper,x:frame.x,y:frame.y,width:frame.width,height:frame.height};
 api.updateScene({elements:[maskPaper,...api.getSceneElements().filter(e=>!e.customData?.generetiMaskPaper)],captureUpdate:CaptureUpdateAction.NEVER});
}
function togglePanel(){keepPanelOpen=api?.getAppState().openSidebar?.name!=='genereti';api?.updateScene({appState:{openSidebar:keepPanelOpen?{name:'genereti'}:null}});}
if(host)document.addEventListener('pointerdown',event=>{if(event.target.closest?.('[data-testid="sidebar-close"]')?.closest('.sidebar')?.querySelector('.host-panel'))keepPanelOpen=false;},true);
function fit(){
 if(!api)return;
 const rect=document.getElementById('editor').getBoundingClientRect();
 const width=rect.width-(host&&api.getAppState().openSidebar?.name==='genereti'?360:0),height=rect.height;
 const crop=inputCrop(comfy?activeDrawingFrame:'image'),rects=[crop];if(outputMode.checked&&!overlayEnabled)rects.push(outputElement||{x:560,y:0,width:SIZE,height:SIZE});if(guideEnabled)rects.push({x:0,y:560,width:SIZE,height:SIZE});
 const minX=Math.min(...rects.map(e=>e.x)),minY=Math.min(...rects.map(e=>e.y)),worldWidth=Math.max(...rects.map(e=>e.x+e.width))-minX,worldHeight=Math.max(...rects.map(e=>e.y+e.height))-minY;
 const zoom=Math.max(.1,Math.min((width-50)/worldWidth,(height-150)/worldHeight,1.4));
 api.updateScene({appState:{zoom:{value:zoom},scrollX:(width/zoom-worldWidth)/2-minX,scrollY:(height/zoom-worldHeight)/2-minY+15/zoom}});
}
function outline(state){
 const zoom=state.zoom.value,crop=inputCrop(comfy?activeDrawingFrame:'image');
 const signature=JSON.stringify([state.scrollX,state.scrollY,zoom,crop]);if(signature===outlineSignature)return;outlineSignature=signature;
 const rect=document.getElementById('artboard');
 Object.assign(rect.style,{left:`${(state.scrollX+crop.x)*zoom}px`,top:`${(state.scrollY+crop.y)*zoom}px`,width:`${crop.width*zoom}px`,height:`${crop.height*zoom}px`});
}
async function rasterize(requestId,kind='image',vectors=true){
 if(!api)return;
 if(comfy&&requestId)ensureInputFrame();
 if(rendering){if(requestId)setTimeout(()=>rasterize(requestId,kind,vectors),20);return;}
 if(host&&document.getElementById('source').value!=='editor'&&!frameInputMode){dirty=false;return;}
 rendering=true;dirty=false;
 const W=comfy?outputSize.width:SIZE,H=comfy?outputSize.height:SIZE;
 const started=performance.now(),version=revision,value=scene(),darkExport=comfy&&exportMatchTheme&&kind==='image'&&api.getAppState().theme==='dark';
 try{
  const automaticMask=comfy&&kind==='mask'&&autoImageMask;
  const crop=inputCrop(automaticMask?'image':kind),cropBoundary=frameInputMode?{...boundary,...crop}:boundary;
  const elements=value.elements.filter(e=>!e.isDeleted&&(!frameInputMode||e.type!=='frame')).filter(e=>{if(!frameInputMode)return true;const b=getCommonBounds([e]);return b[2]>=crop.x&&b[0]<=crop.x+crop.width&&b[3]>=crop.y&&b[1]<=crop.y+crop.height;}).map(e=>frameInputMode?{...e,frameId:null}:e);
  const bounds=getCommonBounds([...elements,cropBoundary]);
  // Fixed artboard: zoom, panning, and out-of-bounds shapes never recenter output.
  if(bounds[2]-bounds[0]>8192||bounds[3]-bounds[1]>8192)throw new Error('Move distant shapes closer to the 512px artboard before rendering.');
  const canvas=await exportToCanvas({elements:[...elements,cropBoundary],appState:{...value.appState,exportBackground:(comfy&&(kind==='image'||automaticMask)&&value.appState.viewBackgroundColor!=='transparent')||!frameInputMode,exportWithDarkMode:darkExport,exportScale:1},files:value.files,exportPadding:0});
  const cropped=document.createElement('canvas');cropped.width=W;cropped.height=H;
  const ctx=cropped.getContext('2d');ctx.fillStyle=comfy&&kind==='mask'?'#000000':value.appState.viewBackgroundColor||'#ffffff';if(!automaticMask&&!(comfy&&kind==='image'&&value.appState.viewBackgroundColor==='transparent'))ctx.fillRect(0,0,W,H);
  ctx.drawImage(canvas,crop.x-bounds[0],crop.y-bounds[1],crop.width,crop.height,0,0,W,H);
  if(automaticMask){const pixels=ctx.getImageData(0,0,W,H),alpha=value.appState.viewBackgroundColor==='transparent';for(let i=0;i<pixels.data.length;i+=4){const strength=alpha?pixels.data[i+3]:(255-(.2126*pixels.data[i]+.7152*pixels.data[i+1]+.0722*pixels.data[i+2]))*pixels.data[i+3]/255;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=Math.round(strength);pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);lastAutoMask=cropped.toDataURL('image/png');refreshPreview('mask',lastAutoMask);}

  let layer=null;if(frameInputMode){const transparent=document.createElement('canvas');transparent.width=W;transparent.height=H;transparent.getContext('2d').drawImage(canvas,crop.x-bounds[0],crop.y-bounds[1],crop.width,crop.height,0,0,W,H);layer=transparent.toDataURL('image/png');}
  let svg='';if(comfy&&(requestId||drawingDemand.has('SVG'))&&kind==='image'&&vectors){const vector=await exportToSvg({elements:[...elements,cropBoundary],appState:{...value.appState,exportBackground:value.appState.viewBackgroundColor!=='transparent',exportWithDarkMode:darkExport},files:value.files,exportPadding:0});vector.setAttribute('viewBox',`${crop.x-bounds[0]} ${crop.y-bounds[1]} ${crop.width} ${crop.height}`);vector.setAttribute('width',String(W));vector.setAttribute('height',String(H));svg=new XMLSerializer().serializeToString(vector);}
  {send({type:'frame',svg,image:cropped.toDataURL('image/png'),scene:value,revision:version,layer,artboard:crop,frameId:inputFrameId,maskFrameId,exportMatchTheme,kind,requestId});timing('raster',performance.now()-started);count('raster');say('Live guide · editable shapes');}
 }catch(error){say(error.message);send({type:'error',message:error.message,requestId});}
 finally{rendering=false;if(dirty||version!==revision)schedule();}
}
function schedule(){
 if(comfy&&!autoImageMask&&!['IMAGE','MASK','SVG'].some(kind=>drawingDemand.has(kind))){dirty=false;return;}
 dirty=true;
 if(!liveEdits.checked&&pointerActive)return;
 // Throttle instead of restarting the timer on each drag event.
 if(liveEdits.checked&&timer)return;
 clearTimeout(timer);timer=setTimeout(async()=>{timer=null;if(comfy){if(drawingDemand.has('IMAGE')||drawingDemand.has('SVG'))await rasterize(undefined,'image',drawingDemand.has('SVG'));if(drawingDemand.has('MASK')||autoImageMask)await rasterize(undefined,'mask',false);}else rasterize();},liveEdits.checked?1000/Math.min(24,Number(document.getElementById('maxfpsValue')?.value)||24):80);
}
document.addEventListener('pointerdown',()=>{pointerActive=true;if(!liveEdits.checked){clearTimeout(timer);timer=null;}},true);
for(const event of ['pointerup','pointercancel'])document.addEventListener(event,()=>{pointerActive=false;if(dirty)schedule();},true);
liveEdits.onchange=()=>{document.getElementById('liveEditsToggle')?.setAttribute('aria-pressed',String(liveEdits.checked));try{localStorage.setItem('genereti-editor-live',String(liveEdits.checked));}catch{}if(dirty)schedule();};
function onChange(elements,state,files){
 if(comfy)document.getElementById('grid')?.setAttribute('aria-pressed',String(!!state.gridModeEnabled));
 if(comfy)document.getElementById('paper')?.setAttribute('aria-pressed',String(state.viewBackgroundColor==='transparent'));
 if(host&&keepPanelOpen&&!state.openSidebar&&!panelRestorePending){panelRestorePending=true;requestAnimationFrame(()=>{panelRestorePending=false;if(keepPanelOpen&&api&&!api.getAppState().openSidebar)api.updateScene({appState:{openSidebar:{name:'genereti'}}});});}
 if(comfy&&api){if(protectDrawingFrames(elements,state))return;syncMaskPaper();}
 updateFrameList(elements);outline(state);
 const live=elements.filter(e=>e.customData?.generetiOutput);
 outputFrame=live.find(e=>e.type==='frame')||outputFrame;outputElement=live.find(e=>e.type==='embeddable')||outputElement;
 if(overlayEnabled&&outputMode.checked&&outputElement){const crop=inputCrop();if(['x','y','width','height'].some(k=>outputElement[k]!==crop[k])){ensureOutputFrame();return;}}
 rememberOutputPlacement();
 if(state.theme!==editorTheme){editorTheme=state.theme;try{localStorage.setItem('genereti-editor-theme',editorTheme);}catch{}}
 if(host)document.body.dataset.theme=state.theme;
 const themeButton=document.getElementById('theme'),nextTheme=state.theme==='dark'?'light':'dark';
 if(host&&displayedTheme!==state.theme){displayedTheme=state.theme;themeButton.innerHTML=icon(nextTheme==='light'?'sun':'moon');themeButton.title=`Switch to ${nextTheme} mode (Shift + Alt + D)`;themeButton.setAttribute('aria-label',`Switch to ${nextTheme} mode`);}else if(comfy){themeButton.innerHTML=icon(nextTheme==='light'?'sun':'moon');}else if(!host)themeButton.textContent=nextTheme==='light'?'Light mode':'Dark mode';
 const signature=JSON.stringify([elements.filter(e=>!runtimeElement(e)).map(e=>[e.id,e.version,e.versionNonce,e.isDeleted]),state.viewBackgroundColor,comfy?state.theme:null,Object.keys(files)]);
 if(signature===lastSignature)return;
 lastSignature=signature;revision++;schedule();
 if(comfy){send({type:'scene',scene:scene(),frameId:inputFrameId,maskFrameId,exportMatchTheme});return;}
 clearTimeout(saveTimer);saveTimer=setTimeout(()=>persist(scene()).catch(()=>say('Drawing is in memory; local autosave unavailable. Save a drawing file to keep it.')),400);
}
async function load(value){
 if(comfy){outputSize=normalizeSize(value?.genereti?.outputSize);autoImageMask=value?.genereti?.autoImageMask===true;document.getElementById('autoMask').setAttribute('aria-pressed',String(autoImageMask));}
 if(!value||value.type!=='excalidraw'||!Array.isArray(value.elements)||value.elements.length>10000)throw new Error('Choose a valid .excalidraw drawing with fewer than 10,000 elements.');
 const restored=restore(value,null,null);
 api.resetScene();api.addFiles(Object.values(restored.files||{}));
 api.updateScene({elements:restored.elements,appState:{...restored.appState,theme:comfy?(value.appState?.theme||api.getAppState().theme):api.getAppState().theme,viewBackgroundColor:restored.appState.viewBackgroundColor||'#ffffff'}});
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
 try{if(comfy&&data.type==='output-size'){outputSize=normalizeSize(data.size);ensureInputFrame();revision++;send({type:'scene',scene:scene(),frameId:inputFrameId,maskFrameId,exportMatchTheme});fit();schedule();return;}if(comfy&&data.type==='scene-request'){send({type:'scene',scene:scene(),frameId:inputFrameId,maskFrameId,exportMatchTheme});return;}if(comfy&&data.type==='output-demand'){drawingDemand=new Set(data.outputs||[]);schedule();return;}if(comfy&&data.type==='export-appearance'){exportMatchTheme=Boolean(data.enabled);revision++;send({type:'scene',scene:scene(),frameId:inputFrameId,maskFrameId,exportMatchTheme});schedule();return;}if(comfy&&data.type==='edit-frame'){document.getElementById(data.kind==='mask'?'paintMask':'paintImage').click();if(data.freehand)api?.setActiveTool({type:'freedraw'});return;}if(comfy&&data.type==='capture'){await rasterize(data.requestId,data.kind||'image',data.vectors!==false);return;}if(comfy&&data.type==='load'){inputFrameId=data.frameId||'';maskFrameId=data.maskFrameId||'';exportMatchTheme=Boolean(data.exportMatchTheme);maskPaper=null;await load(data.scene);send({type:'loaded'});schedule();return;}if(data.type==='guide-mode')showGuide(data);if(data.type==='guide'){guideImage=data.image;setGuideImage?.(guideImage);}if(data.type==='source')showSource(data);if(data.type==='output')await showOutput(data);if(data.type==='shortcut')shortcut(data.event,true);if(data.type==='fit')fit();if(data.type==='load')await load(data.scene);if(data.type==='save')download(scene());if(data.type==='refresh')schedule();}
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
function clearDrawing(){
 if(!api||!comfy)return;
 const keep=new Set([inputFrameId,maskFrameId]);
 api.updateScene({elements:api.getSceneElements().map(e=>keep.has(e.id)||runtimeElement(e)?e:{...e,isDeleted:true}),appState:{selectedElementIds:{}},captureUpdate:CaptureUpdateAction.IMMEDIATELY});
 revision++;schedule();
}
function shortcut(event,forwarded=false){
 if(!api)return;
 const editing=document.activeElement?.closest('input:not([type=radio]):not([type=checkbox]),textarea,select,[contenteditable="true"]');
 if(comfy&&!editing&&(event.metaKey||event.ctrlKey)&&event.shiftKey&&event.code==='Backspace'){event.preventDefault?.();event.stopImmediatePropagation?.();clearDrawing();return;}
 if(event.ctrlKey||event.metaKey)return;
 if(comfy&&!editing&&event.altKey&&!event.shiftKey&&event.code==='KeyZ'){event.preventDefault?.();event.stopImmediatePropagation?.();toggleSatori();return;}
 const target=document.activeElement;
 if(!event.altKey&&['BracketLeft','BracketRight'].includes(event.code)&&!target?.closest('input:not([type=radio]):not([type=checkbox]),textarea,select,[contenteditable="true"]')){
  event.preventDefault?.();event.stopImmediatePropagation?.();
  const step=event.shiftKey ? 0.25 : 1,direction=event.code==='BracketRight'?1:-1;
  const width=Math.max(.25,Math.min(100,Math.round((api.getAppState().currentItemStrokeWidth+direction*step)*100)/100));
  api.updateScene({appState:{currentItemStrokeWidth:width}});return;
 }
 if(!forwarded&&target?.matches('input,textarea,select,[contenteditable="true"]'))return;
 if(comfy&&event.shiftKey&&event.altKey&&event.code==='KeyU'){event.preventDefault?.();event.stopImmediatePropagation?.();document.getElementById('liveEditsToggle').click();return;}
 if(comfy&&event.altKey&&!event.shiftKey&&['Digit1','Digit2'].includes(event.code)){event.preventDefault?.();event.stopImmediatePropagation?.();document.getElementById(event.code==='Digit1'?'paintImage':'paintMask').click();return;}
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
 try{const previous=comfy?null:await stored();if(previous)await load(previous);}catch{say('Local autosave unavailable.');}
 requestAnimationFrame(()=>{if(host)api.updateScene({appState:{openSidebar:{name:'genereti'},frameRendering:{...api.getAppState().frameRendering,name:frameLabels}}});ensureInputFrame();ensureOutputFrame();if(comfy){api.setActiveTool({type:'freedraw'});toggleSatori(true);}fit();schedule();send({type:'ready'});send({type:'frame-input-mode',enabled:frameInputMode});send({type:'output-mode',enabled:outputMode.checked});});
}
if(comfy)document.addEventListener('keydown',event=>{if(event.key==='Escape')send({type:'collapse'});});
if(comfy){
 for(const [id,kind] of [['inputFrameSelect','image'],['maskFrameSelect','mask']])document.getElementById(id).onchange=()=>{
  if(kind==='mask')maskFrameId=document.getElementById(id).value;else inputFrameId=document.getElementById(id).value;
  activeDrawingFrame=kind;syncMaskPaper();outlineSignature='';outline(api.getAppState());revision++;
  send({type:'scene',scene:scene(),frameId:inputFrameId,maskFrameId,exportMatchTheme});schedule();fit();
 };
 document.getElementById('paintImage').onclick=()=>{activeDrawingFrame='image';fit();};
 document.getElementById('paintMask').onclick=()=>{activeDrawingFrame='mask';fit();};
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
const mountDrawingToolbar=node=>{if(drawingToolbar)(node||drawingToolbarParking).append(drawingToolbar);};
const previewNodes=new Map();
function refreshPreview(kind,image){
 const entry=previewNodes.get(kind);if(!entry)return;
 if(image&&entry.img.src!==image)entry.img.src=image;
 entry.img.hidden=!image;entry.empty.hidden=Boolean(image)||kind==='mask';
}
setLiveOutput=image=>refreshPreview('output',image);
setSourceImage=value=>refreshPreview('source',value.image);
setGuideImage=image=>refreshPreview('guide',image);
function LivePreview({kind}){
 return <div className="host-source" style={{width:'100%',height:'100%',pointerEvents:'none'}} ref={node=>{if(!node){previewNodes.delete(kind);return;}previewNodes.set(kind,{img:node.querySelector('img'),empty:node.querySelector('span')});refreshPreview(kind,kind==='mask'?lastAutoMask:kind==='output'?lastOutput:kind==='source'?sourceImage:guideImage);}}><img alt={kind==='output'?'Live generated output':kind==='source'?'Live input source':'Prepared model guide'} style={{width:'100%',height:'100%',objectFit:'contain'}}/><span>{kind==='output'?'Waiting for generation…':kind==='source'?'Enable or choose your source in Genereti':'Guide · run generation to preview'}</span></div>;
}
const renderLiveEmbeddable=element=>element.customData?.generetiAutoMask?<LivePreview kind="mask"/>:element.customData?.generetiGuide?<LivePreview kind="guide"/>:element.customData?.generetiSource?<LivePreview kind="source"/>:element.customData?.generetiOutput?<LivePreview kind="output"/>:null;
function DrawingEditor(){
 count('hostRenders');
 const [docked,setDocked]=useState(true);
 const [satoriMode,setSatoriMode]=useState(comfy);setSatoriState=setSatoriMode;
 const footer=useMemo(()=>comfy?<Footer><div className="drawing-tools" ref={mountDrawingToolbar}/></Footer>:host&&<Footer><div className="host-tools"><div ref={mountToolbar}/><div ref={mountHeader}/><button className="sidebar-trigger" onClick={togglePanel} title="Genereti controls" aria-label="Show or hide Genereti controls" dangerouslySetInnerHTML={{__html:icon('panel')}}/></div></Footer>,[]);
 return <Excalidraw zenModeEnabled={comfy?satoriMode:undefined} renderEmbeddable={renderLiveEmbeddable} validateEmbeddable={link=>['https://genereti.local/live-output','https://genereti.local/live-source','https://genereti.local/live-guide','https://genereti.local/auto-mask'].includes(link)} excalidrawAPI={initializeEditor} onChange={onChange} initialData={{appState:{viewBackgroundColor:comfy?'transparent':'#ffffff',currentItemStrokeColor:'#111111',currentItemStrokeWidth:2,currentItemRoughness:1,theme:editorTheme,...(comfy?{gridSize:20,activeTool:{type:'freedraw',customType:null,locked:false}}: {})}}} UIOptions={{canvasActions:{loadScene:false,saveToActiveFile:false,export:false,toggleTheme:true}}} detectScroll={false} handleKeyboardGlobally={true}>{comfy&&<MainMenu><MainMenu.Item onSelect={clearDrawing}>Clear drawing · Cmd/Ctrl+Shift+Backspace</MainMenu.Item><MainMenu.DefaultItems.ChangeCanvasBackground/><MainMenu.DefaultItems.ToggleTheme/><MainMenu.DefaultItems.Help/></MainMenu>}{host&&<Sidebar name="genereti" docked={docked} onDock={setDocked}><Sidebar.Header>Genereti · live image lab</Sidebar.Header><div ref={mountPanel}/></Sidebar>}{footer}</Excalidraw>;
}
createRoot(document.getElementById('editor')).render(<DrawingEditor/>);
new ResizeObserver(()=>{if(api)fit();}).observe(document.getElementById('editor'));

if(!host&&!comfy)new ResizeObserver(entries=>{document.getElementById('editor').style.bottom=`${entries[0].contentRect.height}px`;}).observe(document.getElementById('toolbar'));
