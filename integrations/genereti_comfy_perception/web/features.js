// Original adapter over perception-v1 numeric paths; no app-specific ontology.
export function pointsFor(result,minConfidence=.4){
 const f=result?.features??{};
 return Object.keys(f).filter(k=>k.endsWith('.x')).flatMap(k=>{
  const name=k.slice(0,-2),x=f[k],y=f[name+'.y'],confidence=Math.min(f[name+'.visibility']??1,f[name+'.presence']??1);
  return Number.isFinite(x)&&Number.isFinite(y)&&confidence>=minConfidence?[{name,x,y,confidence}]:[];
 });
}
export function selectedFeatures(result,names,minConfidence=.4){
 const points=pointsFor(result,minConfidence),available=new Set(points.map(p=>p.name)),features={};
 for(const name of names)for(const [key,value] of Object.entries(result?.features??{}))if((available.has(name)&&key.startsWith(name+'.')||key===name&&(!/[.](x|y|z|visibility|presence)$/.test(name)||available.has(name.slice(0,name.lastIndexOf('.')))))&&Number.isFinite(value))features[key]=value;
 const p=points.find(p=>p.name===names[0]);if(p)Object.assign(features,{'pointer.x':p.x,'pointer.y':p.y,'pointer.confidence':p.confidence});
 return features;
}
export function nearestPoint(points,x,y,width,height,radius=14){let found=null,best=radius;for(const p of points){const d=Math.hypot((p.x-x)*width,(p.y-y)*height);if(d<best){best=d;found=p;}}return found;}
export class StrokeGate {
 constructor(){this.last=null;this.key='';}
 step(result,point,enabled=true){
  const source=result?.source,key=source?JSON.stringify([source.id,source.output_slot,source.revision,source.width,source.height]):'';
  if(!enabled||!point||!source){this.last=null;this.key=key;return null;}
  if(key!==this.key){this.last=null;this.key=key;}
  if(this.last?.timestamp===source.frame_timestamp_ms)return null;
  const next={x:point.x,y:point.y,timestamp:source.frame_timestamp_ms},line=this.last&&Math.hypot(next.x-this.last.x,next.y-this.last.y)<.3?[this.last,next]:null;this.last=next;return line;
 }
}
