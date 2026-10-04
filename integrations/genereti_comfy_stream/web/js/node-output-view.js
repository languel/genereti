import { routePreviewShortcut } from './preview-shortcuts.js';
// Move the live surface, never clone it: interaction, undo and renderer state
// must survive hiding the node's controls.
export function nodeOutputView(node,surface,{beforeOpen=()=>{},onChange=()=>{}}={}){
 if(!document.getElementById('genereti-node-output-style')){
  const style=document.createElement('style');style.id='genereti-node-output-style';style.textContent=`
  .lg-node.genereti-output-only{background:transparent!important;border-color:transparent!important;box-shadow:none!important;filter:none!important;outline:none!important;overflow:visible!important}
  .lg-node.genereti-output-only>:not(.genereti-output-only-view){visibility:hidden!important;pointer-events:none!important}
  .genereti-output-only-view{position:absolute;inset:0;visibility:visible;pointer-events:auto;z-index:5}
  .genereti-output-only-edge{position:absolute;left:-9px;right:-9px;top:-9px;height:9px;z-index:6}
  .genereti-output-only-edge button{position:absolute;top:-24px;left:9px;width:30px;height:30px;padding:0;border:0;border-radius:6px;background:var(--comfy-menu-bg,#222);color:var(--fg-color,#eee);opacity:0;pointer-events:none;cursor:pointer}
  .genereti-output-only-view:has(.genereti-output-only-edge:hover) button,.genereti-output-only-edge:focus-within button{opacity:1;pointer-events:auto}
  .genereti-output-only-edge[data-side=left]{right:auto;top:0;bottom:-9px;width:9px;height:auto}
  .genereti-output-only-edge[data-side=right]{left:auto;top:0;bottom:-9px;width:9px;height:auto}
  .genereti-output-only-edge[data-side=bottom]{top:auto;bottom:-9px;height:9px}
  .genereti-output-only-edge button svg{width:18px;height:18px;vertical-align:middle}
  `;document.head.append(style);
 }
 let host,portal,original,frameWindow,disposed=false;
 const bindKeys=()=>{try{frameWindow=surface.contentWindow;frameWindow?.addEventListener('keydown',routePreviewShortcut,true);}catch{frameWindow=null;}};
 const move=(parent,child,next=null)=>{if(parent.isConnected&&child.isConnected&&parent.moveBefore)parent.moveBefore(child,next);else parent.insertBefore(child,next);};
 function set(open,persist=true){
  if(open===!!portal)return;
  if(open){
   beforeOpen();host=surface.closest('.lg-node');if(!host)return;
   original={parent:surface.parentNode,next:surface.nextSibling,style:surface.style.cssText};
   portal=document.createElement('div');portal.className='genereti-output-only-view';portal.addEventListener('pointerdown',event=>event.stopPropagation());host.append(portal);
   move(portal,surface);surface.style.cssText+=';position:absolute;inset:0;width:100%;height:100%;min-height:0;max-height:none;margin:0;flex:none;background:transparent';
   const edge=document.createElement('div');edge.className='genereti-output-only-edge';const restore=document.createElement('button');restore.type='button';restore.title='Restore node controls (Alt+O)';restore.setAttribute('aria-label','Restore node controls');restore.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18M8 8v13"/></svg>';restore.onclick=()=>set(false);edge.append(restore);portal.append(edge);for(const side of ['left','right','bottom']){const strip=document.createElement('div');strip.className='genereti-output-only-edge';strip.dataset.side=side;portal.append(strip);}host.classList.add('genereti-output-only');bindKeys();surface.addEventListener('load',bindKeys);
  }else{
   frameWindow?.removeEventListener('keydown',routePreviewShortcut,true);surface.removeEventListener('load',bindKeys);
   move(original.parent,surface,original.next?.parentNode===original.parent?original.next:null);surface.style.cssText=original.style;portal.remove();portal=null;host.classList.remove('genereti-output-only');
  }
  if(persist){node.properties??={};node.properties.genereti_output_only=open;node.graph?.change?.(node);}
  onChange(open);
 }
 const configure=node.onConfigure;node.onConfigure=function(){const result=configure?.apply(this,arguments);requestAnimationFrame(()=>{if(!disposed)set(!!node.properties?.genereti_output_only,false);});return result;};
 requestAnimationFrame(function mount(){if(disposed)return;if(!surface.closest('.lg-node')){requestAnimationFrame(mount);return;}set(!!node.properties?.genereti_output_only,false);});
 return {toggle(){set(!portal);},close(){set(false);},get opened(){return !!portal;},get hovered(){return portal?.matches(':hover');},dispose(){disposed=true;set(false,false);}};
}
