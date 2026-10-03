import { previewState } from '/extensions/genereti_comfy_p5/js/preview-state.js';
import { app } from '../../../scripts/app.js';
import { previewControls } from './preview-controls.js';
import { subscribeLive } from '/extensions/genereti_comfy_p5/js/live-runtime.js';

app.registerExtension({
  name: 'Genereti.LiveImagePreview',
  nodeCreated(node) {
    if (node.comfyClass !== 'GeneretiLiveImagePreview') return;
    node.title='ꘇ image preview';
    node.widgets=node.widgets?.filter(widget=>widget.name!=='jpeg_quality')||[];
    let disposed = false, revision = 0, last = 0, lastBrowserFrame = 0, unsubscribe = null, frameTimes = [], lastStatus = -Infinity;
    const container = document.createElement('div');container.classList.add('genereti-live-surface');
    container.style.cssText = 'width:100%;display:flex;flex-direction:column;gap:6px';
    const status = document.createElement('span');
    status.style.cssText = 'font-size:11px;font-variant-numeric:tabular-nums';
    status.textContent = 'Live browser source · Comfy Queue for Python IMAGE results';
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    canvas.style.cssText = 'width:100%;aspect-ratio:1;object-fit:contain;background:transparent';
    const localPreview=previewState(node,canvas);
    const realtime=document.createElement('button');
    realtime.type='button';realtime.textContent='Start realtime';realtime.hidden=true;
    const output=previewControls(canvas,status,node,()=>{performancePanel.open=true;});
    const performancePanel=document.createElement('details');
    const summary=document.createElement('summary');summary.title='Performance details';summary.setAttribute('aria-label','Performance details');
    summary.style.cssText='cursor:pointer;width:30px;min-height:24px';
    performancePanel.append(summary,status);
    container.append(realtime,output.toolbar,localPreview.actions,canvas,performancePanel);
    node._generetiMountTransport=()=>node._generetiExecutionModeElement?.append(output.actions);
    node._generetiMountTransport();
    const widget = node.addDOMWidget('live_image_preview', 'GENERETI_IMAGE_PREVIEW', container, {serialize:false});
    widget.computeSize = width => [width, (localPreview.minimized?0:width) + (performancePanel.open ? 80 : 60)];
    performancePanel.ontoggle=()=>{node.setSize?.([node.size[0],node.computeSize()[1]]);node.graph?.setDirtyCanvas?.(true,true);};
    realtime.onclick=()=>{
      if(unsubscribe){unsubscribe();unsubscribe=null;realtime.textContent='Start realtime';status.textContent='Browser clock paused';return;}
      last=0;frameTimes=[];lastStatus=-Infinity;realtime.textContent='Pause realtime';
      unsubscribe=subscribeLive(node,({bitmap,producedAt})=>{
        lastBrowserFrame=performance.now();
        if(localPreview.visible){if(canvas.width!==bitmap.width||canvas.height!==bitmap.height){canvas.width=bitmap.width;canvas.height=bitmap.height;}
        canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
        canvas.getContext('2d').drawImage(bitmap,0,0);
        }
        output.publish({bitmap});
        const now=performance.now();
        // Recent delivery rate; startup and earlier pauses must not dilute FPS.
        if(frameTimes.length && now-frameTimes.at(-1)>2000)frameTimes=[];
        frameTimes.push(now);
        while(frameTimes.length>2 && frameTimes[0]<now-2000)frameTimes.shift();
        if(now-lastStatus>=250){
          const elapsed=now-frameTimes[0];
          const fps=frameTimes.length>1&&elapsed>0?((frameTimes.length-1)*1000/elapsed).toFixed(1):'—';
          status.textContent=`${fps} fps · browser clock · ${Math.round(now-producedAt)} ms delivery · no queue`;
          status.title='Frames received over the last 2 seconds; excludes earlier idle time. Delivery measures source-to-preview handoff, not model inference.';
          lastStatus=now;
        }
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
        if(localPreview.visible){canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
        canvas.getContext('2d').drawImage(image,0,0);
        }
        output.publish({src});
        const now = performance.now();
        status.textContent = `${last ? (1000/(now-last)).toFixed(1) : '—'} fps · ${message.genereti_preview_ms?.[0] ?? '—'} ms encode`;
        last = now;
      };
      image.onerror = () => { if (current === revision && !disposed) {status.textContent = 'Preview decode failed';performancePanel.open=true;} };
      image.src = src;
    };
    const removed = node.onRemoved;
    node.onRemoved = function() { disposed = true; revision++; unsubscribe?.();output.close(); return removed?.apply(this, arguments); };
    window.addEventListener('pagehide', () => {unsubscribe?.();output.close();}, {once:true});
  },
});
