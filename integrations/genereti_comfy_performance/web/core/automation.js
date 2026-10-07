export function evaluateKeys(keys,time,mode='linear'){
 if(!keys?.length)return undefined;const sorted=[...keys].sort((a,b)=>a.time-b.time);if(time<=sorted[0].time)return sorted[0].value;
 const right=sorted.findIndex(x=>x.time>time);if(right<0)return sorted.at(-1).value;const a=sorted[right-1],b=sorted[right];
 if(mode==='step'||typeof a.value!=='number'||typeof b.value!=='number')return a.value;
 return a.value+(b.value-a.value)*(time-a.time)/(b.time-a.time);
}
export function clipTime(clip,time,duration){const t=clip.timing??{},start=Number(t.start)||0,length=t.durationMode==='hold'?duration-start:Number(t.duration)||1;if(time<start||time>=start+length)return null;let local=(time-start)*(Number(t.rate)||1)+(Number(t.sourceOffset)||0);if(t.loopMode==='loop'&&clip.sourceDuration>0)local=((local%clip.sourceDuration)+clip.sourceDuration)%clip.sourceDuration;return local;}
export function evaluateAutomation(doc,time){const values=new Map(),solo=doc.tracks.some(t=>t.solo);for(const track of doc.tracks){if(track.muted||solo&&!track.solo)continue;for(const clip of doc.clips.filter(c=>c.trackId===track.id&&!c.muted).sort((a,b)=>(a.timing?.start??0)-(b.timing?.start??0))){const local=clipTime(clip,time,doc.duration);if(local===null)continue;const value=evaluateKeys(clip.keys,local,clip.interpolation);if(value!==undefined)values.set(track.id,{target:track.target,value});}}return [...values.values()];}
export function addKey(clip,time,value){const key={id:globalThis.crypto?.randomUUID?.()??String(Math.random()),time:Math.max(0,time),value};clip.keys=clip.keys.filter(k=>Math.abs(k.time-key.time)>.025);clip.keys.push(key);clip.keys.sort((a,b)=>a.time-b.time);clip.sourceDuration=Math.max(clip.sourceDuration??0,key.time+.01);return key;}
