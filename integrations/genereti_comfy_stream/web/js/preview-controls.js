import { nodeOutputView } from './node-output-view.js';
import { graphBackdrop } from './graph-backdrop.js';
import { registerPreviewShortcuts } from './preview-shortcuts.js';
import { outputWindow } from './output-window.js';
import { ensureControlStyle } from '/extensions/genereti_comfy_p5/js/control-style.js';

// Local viewing only: projector transport belongs to the projector node.
export function previewControls(canvas, status, node, onError=()=>{}, config={}) {
  ensureControlStyle();
  const toolbar=document.createElement('div');toolbar.className='genereti-node-controls';
  let output,overlay,backdrop;const viewers=[];let viewerOrder=0;
  node.properties??={};node.properties.genereti_output_layout??={};
  const actions=document.createElement('div');actions.className='genereti-node-controls';
  const button=(label,paths,action)=>{
    const b=document.createElement('button');b.type='button';b.title=label;b.setAttribute('aria-label',label);
    b.innerHTML=`<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${paths}</svg>`;
    b.onclick=action;return b;
  };
  const toggle=(label,paths,options)=>{
    let viewer,opened=false;const state={viewport:()=>viewer.getViewport?.(),opened:false,order:0};viewers.push(state);
    const paint=value=>{if(opened===value)return;opened=value;state.opened=value;if(value)state.order=++viewerOrder;b.setAttribute('aria-pressed',String(value));b.title=(value?'Close ':'Open ')+label;b.setAttribute('aria-label',b.title);b.title+=options.overlay?' (Alt+W · Shift-click / Alt+O: output-only node)':options.backdrop?' (D)':'';config.onViewerChange?.(value,options);};
    const make=()=>options.backdrop?graphBackdrop(status,paint):outputWindow(status,paint,options.overlay?node.properties.genereti_output_layout:{},{node,interactiveSurface:options.overlay?config.interactiveSurface:null,onSurfaceChange:config.onSurfaceChange});
    const b=button('Open '+label,paths,async(event={})=>{
      if(options.overlay&&event.shiftKey){nodeView.toggle();return;}
      if(opened){viewer.close();viewer=make();assign(viewer);viewer.setFit(config.getFit?.()||node.properties?.[config.fitKey||'genereti_preview_fit']||'contain');paint(false);return;}
      if(options.overlay)nodeView.close();
      b.disabled=true;
      try{const success=await viewer.open({...options,initialSize:config.getRenderSize?.(),matchAspect:config.matchOutputAspect?.(),position:event.position});paint(success);if(success&&config.publishOnOpen!==false)viewer.publish(config.initialFrame?.()||{bitmap:canvas});else if(!success)onError();}
      finally{b.disabled=false;}
    });
    const assign=value=>{if(options.backdrop)backdrop=value;else if(options.overlay)overlay=value;else output=value;};
    viewer=make();assign(viewer);b.setAttribute('aria-pressed','false');return b;
  };
  const windowButton=toggle('output window','<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',{});
  const overlayButton=toggle('output overlay · drag and resize inside Comfy','<rect x="3" y="4" width="18" height="16" rx="2"/><rect x="11" y="11" width="8" height="7" rx="1"/>',{overlay:true});
  const backdropButton=toggle('output backdrop','<rect x="3" y="3" width="18" height="18" rx="1"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="16" cy="8" r="1.5"/>',{backdrop:true});
  const fit=document.createElement('select');fit.title='Image fit · applies to preview and local output windows';fit.setAttribute('aria-label','Image fit');
  for(const [label,value] of [['Contain','contain'],['Cover','cover'],['Stretch','fill'],['Native pixels','native']])fit.append(new Option(label,value));
  const apply=(persist=false)=>{const value=fit.value;if(config.fitTarget!==null){const surface=config.fitTarget||canvas;surface.style.objectFit=value==='native'?'none':value;}output.setFit(value);overlay.setFit(value);backdrop.setFit(value);if(persist){node.properties??={};if(config.fitKey!==null)node.properties[config.fitKey||'genereti_preview_fit']=value;config.onFitChange?.(value);}};
  const currentFit=()=>config.getFit?.()||config.initialFit||node.properties?.[config.fitKey||'genereti_preview_fit']||'contain';
  fit.value=currentFit();fit.onchange=()=>apply(true);apply();
  const setFit=value=>{fit.value=value;apply(false);};
  const configure=node.onConfigure;node.onConfigure=function(){const result=configure?.apply(this,arguments);fit.value=currentFit();apply();return result;};
  const nodeView=nodeOutputView(node,canvas,{beforeOpen:()=>{if(overlay.element)overlayButton.click();},onChange:config.onNodeViewChange});
  const unregister=registerPreviewShortcuts(node,{toggleOutputOnly:()=>nodeView.toggle(),isOutputHovered:()=>nodeView.hovered,toggleOverlay:options=>overlayButton.onclick(options),toggleClickThrough:()=>nodeView.opened?nodeView.toggleClickThrough():overlay.toggleClickThrough?.(),toggleBackdrop:()=>backdropButton.click(),toggleFill:async()=>{if(!overlay.element)await overlayButton.onclick();overlay.toggleFill();},isFilled:()=>overlay.filled,isHovered:()=>overlay.element?.matches(':hover')});
  overlayButton.title+=' (Alt+W · Shift-click / Alt+O: output-only node)';backdropButton.title+=' (D)';
  actions.append(windowButton,overlayButton,backdropButton);if(config.fitControl!==false)toolbar.append(fit);
  for(const row of [toolbar,actions])row.addEventListener('pointerdown',event=>event.stopPropagation());
  return {toolbar,actions,getViewport(){return viewers.filter(v=>v.opened).sort((a,b)=>b.order-a.order).map(v=>v.viewport()).find(Boolean)||null;},publish(frame){output.publish(frame);overlay.publish(frame);backdrop.publish(frame);},setFit,close(){nodeView.dispose();unregister();output.close();overlay.close();backdrop.close();}};
}
