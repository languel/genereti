import {app} from '../../../scripts/app.js';

// Separate windows/backdrops are independent document instances. The interactive
// overlay and Alt-O move the node's original surface through shared controls.
let activeBackdrop;
export function documentViewer(status,onState,{backdrop=false,getDocument,fontDelta,shortcut,onFrame}={}){
 let win,frame,host,graph,previous,hook,oldStyle,closed=true,epoch=0;
 const key=event=>{if((event.metaKey||event.ctrlKey)&&event.shiftKey&&!event.altKey&&['Equal','Minus','NumpadAdd','NumpadSubtract'].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();fontDelta(['Equal','NumpadAdd'].includes(event.code)?1:-1);}};
 const message=event=>{if(event.source===frame?.contentWindow&&event.data?.type==='genereti-webview-font'&&[1,-1].includes(event.data.delta))fontDelta(event.data.delta);else if(event.source===frame?.contentWindow&&event.data?.type==='genereti-webview-shortcut')shortcut?.(event.data.action);};
 function bind(){try{if(frame.contentDocument){frame.contentWindow.addEventListener('keydown',key,true);}}catch{};onFrame?.(frame);}
 async function refresh(){if(closed)return;const revision=++epoch;const doc=await getDocument();if(closed||revision!==epoch)return;frame.onload=bind;frame.sandbox=doc.sandbox;frame.allow='autoplay';frame.title='Genereti webview output';if(doc.url){frame.removeAttribute('srcdoc');frame.src=doc.url;}else{frame.removeAttribute('src');frame.srcdoc=doc.html;}}
 function close(){if(closed)return;closed=true;epoch++;(win||window).removeEventListener('message',message);frame?.remove();if(backdrop){host?.remove();if(graph?.onRenderBackground===hook)graph.onRenderBackground=previous;if(graph?.canvas)graph.canvas.style.cssText=oldStyle;graph?.setDirty?.(true,true);if(activeBackdrop===viewer)activeBackdrop=undefined;}else{win?.removeEventListener('pagehide',close);if(win&&!win.closed)win.close();}frame=host=win=undefined;onState(false);}
 const viewer={
  async open(){if(!closed)return true;
   if(backdrop){activeBackdrop?.close();graph=app.canvas;const canvas=graph?.canvas;if(!canvas){status.textContent='Graph canvas unavailable';return false;}host=document.createElement('div');host.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0';canvas.before(host);oldStyle=canvas.style.cssText;previous=graph.onRenderBackground;hook=(_target,ctx)=>{ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.restore();return true;};graph.onRenderBackground=hook;activeBackdrop=viewer;graph.setDirty(true,true);}
   else{win=window.open('','_blank','width=900,height=650');if(!win){status.textContent='Allow browser popups for the output window.';return false;}win.document.title='ꘇ webview';win.document.body.style.cssText='margin:0;width:100vw;height:100vh;overflow:hidden';host=win.document.body;win.addEventListener('pagehide',close);}
   frame=(win?.document||document).createElement('iframe');frame.style.cssText='display:block;width:100%;height:100%;border:0';host.append(frame);closed=false;(win||window).addEventListener('message',message);try{await refresh();onState(true);return true;}catch(error){status.textContent=error.message;close();return false;}
  },close,refresh,publish(){},setFit(){},getViewport(){return !closed?{width:host.clientWidth,height:host.clientHeight}:null;},get frame(){return frame;}
 };return viewer;
}
