// Delivery cadence is distinct from GPU execution, audio deadlines and Queue time.
export class FrameMonitor {
 constructor({windowMs=5000,maxSamples=600}={}){this.windowMs=windowMs;this.maxSamples=maxSamples;this.reset();}
 reset(){this.frames=[];this.sources=new Map();this.tasks=[];this.work=new Map();this.previous=0;}
 frame(now){if(this.previous&&now>this.previous)this.frames.push({at:now,ms:now-this.previous});this.previous=now;this.trim(this.frames,now);}
 trim(samples,now){while(samples.length&&(samples[0].at<now-this.windowMs||samples.length>this.maxSamples))samples.shift();}
 source(id,now){let samples=this.sources.get(id);if(!samples){if(this.sources.size>=256)this.sources.delete(this.sources.keys().next().value);this.sources.set(id,samples=[]);}samples.push({at:now});this.trim(samples,now);}
 task(at,ms){this.tasks.push({at,ms});this.trim(this.tasks,at);}
 duration(name,at,ms){let samples=this.work.get(name);if(!samples)this.work.set(name,samples=[]);samples.push({at,ms});this.trim(samples,at);}
 read(now){this.trim(this.frames,now);this.trim(this.tasks,now);const dt=this.frames.map(x=>x.ms).sort((a,b)=>a-b),mean=dt.length?dt.reduce((a,b)=>a+b,0)/dt.length:0;const sources=[];for(const [id,samples]of this.sources){this.trim(samples,now);if(samples.length<2)continue;const duration=samples.at(-1).at-samples[0].at;sources.push({id,fps:duration>0?(samples.length-1)*1000/duration:0,frames:samples.length});}return {windowMs:this.windowMs,samples:dt.length,fps:mean?1000/mean:0,meanMs:mean,p95Ms:dt.length?dt[Math.min(dt.length-1,Math.floor(dt.length*.95))]:0,worstMs:dt.at(-1)??0,slowFrames:dt.filter(x=>x>50).length,longTasks:this.tasks.length,longTaskMs:this.tasks.reduce((n,x)=>n+x.ms,0),sources,work:Object.fromEntries([...this.work].map(([name,samples])=>{this.trim(samples,now);return [name,{samples:samples.length,meanMs:samples.length?samples.reduce((n,x)=>n+x.ms,0)/samples.length:0,worstMs:Math.max(0,...samples.map(x=>x.ms))}];}))};}
}
