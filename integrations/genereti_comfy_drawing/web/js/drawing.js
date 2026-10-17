import { app } from '../../../scripts/app.js';
import { api } from '../../../scripts/api.js';
import { publishLive } from '/extensions/genereti_comfy_p5/js/live-runtime.js';
import { previewState } from '/extensions/genereti_comfy_p5/js/preview-state.js';
import { ensureControlStyle } from '/extensions/genereti_comfy_p5/js/control-style.js';
import { previewControls } from '/extensions/genereti_comfy_stream/js/preview-controls.js';
import { routePreviewShortcut } from '/extensions/genereti_comfy_stream/js/preview-shortcuts.js';

import { connectedOutputs,sceneJSON } from './output-demand.js';
import { renderSettings } from './render-settings.js';

const CHANNEL = 'genereti-drawing-v1';
function makeDrawing(node, name) {
  ensureControlStyle();
  let value = '', ready = false, pending = null, loading = false,liveUsers=0,liveEpoch=0,livePending=new Set(),latestImage='';
  const container = document.createElement('div');
  const controls = document.createElement('div');
  controls.className='genereti-node-controls';
  let matchEditorTheme=false;
  const matchTheme=document.createElement('button');matchTheme.type='button';
  matchTheme.setAttribute('aria-label','Match editor theme');
  matchTheme.title='Match editor theme · IMAGE and SVG only; MASK stays unchanged';
  matchTheme.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4M16 7a4 4 0 1 0 2 6 3 3 0 0 1-2-6Z"/></svg>';
  const setMatchTheme=enabled=>{matchEditorTheme=enabled;matchTheme.setAttribute('aria-pressed',String(enabled));};
  setMatchTheme(false);
  matchTheme.onclick=()=>{setMatchTheme(!matchEditorTheme);send({type:'export-appearance',enabled:matchEditorTheme});};
  const status = document.createElement('span');
  const render=renderSettings(size=>send({type:'output-size',size}));
  const frame = document.createElement('iframe');
  frame.title = 'ꘇ interactive drawing';
  frame.src = api.apiURL('/genereti/drawing/index.html');
  Object.assign(container.style, {width:'100%', height:'100%', display:'flex', flexDirection:'column', background:'var(--comfy-menu-bg, #222)'});
  Object.assign(controls.style, {padding:'4px',flexShrink:'0'});
  // A dark host embedding a light document otherwise gets an opaque browser
  // canvas backing even when every CSS background and canvas pixel has alpha.
  Object.assign(frame.style, {width:'100%', flex:'1 1 auto', height:'560px', minHeight:'560px', border:'0',pointerEvents:'auto',background:'transparent',colorScheme:'normal'});
  status.textContent = 'Loading drawing tools…';
  controls.append(render.element,matchTheme,status); container.append(controls, frame);
  // The node behaves like the other live nodes: delivery and pause, the output window / overlay / visual / backdrop glyphs,
  // freeze, minimize and fit. Alt+W moves this editor into an overlay window you draw in, and the node mirrors it (the last
  // frame); Freeze holds delivery and the mirror, and the editor stays usable.
  let viewers=0,local=null,output=null;
  const preview=document.createElement('canvas');preview.width=preview.height=1;
  const mirror=document.createElement('div');
  Object.assign(mirror.style,{flex:'1 1 auto',minHeight:'560px',display:'none',alignItems:'center',justifyContent:'center',overflow:'hidden'});
  Object.assign(preview.style,{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',background:'transparent'});
  mirror.append(preview);frame.after(mirror);
  const showFrame=bitmap=>{preview.width=bitmap.width;preview.height=bitmap.height;preview.getContext('2d').drawImage(bitmap,0,0);output.publish({bitmap:preview});};
  output=previewControls(frame,status,node,()=>{},{
    fitTarget:null,initialFrame:()=>({bitmap:preview}),getRenderSize:()=>preview,
    getFit:()=>node.properties?.genereti_preview_fit??'contain',onFitChange:value=>local?.setFit(value),
    interactiveSurface:frame,publishOnOpen:false,
    onViewerChange:opened=>{viewers=Math.max(0,viewers+(opened?1:-1));demandSignature='';syncDemand();},
    onSurfaceChange:open=>{mirror.style.display=open?'flex':'none';if(!open)status.textContent='';send({type:'edit-frame',kind:'image',...(open?{freehand:true}:{})});},
  });
  node._generetiMountTransport=()=>node._generetiExecutionModeElement?.append(output.actions);
  local=previewState(node,frame,{getFit:()=>node.properties?.genereti_preview_fit??'contain'});
  local.actions.append(output.toolbar);
  // Alt+O, Alt+W and the other preview shortcuts also work with the focus inside the (same-origin) editor.
  frame.addEventListener('load',()=>{try{frame.contentWindow.addEventListener('keydown',routePreviewShortcut,true);}catch{/* not reachable */}});
  controls.addEventListener('pointerdown',event=>event.stopPropagation());
  const send = data => frame.contentWindow?.postMessage({channel:CHANNEL, ...data}, location.origin);
  const restore = () => {
    if (!ready || !value) return;
    try {const saved=JSON.parse(value);setMatchTheme(saved.exportMatchTheme===true);loading=true;send({type:'load',scene:saved.scene,frameId:saved.frameId,maskFrameId:saved.maskFrameId,exportMatchTheme:matchEditorTheme});}
    catch {status.textContent='Could not restore drawing';}
  };
  const widget=node.addDOMWidget(name,'GENERETI_DRAWING',container,{
    serialize:true, hideOnZoom:false,
    getValue:()=>value,
    setValue(next){value=typeof next==='string'?next:'';restore();},
  });
  widget.computeSize=width=>[width,600];
  const receive = event => {
    if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.channel!==CHANNEL)return;
    const data=event.data;
    if(data.type==='ready'){ready=true;restore();send({type:'scene-request'});if(!loading)send({type:'edit-frame',kind:'image'});status.textContent='';}
    if(data.type==='loaded'){loading=false;send({type:'scene-request'});send({type:'edit-frame',kind:'image'});}
    if((data.type==='frame'||data.type==='scene')&&ready&&!loading){
      render.setValue(data.scene?.genereti?.outputSize);
      setMatchTheme(!!data.exportMatchTheme);
      const next=JSON.stringify({scene:data.scene,frameId:data.frameId,maskFrameId:data.maskFrameId,exportMatchTheme:!!data.exportMatchTheme});
      if(value!==next){value=next;node.graph?.change?.(node);}
      status.textContent='';
      if(node._generetiExecutionMode!=='Comfy Queue'&&connectedOutputs(node).includes('JSON'))publishValue(3,sceneJSON(data.scene,data.frameId,data.maskFrameId));
    }
    if(data.requestId&&data.requestId===pending?.id){
      const request=pending;pending=null;clearTimeout(request.timer);
      if(data.type==='error')request.reject(new Error(data.message));
      else request.resolve(data);
    }
    if(data.type==='frame'&&data.kind==='mask'&&ready&&!loading&&connectedOutputs(node).includes('MASK'))void publishDrawing(data.image,1);
    if(data.svg&&ready&&!loading&&connectedOutputs(node).includes('SVG'))publishValue(2,data.svg);
    if(data.type==='frame'&&data.kind==='image'&&ready&&!loading){latestImage=data.image;if(connectedOutputs(node).includes('IMAGE')||viewers>0)void publishDrawing(data.image,0);}
    if(data.type==='error'){loading=false;status.textContent=data.message;}
  };
  window.addEventListener('message',receive);
  function publishValue(outputSlot,value){
    if(node._generetiExecutionMode==='Comfy Queue')return;
    node._generetiLiveValues ||= new Map();node._generetiLiveValues.set(outputSlot,value);
    window.dispatchEvent(new CustomEvent('genereti-live-value',{detail:{nodeId:node.id,outputSlot,value,producedAt:performance.now()}}));
  }
  let demandSignature='';
  const syncDemand=()=>{
    if(!ready||loading)return;
    // Image frames are also wanted by the output windows and the node's mirror, with or without a connected IMAGE.
    const wanted=node._generetiExecutionMode==='Comfy Queue'?[]:connectedOutputs(node);
    const outputs=viewers>0&&!wanted.includes('IMAGE')?['IMAGE',...wanted]:wanted;
    const signature=JSON.stringify(outputs);if(signature===demandSignature)return;demandSignature=signature;send({type:'output-demand',outputs});
    if(outputs.includes('JSON')&&value){const saved=JSON.parse(value);publishValue(3,sceneJSON(saved.scene,saved.frameId,saved.maskFrameId));}
  };
  const demandTimer=setInterval(syncDemand,250);
  node._generetiSetExecutionMode=()=>{demandSignature='';syncDemand();};
  async function publishDrawing(image,slot=0){
    if(livePending.has(slot))return;livePending.add(slot);const epoch=liveEpoch;
    try{const bitmap=await createImageBitmap(await(await fetch(image)).blob());
      try{
        if(epoch===liveEpoch&&!local?.frozen){   // (Freeze holds delivery and the node's mirror; the editor stays usable)
          if(connectedOutputs(node).includes(['IMAGE','MASK'][slot]))publishLive(node,bitmap,slot);
          if(slot===0&&viewers>0)showFrame(bitmap);
        }
      }finally{bitmap.close();}
    }catch(error){status.textContent=error.message;}finally{livePending.delete(slot);}
  }
  let requestChain=Promise.resolve();
  function requestFrame(kind='image',vectors=true){
    const request=()=>{
      if(!ready||loading)throw new Error('Wait for the ꘇ drawing editor to finish loading.');
      return new Promise((resolve,reject)=>{
        const id=crypto.randomUUID();
        pending={id,resolve,reject,timer:setTimeout(()=>{pending=null;reject(new Error('Drawing capture timed out.'));},10000)};
        send({type:'capture',requestId:id,kind,vectors});
      });
    };
    requestChain=requestChain.catch(()=>{}).then(request);return requestChain;
  }
  async function uploadFrame(captured,kind){
    const blob=await(await fetch(captured.image)).blob();
    const body=new FormData();body.append('image',blob,`drawing-${kind}-${crypto.randomUUID()}.png`);body.append('type','temp');body.append('subfolder','genereti-drawing');
    const response=await api.fetchApi('/upload/image',{method:'POST',body});
    if(!response.ok)throw new Error(`Drawing upload failed (${response.status}).`);
    const result=await response.json();
    return `${result.subfolder?result.subfolder+'/':''}${result.name} [${result.type||'temp'}]`;
  }
  node._generetiLiveSource={
    retain(){if(++liveUsers===1){if(latestImage)void publishDrawing(latestImage);send({type:'refresh'});}},
    release(){liveUsers=Math.max(0,liveUsers-1);if(!liveUsers)liveEpoch++;},
  };
  node._generetiDrawing={
    async captureDataUrl(){return (await requestFrame('image',false)).image;},
    async capture(kind){
      const captured=await requestFrame(kind);
      return {...captured,path:await uploadFrame(captured,kind)};
    },
    async serializeOutputs(){
      const outputs=connectedOutputs(node),result={outputs};
      let snapshot=JSON.parse(value||'{}');
      if(outputs.includes('IMAGE')||outputs.includes('SVG')){
        const image=await requestFrame('image',outputs.includes('SVG'));
        snapshot=image;
        if(outputs.includes('IMAGE'))result.image=await uploadFrame(image,'image');
        if(outputs.includes('SVG'))result.svg=image.svg;
      }
      if(outputs.includes('MASK')){
        const mask=await requestFrame('mask',false);snapshot=mask;result.mask=await uploadFrame(mask,'mask');
      }
      if(outputs.includes('JSON'))result.json=sceneJSON(snapshot.scene,snapshot.frameId,snapshot.maskFrameId);
      return JSON.stringify(result);
    },
    dispose(){output?.close();clearInterval(demandTimer);liveUsers=0;liveEpoch++;window.removeEventListener('message',receive);if(pending){clearTimeout(pending.timer);pending.reject(new Error('Drawing node removed.'));pending=null;}frame.remove();},
  };
  return {widget};
}
function makeCapture(node,name){
  const element=document.createElement('div');element.hidden=true;
  const widget=node.addDOMWidget(name,'GENERETI_DRAWING_CAPTURE',element,{serialize:true,getValue:()=>'',setValue(){}});
  widget.computeSize=()=>[0,0];widget.serializeValue=()=>node._generetiDrawing.serializeOutputs();
  return {widget};
}
app.registerExtension({
  name:'Genereti.Drawing',
  getCustomWidgets(){return {GENERETI_DRAWING:makeDrawing,GENERETI_DRAWING_CAPTURE:makeCapture};},
  nodeCreated(node){
    if(node.comfyClass!=='GeneretiDrawing')return;
    node.size=[960,720];
    const removed=node.onRemoved;
    node.onRemoved=function(){node._generetiDrawing?.dispose();return removed?.apply(this,arguments);};
  },
});
