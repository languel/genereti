import { ensureControlStyle } from './control-style.js';

// Local display only. Producers and downstream subscribers keep their clock.
export function previewState(node, surface, {capture, resize=()=>{}}={}) {
  ensureControlStyle();
  let frozen=false, minimized=false, version=0, snapshot;
  const actions=document.createElement('div');actions.className='genereti-node-controls genereti-preview-actions';actions.style.cssText='display:flex;align-items:center;gap:0;flex-shrink:0;align-self:flex-start';
  const button=(glyph,title)=>{const b=document.createElement('button');b.type='button';b.textContent=glyph;b.title=title;b.setAttribute('aria-label',title);actions.append(b);return b;};
  const minimize=button('▾','Minimize node preview only · downstream frames continue');
  const freeze=button('❄','Freeze node preview only · downstream frames continue');
  const oldHeight=surface.style.height, oldMinHeight=surface.style.minHeight, oldOverflow=surface.style.overflow, oldFlex=surface.style.flex, oldMaxHeight=surface.style.maxHeight;
  const iframe=Boolean(capture);
  function paint(){
    freeze.setAttribute('aria-pressed',String(frozen));minimize.setAttribute('aria-pressed',String(minimized));minimize.textContent=minimized?'▸':'▾';minimize.title=minimized?'Restore node preview · downstream frames continue':'Minimize node preview only · downstream frames continue';minimize.setAttribute('aria-label',minimize.title);
    if(iframe){surface.style.flex=minimized?'0 0 0':oldFlex;surface.style.maxHeight=minimized?'0px':oldMaxHeight;surface.style.height=minimized?'0px':oldHeight;surface.style.minHeight=minimized?'0px':oldMinHeight;surface.style.overflow=minimized?'hidden':oldOverflow;surface.style.opacity=minimized?'0':'1';}
    else surface.hidden=minimized;
    resize();node.graph?.setDirtyCanvas?.(true,true);
  }
  freeze.onclick=async()=>{
    frozen=!frozen;const current=++version;
    if(snapshot){snapshot.remove();snapshot=null;}
    if(iframe){surface.querySelectorAll('iframe').forEach(f=>f.style.pointerEvents='');if(frozen){
      try{const src=await capture();if(!frozen||current!==version)return;snapshot=document.createElement('img');snapshot.src=src;snapshot.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;z-index:3;background:var(--comfy-menu-bg,#111)';surface.append(snapshot);surface.querySelectorAll('iframe').forEach(f=>f.style.pointerEvents='none');}
      catch(error){frozen=false;freeze.title=`Could not freeze preview: ${error.message}`;}
    }}
    paint();
  };
  minimize.onclick=()=>{minimized=!minimized;paint();};
  if(surface.parentNode)surface.parentNode.insertBefore(actions,surface);
  return {get visible(){return !frozen&&!minimized;},get minimized(){return minimized;},actions};
}
