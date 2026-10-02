import { app } from '../../../scripts/app.js';

// Frames are borrowed for this synchronous dispatch; consumers draw/copy them
// immediately. The source closes its ImageBitmap after all listeners return.
export function publishLive(node, bitmap) {
  window.dispatchEvent(new CustomEvent('genereti-live-frame', {
    detail: { nodeId: node.id, bitmap, producedAt: performance.now() },
  }));
}

export function resolveLiveSource(node, seen = new Set()) {
  if (!node || seen.has(node.id)) return null;
  seen.add(node.id);
  if (node._generetiLiveSource || node._generetiCapture) return node;
  const name = node.comfyClass === 'GeneretiInputSelect' ?
    ({ Doodle:'doodle', Webcam:'webcam', 'Window / Screen':'screen' })[node.widgets?.find(w=>w.name==='source')?.value] : 'image';
  // Only known pass-through viewers may be traversed. Never skip a Python effect.
  if (!['GeneretiInputSelect','GeneretiLiveImagePreview','GeneretiProjector'].includes(node.comfyClass)) return null;
  const slot = node.inputs?.findIndex(input=>input.name===name);
  if (!node.graph) return null;
  const link = slot >= 0 ? node.getInputLink?.(slot) ?? app.graph.links[node.inputs[slot].link] : null;
  return resolveLiveSource(app.graph.getNodeById(link?.origin_id), seen);
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
  let source=undefined, driver=null, disposed=false;
  const bind = () => {
    const next=resolveLiveSource(node);
    if (next===source) return;
    driver?.release();source=next;driver=null;
    if (source) {
      driver=source._generetiLiveSource || videoSource(source);driver.retain();
      onStatus('Browser clock · waiting for live frames');
    } else onStatus('No browser live source · queued IMAGE previews still work');
  };
  const listener = event => {
    if (!disposed && source && String(event.detail.nodeId)===String(source.id)) onFrame(event.detail);
  };
  window.addEventListener('genereti-live-frame',listener);
  // Rebind after rewiring/selecting a source; this does not submit Comfy jobs.
  const timer=setInterval(bind,250);bind();
  return () => {disposed=true;clearInterval(timer);window.removeEventListener('genereti-live-frame',listener);driver?.release();};
}
