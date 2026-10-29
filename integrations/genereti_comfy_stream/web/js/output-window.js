import { overlayShell } from './overlay-shell.js';
import { nativeOutput } from './native-output.js';
// A local display surface, not a network projector. Borrow live ImageBitmaps
// synchronously: no JPEG, blob encoding, server, queue, or bitmap clone.
export function outputWindow(status,onStateChange=()=>{},layout={},config={}) {
  const desktop=Boolean(/Electron/i.test(navigator.userAgent)||window.electronAPI||window.__comfyDesktop2);
  const native=desktop?nativeOutput(status,onStateChange):null;let nativeMode=false;
  let win = null, canvas = null, context = null, disposed = false, revision = 0;
  let frames = 0, since = performance.now(), fit = 'contain', localSurface = null, localCleanup = null, localShell = null, popupUnmount = null;
  function setFit(next){native?.setFit(next);fit=['contain','cover','fill','native'].includes(next)?next:'contain';if(!canvas)return;canvas.style.cssText=fit==='native'?'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:auto;height:auto;max-width:none;max-height:none':'position:fixed;inset:0;width:100vw;height:100vh;object-fit:'+fit;}
  function inAppOutput(initialSize,matchAspect,position,takeSurface=false){
    if(initialSize?.width>0&&initialSize?.height>0&&(matchAspect||!layout.rect||!layout.manualSize)){const width=layout.manualSize&&layout.rect?layout.rect.width:initialSize.width;const height=width*initialSize.height/initialSize.width;const scale=Math.min(1,innerWidth*.7/width,innerHeight*.7/height);layout.rect={left:layout.rect?.left??innerWidth*.1,top:layout.rect?.top??innerHeight*.12,width:Math.max(240,width*scale),height:Math.max(180,height*scale)};}
    // Alt+W moves the node's live surface here. A window instead asks the node for its own interactive view
    // (config.mountMirror), which stays in sync with the node and every other view.
    // `takeSurface`: this window takes the node's live surface (the node then shows its bitmap). Otherwise it is a bitmap mirror.
    const moved=takeSurface?config.interactiveSurface:null,mirror=!moved&&typeof config.mountMirror==='function'&&(config.multiUi?config.multiUi():true);
    const interactive=moved||(mirror?document.createElement('div'):null);
    const frame=interactive||document.createElement('iframe');if(!interactive)frame.title='Local output';
    let unmount=null,closed=false;
    const shell=overlayShell(frame,layout,()=>{closed=true;unmount?.();unmount=null;onStateChange(false);localSurface=null;localCleanup=null;win=null;canvas=null;context=null;revision++;if(moved)config.onSurfaceChange?.(false);},{...config,position,dragFrame:!interactive});
    localShell=shell;localSurface=shell.element;localCleanup=shell.close;
    if(moved){config.onSurfaceChange?.(true);status.textContent='Interactive output overlay';}
    else if(mirror){
      status.textContent='Interactive view · synced with the node';
      Promise.resolve(config.mountMirror(interactive)).then(dispose=>{if(closed)dispose?.();else unmount=dispose;}).catch(error=>{status.textContent=`Interactive view: ${error.message}`;});
    }
    else{attach(frame.contentWindow,true);status.textContent='Output overlay · direct';}
  }
  async function openInteractiveWindow(){
    const target=window.open('','','width=960,height=720');if(!target)return false;win=target;const doc=target.document;doc.title=config.node?.title||'Genereti output';doc.documentElement.style.cssText='height:100%;background:var(--comfy-menu-bg,#222)';doc.body.classList.add('genereti-external-window');doc.body.style.cssText='margin:0;height:100%;overflow:auto;background:var(--comfy-menu-bg,#222);color:var(--input-text,#ddd)';
    for(const style of (document.querySelectorAll?.('style,link[rel=stylesheet]')??[]))doc.head.append(style.cloneNode(true));
    const host=doc.createElement('div');host.style.cssText='position:relative;min-height:100%;box-sizing:border-box;padding:10px';doc.body.append(host);
    try{const dispose=await config.mountMirror(host);if(disposed||win!==target){dispose?.();return false;}popupUnmount=()=>{dispose?.();};target.addEventListener('pagehide',()=>{if(win!==target)return;popupUnmount?.();popupUnmount=null;win=null;onStateChange(false);},{once:true});status.textContent='Interactive window · synced with the node';return true;}catch(error){target.close();win=null;throw error;}
  }
  function attach(target,overlay=false) {
    win = target;
    const doc = win.document;
    doc.title = 'Genereti output';
    doc.documentElement.style.cssText = 'height:100%;background:transparent;color-scheme:normal';
    doc.body.replaceChildren();
    doc.body.style.cssText = 'margin:0;height:100%;overflow:hidden;background:transparent;color-scheme:normal;display:grid;place-items:center';
    const style = doc.createElement('style');
    style.textContent = 'canvas{display:block;width:100%;height:100%;object-fit:contain}button{position:fixed;bottom:12px;right:12px;width:36px;height:36px;border:1px solid #ffffff30;border-radius:6px;background:#222b;color:#ddd;opacity:0;transition:opacity .2s;cursor:pointer}button:hover,button:focus-visible{opacity:1}button svg{width:16px;height:16px}';
    canvas = doc.createElement('canvas');setFit(fit);
    context = canvas.getContext('2d', {alpha: true});
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
    if(overlay){fullscreen.style.display='none';fits.style.display='none';}
    doc.head.append(style);doc.body.append(canvas, fullscreen, fits);
    frames = 0; since = performance.now();
    status.textContent = 'Output window · direct · waiting for source';
    target.addEventListener('pagehide', () => {if(win === target){onStateChange(false);win=null;canvas=null;context=null;revision++;}}, {once:true});
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
    async open({floating = false, overlay = false, initialSize=null, matchAspect=false, position=null, interactive=false} = {}) {
      if(disposed) return false;
      if(localSurface)return true;
      if(win && !win.closed){win.focus();return true;}
      try {
        const forceMirror=typeof config.forceMirror==='function'?config.forceMirror():config.forceMirror;
        if(desktop&&!overlay&&!interactive&&!forceMirror){nativeMode=true;const opened=await native.open();onStateChange(opened);return opened;}
        if(forceMirror&&!overlay&&!interactive){if(!await openInteractiveWindow())inAppOutput(initialSize,matchAspect,position,false);}
        else if(overlay||interactive){inAppOutput(initialSize,matchAspect,position,interactive);}
        else if(floating && window.documentPictureInPicture?.requestWindow){
          attach(await window.documentPictureInPicture.requestWindow({width:960,height:720}));

        } else {
          // Popups are often blocked, so the fallback is the same live mirror as the overlay, drawn from bitmaps.
          inAppOutput(initialSize,matchAspect,position,false);
        }
        if(disposed){win?.close();win=null;return false;}
        onStateChange(true);return true;
      } catch(error){status.textContent=`Output window: ${error.message}`;return false;}
    },
    publish(frame) {
      if(nativeMode){native.publish(frame);return;}
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
    close(){onStateChange(false);popupUnmount?.();popupUnmount=null;localCleanup?.();native?.close();disposed=true;revision++;if(localSurface){localSurface.remove();localSurface=null;}else win?.close();win=null;canvas=null;context=null;},
    getViewport(){if(localSurface&&config.interactiveSurface)return {width:localSurface.clientWidth,height:localSurface.clientHeight};return win&&!win.closed?{width:win.innerWidth,height:win.innerHeight}:null;},
    get window(){return win;},
    get element(){return localSurface;},
    toggleFill(){localShell?.toggleFill();},
    toggleClickThrough(){localShell?.toggleClickThrough();},
    get filled(){return Boolean(localSurface&&localShell?.filled);},
  };
}
