import { app } from '../../../scripts/app.js';
import { ensureControlStyle } from './control-style.js';

// Frames are borrowed for this synchronous dispatch; consumers draw/copy them
// immediately. The source closes its ImageBitmap after all listeners return.
export function publishLive(node, bitmap, outputSlot=0) {
  if(node._generetiExecutionMode==='Comfy Queue'||node._generetiLivePaused)return;
  window.dispatchEvent(new CustomEvent('genereti-live-frame', {
    detail: { nodeId: node.id, outputSlot, bitmap, producedAt: performance.now() },
  }));
}

export function resolveLiveSource(node, seen = new Set()) {
  if (!node || seen.has(node.id)||node._generetiExecutionMode==='Comfy Queue'||node._generetiLivePaused) return null;
  seen.add(node.id);
  if (node._generetiLiveSource || node._generetiCapture) return node;
  const name = node.comfyClass === 'GeneretiInputSelect' ?
    ({ Doodle:'doodle', Webcam:'webcam', 'Window / Screen':'screen' })[node.widgets?.find(w=>w.name==='source')?.value] : 'image';
  // Only known pass-through viewers may be traversed. Never skip a Python effect.
  if (!['GeneretiInputSelect','GeneretiLiveImagePreview','GeneretiProjector'].includes(node.comfyClass)) return null;
  const slot = node.inputs?.findIndex(input=>input.name===name);
  let graph;try{graph=node.graph;}catch{return null;}
  if (!graph) return null;
  const link = slot >= 0 ? node.getInputLink?.(slot) ?? app.graph.links[node.inputs[slot].link] : null;
  return resolveLiveSource(app.graph.getNodeById(link?.origin_id), seen);
}

function liveOutputSlot(node,source,seen=new Set()){
 if(!source||!node||node===source||seen.has(node.id))return 0;seen.add(node.id);
 const name=node.comfyClass==='GeneretiInputSelect'?({Doodle:'doodle',Webcam:'webcam','Window / Screen':'screen'})[node.widgets?.find(w=>w.name==='source')?.value]:'image';
 const slot=node.inputs?.findIndex(input=>input.name===name);
 const link=slot>=0?(node.getInputLink?.(slot)??node.graph?.links?.[node.inputs[slot].link]):null;
 const parent=node.graph?.getNodeById(link?.origin_id);
 return parent===source?(link.origin_slot??0):liveOutputSlot(parent,source,seen);
}

function videoSource(node) {
  if (node._generetiLiveSource) return node._generetiLiveSource;
  let users=0, raf=0, pending=false, last=0, epoch=0;
  const tick = async now => {
    if (!users) return;
    raf=requestAnimationFrame(tick);
    const state=node._generetiCapture, video=state?.video;
    if (pending || now-last<1000/60 || !state?.stream || !video || video.readyState<2) return;
    pending=true;last=now;const session=epoch;
    try {
      const bitmap=await createImageBitmap(video);
      if (users && session===epoch) publishLive(node,bitmap);
      bitmap.close();
    } catch (error) { console.warn("Genereti live capture:", error.message); } finally {pending=false;}
  };
  node._generetiLiveSource={
    retain(){if(++users===1)raf=requestAnimationFrame(tick);},
    release(){users=Math.max(0,users-1);if(!users){epoch++;cancelAnimationFrame(raf);}},
  };
  return node._generetiLiveSource;
}

export function subscribeLive(node, onFrame, onStatus=()=>{}, {gpu=false}={}) {
  let source=undefined, sourceSlot=0,driver=null, disposed=false;
  const bind = () => {
    const next=resolveLiveSource(node);
    const nextSlot=liveOutputSlot(node,next);
    if (next===source&&nextSlot===sourceSlot) return;
    driver?.release(sourceSlot);source=next;sourceSlot=nextSlot;driver=null;
    if (source) {
      driver=source._generetiLiveSource || videoSource(source);driver.retain(sourceSlot);
      onStatus('Browser clock · waiting for live frames');
    } else onStatus('No browser live source · queued IMAGE previews still work');
  };
  const listener = event => {
    if (!disposed && source && (event.detail.outputSlot??0)===sourceSlot && String(event.detail.nodeId)===String(source.id)) {
      const detail=event.detail;
      if(!detail.texture||gpu)onFrame(detail);
      else if(source._generetiTexturePresent){
        try{onFrame({...detail,bitmap:source._generetiTexturePresent(detail)});}
        catch(error){onStatus(`GPU display failed: ${error.message}`);}
      }
    }
  };
  window.addEventListener('genereti-live-frame',listener);
  // Rebind after rewiring/selecting a source; this does not submit Comfy jobs.
  const timer=setInterval(bind,250);bind();
  return () => {disposed=true;clearInterval(timer);window.removeEventListener('genereti-live-frame',listener);driver?.release(sourceSlot);};
}

// Shared browser transport choice. This is workflow UI state, never a model
// parameter and never an instruction to queue the Python graph automatically.
const browserNodes=new Set(['GeneretiSDXSGenerate','GeneretiSDTurboGenerate','GeneretiLiveGenerator','GeneretiDrawing','GeneretiP5Sketch','GeneretiLivecode','GeneretiCameraCapture','GeneretiScreenCapture','GeneretiLiveImagePreview','GeneretiProjector']);
export function attachExecutionMode(node){
  if(node._generetiExecutionModeWidget)return;
  ensureControlStyle();
  let mode='Live';
  const element=document.createElement('div');
  element.className='genereti-node-controls';
  Object.assign(element.style,{display:'flex',gap:'10px',alignItems:'center',padding:'4px 0'});
  const select=document.createElement('select');select.setAttribute('aria-label','Output delivery');
  select.title='Output delivery';
  for(const choice of ['Live','Comfy Queue'])select.add(new Option(choice,choice));
  element.append(select);
  if(!['GeneretiSDXSGenerate','GeneretiSDTurboGenerate','GeneretiLiveGenerator'].includes(node.comfyClass)){
    const transport=document.createElement('button');transport.type='button';
    const paint=()=>{const custom=node._generetiTransportState?.();if(custom){transport.textContent=custom.text;transport.title=custom.title;transport.setAttribute('aria-label',custom.title);transport.disabled=Boolean(custom.disabled);return;}transport.textContent=node._generetiLivePaused?'▶':'Ⅱ';transport.title=node._generetiLivePaused?'Resume live delivery':'Pause live delivery · editor keeps running';transport.setAttribute('aria-label',transport.title);transport.disabled=select.value==='Comfy Queue';};
    transport.onclick=()=>{if(node._generetiToggleTransport){void node._generetiToggleTransport();paint();return;}node._generetiLivePaused=!node._generetiLivePaused;paint();};
    node._generetiTransportRefresh=paint;select.addEventListener('change',paint);element.append(transport);paint();
  }
  const apply=next=>{
    mode=next==='Comfy Queue'?'Comfy Queue':'Live';node._generetiExecutionMode=mode;select.value=mode;
    node._generetiSetExecutionMode?.(mode);node._generetiTransportRefresh?.();node.graph?.change?.(node);
  };
  select.onchange=()=>apply(select.value);
  element.addEventListener('pointerdown',event=>event.stopPropagation());
  const widget=node.addDOMWidget('genereti_delivery','GENERETI_DELIVERY',element,{serialize:true,hideOnZoom:false,getValue:()=>mode,setValue:apply});
  // Keep the workflow choice, but exclude browser delivery state from Python inputs.
  widget.serializeValue=()=>undefined;widget.computeSize=width=>[width,node.comfyClass==='GeneretiDrawing'?0:Math.max(['GeneretiSDXSGenerate','GeneretiSDTurboGenerate','GeneretiLiveGenerator'].includes(node.comfyClass)?64:32,element.scrollHeight??0)];
  node._generetiExecutionModeWidget=widget;node._generetiExecutionModeElement=element;
  node._generetiMountExecutionMode?.(element);node._generetiMountPreviewControls?.();node._generetiMountTransport?.();apply(mode);
  if(node.comfyClass!=='GeneretiDrawing'){
    // Canonical serialization follows the original widget order, even though
    // the browser-only transport row is displayed first.
    const original=node.widgets.filter(w=>w!==widget);
    const defaults=new Map(original.map(w=>[w.name,w.value]));
    const valid=(w,v)=>{const d=defaults.get(w.name);return typeof d==='boolean'?typeof v==='boolean':typeof d==='number'?typeof v==='number'&&Number.isFinite(v):true;};
    node.widgets=[widget,...original];
    const configured=node.onConfigure;
    node.onConfigure=function(info){
      const result=configured?.apply(this,arguments);
      // LiteGraph has already assigned old positional values to the new visual
      // order. Restore schema defaults first, including newly added controls.
      for(const w of original)if(defaults.has(w.name))w.value=defaults.get(w.name);
      if(info?.widgets_values){const values=[...info.widgets_values];const delivery=values.findLastIndex(v=>v==='Live'||v==='Comfy Queue');if(delivery>=0)apply(values.splice(delivery,1)[0]);original.filter(w=>w.options?.serialize!==false).forEach((w,i)=>{if(i<values.length&&valid(w,values[i]))w.value=values[i];});}
      const saved=info?.properties?.genereti_widget_values;if(saved)for(const w of node.widgets??[])if(Object.hasOwn(saved,w.name)&&valid(w,saved[w.name]))w.value=saved[w.name];
      node._generetiRestorePrompt?.();node._generetiMountTransport?.();return result;
    };
    const serialized=node.onSerialize;
    node.onSerialize=function(info){const result=serialized?.apply(this,arguments);info.properties??={};info.properties.genereti_widget_values=Object.fromEntries(node.widgets.filter(w=>w!==widget&&w.options?.serialize!==false).map(w=>[w.name,w.value]));const ordered=[...original,widget,...node.widgets.filter(w=>w!==widget&&!original.includes(w))];info.widgets_values=ordered.filter(w=>w.options?.serialize!==false).map(w=>w===widget?mode:w.value);return result;};
  }
}
app.registerExtension({name:'Genereti.BrowserDelivery',nodeCreated(node){
  if(browserNodes.has(node.comfyClass))attachExecutionMode(node);
}});
