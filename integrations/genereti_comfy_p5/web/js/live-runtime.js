import { app } from '../../../scripts/app.js';
import { ensureControlStyle } from './control-style.js';

// Frames are borrowed for this synchronous dispatch; consumers draw/copy them
// immediately. The source closes its ImageBitmap after all listeners return.
export function publishLive(node, bitmap, outputSlot=0) {
  if(node._generetiExecutionMode==='Comfy Queue')return;
  window.dispatchEvent(new CustomEvent('genereti-live-frame', {
    detail: { nodeId: node.id, outputSlot, bitmap, producedAt: performance.now() },
  }));
}

export function resolveLiveSource(node, seen = new Set()) {
  if (!node || seen.has(node.id)||node._generetiExecutionMode==='Comfy Queue') return null;
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

export function subscribeLive(node, onFrame, onStatus=()=>{}) {
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
    if (!disposed && source && (event.detail.outputSlot??0)===sourceSlot && String(event.detail.nodeId)===String(source.id)) onFrame(event.detail);
  };
  window.addEventListener('genereti-live-frame',listener);
  // Rebind after rewiring/selecting a source; this does not submit Comfy jobs.
  const timer=setInterval(bind,250);bind();
  return () => {disposed=true;clearInterval(timer);window.removeEventListener('genereti-live-frame',listener);driver?.release(sourceSlot);};
}

// Shared browser transport choice. This is workflow UI state, never a model
// parameter and never an instruction to queue the Python graph automatically.
const browserNodes=new Set(['GeneretiDrawing','GeneretiP5Sketch','GeneretiLivecode','GeneretiCameraCapture','GeneretiScreenCapture','GeneretiLiveImagePreview','GeneretiProjector']);
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
  const apply=next=>{
    mode=next==='Comfy Queue'?'Comfy Queue':'Live';node._generetiExecutionMode=mode;select.value=mode;
    node._generetiSetExecutionMode?.(mode);node.graph?.change?.(node);
  };
  select.onchange=()=>apply(select.value);
  element.addEventListener('pointerdown',event=>event.stopPropagation());
  const widget=node.addDOMWidget('genereti_delivery','GENERETI_DELIVERY',element,{serialize:true,hideOnZoom:false,getValue:()=>mode,setValue:apply});
  // Keep the workflow choice, but exclude browser delivery state from Python inputs.
  widget.serializeValue=()=>undefined;widget.computeSize=width=>[width,node.comfyClass==='GeneretiDrawing'?0:32];
  node._generetiExecutionModeWidget=widget;node._generetiExecutionModeElement=element;
  node._generetiMountExecutionMode?.(element);apply(mode);
}
app.registerExtension({name:'Genereti.BrowserDelivery',nodeCreated(node){
  if(browserNodes.has(node.comfyClass))attachExecutionMode(node);
}});
