import {frameControls,paintImage,observeSurface} from './image-frame.js';
import { previewState } from '/extensions/genereti_comfy_p5/js/preview-state.js';
import {previewWidgetHeight} from '/extensions/genereti_comfy_p5/js/widget-layout.js';
import { app } from '../../../scripts/app.js';
import { previewControls } from './preview-controls.js';
import { subscribeLive } from '/extensions/genereti_comfy_p5/js/live-runtime.js';

const resolutionId='Genereti.Preview.QueuedResolution';
const queuedResolution=()=>Number(app.ui?.settings?.getSettingValue(resolutionId)??512);

app.registerExtension({
  name: 'Genereti.LiveImagePreview',
  settings:[{id:resolutionId,name:'Queued preview resolution',category:['Genereti','Previews','Queued resolution'],type:'combo',options:[128,256,512,1024,2048],defaultValue:512,tooltip:'Maximum thumbnail width and height after Comfy Queue, preserving proportions. Lower values reduce encoding time and data transfer; higher values show finer detail, including in Alt-O and Alt-W previews. Does not affect live streams or full-resolution image input/output.',onChange(value){for(const node of app.graph?._nodes||[]){if(node.comfyClass==='GeneretiLiveImagePreview'){const widget=node.widgets?.find(w=>w.name==='preview_size');if(widget)widget.value=Number(value);}}}}],
  nodeCreated(node) {
    if (node.comfyClass !== 'GeneretiLiveImagePreview') return;
    node.title='ꘇ image preview';
    node.widgets=node.widgets?.filter(widget=>widget.name!=='jpeg_quality')||[];
    const limit=node.widgets.find(w=>w.name==='preview_size');if(limit){
      limit.type='converted-widget';limit.hidden=true;limit.computeSize=()=>[0,-4];
      limit.value=queuedResolution();limit.serializeValue=()=>queuedResolution();
      const configured=node.onConfigure;node.onConfigure=function(){configured?.apply(this,arguments);limit.value=queuedResolution();};
    }
    let disposed = false, revision = 0, last = 0, lastBrowserFrame = 0, unsubscribe = null, frameTimes = [], lastStatus = -Infinity;
    const container = document.createElement('div');container.classList.add('genereti-live-surface');
    container.style.cssText = 'width:100%;display:flex;flex-direction:column;gap:6px';
    const status = Object.assign(document.createElement('span'),{className:'genereti-status'});
    status.style.cssText = 'font-size:11px;font-variant-numeric:tabular-nums';
    status.textContent = 'Live browser source · Comfy Queue for Python IMAGE results';
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    canvas.style.cssText = 'display:block;width:100%;height:auto;aspect-ratio:1;object-fit:contain;background:transparent';
    let latest;const dimensions=frameControls(node,canvas,()=>{if(latest&&localPreview.visible){dimensions.resize(latest.width||latest.naturalWidth,latest.height||latest.naturalHeight,output.getViewport());paintImage(canvas,latest,node.properties.genereti_preview_fit);}});
    const visibility=observeSurface(canvas,()=>{if(latest&&localPreview.visible){dimensions.resize(latest.naturalWidth,latest.naturalHeight,output.getViewport());paintImage(canvas,latest,node.properties.genereti_preview_fit);}});
    const localPreview=previewState(node,canvas);
    const realtime=document.createElement('button');
    realtime.type='button';realtime.textContent='Start realtime';realtime.hidden=true;
    const output=previewControls(canvas,status,node,()=>{performancePanel.hidden=false;performancePanel.open=true;},{onFitChange:()=>{if(latest&&localPreview.visible)paintImage(canvas,latest,node.properties.genereti_preview_fit);}});
    const performancePanel=document.createElement('details');performancePanel.className='genereti-disclosure';performancePanel.hidden=true;
    const summary=document.createElement('summary');summary.title='Performance details';summary.setAttribute('aria-label','Performance details');
    summary.style.cssText='cursor:pointer;width:30px;min-height:24px';
    performancePanel.append(summary,status);
    for(const row of [localPreview.actions,output.toolbar,dimensions.row])row.style.display='contents';output.actions.append(localPreview.actions,output.toolbar,dimensions.row);
 output.actions.prepend(localPreview.minimize);
    container.append(realtime,output.actions,canvas,performancePanel);
    node._generetiMountTransport=()=>node._generetiExecutionModeElement?.append(output.actions);
    node._generetiMountTransport();
    const widget = node.addDOMWidget('live_image_preview', 'GENERETI_IMAGE_PREVIEW', container, {serialize:false});
    const requiredHeight=(width=node.size[0])=>previewWidgetHeight(width,localPreview.minimized?0:canvas.height/canvas.width,134+(performancePanel.open?status.offsetHeight+6:0),widget.margin??10);
    widget.computeSize = (width=node.size[0]) => [width,requiredHeight(width)];
    widget.options.getMinHeight=requiredHeight;
    widget.options.getMaxHeight=requiredHeight;
    const resizeCanvas=(width,height)=>{if(!dimensions.resize(width,height,output.getViewport()))return;node.setSize?.([node.size[0],Math.max(node.size[1],node.computeSize()[1])]);};
    performancePanel.ontoggle=()=>{node.setSize?.([node.size[0],node.computeSize()[1]]);node.graph?.setDirtyCanvas?.(true,true);};
    realtime.onclick=()=>{
      if(unsubscribe){unsubscribe();unsubscribe=null;realtime.textContent='Start realtime';status.textContent='Browser clock paused';return;}
      last=0;frameTimes=[];lastStatus=-Infinity;realtime.textContent='Pause realtime';
      unsubscribe=subscribeLive(node,({bitmap,producedAt})=>{
        lastBrowserFrame=performance.now();
        if(localPreview.visible&&visibility.visible){resizeCanvas(bitmap.width,bitmap.height);
        paintImage(canvas,bitmap,node.properties.genereti_preview_fit);
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
        latest=image;if(localPreview.visible&&visibility.visible){resizeCanvas(image.naturalWidth,image.naturalHeight);
        paintImage(canvas,image,node.properties.genereti_preview_fit);
        }
        output.publish({src});
        const now = performance.now();
        status.textContent = `${last ? (1000/(now-last)).toFixed(1) : '—'} fps · ${message.genereti_preview_ms?.[0] ?? '—'} ms encode`;
        last = now;
      };
      image.onerror = () => { if (current === revision && !disposed) {status.textContent = 'Preview decode failed';performancePanel.hidden=false;performancePanel.open=true;} };
      image.src = src;
    };
    const removed = node.onRemoved;
    node.onRemoved = function() { disposed = true; revision++; unsubscribe?.();visibility.dispose();output.close(); return removed?.apply(this, arguments); };
    window.addEventListener('pagehide', () => {unsubscribe?.();output.close();}, {once:true});
  },
});
