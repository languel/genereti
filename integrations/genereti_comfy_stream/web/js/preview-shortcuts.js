import { moveActiveView } from './view-stack.js';
import { editing, routeNativeShortcut } from './keybinding-router.js';
import { app } from '../../../scripts/app.js';

const previews=new Map();
let pointer;window.addEventListener('pointermove',event=>{pointer={x:event.clientX,y:event.clientY};},{passive:true,capture:true});
export function registerPreviewShortcuts(node,controls){
  previews.set(node,controls);
  return ()=>{if(previews.get(node)===controls)previews.delete(node);};
}
export function performPreviewAction(kind){
  const escape=kind==='restore';
  if(escape){const filled=[...previews].reverse().find(([node,controls])=>node.graph===app.graph&&controls.isFilled?.());if(!filled)return false;filled[1].toggleFill();return true;}
  const selected=[...new Set([...Object.values(app.canvas?.selected_nodes||{}),...Array.from(app.canvas?.selectedItems||[])])].filter(node=>node.graph===app.graph);
  const hovered=kind!=='backdrop'&&([...previews].reverse().find(([node,controls])=>node.graph===app.graph&&(kind==='outputOnly'?controls.isOutputHovered?.():controls.isHovered?.()||(kind==='through'&&controls.isOutputHovered?.()))));
  const node=hovered?.[0]||(selected.length===1?selected[0]:null);
  const action=previews.get(node)?.[{outputOnly:'toggleOutputOnly',through:'toggleClickThrough',backdrop:'toggleBackdrop',fill:'toggleFill',overlay:'toggleOverlay'}[kind]];
  if(!action)return false;
  action(kind==='overlay'?{position:pointer}:undefined);return true;
}
const definitions=[
 ['Backdrop','Toggle backdrop','d',false,false,'One selected preview-capable node.'],
 ['OutputOnly','Toggle output-only node','o',true,false,'Selected node or output-only node under the pointer. Reveal its bar just outside an edge.'],
 ['Overlay','Toggle overlay window','w',true,false,'Hovered overlay first, otherwise selected node. Opens at the pointer.'],
 ['Fill','Fill window / restore','f',true,false,'Fill inside Comfy; browser and macOS fullscreen remain separate.'],
 ['ClickThrough','Toggle click through','o',true,true,'Toggle interaction with content underneath the active overlay.'],
];
const kinds={Backdrop:'backdrop',OutputOnly:'outputOnly',Overlay:'overlay',Fill:'fill',ClickThrough:'through'};
app.registerExtension({name:'Genereti.PreviewKeybindings',
 commands:[...definitions.map(([id,label,key,alt,shift,tooltip])=>({id:`Genereti.${id}`,label:`ꘇ ${label}`,tooltip,function:()=>performPreviewAction(kinds[id])})),
 ...['backward','forward','back','front'].map(direction=>({id:`Genereti.Stack.${direction}`,label:`ꘇ Stack ${direction}`,tooltip:'Hovered or last interacted overlay/output-only view.',function:()=>moveActiveView(direction)}))],
 keybindings:[...definitions.map(([id,label,key,alt,shift])=>({commandId:`Genereti.${id}`,combo:{key,alt,shift}})),
 ...['backward','forward','back','front'].map((direction,index)=>({commandId:`Genereti.Stack.${direction}`,combo:{key:index%2?']':'[',ctrl:true,shift:index>1}}))]
});
// Escape is shared with Comfy's subgraph navigation: consume only when filled.
export function routePreviewShortcut(event){
 routeNativeShortcut(event);
 if(event.defaultPrevented||event.repeat||event.isComposing||editing(event)||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.key!=='Escape')return;
 if(performPreviewAction('restore')){event.preventDefault();event.stopImmediatePropagation?.();event.stopPropagation?.();}
}
window.addEventListener('keydown',routePreviewShortcut,true);
