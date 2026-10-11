// Portable perception-v1 semantics; adapters do not depend on Comfy or DOM.
export class LatestFrame {
 constructor(){this.revision=0;this.inflight=null;this.pending=null;this.serial=0;}
 reset(){this.revision++;this.pending=null;}
 offer(meta){this.pending={...meta,revision:this.revision};}
 take(){if(this.inflight||!this.pending)return null;const next={...this.pending,id:++this.serial};this.pending=null;return this.inflight=next;}
 finish(id,revision){if(this.inflight?.id!==id)return false;this.inflight=null;return revision===this.revision;}
}
export class StreamRegistry {
 constructor(now=()=>performance.now()){this.now=now;this.entries=new Map();this.listeners=new Set();}
 claim(name,owner){name=String(name).trim();if(!name||name.length>80)throw Error('Choose a stream name of 1–80 characters');const e=this.entries.get(name);if(e&&e.owner!==owner)throw Error('Stream name already in use: '+name);if(!e&&this.entries.size>=16)throw Error('At most 16 global perception streams');if(!e)this.entries.set(name,{owner,result:null,state:'stopped'});return name;}
 update(name,owner,result,state='running'){const e=this.entries.get(name);if(e?.owner!==owner)return;Object.assign(e,{result,state});this.emit(name);}
 remove(name,owner){if(this.entries.get(name)?.owner===owner){this.entries.delete(name);this.emit(name);}}
 emit(name){for(const fn of this.listeners){try{fn(name);}catch(error){console.error(error);}}}
 list(){return [...this.entries].map(([name,e])=>({name,state:e.state,task:e.result?.task??null}));}
 read(name,maxAge=500){const e=this.entries.get(name),r=e?.result;if(!r||e.state!=='running')return null;const age=Math.max(0,this.now()-r.source.frame_timestamp_ms);return age<=maxAge?{...r,age_ms:age}:null;}
 subscribe(fn){this.listeners.add(fn);return ()=>this.listeners.delete(fn);}
}
export function resultFor(meta,task,features,timings,now){return {version:1,task,source:{id:meta.nodeId,output_slot:meta.outputSlot??0,revision:meta.revision,width:meta.width,height:meta.height,frame_timestamp_ms:meta.producedAt},coordinates:{origin:'top-left',space:'normalized-image',x:'right',y:'down',mirrored:false},model:{id:task==='segment'?'selfie_segmenter':task+'_landmarker',version:1,runtime:'MediaPipe Tasks Vision 0.10.32',backend:'WASM CPU'},completed_at_ms:now,age_ms:Math.max(0,now-meta.producedAt),timings_ms:timings,features};}
export function table(result){return {rows:[['key','value'],...Object.entries(result?.features??{}).map(([k,v])=>[k,String(v)])],jsonValue:result};}
