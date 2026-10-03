import { app } from '../../../scripts/app.js';
import { projectorLink } from './projector-link.js';
import { subscribeLive } from '/extensions/genereti_comfy_p5/js/live-runtime.js';

app.registerExtension({
  name: 'Genereti.LiveImagePreview',
  nodeCreated(node) {
    if (node.comfyClass !== 'GeneretiLiveImagePreview') return;
    let disposed = false, revision = 0, last = 0, lastBrowserFrame = 0, unsubscribe = null, clockStart = 0, clockFrames = 0;
    const container = document.createElement('div');container.classList.add('genereti-live-surface');
    container.style.cssText = 'width:100%;display:flex;flex-direction:column;gap:6px';
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = 'Open projector';
    const status = document.createElement('span');
    status.style.cssText = 'font-size:11px;font-variant-numeric:tabular-nums';
    status.textContent = 'Live browser source · Comfy Queue for Python IMAGE results';
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    canvas.style.cssText = 'width:100%;aspect-ratio:1;object-fit:contain;background:transparent';
    const realtime=document.createElement('button');
    realtime.type='button';realtime.textContent='Start realtime';realtime.hidden=true;
    container.append(realtime,button, status, canvas);
    const widget = node.addDOMWidget('live_image_preview', 'GENERETI_IMAGE_PREVIEW', container, {serialize:false});
    widget.computeSize = width => [width, width + 181];
    const projector = projectorLink(container, '/extensions/genereti_comfy_stream/projector.html', status);
    button.onclick = () => projector.open();
    realtime.onclick=()=>{
      if(unsubscribe){unsubscribe();unsubscribe=null;realtime.textContent='Start realtime';status.textContent='Browser clock paused';return;}
      last=0;clockStart=0;clockFrames=0;realtime.textContent='Pause realtime';
      unsubscribe=subscribeLive(node,({bitmap,producedAt})=>{
        lastBrowserFrame=performance.now();
        if(canvas.width!==bitmap.width||canvas.height!==bitmap.height){canvas.width=bitmap.width;canvas.height=bitmap.height;}
        canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
        canvas.getContext('2d').drawImage(bitmap,0,0);
        projector.publish({bitmap});
        const now=performance.now();
        if (!clockStart) clockStart=now;
        clockFrames++;
        status.textContent=`${clockFrames>1?((clockFrames-1)*1000/(now-clockStart)).toFixed(1):'—'} fps · browser clock · ${Math.round(now-producedAt)} ms delivery · no queue`;
        last=now;
      },text=>{status.textContent=text;});
    };
    node._generetiSetExecutionMode=mode=>{if((mode==='Live')!==Boolean(unsubscribe))realtime.onclick();};
    node._generetiSetExecutionMode(node._generetiExecutionMode||'Live');
    const executed = node.onExecuted;
    node.onExecuted = function(message) {
      executed?.apply(this, arguments);
      if(unsubscribe&&performance.now()-lastBrowserFrame<500)return;
      const src = message?.genereti_preview?.[0];
      if (!src) return;
      const current = ++revision;
      const image = new Image();
      image.onload = () => {
        if (disposed || current !== revision) return;
        canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        canvas.getContext('2d').drawImage(image,0,0);
        projector.publish({src});
        const now = performance.now();
        status.textContent = `${last ? (1000/(now-last)).toFixed(1) : '—'} fps · ${message.genereti_preview_ms?.[0] ?? '—'} ms encode`;
        last = now;
      };
      image.onerror = () => { if (current === revision && !disposed) status.textContent = 'Preview decode failed'; };
      image.src = src;
    };
    const removed = node.onRemoved;
    node.onRemoved = function() { disposed = true; revision++; unsubscribe?.();projector.close(); return removed?.apply(this, arguments); };
    window.addEventListener('pagehide', () => {unsubscribe?.();projector.close();}, {once:true});
  },
});
