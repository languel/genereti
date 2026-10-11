// Cross-task comparisons require the same unmirrored source geometry.
export function ruleStreams(doc,fallback){const names=new Set([fallback]);for(const r of doc?.rules??[])for(const s of r.steps)for(const key of s.distance??[s.feature])if(key?.includes('::'))names.add(key.split('::')[0]);return [...names].filter(Boolean);}
export function joinStreams(registry,doc,fallback,maxAge=500,maxSkew=150){
 const names=ruleStreams(doc,fallback),results=names.map(n=>registry.read(n,maxAge));if(!results.length||results.some(r=>!r))return null;
 const first=results[0],signature=r=>JSON.stringify([r.source.id,r.source.output_slot,r.source.width,r.source.height,r.coordinates]);if(results.some(r=>signature(r)!==signature(first)))return null;
 const times=results.map(r=>r.source.frame_timestamp_ms);if(Math.max(...times)-Math.min(...times)>maxSkew)return null;
 const features={...first.features};results.forEach((r,i)=>{for(const [k,v]of Object.entries(r.features))features[names[i]+'::'+k]=v;});
 return {...first,source:{...first.source,revision:JSON.stringify(results.map(r=>[r.source.revision,r.selection?.names])),frame_timestamp_ms:Math.min(...times)},features,streams:Object.fromEntries(names.map((n,i)=>[n,results[i].source]))};
}
