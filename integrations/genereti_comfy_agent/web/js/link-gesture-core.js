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
