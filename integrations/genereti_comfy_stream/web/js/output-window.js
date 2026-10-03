// A local display surface, not a network projector. Borrow live ImageBitmaps
// synchronously: no JPEG, blob encoding, server, queue, or bitmap clone.
export function outputWindow(status) {
  let win = null, canvas = null, context = null, disposed = false, revision = 0;
  let frames = 0, since = performance.now(), fit = 'contain', localSurface = null;
  function setFit(next){fit=['contain','cover','fill','native'].includes(next)?next:'contain';if(!canvas)return;canvas.style.cssText=fit==='native'?'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:auto;height:auto;max-width:none;max-height:none':'position:fixed;inset:0;width:100vw;height:100vh;object-fit:'+fit;}
  function inAppOutput(){
    const panel=document.createElement('div');panel.style.cssText='position:fixed;left:10vw;top:12vh;width:70vw;height:70vh;min-width:240px;min-height:180px;z-index:10000;resize:both;overflow:hidden;box-shadow:0 8px 40px #000a;background:#000;border:1px solid #555';
    const header=document.createElement('div');header.style.cssText='height:28px;background:var(--comfy-input-bg,#222);color:var(--fg-color,#eee);display:flex;justify-content:space-between;cursor:move;padding:0 8px;align-items:center';header.textContent='Output';
    const close=document.createElement('button');close.textContent='×';close.title='Close output';header.append(close);
    const frame=document.createElement('iframe');frame.style.cssText='width:100%;height:calc(100% - 28px);border:0';frame.title='Local output';panel.append(header,frame);document.body.append(panel);localSurface=panel;
    let drag=null;header.onpointerdown=event=>{if(event.target===close)return;drag={x:event.clientX,y:event.clientY,left:panel.offsetLeft,top:panel.offsetTop};header.setPointerCapture(event.pointerId);};header.onpointermove=event=>{if(drag){panel.style.left=drag.left+event.clientX-drag.x+'px';panel.style.top=drag.top+event.clientY-drag.y+'px';}};header.onpointerup=()=>drag=null;
    close.onclick=()=>{panel.remove();localSurface=null;win=null;canvas=null;context=null;revision++;};
    attach(frame.contentWindow);status.textContent='Desktop floating windows unavailable · local output panel; use Chrome for a separate window';
  }
  function attach(target) {
    win = target;
    const doc = win.document;
    doc.title = 'Genereti output';
    doc.documentElement.style.cssText = 'height:100%;background:#000';
    doc.body.replaceChildren();
    doc.body.style.cssText = 'margin:0;height:100%;overflow:hidden;background:#000;display:grid;place-items:center';
    const style = doc.createElement('style');
    style.textContent = 'canvas{display:block;width:100%;height:100%;object-fit:contain}button{position:fixed;bottom:12px;right:12px;width:36px;height:36px;border:1px solid #ffffff30;border-radius:6px;background:#222b;color:#ddd;opacity:0;transition:opacity .2s;cursor:pointer}button:hover,button:focus-visible{opacity:1}button svg{width:16px;height:16px}';
    canvas = doc.createElement('canvas');setFit(fit);
    context = canvas.getContext('2d', {alpha: false});
    const fullscreen = doc.createElement('button');
    fullscreen.title = 'Fullscreen (F) · double click';
    fullscreen.setAttribute('aria-label', 'Fullscreen');
    fullscreen.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
    fullscreen.onclick = async () => {
      try {if(doc.fullscreenElement) await doc.exitFullscreen();else await doc.documentElement.requestFullscreen();}
      catch {fullscreen.title = 'Use the window maximize control; this browser does not allow fullscreen here';}
    };
    doc.addEventListener('keydown', event => {
      if(event.key.toLowerCase()==='f' && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey){event.preventDefault();fullscreen.click();}
    });
    canvas.ondblclick = () => fullscreen.click();
    const fits=doc.createElement('select');fits.title='Output fit';fits.setAttribute('aria-label','Output fit');fits.style.cssText='position:fixed;left:12px;bottom:12px;z-index:2;background:#222b;color:#ddd;border:1px solid #ffffff30;opacity:0';
    for(const [label,value] of [['Contain','contain'],['Cover','cover'],['Stretch','fill'],['Native pixels','native']])fits.append(new win.Option(label,value));fits.value=fit;fits.onchange=()=>setFit(fits.value);
    doc.body.addEventListener('pointermove',event=>{fits.style.opacity=event.clientY>win.innerHeight-70?'1':'0';});fits.onfocus=()=>fits.style.opacity='1';
    doc.head.append(style);doc.body.append(canvas, fullscreen, fits);
    frames = 0; since = performance.now();
    status.textContent = 'Output window · direct · waiting for source';
    target.addEventListener('pagehide', () => {if(win === target){win=null;canvas=null;context=null;revision++;}}, {once:true});
  }
  function draw(bitmap) {
    if(!win || win.closed || !context) return;
    if(canvas.width !== bitmap.width || canvas.height !== bitmap.height){canvas.width=bitmap.width;canvas.height=bitmap.height;}
    context.clearRect(0,0,canvas.width,canvas.height);
    context.drawImage(bitmap, 0, 0);
    frames++;
    const now=performance.now();
    if(now-since >= 1000){
      const label=`Output · ${(frames*1000/(now-since)).toFixed(1)} fps · ${canvas.width} × ${canvas.height} · direct`;
      win.document.title=label;status.textContent=label;frames=0;since=now;
    }
  }
  return {
    async open({floating = false} = {}) {
      if(disposed) return;
      if(win && !win.closed){win.focus();return;}
      try {
        // Document PiP stays in the editor's browser/Electron context, even
        // when desktop window.open would redirect into an external browser.
        const desktop = /Electron/i.test(navigator.userAgent) || window.electronAPI || window.__comfyDesktop2;
        if((floating || desktop) && window.documentPictureInPicture?.requestWindow){
          try{attach(await window.documentPictureInPicture.requestWindow({width:960,height:720}));}catch(error){if(desktop){inAppOutput();}else throw error;}
        } else if(desktop){inAppOutput();} else {
          const target=window.open('about:blank', 'genereti-output-'+crypto.randomUUID(), 'popup,width=960,height=720');
          if(!target) throw new Error('This host does not allow local output windows. Open Comfy in Chrome and use Output window there.');
          attach(target);
        }
        if(disposed){win?.close();win=null;}
      } catch(error){status.textContent=`Output window: ${error.message}`;}
    },
    publish(frame) {
      if(!win || win.closed || disposed) return;
      const current=++revision;
      if(frame.bitmap){draw(frame.bitmap);return;}
      // Queued IMAGE results are decoded once; browser live sources above
      // never go through this path. Discard late decodes after newer frames.
      (async () => {
        let bitmap;
        try {
          bitmap=await createImageBitmap(frame.blob || await(await fetch(frame.src)).blob());
          if(!disposed && current===revision) draw(bitmap);
        } catch(error){if(!disposed && current===revision) status.textContent=`Output: ${error.message}`;}
        finally {bitmap?.close();}
      })();
    },
    setFit,
    close(){disposed=true;revision++;if(localSurface){localSurface.remove();localSurface=null;}else win?.close();win=null;canvas=null;context=null;},
    get window(){return win;},
  };
}
