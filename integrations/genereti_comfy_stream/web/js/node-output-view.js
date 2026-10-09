import { overlayShell } from './overlay-shell.js';
import { registerPreviewShortcuts } from './preview-shortcuts.js';
// Share the overlay bar and move the live surface rather than cloning it.
export function nodeOutputView(node,surface,{beforeOpen=()=>{},onChange=()=>{}}={}){
 if(!document.getElementById('genereti-node-output-style')){
  const style=document.createElement('style');style.id='genereti-node-output-style';style.textContent=`
  .lg-node:has(>.genereti-output-only-view){background:transparent!important;border-color:transparent!important;box-shadow:none!important;filter:none!important;outline:none!important;overflow:visible!important}
  .lg-node:has(>.genereti-output-only-view) :not(:has(.genereti-visual-surface)):not(.genereti-visual-surface):not(.genereti-visual-surface *):not(.genereti-output-only-view):not(.genereti-output-only-view *){opacity:0!important}
  .lg-node:has(>.genereti-output-only-view) :has(.genereti-visual-surface){background:transparent!important;border-color:transparent!important;box-shadow:none!important}
    `;document.head.append(style);
 }
 let host,shell,hostPointerEvents,paths=[],disposed=false;
 function set(open,persist=true){
  if(open===!!shell)return;
  if(open){
   beforeOpen();host=surface.closest('.lg-node');if(!host)return;
   // Measure before moving the surface: node height also includes hidden controls.
   const hostRect=host.getBoundingClientRect(),rect=surface.getBoundingClientRect();
   const scale=host.offsetWidth?hostRect.width/host.offsetWidth:1;
   const surfaceSize={width:rect.width/(scale||1),height:rect.height/(scale||1),left:(rect.left-hostRect.left)/(scale||1),top:(rect.top-hostRect.top)/(scale||1)};
   hostPointerEvents=host.style.pointerEvents;surface.classList.add('genereti-visual-surface');
   paths=[];for(let parent=surface.parentElement;parent&&parent!==host;parent=parent.parentElement){parent.classList.add('genereti-visual-path');paths.push(parent);}
   host.classList.add('genereti-output-only');
   shell=overlayShell(surface,{},()=>{
    shell=null;surface.classList.remove('genereti-visual-surface');for(const parent of paths)parent.classList.remove('genereti-visual-path');paths=[];host.classList.remove('genereti-output-only');host.style.pointerEvents=hostPointerEvents;
    if(!disposed){node.properties.genereti_output_only=false;node.graph?.change?.(node);onChange(false);}
   },{node,embedded:true,inPlace:true,parent:host,surfaceSize,onThroughChange:through=>host.style.pointerEvents=through?'none':hostPointerEvents});
  }else{shell.close();return;}
  if(persist){node.properties??={};node.properties.genereti_output_only=open;node.graph?.change?.(node);}
  onChange(open);
 }
 const configure=node.onConfigure;node.onConfigure=function(){const result=configure?.apply(this,arguments);requestAnimationFrame(()=>{if(!disposed)set(!!node.properties?.genereti_output_only,false);});return result;};
 requestAnimationFrame(function mount(){if(disposed)return;if(!surface.closest('.lg-node')){requestAnimationFrame(mount);return;}set(!!node.properties?.genereti_output_only,false);});
 return {toggle(){set(!shell);},close(){set(false);},get opened(){return !!shell;},get hovered(){return shell&&(surface.matches(':hover')||shell.element.matches(':hover'));},toggleClickThrough(){shell?.toggleClickThrough();},dispose(){disposed=true;set(false,false);}};
}

// Add the shared performance view to visual nodes without output-window controls.
export function visualNodeControls(node,surface,toolbar){
 const view=nodeOutputView(node,surface);
 const button=document.createElement('button');button.type='button';button.textContent='▣';
 button.title=button.ariaLabel='Visual node view · keep sockets and cables (Alt+O)';
 button.onclick=()=>view.toggle();toolbar.append(button);
 const unregister=registerPreviewShortcuts(node,{toggleOutputOnly:()=>view.toggle(),isOutputHovered:()=>view.hovered});
 const removed=node.onRemoved;node.onRemoved=function(){unregister();view.dispose();return removed?.apply(this,arguments);};
 return view;
}
