// Pure, deterministic timing and gesture math shared by live controls and tests.
export const intervals=['free','4m','2m','1m','1n','2nd','2n','2nt','4nd','4n','4nt','8nd','8n','8nt','16nd','16n','16nt','32n','64n'];
export function quarterNotes(interval,signature={numerator:4,denominator:4}){
 const bar=/^(\d+)m$/.exec(interval);if(bar)return +bar[1]*signature.numerator*4/signature.denominator;
 const note=/^(\d+)n([dt]?)$/.exec(interval);if(!note)throw Error('Choose a musical interval');return 4/+note[1]*(note[2]==='d'?1.5:note[2]==='t'?2/3:1);
}
const fract=x=>x-Math.floor(x),random=(n,seed)=>fract(Math.sin(n*12.9898+seed*78.233)*43758.5453);
export function wave(shape,phase,seed=0){const p=fract(phase);switch(shape){case 'triangle':return 1-Math.abs(p*2-1);case 'saw':return p;case 'reverse saw':return 1-p;case 'square':return p<.5?1:0;case 'sample & hold':return random(Math.floor(phase),seed);case 'smooth noise':{const a=random(Math.floor(phase),seed),b=random(Math.floor(phase)+1,seed),k=p*p*(3-2*p);return a+(b-a)*k;}default:return .5-.5*Math.cos(p*Math.PI*2);}}
export function smooth(previous,target,dt,seconds){return previous===undefined||seconds<=0?target:previous+(target-previous)*(1-Math.exp(-Math.max(0,dt)/seconds));}
export function validateGesture(value){
 const clip=typeof value==='string'?JSON.parse(value):value;
 if(!clip||clip.version!==1||!Number.isFinite(clip.duration)||clip.duration<=0||clip.duration>600||!Array.isArray(clip.points)||clip.points.length>8192)throw Error('Invalid gesture recording');
 let last=-1;for(const p of clip.points){if(![p.t,p.x,p.y].every(Number.isFinite)||p.t<last||p.t<0||p.t>clip.duration||p.x<0||p.x>1||p.y<0||p.y>1)throw Error('Invalid gesture point');last=p.t;}return clip;
}
export function gestureAt(clip,phase,loop=true){
 const points=clip.points;if(!points.length)return [.5,.5];const t=(loop?fract(phase):Math.max(0,Math.min(1,phase)))*clip.duration;
 let lo=0,hi=points.length-1;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(points[mid].t<t)lo=mid+1;else hi=mid;}
 const b=points[lo],a=points[Math.max(0,lo-1)],k=a===b?0:Math.max(0,Math.min(1,(t-a.t)/Math.max(1e-9,b.t-a.t)));
 return [a.x+(b.x-a.x)*k,a.y+(b.y-a.y)*k];
}
