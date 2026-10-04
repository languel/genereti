import { registerViewStack } from './view-stack.js';
import { routePreviewShortcut } from './preview-shortcuts.js';
// Shared content-only chrome for image output and the interactive drawing editor.
export function overlayShell(frame,layout={},onClose=()=>{},config={}) {
    const panel=document.createElement('div');panel.className='genereti-output-overlay';panel.setAttribute('data-chrome','auto');panel.style.cssText='position:fixed;left:10vw;top:12vh;width:70vw;height:70vh;min-width:240px;min-height:180px;z-index:10000;background:transparent;border:0;box-shadow:none';
    if(config.embedded){panel.classList.add('genereti-output-only-view');panel.style.cssText='position:absolute;inset:0;width:100%;height:100%;min-width:0;min-height:0;visibility:visible;pointer-events:auto;background:transparent';}
    if(!config.embedded&&layout.rect){const {left,top,width,height}=layout.rect;panel.style.left=left+'px';panel.style.top=top+'px';panel.style.width=width+'px';panel.style.height=height+'px';}
    if(!config.embedded&&config.position){
      const {x,y}=config.position;
      // Cursor anchors the content's top-left; keep the edge bar and view reachable.
      panel.style.left=Math.max(8,Math.min(x,innerWidth-(layout.rect?.width||innerWidth*.7)-8))+'px';
      panel.style.top=Math.max(38,Math.min(y,innerHeight-(layout.rect?.height||innerHeight*.7)-8))+'px';
    }
    let filled=false,savedGeometry;
    const saveLayout=()=>{if(filled||config.embedded)return;layout.rect={left:panel.offsetLeft,top:panel.offsetTop,width:panel.offsetWidth,height:panel.offsetHeight};};
    const glyph=(paths)=>`<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
    const style=document.createElement('style');style.textContent=`
.genereti-output-overlay .output-header{position:absolute;bottom:100%;left:0;right:0;height:30px;display:flex;align-items:center;gap:4px;padding:0 6px;background:var(--comfy-menu-bg,#222);color:var(--fg-color,#eee);cursor:move;opacity:0;pointer-events:none;transition:opacity .12s}
.genereti-output-overlay .output-header button{width:30px;height:30px;padding:0;border:0;box-shadow:none;border-radius:6px;background:transparent;color:inherit;font:18px sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:0 0 30px}
.genereti-output-overlay .output-header button[hidden]{display:none}
.genereti-output-overlay .output-header button svg{display:block;width:18px;height:18px;flex-shrink:0}
.genereti-output-overlay .output-header button:hover,.genereti-output-overlay .output-header button[aria-pressed=true]{background:color-mix(in srgb,currentColor 12%,transparent)}
.genereti-output-overlay .output-header input[type=range]{appearance:none;-webkit-appearance:none;width:76px;height:30px;margin:0 6px;padding:0;border:0;box-shadow:none;background:transparent;color:inherit;cursor:ew-resize}
.genereti-output-overlay .output-header input[type=range]::-webkit-slider-runnable-track{height:2px;border:0;background:color-mix(in srgb,currentColor 35%,transparent);border-radius:2px}
.genereti-output-overlay .output-header input[type=range]::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:10px;height:10px;margin-top:-4px;border:0;border-radius:50%;background:currentColor;box-shadow:none}
.genereti-output-overlay .output-header input[type=range]::-moz-range-track{height:2px;border:0;border-radius:2px;background:color-mix(in srgb,currentColor 35%,transparent)}
.genereti-output-overlay .output-header input[type=range]::-moz-range-thumb{width:10px;height:10px;border:0;border-radius:50%;background:currentColor}
.genereti-output-overlay .output-header input[type=range]:focus-visible{outline:1px solid currentColor;outline-offset:0;border-radius:6px}
.genereti-output-overlay .output-header button:focus-visible{outline:1px solid currentColor;outline-offset:-2px}
.genereti-output-overlay:has(.output-edge:hover,.output-header:hover):not([data-chrome=hidden]) .output-header,.genereti-output-overlay:has(.output-header:focus-within) .output-header,.genereti-output-overlay[data-chrome=visible] .output-header{opacity:1;pointer-events:auto}
.genereti-output-overlay[data-locked=true] .output-edge{cursor:default!important}
.genereti-output-overlay .output-edge{position:absolute;background:transparent;touch-action:none}

.genereti-output-overlay[data-filled=true] .output-header{top:0;bottom:auto;z-index:2}
.genereti-output-overlay[data-filled=true] .output-edge{z-index:3;cursor:default!important}
.genereti-output-overlay[data-filled=true] [data-edge=n]{top:0!important}
.genereti-output-overlay[data-filled=true] [data-edge=s],.genereti-output-overlay[data-filled=true] [data-edge=se]{bottom:0!important}
.genereti-output-overlay[data-filled=true] [data-edge=w]{left:0!important}
.genereti-output-overlay[data-filled=true] [data-edge=e],.genereti-output-overlay[data-filled=true] [data-edge=se]{right:0!important}
`;panel.append(style);
    const header=document.createElement('div');header.className='output-header';
    const title=document.createElement('span');title.innerHTML=glyph('<rect x="3" y="4" width="18" height="16" rx="2"/>');const titleText=document.createElement('span');titleText.textContent=config.node?.title||'Output';title.append(titleText);title.style.cssText='flex:1;display:flex;align-items:center;gap:6px;font:12px sans-serif;pointer-events:none;min-width:0';titleText.style.cssText='overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    const pin=document.createElement('button');pin.innerHTML=glyph('<path d="m12 4 8 8-8 8-8-8Z"/>');pin.title='Keep output controls visible';pin.setAttribute('aria-label',pin.title);pin.setAttribute('aria-pressed','false');
    pin.onclick=()=>{const pinned=panel.getAttribute('data-chrome')!=='visible';panel.setAttribute('data-chrome',pinned?'visible':'auto');pin.setAttribute('aria-pressed',String(pinned));};
    let locked=false,clickThrough=false;
    const lock=document.createElement('button');lock.innerHTML=glyph('<circle cx="12" cy="12" r="7"/><path d="M12 2v20M2 12h20"/>');lock.title='Lock output position and size';lock.setAttribute('aria-label',lock.title);lock.setAttribute('aria-pressed','false');lock.onclick=()=>{locked=!locked;lock.setAttribute('aria-pressed',String(locked));panel.setAttribute('data-locked',String(locked));header.style.cursor=locked?'default':'move';};
    const through=document.createElement('button');through.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3v14l4-4 3 7 3-1-3-7h6Z"/><path d="M20 2v8m-3-3 3 3 3-3" stroke-dasharray="2 2"/></svg>';through.title='Click through content · edit underneath (Alt+Shift+O)';through.setAttribute('aria-label',through.title);through.setAttribute('aria-pressed','false');
    const opacity=document.createElement('input');opacity.type='range';opacity.min='0';opacity.max='100';opacity.step='1';opacity.value='100';opacity.title='Output opacity · 100%';opacity.setAttribute('aria-label','Output opacity');opacity.style.cssText='flex:0 0 76px';
    const fill=document.createElement('button');fill.innerHTML=glyph('<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>');fill.setAttribute('aria-pressed','false');
    const paintFill=()=>{fill.title=(filled?'Restore overlay':'Fill window')+' · Alt+F · Escape restores · stays inside Comfy';fill.setAttribute('aria-label',filled?'Restore overlay':'Fill window');fill.setAttribute('aria-pressed',String(filled));};
    const toggleFill=()=>{
      if(!filled){saveLayout();savedGeometry=Object.fromEntries(['left','top','width','height','minWidth','minHeight'].map(key=>[key,panel.style[key]]));filled=true;Object.assign(panel.style,{left:'0px',top:'0px',width:'100vw',height:'100vh',minWidth:'0',minHeight:'0'});}
      else{filled=false;Object.assign(panel.style,savedGeometry);}
      panel.setAttribute('data-filled',String(filled));paintFill();
    };fill.onclick=toggleFill;paintFill();
    const close=document.createElement('button');close.innerHTML=glyph('<path d="m6 6 12 12M18 6 6 18"/>');close.title='Close output';close.setAttribute('aria-label',close.title);close.title=config.embedded?'Restore node controls (Alt+O)':'Close output';close.setAttribute('aria-label',close.title);
    const backward=document.createElement('button'),forward=document.createElement('button');
    backward.innerHTML=glyph('<rect x="9" y="3" width="12" height="12" rx="1"/><path d="M15 15v6H3V9h6m-2 3-3 3 3 3m-3-3h7"/>');forward.innerHTML=glyph('<rect x="3" y="9" width="12" height="12" rx="1"/><path d="M9 9V3h12v12h-6m2-9 3 3-3 3m3-3h-7"/>');
    backward.title='Move backward · Cmd+[ · Shift-click / Cmd+Shift+[ sends to back';forward.title='Move forward · Cmd+] · Shift-click / Cmd+Shift+] brings to front';
    backward.setAttribute('aria-label','Move backward');forward.setAttribute('aria-label','Move forward');
    backward.onclick=event=>stack.move(event.shiftKey?'back':'backward');forward.onclick=event=>stack.move(event.shiftKey?'front':'forward');
    if(config.embedded){lock.hidden=true;fill.hidden=true;}header.append(title,opacity,backward,forward,lock,through,pin,fill,close);
    panel.onpointerenter=()=>{titleText.textContent=config.node?.title||'Output';};
    panel.append(header);(config.parent||document.body).append(panel);
    const stack=registerViewStack(panel,config.embedded?config.parent:panel);
    for(const type of ['pointerdown','mousedown','click','dblclick'])panel.addEventListener(type,event=>event.stopPropagation());
    const originalParent=frame.parentNode, originalNext=frame.nextSibling, originalStyle=frame.style.cssText;
    // moveBefore preserves the live iframe's browsing context in supporting hosts.
    if(panel.moveBefore && frame.isConnected)panel.moveBefore(frame,null);else panel.append(frame);
    frame.style.cssText='display:block;width:100%;height:100%;min-height:0;border:0;background:transparent;color-scheme:normal';
    if(frame.tagName!=='IFRAME'){frame.style.position='relative';frame.style.overflow='hidden';}
    opacity.oninput=()=>{frame.style.opacity=String(Number(opacity.value)/100);opacity.title=`Output opacity · ${opacity.value}%`;};
    through.onclick=()=>{clickThrough=!clickThrough;frame.style.pointerEvents=clickThrough?'none':'auto';panel.style.pointerEvents=clickThrough?'none':'auto';config.onThroughChange?.(clickThrough);through.setAttribute('aria-pressed',String(clickThrough));};
    const recover=event=>{if(config.node){routePreviewShortcut(event);return;}if(event.defaultPrevented)return;if(event.altKey&&event.shiftKey&&event.code==='KeyO'&&!event.repeat){event.preventDefault();event.stopPropagation?.();through.onclick();}};document.addEventListener('keydown',recover);
    let frameWindow;const bindKeys=()=>{frameWindow?.removeEventListener?.('keydown',recover,true);try{frameWindow=frame.contentWindow;frameWindow?.addEventListener?.('keydown',recover,true);}catch{frameWindow=null;}};
    bindKeys();frame.addEventListener('load',bindKeys);
    const cleanup=()=>{stack.dispose();document.removeEventListener('keydown',recover);frameWindow?.removeEventListener?.('keydown',recover,true);frame.removeEventListener('load',bindKeys);};
    let drag=null;header.onpointerdown=event=>{if(config.embedded||locked||filled||event.target!==header)return;drag={x:event.clientX,y:event.clientY,left:panel.offsetLeft,top:panel.offsetTop};header.setPointerCapture(event.pointerId);};header.onpointermove=event=>{if(drag){panel.style.left=drag.left+event.clientX-drag.x+'px';panel.style.top=drag.top+event.clientY-drag.y+'px';}};header.onpointerup=header.onpointercancel=()=>{if(drag)saveLayout();drag=null;};
    // Hit targets sit outside the content; hovering the picture never reveals chrome.
    for(const [edge,css] of [['n','left:0;right:0;top:-8px;height:8px'],['s','left:0;right:0;bottom:-8px;height:8px'],['w','top:0;bottom:0;left:-8px;width:8px'],['e','top:0;bottom:0;right:-8px;width:8px'],['se','right:-8px;bottom:-8px;width:16px;height:16px']]){
      const handle=document.createElement('div');handle.className='output-edge';handle.setAttribute('data-edge',edge);handle.style.cssText=css+';pointer-events:auto;cursor:'+edge+'-resize';let sizing;
      handle.onpointerdown=event=>{if(config.embedded||locked||filled)return;event.preventDefault();sizing={x:event.clientX,y:event.clientY,width:panel.offsetWidth,height:panel.offsetHeight,left:panel.offsetLeft,top:panel.offsetTop};panel.setAttribute('data-dragging','true');handle.setPointerCapture(event.pointerId);};
      handle.onpointermove=event=>{if(!sizing)return;const dx=event.clientX-sizing.x,dy=event.clientY-sizing.y;if(edge.includes('e'))panel.style.width=Math.max(240,sizing.width+dx)+'px';if(edge.includes('s'))panel.style.height=Math.max(180,sizing.height+dy)+'px';if(edge==='w'){const width=Math.max(240,sizing.width-dx);panel.style.width=width+'px';panel.style.left=sizing.left+sizing.width-width+'px';}if(edge==='n'){const height=Math.max(180,sizing.height-dy);panel.style.height=height+'px';panel.style.top=sizing.top+sizing.height-height+'px';}};
      handle.onpointerup=handle.onpointercancel=()=>{if(sizing)saveLayout();sizing=null;panel.removeAttribute('data-dragging');};panel.append(handle);
    }
    let closed=false;
    const dismiss=()=>{if(closed)return;closed=true;saveLayout();cleanup();
      if(originalParent?.isConnected){if(originalParent.moveBefore)originalParent.moveBefore(frame,originalNext?.parentNode===originalParent?originalNext:null);else originalParent.insertBefore(frame,originalNext?.parentNode===originalParent?originalNext:null);frame.style.cssText=originalStyle;}
      panel.remove();onClose();
    };
    close.onclick=dismiss;
    return {element:panel,close:dismiss,move:stack.move,toggleFill,toggleClickThrough:()=>through.onclick(),get filled(){return filled;}};

}
