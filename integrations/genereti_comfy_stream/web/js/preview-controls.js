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
  // A node with a live interactive surface (editor, sketch, timeline) has one "owner" at a time: the node itself, the output
  // window or the output overlay. The others show its bitmap. Whichever window opens last takes the surface; the menu or
  // closing the owner changes that. Nodes without a live surface just get bitmap mirrors.
  let owner='node';const ownerListeners=new Set();
  const toggle=(label,paths,options)=>{
    let viewer,opened=false,live=false;const name=options.overlay?'overlay':options.backdrop?'backdrop':'window';
    const state={viewport:()=>viewer.getViewport?.(),opened:false,order:0};viewers.push(state);
    const paint=value=>{
      if(opened===value)return;opened=value;state.opened=value;if(value)state.order=++viewerOrder;
      if(!value&&live){live=false;if(owner===name){owner='node';for(const fn of ownerListeners)fn();}}
      b.setAttribute('aria-pressed',String(value));b.title=(value?'Close ':'Open ')+label;b.setAttribute('aria-label',b.title);b.title+=options.overlay?' (Alt+W · Shift-click / Alt+O: output-only node)':options.backdrop?' (D: solo · Shift+D: grid)':' (Alt+Shift+W)';config.onViewerChange?.(value,options);
    };
    const make=()=>config.createViewer?.(status,paint,options)??(options.backdrop?graphBackdrop(status,paint):outputWindow(status,paint,options.overlay?node.properties.genereti_output_layout:(node.properties.genereti_window_layout??={}),{node,interactiveSurface:config.interactiveSurface,mountMirror:config.mountMirror,multiUi:()=>node.properties?.genereti_multi_ui===true,onSurfaceChange:config.onSurfaceChange}));
    const closeIt=()=>{viewer.close();viewer=make();assign(viewer);viewer.setFit(config.getFit?.()||node.properties?.[config.fitKey||'genereti_preview_fit']||'contain');paint(false);};
    const openIt=async({event={},interactive=false}={})=>{
      // An interactive surface and the visual node view both need the node's own surface.
      if(options.overlay||interactive)nodeView.close();
      b.disabled=true;
      try{
        const success=await viewer.open({...options,interactive,grid:options.backdrop&&Boolean(event.shiftKey),initialSize:config.getRenderSize?.(),matchAspect:config.matchOutputAspect?.(),position:event.position});
        if(success)live=interactive;paint(success);
        if(success&&config.publishOnOpen!==false)viewer.publish(config.initialFrame?.()||{bitmap:canvas});else if(!success)onError();
        return success;
      }finally{b.disabled=false;}
    };
    const b=button('Open '+label,paths,async(event={})=>{
      if(options.overlay&&event.shiftKey){nodeView.toggle();return;}
      if(opened&&(!options.backdrop||Boolean(event.shiftKey)===Boolean(viewer.gridMode))){closeIt();return;}
      if(!options.backdrop&&config.interactiveSurface){await setOwner(name,event);return;}
      await openIt({event});
    });
    b.controller={isOpen:()=>opened,isLive:()=>live,open:openIt,close:()=>{if(opened)closeIt();}};
    const assign=value=>{if(options.backdrop)backdrop=value;else if(options.overlay)overlay=value;else output=value;};
    viewer=make();assign(viewer);b.setAttribute('aria-pressed','false');return b;
  };
  const WINDOW_GLYPH='<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',OVERLAY_GLYPH='<rect x="3" y="4" width="18" height="16" rx="2"/><rect x="11" y="11" width="8" height="7" rx="1"/>',NODE_GLYPH='<rect x="4" y="6" width="16" height="12" rx="2"/><circle cx="4" cy="12" r="1.3" fill="currentColor"/><circle cx="20" cy="12" r="1.3" fill="currentColor"/><path d="M8 10h8M8 14h5"/>';
  const windowButton=toggle('output window',WINDOW_GLYPH,{});
  const overlayButton=toggle('output overlay · drag and resize inside Comfy',OVERLAY_GLYPH,{overlay:true});
  const backdropButton=toggle('output backdrop · behind the graph','<rect x="2.5" y="3.5" width="19" height="17" rx="2" fill="currentColor" fill-opacity=".14"/><rect x="6" y="7.5" width="6" height="4" rx="1"/><rect x="12.5" y="13" width="6" height="4" rx="1"/><path d="M12 9.5h2.5v3.5"/>',{backdrop:true});
  const controllers={window:windowButton.controller,overlay:overlayButton.controller};
  /** Hand the live surface to `next` ('node' | 'window' | 'overlay'); the previous owner stays open as a bitmap mirror. */
  async function setOwner(next,event={}){
    if(!config.interactiveSurface)return;
    for(const [name,c] of Object.entries(controllers))if(name!==next&&c.isLive()){c.close();await c.open({event,interactive:false});}
    if(next!=='node'){
      const c=controllers[next];
      if(c.isOpen()&&!c.isLive())c.close();
      if(!c.isOpen()&&await c.open({event,interactive:true}))owner=next;
    }else owner='node';
    for(const fn of ownerListeners)fn();
  }
  const releaseSurface=()=>{for(const c of Object.values(controllers))if(c.isLive())c.close();};
  const surfaces=[['node','node',NODE_GLYPH,'Node: edit in the node; windows show its bitmap'],['window','output window',WINDOW_GLYPH,'Output window: edit there; the node shows its bitmap (Alt+Shift+W)'],['overlay','output overlay',OVERLAY_GLYPH,'Output overlay: edit there; the node shows its bitmap (Alt+W)']];
  const svg=paths=>`<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${paths}</svg>`;
  let surfaceButton=null;
  if(config.interactiveSurface){
    surfaceButton=document.createElement('button');surfaceButton.type='button';surfaceButton.setAttribute('aria-haspopup','menu');surfaceButton.setAttribute('aria-expanded','false');
    surfaceButton.style.width='auto';surfaceButton.style.padding='0 4px 0 5px';surfaceButton.style.gap='1px';
    let menu=null,dismiss=null;
    const paintSurface=()=>{const [,,glyph,tip]=surfaces.find(x=>x[0]===owner);surfaceButton.innerHTML=svg(glyph)+'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:8px;height:8px"><path d="m6 9 6 6 6-6"/></svg>';surfaceButton.title='Interactive view · '+tip+'. Click to choose where it lives; the others show its bitmap.';surfaceButton.setAttribute('aria-label','Interactive view location: '+owner);};
    const closeMenu=()=>{menu?.remove();menu=null;dismiss?.();dismiss=null;surfaceButton.setAttribute('aria-expanded','false');};
    surfaceButton.onclick=event=>{
      event.stopPropagation();if(menu){closeMenu();return;}
      menu=document.createElement('div');menu.setAttribute('role','menu');menu.className='genereti-surface-menu';
      const r=surfaceButton.getBoundingClientRect();menu.style.cssText=`position:fixed;left:${Math.round(r.left)}px;top:${Math.round(r.bottom+2)}px;z-index:10060;display:flex;flex-direction:column;padding:3px;border-radius:8px;background:var(--comfy-menu-bg,#222);color:var(--fg-color,#eee);box-shadow:0 6px 24px #0007;font:12px system-ui,sans-serif`;
      for(const [name,label,glyph,tip] of surfaces){
        const item=document.createElement('button');item.type='button';item.setAttribute('role','menuitemradio');item.setAttribute('aria-checked',String(owner===name));item.title=tip;
        item.style.cssText='display:flex;align-items:center;gap:8px;width:auto;min-width:160px;height:26px;padding:0 10px 0 6px;justify-content:flex-start;border:0;border-radius:6px;background:'+(owner===name?'color-mix(in srgb,currentColor 16%,transparent)':'transparent')+';color:inherit;font:inherit;cursor:pointer';
        item.innerHTML=`<span style="display:inline-flex;width:16px;height:16px">${svg(glyph).replace('<svg ','<svg style="width:16px;height:16px" ')}</span><span>${label}</span>`;
        item.onmouseenter=()=>{if(owner!==name)item.style.background='color-mix(in srgb,currentColor 10%,transparent)';};item.onmouseleave=()=>{item.style.background=owner===name?'color-mix(in srgb,currentColor 16%,transparent)':'transparent';};
        item.onclick=async e=>{e.stopPropagation();closeMenu();await setOwner(name,{});};
        menu.append(item);
      }
      document.body.append(menu);surfaceButton.setAttribute('aria-expanded','true');menu.firstChild?.focus();
      const away=e=>{if(!menu?.contains(e.target)&&e.target!==surfaceButton&&!surfaceButton.contains(e.target))closeMenu();},esc=e=>{if(e.key==='Escape'){e.stopPropagation();closeMenu();surfaceButton.focus();}};
      document.addEventListener('pointerdown',away,true);document.addEventListener('keydown',esc,true);dismiss=()=>{document.removeEventListener('pointerdown',away,true);document.removeEventListener('keydown',esc,true);};
    };
    ownerListeners.add(paintSurface);ownerListeners.add(closeMenu);paintSurface();
  }
  const fit=document.createElement('select');fit.title='Image fit · applies to preview and local output windows';fit.setAttribute('aria-label','Image fit');
  for(const [label,value] of [['Contain','contain'],['Cover','cover'],['Stretch','fill'],['Native pixels','native']])fit.append(new Option(label,value));
  const apply=(persist=false)=>{const value=fit.value;if(config.fitTarget!==null){const surface=config.fitTarget||canvas;surface.style.objectFit=value==='native'?'none':value;}output.setFit(value);overlay.setFit(value);backdrop.setFit(value);if(persist){node.properties??={};if(config.fitKey!==null)node.properties[config.fitKey||'genereti_preview_fit']=value;config.onFitChange?.(value);}};
  const currentFit=()=>config.getFit?.()||config.initialFit||node.properties?.[config.fitKey||'genereti_preview_fit']||'contain';
  fit.value=currentFit();fit.onchange=()=>apply(true);apply();
  const setFit=value=>{fit.value=value;apply(false);};
  const configure=node.onConfigure;node.onConfigure=function(){const result=configure?.apply(this,arguments);fit.value=currentFit();apply();return result;};
  const visualButton=button('Visual node view · hide controls (Alt+O)','<rect x="4" y="4" width="16" height="16" rx="1"/><rect x="7" y="7" width="10" height="10" fill="currentColor"/>',()=>nodeView.toggle());visualButton.setAttribute('aria-pressed',String(!!node.properties.genereti_output_only));
  const nodeView=nodeOutputView(node,canvas,{beforeOpen:()=>{if(config.interactiveSurface)releaseSurface();else if(overlay.element)overlayButton.click();},onChange:open=>{visualButton.setAttribute('aria-pressed',String(open));config.onNodeViewChange?.(open);}});
  const unregister=registerPreviewShortcuts(node,{toggleOutputOnly:()=>nodeView.toggle(),isOutputHovered:()=>nodeView.hovered,toggleOverlay:options=>overlayButton.onclick(options),toggleWindow:options=>windowButton.onclick(options),toggleClickThrough:()=>nodeView.opened?nodeView.toggleClickThrough():overlay.toggleClickThrough?.(),toggleBackdrop:()=>backdropButton.onclick(),toggleBackdropGrid:()=>backdropButton.onclick({shiftKey:true}),toggleFill:async()=>{if(!overlay.element)await overlayButton.onclick();overlay.toggleFill();},isFilled:()=>overlay.filled,isHovered:()=>overlay.element?.matches(':hover')});
  overlayButton.title+=' (Alt+W · Shift-click / Alt+O: output-only node)';backdropButton.title+=' (D: solo · Shift+D: grid)';
  if(surfaceButton)actions.append(surfaceButton);actions.append(windowButton,overlayButton,visualButton,backdropButton);if(config.fitControl!==false)toolbar.append(fit);
  for(const row of [toolbar,actions])row.addEventListener('pointerdown',event=>event.stopPropagation());
  return {toolbar,actions,shortcut(action){const run={outputOnly:()=>nodeView.toggle(),overlay:()=>overlayButton.onclick(),window:()=>windowButton.onclick(),backdrop:()=>backdropButton.onclick(),backdropGrid:()=>backdropButton.onclick({shiftKey:true}),fill:async()=>{if(!overlay.element)await overlayButton.onclick();overlay.toggleFill();},through:()=>nodeView.opened?nodeView.toggleClickThrough():overlay.toggleClickThrough?.(),restore:()=>{if(overlay.filled)overlay.toggleFill();}};run[action]?.();},getViewport(){return viewers.filter(v=>v.opened).sort((a,b)=>b.order-a.order).map(v=>v.viewport()).find(Boolean)||null;},publish(frame){output.publish(frame);overlay.publish(frame);backdrop.publish(frame);},setFit,close(){nodeView.dispose();unregister();output.close();overlay.close();backdrop.close();}};
}
