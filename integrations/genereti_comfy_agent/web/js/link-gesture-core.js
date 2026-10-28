// Use native rendered Path2D segments, including shared reroute trunks.
export function crossedLinks(canvas,from,to){
 const ctx=canvas.ctx,graph=canvas.graph,hits=[];
 if(!ctx||!graph)return hits;
 const distance=Math.hypot(to[0]-from[0],to[1]-from[1]);
 const steps=Math.max(1,Math.ceil(distance*Math.max(canvas.ds?.scale??1,.01)/3));
 ctx.save();
 try{
  ctx.setTransform(1,0,0,1,0,0);ctx.lineWidth=6/Math.max(canvas.ds?.scale??1,.01);
  for(const item of canvas.renderedPaths??[]){
   if(!item.path)continue;
   for(let i=0;i<=steps;i++){
    const f=i/steps,pos=[from[0]+(to[0]-from[0])*f,from[1]+(to[1]-from[1])*f];
    if(!ctx.isPointInStroke(item.path,...pos))continue;
    const ids=item.linkIds?[...item.linkIds]:[item.id];
    const links=ids.map(id=>graph.links.get(id)).filter(Boolean);
    if(links.length)hits.push({item,pos,ids:links.map(l=>l.id)});
    break;
   }
  }
 }finally{ctx.restore();}
 return hits;
}

export function applyLinkGesture(canvas,mode,hits){
 const graph=canvas.graph;if(!graph||!hits.length)return 0;
 let count=0;const handled=new Set();
 canvas.emitBeforeChange();
 try{
  for(const hit of hits){
   const ids=hit.ids.filter(id=>graph.links.has(id)&&!handled.has(id));
   if(!ids.length)continue;
   if(mode==='cut')for(const id of ids){graph.removeLink(id);handled.add(id);count++;}
   else if(mode==='reroute'){
    // createReroute expects the native segment (LLink or Reroute), preserving
    // existing reroute parents and all branches sharing that segment.
    if(graph.createReroute(hit.pos,hit.item)){ids.forEach(id=>handled.add(id));count++;}
   }
  }
 }finally{canvas.emitAfterChange();canvas.setDirty(true,true);}
 return count;
}

// A tie groups separate native reroutes; it never merges links or their types.
const TIE_KEY='generetiCableTies';
export function cableTies(graph){return Array.isArray(graph?.extra?.[TIE_KEY])?graph.extra[TIE_KEY]:[];}
export function tieReroutes(graph,tie){return (tie.reroutes??[]).map(id=>graph.reroutes?.get(id)).filter(Boolean);}
export function tieBounds(graph,tie){const nodes=tieReroutes(graph,tie);if(nodes.length<2)return null;const xs=nodes.map(n=>n.pos[0]),ys=nodes.map(n=>n.pos[1]);return {x:xs.reduce((a,b)=>a+b,0)/xs.length,top:Math.min(...ys),bottom:Math.max(...ys),nodes};}
export function tieAt(graph,pos,scale=1){const tolerance=10/Math.max(.1,scale);return [...cableTies(graph)].reverse().find(t=>{const b=tieBounds(graph,t);return b&&Math.abs(pos[0]-b.x)<=tolerance&&pos[1]>=b.top-tolerance&&pos[1]<=b.bottom+tolerance;});}
export function createCableTie(canvas,hits){
 const graph=canvas.graph;if(!graph)return null;const unique=[],seen=new Set();
 for(const hit of hits){const ids=hit.ids.filter(id=>graph.links.has(id)&&!seen.has(id));if(!ids.length)continue;ids.forEach(id=>seen.add(id));unique.push(hit);}
 if(unique.length<2)return null;
 const x=unique.reduce((a,h)=>a+h.pos[0],0)/unique.length,y=unique.reduce((a,h)=>a+h.pos[1],0)/unique.length,ordered=[...unique].sort((a,b)=>a.pos[1]-b.pos[1]),reroutes=[];
 canvas.emitBeforeChange();try{
  ordered.forEach((hit,i)=>{const route=graph.createReroute([x,y+(i-(ordered.length-1)/2)*18],hit.item);if(route)reroutes.push(route.id);});
  if(reroutes.length<2){for(const id of reroutes)graph.removeReroute(id);return null;}
  const tie={id:globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`,reroutes};graph.extra??={};graph.extra[TIE_KEY]=[...cableTies(graph),tie];return tie;
 }finally{canvas.emitAfterChange();canvas.setDirty(true,true);}
}
export function removeCableTie(canvas,tie){const graph=canvas.graph;if(!graph)return;canvas.emitBeforeChange();try{for(const reroute of tieReroutes(graph,tie))graph.removeReroute(reroute.id);graph.extra[TIE_KEY]=cableTies(graph).filter(t=>t!==tie);}finally{canvas.emitAfterChange();canvas.setDirty(true,true);}}
