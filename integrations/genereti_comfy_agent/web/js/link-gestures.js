import {app} from '../../../../scripts/app.js';
import {crossedLinks,applyLinkGesture} from './link-gesture-core.js';

const installed=new WeakSet();
export const LINK_GESTURES_SETTING='Genereti.Shortcuts.ConnectionGestures';
export function installLinkGestures(canvas,{isEnabled=()=>app.ui.settings.getSettingValue(LINK_GESTURES_SETTING,true)}={}){
 const el=canvas?.canvas;if(!el||installed.has(el))return;
 installed.add(el);let drag=null,suppressUntil=0;
 const listeners=[];const listen=(type,fn,capture=false)=>{window.addEventListener(type,fn,capture);listeners.push(()=>window.removeEventListener(type,fn,capture));};
 const consume=e=>{e.preventDefault();e.stopImmediatePropagation();};
 const position=e=>canvas.convertEventToCanvasOffset(e);
 const clearPreview=()=>{
  if(!drag)return;
  for(const [link,color] of drag.highlights)link.color=color;
  drag.trail?.remove();canvas.setDirty(true,true);
 };
 const startTrail=e=>{
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('aria-hidden','true');
  svg.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483647';
  const line=document.createElementNS(svg.namespaceURI,'polyline');
  for(const [key,value] of Object.entries({fill:'none',stroke:'#ff6262','stroke-width':'2','stroke-dasharray':'7 5','stroke-linecap':'round','stroke-linejoin':'round'}))line.setAttribute(key,value);
  svg.appendChild(line);document.body.appendChild(svg);
  drag.trail=svg;drag.line=line;drag.points=[];
  extendTrail(e);
 };
 const extendTrail=e=>{
  if(!drag.line)return;
  drag.points.push(`${e.clientX},${e.clientY}`);
  drag.line.setAttribute('points',drag.points.join(' '));
 };
 const collect=e=>{
  const pos=position(e);
  extendTrail(e);
  for(const hit of crossedLinks(canvas,drag.last,pos)){
   if(!drag.seen.has(hit.item)){drag.seen.add(hit.item);drag.hits.push(hit);}
   if(drag.mode==='cut')for(const id of hit.ids){
    const link=drag.graph.links.get(id);
    if(link&&!drag.highlights.has(link)){drag.highlights.set(link,link.color);link.color='#ff6262';canvas.setDirty(true,true);}
   }
  }
  drag.last=pos;
 };
 listen('pointerdown',e=>{
  if(!isEnabled()||e.target!==el||e.button!==2||e.altKey||e.metaKey||(!e.ctrlKey&&!e.shiftKey))return;
  consume(e);
  el.focus({preventScroll:true});
  drag={id:e.pointerId,graph:canvas.graph,mode:e.ctrlKey?'cut':'reroute',last:position(e),hits:[],seen:new Set(),highlights:new Map()};
  if(drag.mode==='cut')startTrail(e);
  el.setPointerCapture(e.pointerId);
 },true);
 listen('pointermove',e=>{if(drag&&e.pointerId===drag.id){if(!isEnabled()){finish(e,true);return;}consume(e);collect(e);}},true);
 const finish=(e,cancel=false)=>{
  if(!drag||e.pointerId!==drag.id)return;
  cancel=cancel||!isEnabled();consume(e);if(!cancel)collect(e);
  const current=drag;clearPreview();drag=null;suppressUntil=performance.now()+500;
  if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);
  if(!cancel&&canvas.graph===current.graph)applyLinkGesture(canvas,current.mode,current.hits);
 };
 listen('pointerup',e=>finish(e),true);
 listen('pointercancel',e=>finish(e,true),true);
 // Suppress compatibility mouse events and Comfy's right-click menu only for
 // this gesture. Normal right-click, panning and widget interactions stay native.
 for(const type of ['mousedown','mousemove','mouseup','contextmenu'])listen(type,e=>{
  if((drag||performance.now()<suppressUntil)&&e.target===el)consume(e);
 },true);
 listen('keydown',e=>{
  if(e.key==='Escape'&&drag){const id=drag.id;clearPreview();drag=null;suppressUntil=performance.now()+500;if(el.hasPointerCapture(id))el.releasePointerCapture(id);consume(e);}
 },true);
 listen('blur',()=>{if(drag){const id=drag.id;clearPreview();drag=null;if(el.hasPointerCapture(id))el.releasePointerCapture(id);}});
 return ()=>{clearPreview();if(drag&&el.hasPointerCapture(drag.id))el.releasePointerCapture(drag.id);drag=null;listeners.forEach(stop=>stop());installed.delete(el);};
}

app.registerExtension({name:'Genereti.LinkGestures',setup(){installLinkGestures(app.canvas);},settings:[{
 id:LINK_GESTURES_SETTING,name:'Connection drag gestures',type:'boolean',defaultValue:true,
 category:['Genereti','Shortcuts','ConnectionGestures'],sortOrder:201,
 tooltip:'Ctrl + right-drag cuts crossed connections; Shift + right-drag adds reroutes. Start on blank canvas. Release commits one undoable edit; Escape cancels. Disable to use Comfy’s normal mouse handling.',
}]});
