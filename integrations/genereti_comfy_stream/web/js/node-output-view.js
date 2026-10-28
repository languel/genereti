import {previewFirst} from '/extensions/genereti_comfy_p5/js/preview-order.js';
import { overlayShell } from './overlay-shell.js';
import { registerPreviewShortcuts } from './preview-shortcuts.js';
// Share the overlay bar and move the live surface rather than cloning it.
export function nodeOutputView(node,surface,{beforeOpen=()=>{},onChange=()=>{}}={}){
 let home=surface,parked=false,quiet=false;   // home: the node's own surface; parked: the live surface is in a window, so the view follows the node's mirror (or waits)
 requestAnimationFrame(()=>{if(!node.graph)return;const widget=node.widgets?.find(w=>w.element?.contains(surface));if(widget)previewFirst(node,widget);const root=widget?.element,actions=root?.querySelector('.genereti-preview-actions');if(actions){for(const fit of root.querySelectorAll('select[aria-label="Image fit"],select[aria-label^="Preview fit"]'))actions.append(fit);}});
 if(!document.getElementById('genereti-node-output-style')){
  const style=document.createElement('style');style.id='genereti-node-output-style';style.textContent=`
  .lg-node:has(>.genereti-output-only-view){background:transparent!important;border-color:transparent!important;box-shadow:none!important;filter:none!important;outline:none!important;overflow:visible!important}
  .lg-node:has(>.genereti-output-only-view) :not(:has(.genereti-visual-surface)):not(.genereti-visual-surface):not(.genereti-visual-surface *):not(.genereti-output-only-view):not(.genereti-output-only-view *){opacity:0!important}
  .lg-node:has(>.genereti-output-only-view) :has(.genereti-visual-surface){background:transparent!important;border-color:transparent!important;box-shadow:none!important}
  .lg-node.genereti-output-only .genereti-slot-path,.lg-node.genereti-output-only .genereti-minimal-slot,.lg-node.genereti-output-only .genereti-minimal-slot [data-testid="slot-connection-dot"],.lg-node.genereti-output-only .genereti-minimal-slot [data-testid="slot-connection-dot"] *{opacity:1!important}
  .lg-node.genereti-output-only .genereti-minimal-slot{translate:0 var(--genereti-slot-shift,0px);pointer-events:none}
  .lg-node.genereti-output-only .genereti-minimal-slot [data-testid="slot-connection-dot"]{pointer-events:auto}
    `;document.head.append(style);
 }
 let host,shell,hostPointerEvents,paths=[],disposed=false,slotPaths=[],slotNodes=[],slotShift=null,slotObserver,slotOpacity=new Map();
 // Vue computes cable anchors from the measured slot dots. Move the actual slots
 // and nudge its observed widget grid so its layout store remeasures them.
 function remeasureSlots(){const grid=host?.querySelector?.('[data-testid="node-widgets"]');if(!grid)return;const previous=grid.style.width;grid.style.width='calc(100% - 1px)';requestAnimationFrame(()=>{if(grid.isConnected!==false)grid.style.width=previous;node.setDirtyCanvas?.(true,true);});}
 function alignSlots(){if(!host||!surface)return;const slots=[...(host.querySelectorAll?.('.lg-slot')??[])];const first=slots[0]?.querySelector?.('[data-testid="slot-dot"]');if(!first)return;const bounds=host.getBoundingClientRect(),scale=host.offsetWidth?bounds.width/host.offsetWidth:1,desired=(surface.getBoundingClientRect().top-first.getBoundingClientRect().top)/(scale||1)+8,shift=Math.round(desired*10)/10+(slotShift??0);if(slotShift!==null&&Math.abs(shift-slotShift)<.5)return;slotShift=shift;host.style.setProperty?.('--genereti-slot-shift',`${shift}px`);remeasureSlots();}
 function revealSlotPart(el){if(!el?.style||slotOpacity.has(el))return;slotOpacity.set(el,[el.style.getPropertyValue('opacity'),el.style.getPropertyPriority('opacity')]);el.style.setProperty('opacity','1','important');}
 function showSlots(){slotNodes=[...(host.querySelectorAll?.('.lg-slot')??[])];slotPaths=[];for(const slot of slotNodes){slot.classList.add('genereti-minimal-slot');revealSlotPart(slot);const dot=slot.querySelector?.('[data-testid="slot-connection-dot"]');if(dot){revealSlotPart(dot);for(const child of dot.querySelectorAll('*'))revealSlotPart(child);}for(let p=slot.parentElement;p&&p!==host;p=p.parentElement)if(!slotPaths.includes(p)){slotPaths.push(p);p.classList.add('genereti-slot-path');revealSlotPart(p);}}alignSlots();if(typeof ResizeObserver!=='undefined'){slotObserver=new ResizeObserver(alignSlots);slotObserver.observe(surface);}}
 function restoreSlots(){slotObserver?.disconnect();slotObserver=null;for(const slot of slotNodes)slot.classList.remove('genereti-minimal-slot');for(const p of slotPaths)p.classList.remove('genereti-slot-path');for(const [el,[value,priority]] of slotOpacity){if(value)el.style.setProperty('opacity',value,priority);else el.style.removeProperty('opacity');}slotOpacity.clear();slotNodes=[];slotPaths=[];slotShift=null;host?.style.removeProperty?.('--genereti-slot-shift');remeasureSlots();}

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
   host.classList.add('genereti-output-only');showSlots();
   shell=overlayShell(surface,{},()=>{
    shell=null;restoreSlots();surface.classList.remove('genereti-visual-surface');for(const parent of paths)parent.classList.remove('genereti-visual-path');paths=[];host.classList.remove('genereti-output-only');host.style.pointerEvents=hostPointerEvents;
    if(!disposed&&!quiet){node.properties.genereti_output_only=false;node.graph?.change?.(node);onChange(false);}
   },{node,embedded:true,inPlace:true,parent:host,surfaceSize,onThroughChange:through=>host.style.pointerEvents=through?'none':hostPointerEvents});
  }else{shell.close();return;}
  if(persist){node.properties??={};node.properties.genereti_output_only=open;node.graph?.change?.(node);}
  onChange(open);
 }
 const configure=node.onConfigure;node.onConfigure=function(){const result=configure?.apply(this,arguments);requestAnimationFrame(()=>{if(!disposed)set(!!node.properties?.genereti_output_only,false);});return result;};
 requestAnimationFrame(function mount(){if(disposed)return;if(!surface.closest('.lg-node')){requestAnimationFrame(mount);return;}set(!!node.properties?.genereti_output_only,false);});
 const settle=()=>{if(!disposed&&surface?.closest?.('.lg-node'))set(!!node.properties?.genereti_output_only,false);};
 return {toggle(){if(parked&&!surface){node.properties??={};node.properties.genereti_output_only=!node.properties.genereti_output_only;node.graph?.change?.(node);onChange(node.properties.genereti_output_only);return;}set(!shell);},
  /** The live surface moved into a window: show the node's mirror in the output-only view, or just keep the state until it returns. */
  park(mirror=null){parked=true;const was=!!shell;if(was){quiet=true;shell.close();quiet=false;}surface=mirror;if(was)requestAnimationFrame(settle);},
  unpark(){if(!parked)return;parked=false;const was=!!shell;if(was){quiet=true;shell.close();quiet=false;}surface=home;requestAnimationFrame(settle);},
  get parked(){return parked;},close(){set(false);},get opened(){return !!shell;},get hovered(){return shell&&(surface?.matches(':hover')||shell.element.matches(':hover'));},toggleClickThrough(){shell?.toggleClickThrough();},dispose(){disposed=true;set(false,false);}};
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
