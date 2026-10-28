import {app} from '../../../../scripts/app.js';
import {crossedLinks,applyLinkGesture,cableTies,tieBounds,tieAt,createCableTie,removeCableTie} from './link-gesture-core.js';

const installed=new WeakSet();
export const LINK_GESTURES_SETTING='Genereti.Shortcuts.ConnectionGestures';
export function installLinkGestures(canvas,{isEnabled=()=>app.ui.settings.getSettingValue(LINK_GESTURES_SETTING,true)}={}){
 const el=canvas?.canvas;if(!el||installed.has(el))return;
 installed.add(el);let drag=null,suppressUntil=0;
 const linksHidden=()=>canvas.links_render_mode===(globalThis.LiteGraph?.HIDDEN_LINK??-1);
 const oldDraw=canvas.onDrawForeground;
 const drawTies=function(ctx,...args){oldDraw?.call(this,ctx,...args);if(!isEnabled()||linksHidden())return;ctx.save();try{ctx.lineCap='round';ctx.lineWidth=4/Math.max(.3,canvas.ds?.scale??1);ctx.strokeStyle='#dcebf1';for(const tie of cableTies(canvas.graph)){const b=tieBounds(canvas.graph,tie);if(!b)continue;ctx.beginPath();ctx.moveTo(b.x,b.top-6);ctx.lineTo(b.x,b.bottom+6);ctx.stroke();}}finally{ctx.restore();}};
 canvas.onDrawForeground=drawTies;
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
  for(const [key,value] of Object.entries({fill:'none',stroke:drag.mode==='tie'?'#8ad8ed':'#ff6262','stroke-width':'2','stroke-dasharray':'7 5','stroke-linecap':'round','stroke-linejoin':'round'}))line.setAttribute(key,value);
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
   if(drag.mode==='cut'||drag.mode==='tie')for(const id of hit.ids){
    const link=drag.graph.links.get(id);
    if(link&&!drag.highlights.has(link)){drag.highlights.set(link,link.color);link.color=drag.mode==='tie'?'#8ad8ed':'#ff6262';canvas.setDirty(true,true);}
   }
  }
  drag.last=pos;
 };
 listen('pointerdown',e=>{
  if(!isEnabled()||e.target!==el||e.altKey)return;
  const pos=position(e),tie=linksHidden()?null:tieAt(canvas.graph,pos,canvas.ds?.scale??1);
  if(e.button===0&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&tie){consume(e);el.focus({preventScroll:true});const b=tieBounds(canvas.graph,tie);canvas.emitBeforeChange();drag={id:e.pointerId,graph:canvas.graph,mode:'move-tie',last:pos,tie,origins:b.nodes.map(n=>[n,[...n.pos]]),start:pos,highlights:new Map()};el.setPointerCapture(e.pointerId);return;}
  if(e.button!==2||(!e.ctrlKey&&!e.shiftKey&&!e.metaKey))return;
  if(e.metaKey&&!e.ctrlKey&&!e.shiftKey&&tie){consume(e);removeCableTie(canvas,tie);suppressUntil=performance.now()+500;return;}
  consume(e);
  el.focus({preventScroll:true});
  drag={id:e.pointerId,graph:canvas.graph,mode:e.metaKey?'tie':e.ctrlKey?'cut':'reroute',last:position(e),hits:[],seen:new Set(),highlights:new Map()};
  if(drag.mode==='cut'||drag.mode==='tie')startTrail(e);
  el.setPointerCapture(e.pointerId);
 },true);
 listen('pointermove',e=>{if(drag&&e.pointerId===drag.id){if(!isEnabled()){finish(e,true);return;}consume(e);if(drag.mode==='move-tie'){const p=position(e),dx=p[0]-drag.start[0],dy=p[1]-drag.start[1];for(const [r,origin] of drag.origins)r.pos=[origin[0]+dx,origin[1]+dy];canvas.setDirty(true,true);}else collect(e);}},true);
 const finish=(e,cancel=false)=>{
  if(!drag||e.pointerId!==drag.id)return;
  cancel=cancel||!isEnabled();consume(e);if(!cancel&&drag.mode!=='move-tie')collect(e);
  const current=drag;clearPreview();drag=null;suppressUntil=performance.now()+500;
  if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);
  if(current.mode==='move-tie'){if(cancel)for(const [r,p] of current.origins)r.pos=p;canvas.emitAfterChange();canvas.setDirty(true,true);}else if(!cancel&&canvas.graph===current.graph){if(current.mode==='tie')createCableTie(canvas,current.hits);else applyLinkGesture(canvas,current.mode,current.hits);}
 };
 listen('pointerup',e=>finish(e),true);
 listen('pointercancel',e=>finish(e,true),true);
 // Suppress compatibility mouse events and Comfy's right-click menu only for
 // this gesture. Normal right-click, panning and widget interactions stay native.
 for(const type of ['mousedown','mousemove','mouseup','contextmenu'])listen(type,e=>{
  if((drag||performance.now()<suppressUntil)&&e.target===el)consume(e);
 },true);
 listen('keydown',e=>{
  if(e.key==='Escape'&&drag){const id=drag.id;if(drag.mode==='move-tie'){for(const [r,p] of drag.origins)r.pos=p;canvas.emitAfterChange();}clearPreview();drag=null;suppressUntil=performance.now()+500;if(el.hasPointerCapture(id))el.releasePointerCapture(id);consume(e);}
 },true);
 listen('blur',()=>{if(drag){const id=drag.id;if(drag.mode==='move-tie'){for(const [r,p] of drag.origins)r.pos=p;canvas.emitAfterChange();}clearPreview();drag=null;if(el.hasPointerCapture(id))el.releasePointerCapture(id);}});
 return ()=>{if(drag?.mode==='move-tie'){for(const [r,p] of drag.origins)r.pos=p;canvas.emitAfterChange();}if(canvas.onDrawForeground===drawTies)canvas.onDrawForeground=oldDraw;clearPreview();if(drag&&el.hasPointerCapture(drag.id))el.releasePointerCapture(drag.id);drag=null;listeners.forEach(stop=>stop());installed.delete(el);};
}

app.registerExtension({name:'Genereti.LinkGestures',setup(){installLinkGestures(app.canvas);},settings:[{
 id:LINK_GESTURES_SETTING,name:'Connection drag gestures',type:'boolean',defaultValue:true,
 category:['Genereti','Shortcuts','ConnectionGestures'],sortOrder:201,
 tooltip:'Ctrl + right-drag cuts crossed connections; Shift + right-drag adds reroutes; Cmd + right-drag ties crossed cables. Drag a tie to move it; Cmd + right-click it to untie. Start on blank canvas. Release commits one undoable edit; Escape cancels. Disable to use Comfy’s normal mouse handling.',
}]});
