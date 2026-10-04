import { overlayShell } from './overlay-shell.js';
// Share the overlay bar and move the live surface rather than cloning it.
export function nodeOutputView(node,surface,{beforeOpen=()=>{},onChange=()=>{}}={}){
 if(!document.getElementById('genereti-node-output-style')){
  const style=document.createElement('style');style.id='genereti-node-output-style';style.textContent=`
  .lg-node:has(>.genereti-output-only-view){background:transparent!important;border-color:transparent!important;box-shadow:none!important;filter:none!important;outline:none!important;overflow:visible!important}
  .lg-node:has(>.genereti-output-only-view)>:not(.genereti-output-only-view){visibility:hidden!important;pointer-events:none!important}
  `;document.head.append(style);
 }
 let host,shell,hostPointerEvents,disposed=false;
 function set(open,persist=true){
  if(open===!!shell)return;
  if(open){
   beforeOpen();host=surface.closest('.lg-node');if(!host)return;
   hostPointerEvents=host.style.pointerEvents;host.classList.add('genereti-output-only');
   shell=overlayShell(surface,{},()=>{
    shell=null;host.classList.remove('genereti-output-only');host.style.pointerEvents=hostPointerEvents;
    if(!disposed){node.properties.genereti_output_only=false;node.graph?.change?.(node);onChange(false);}
   },{node,embedded:true,parent:host,onThroughChange:through=>host.style.pointerEvents=through?'none':hostPointerEvents});
  }else{shell.close();return;}
  if(persist){node.properties??={};node.properties.genereti_output_only=open;node.graph?.change?.(node);}
  onChange(open);
 }
 const configure=node.onConfigure;node.onConfigure=function(){const result=configure?.apply(this,arguments);requestAnimationFrame(()=>{if(!disposed)set(!!node.properties?.genereti_output_only,false);});return result;};
 requestAnimationFrame(function mount(){if(disposed)return;if(!surface.closest('.lg-node')){requestAnimationFrame(mount);return;}set(!!node.properties?.genereti_output_only,false);});
 return {toggle(){set(!shell);},close(){set(false);},get opened(){return !!shell;},get hovered(){return shell?.element.matches(':hover');},toggleClickThrough(){shell?.toggleClickThrough();},dispose(){disposed=true;set(false,false);}};
}
