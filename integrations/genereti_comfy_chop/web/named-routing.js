// Resolve named audio edges within a single workflow.
export function routeAudioDefinitions(defs){
 const sends=new Map();for(const [id,d] of defs)if(d.kind==='Send'){const name=String(d.settings.name??'').trim();if(!name)continue;const ids=sends.get(name)??[];ids.push(id);sends.set(name,ids);}
 for(const [,d] of defs)if(d.kind==='Receive'){const name=String(d.settings.name??'').trim(),ids=sends.get(name)??[];d.routeError=!name?'Enter a route name':ids.length>1?`Multiple audio senders named “${name}”`:!ids.length?`No audio sender named “${name}”`:'';if(ids.length===1&&name)d.inputs.input=ids[0];}
 return defs;
}
