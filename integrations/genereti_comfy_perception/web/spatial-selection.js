import {parseSelection,expandSelection} from './selection.js';

export function boxHits(points,a,b){return points.filter(p=>p.x>=Math.min(a.x,b.x)&&p.x<=Math.max(a.x,b.x)&&p.y>=Math.min(a.y,b.y)&&p.y<=Math.max(a.y,b.y));}
export function paintHits(points,a,b,radius){
 const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
 return points.filter(p=>{const t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)<=radius;});
}

// Screen-space hit testing keeps box/brush selection consistent through zoom and pan.
// Commit once on release; cancel never modifies the stream or saved selectors.
export function attachSpatialSelection(surface,{mode=()=> 'toggle',points,read,write,enabled=()=>true,radius=18}){
 const ns='http://www.w3.org/2000/svg',overlay=document.createElementNS(ns,'svg');
 overlay.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483646';overlay.hidden=true;overlay.style.display='none';document.body.append(overlay);
 let gesture=null,suppressUntil=0;
 const at=e=>({x:e.clientX,y:e.clientY});
 const element=(tag,attrs)=>{const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);overlay.append(el);};
 const paint=()=>{
  overlay.replaceChildren();if(!gesture)return;const {kind,start,last,hits,cloud}=gesture;
  if(kind==='box')element('rect',{x:Math.min(start.x,last.x),y:Math.min(start.y,last.y),width:Math.abs(last.x-start.x),height:Math.abs(last.y-start.y),fill:'#ffffff0a',stroke:'#ffffffcc','stroke-width':1,'stroke-dasharray':'4 3'});
  else element('circle',{cx:last.x,cy:last.y,r:radius,fill:'#ffffff08',stroke:'#ffffffcc','stroke-width':1,'stroke-dasharray':'3 3'});
  for(const p of cloud)if(hits.has(p.id))element('circle',{cx:p.x,cy:p.y,r:4,fill:'none',stroke:p.color??'#ddd','stroke-width':1});
 };
 const consume=e=>{e.preventDefault();e.stopImmediatePropagation();};
 const down=e=>{
  if(gesture||e.button!==0||!surface.contains(e.target)||!enabled())return;
  const kind=e.ctrlKey?'box':e.altKey?'paint':mode();if(!['box','paint'].includes(kind))return;
  consume(e);const p=at(e),rect=surface.getBoundingClientRect(),cloud=points().filter(q=>q.x>=rect.left&&q.x<=rect.right&&q.y>=rect.top&&q.y<=rect.bottom);gesture={id:e.pointerId,kind,start:p,last:p,cloud,hits:new Set(),base:e.shiftKey?parseSelection(read()):[]};
  surface.dataset.generetiSelecting='true';try{surface.setPointerCapture(e.pointerId);}catch{}
  if(kind==='paint')for(const q of paintHits(cloud,p,p,radius))gesture.hits.add(q.id);
  overlay.style.display='block';paint();
 };
 const move=e=>{if(!gesture||e.pointerId!==gesture.id)return;consume(e);const p=at(e);if(gesture.kind==='box')gesture.hits=new Set(boxHits(gesture.cloud,gesture.start,p).map(q=>q.id));else for(const q of paintHits(gesture.cloud,gesture.last,p,radius))gesture.hits.add(q.id);gesture.last=p;paint();};
 const finish=(e,cancel=false)=>{
  if(!gesture||e&&e.pointerId!==gesture.id)return;if(e)consume(e);const old=gesture;gesture=null;delete surface.dataset.generetiSelecting;overlay.style.display='none';overlay.replaceChildren();suppressUntil=performance.now()+300;
  try{surface.releasePointerCapture(old.id);}catch{}
  if(!cancel){const existing=new Set(expandSelection(old.base));write([...old.base,...[...old.hits].filter(id=>!existing.has(id))]);}
 };
 const up=e=>finish(e),cancel=e=>finish(e,true),key=e=>{if(gesture&&e.key==='Escape'){consume(e);finish(null,true);}};
 const click=e=>{if(surface.contains(e.target)&&performance.now()<suppressUntil)consume(e);};
 const context=e=>{if(surface.contains(e.target)&&(gesture||e.ctrlKey))consume(e);};
 const handlers=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancel],['keydown',key],['click',click],['contextmenu',context]];
 for(const [name,fn]of handlers)window.addEventListener(name,fn,true);
 return {get active(){return !!gesture;},dispose(){finish(null,true);for(const [name,fn]of handlers)window.removeEventListener(name,fn,true);overlay.remove();}};
}
