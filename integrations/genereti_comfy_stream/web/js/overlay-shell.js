// Shared content-only chrome for image output and the interactive drawing editor.
export function overlayShell(frame,layout={},onClose=()=>{}) {
    const panel=document.createElement('div');panel.className='genereti-output-overlay';panel.setAttribute('data-chrome','auto');panel.style.cssText='position:fixed;left:10vw;top:12vh;width:70vw;height:70vh;min-width:240px;min-height:180px;z-index:10000;background:transparent;border:0;box-shadow:none';
    if(layout.rect){const {left,top,width,height}=layout.rect;panel.style.left=left+'px';panel.style.top=top+'px';panel.style.width=width+'px';panel.style.height=height+'px';}
    const saveLayout=()=>{layout.rect={left:panel.offsetLeft,top:panel.offsetTop,width:panel.offsetWidth,height:panel.offsetHeight};};
    const glyph=(paths)=>`<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
    const style=document.createElement('style');style.textContent=`
.genereti-output-overlay .output-header{position:absolute;bottom:100%;left:0;right:0;height:30px;display:flex;align-items:center;gap:4px;padding:0 6px;background:var(--comfy-menu-bg,#222);color:var(--fg-color,#eee);cursor:move;opacity:0;pointer-events:none;transition:opacity .12s}
.genereti-output-overlay .output-header button{width:30px;height:30px;padding:0;border:0;box-shadow:none;border-radius:6px;background:transparent;color:inherit;font:18px sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:0 0 30px}
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
`;panel.append(style);
    const header=document.createElement('div');header.className='output-header';
    const title=document.createElement('span');title.textContent='Output';title.style.cssText='flex:1;font:12px sans-serif;pointer-events:none';
    const pin=document.createElement('button');pin.innerHTML=glyph('<path d="m12 4 8 8-8 8-8-8Z"/>');pin.title='Keep output controls visible';pin.setAttribute('aria-label',pin.title);pin.setAttribute('aria-pressed','false');
    pin.onclick=()=>{const pinned=panel.getAttribute('data-chrome')!=='visible';panel.setAttribute('data-chrome',pinned?'visible':'auto');pin.setAttribute('aria-pressed',String(pinned));};
    let locked=false,clickThrough=false;
    const lock=document.createElement('button');lock.innerHTML=glyph('<circle cx="12" cy="12" r="7"/><path d="M12 2v20M2 12h20"/>');lock.title='Lock output position and size';lock.setAttribute('aria-label',lock.title);lock.setAttribute('aria-pressed','false');lock.onclick=()=>{locked=!locked;lock.setAttribute('aria-pressed',String(locked));panel.setAttribute('data-locked',String(locked));header.style.cursor=locked?'default':'move';};
    const through=document.createElement('button');through.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3v14l4-4 3 7 3-1-3-7h6Z"/><path d="M20 2v8m-3-3 3 3 3-3" stroke-dasharray="2 2"/></svg>';through.title='Click through content · edit underneath (Alt+Shift+O)';through.setAttribute('aria-label',through.title);through.setAttribute('aria-pressed','false');
    const opacity=document.createElement('input');opacity.type='range';opacity.min='0';opacity.max='100';opacity.step='1';opacity.value='100';opacity.title='Output opacity · 100%';opacity.setAttribute('aria-label','Output opacity');opacity.style.cssText='flex:0 0 76px';
    const close=document.createElement('button');close.innerHTML=glyph('<path d="m6 6 12 12M18 6 6 18"/>');close.title='Close output';close.setAttribute('aria-label',close.title);header.append(title,opacity,lock,through,pin,close);
    panel.append(header);document.body.append(panel);
    const originalParent=frame.parentNode, originalNext=frame.nextSibling, originalStyle=frame.style.cssText;
    // moveBefore preserves the live iframe's browsing context in supporting hosts.
    if(panel.moveBefore && frame.isConnected)panel.moveBefore(frame,null);else panel.append(frame);
    frame.style.cssText='display:block;width:100%;height:100%;min-height:0;border:0;background:transparent;color-scheme:normal';
    opacity.oninput=()=>{frame.style.opacity=String(Number(opacity.value)/100);opacity.title=`Output opacity · ${opacity.value}%`;};
    through.onclick=()=>{clickThrough=!clickThrough;frame.style.pointerEvents=clickThrough?'none':'auto';panel.style.pointerEvents=clickThrough?'none':'auto';through.setAttribute('aria-pressed',String(clickThrough));};
    const recover=event=>{if(event.altKey&&event.shiftKey&&event.code==='KeyO'&&!event.repeat){event.preventDefault();event.stopPropagation?.();through.onclick();}};document.addEventListener('keydown',recover);
    let frameWindow;const bindKeys=()=>{frameWindow?.removeEventListener?.('keydown',recover,true);try{frameWindow=frame.contentWindow;frameWindow?.addEventListener?.('keydown',recover,true);}catch{frameWindow=null;}};
    bindKeys();frame.addEventListener('load',bindKeys);
    const cleanup=()=>{document.removeEventListener('keydown',recover);frameWindow?.removeEventListener?.('keydown',recover,true);frame.removeEventListener('load',bindKeys);};
    let drag=null;header.onpointerdown=event=>{if(locked||event.target!==header)return;drag={x:event.clientX,y:event.clientY,left:panel.offsetLeft,top:panel.offsetTop};header.setPointerCapture(event.pointerId);};header.onpointermove=event=>{if(drag){panel.style.left=drag.left+event.clientX-drag.x+'px';panel.style.top=drag.top+event.clientY-drag.y+'px';}};header.onpointerup=header.onpointercancel=()=>{if(drag)saveLayout();drag=null;};
    // Hit targets sit outside the content; hovering the picture never reveals chrome.
    for(const [edge,css] of [['n','left:0;right:0;top:-8px;height:8px'],['s','left:0;right:0;bottom:-8px;height:8px'],['w','top:0;bottom:0;left:-8px;width:8px'],['e','top:0;bottom:0;right:-8px;width:8px'],['se','right:-8px;bottom:-8px;width:16px;height:16px']]){
      const handle=document.createElement('div');handle.className='output-edge';handle.style.cssText=css+';pointer-events:auto;cursor:'+edge+'-resize';let sizing;
      handle.onpointerdown=event=>{if(locked)return;event.preventDefault();sizing={x:event.clientX,y:event.clientY,width:panel.offsetWidth,height:panel.offsetHeight,left:panel.offsetLeft,top:panel.offsetTop};panel.setAttribute('data-dragging','true');handle.setPointerCapture(event.pointerId);};
      handle.onpointermove=event=>{if(!sizing)return;const dx=event.clientX-sizing.x,dy=event.clientY-sizing.y;if(edge.includes('e'))panel.style.width=Math.max(240,sizing.width+dx)+'px';if(edge.includes('s'))panel.style.height=Math.max(180,sizing.height+dy)+'px';if(edge==='w'){const width=Math.max(240,sizing.width-dx);panel.style.width=width+'px';panel.style.left=sizing.left+sizing.width-width+'px';}if(edge==='n'){const height=Math.max(180,sizing.height-dy);panel.style.height=height+'px';panel.style.top=sizing.top+sizing.height-height+'px';}};
      handle.onpointerup=handle.onpointercancel=()=>{if(sizing)saveLayout();sizing=null;panel.removeAttribute('data-dragging');};panel.append(handle);
    }
    let closed=false;
    const dismiss=()=>{if(closed)return;closed=true;saveLayout();cleanup();
      if(originalParent?.isConnected){if(originalParent.moveBefore)originalParent.moveBefore(frame,originalNext?.parentNode===originalParent?originalNext:null);else originalParent.insertBefore(frame,originalNext?.parentNode===originalParent?originalNext:null);frame.style.cssText=originalStyle;}
      panel.remove();onClose();
    };
    close.onclick=dismiss;
    return {element:panel,close:dismiss};

}
