// DOM order is independent of render clocks and texture ownership. Floating
// overlays and graph nodes each sort within their own stacking context.
const entries=[];
let active;
export function registerViewStack(element,owner=element){
 let disposed=false;const previous=owner.style.zIndex,entry={element,owner};entries.push(entry);active=entry;
 const peers=()=>entries.filter(item=>item.owner.parentElement===owner.parentElement);
 const paint=()=>peers().forEach((item,index)=>item.owner.style.zIndex=String(10000+index));
 const select=()=>active=entry;element.addEventListener('pointerdown',select,true);element.addEventListener('pointerenter',select);
 entry.move=direction=>{
  const group=peers(),index=group.indexOf(entry);
  const next=direction==='back'?0:direction==='front'?group.length-1:Math.max(0,Math.min(group.length-1,index+(direction==='backward'?-1:1)));
  group.splice(index,1);group.splice(next,0,entry);
  const positions=entries.map((item,i)=>group.includes(item)?i:-1).filter(i=>i>=0);
  positions.forEach((position,i)=>entries[position]=group[i]);paint();active=entry;
 };
 paint();
 return {move:entry.move,dispose(){if(disposed)return;disposed=true;element.removeEventListener('pointerdown',select,true);element.removeEventListener('pointerenter',select);entries.splice(entries.indexOf(entry),1);owner.style.zIndex=previous;paint();if(active===entry)active=entries.at(-1);}};
}
export function moveActiveView(direction){
 const hovered=entries.filter(item=>item.element.matches(':hover')).sort((a,b)=>Number(b.owner.style.zIndex)-Number(a.owner.style.zIndex))[0];
 const entry=hovered||active;if(!entry)return false;entry.move(direction);return true;
}
export function routeStackShortcut(event){
 if(event.defaultPrevented||event.repeat||event.isComposing||event.altKey||!(event.metaKey||event.ctrlKey)||!['BracketLeft','BracketRight'].includes(event.code))return false;
 const direction=event.code==='BracketLeft'?(event.shiftKey?'back':'backward'):(event.shiftKey?'front':'forward');
 if(!moveActiveView(direction))return false;
 event.preventDefault();event.stopPropagation();return true;
}
