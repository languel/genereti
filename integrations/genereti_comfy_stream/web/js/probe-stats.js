// Bounded delivery statistics. Counts source events, never UI repaint ticks.
export class ProbeStats {
 constructor(){this.reset();}
 reset(){this.times=[];this.total=0;this.delay=null;this.last=null;}
 record(now,producedAt){if(this.times.length&&now-this.times.at(-1)>2000)this.times=[];this.times.push(now);this.last=now;this.total++;this.delay=Number.isFinite(producedAt)?Math.max(0,now-producedAt):null;this.prune(now);}
 prune(now){while(this.times.length&&this.times[0]<now-2000)this.times.shift();if(this.times.length>4096)this.times.splice(0,this.times.length-4096);}
 read(now){this.prune(now);const gaps=this.times.slice(1).map((t,i)=>t-this.times[i]);const mean=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:0;return {rate:mean?1000/mean:0,interval:mean,jitter:gaps.length?Math.sqrt(gaps.reduce((a,b)=>a+(b-mean)**2,0)/gaps.length):0,total:this.total,age:this.last===null?null:now-this.last,delay:this.delay};}
}
