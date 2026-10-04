import {parseExpression,evaluateExpression} from '/extensions/genereti_comfy_texture/expression.js';
const trees=new Map();
export function expression(source){if(!trees.has(source)){const tree=parseExpression(source);trees.set(source,tree);if(trees.size>128)trees.delete(trees.keys().next().value);}return trees.get(source);}
export const first=data=>Object.values(data?.channels??{})[0]?.at(-1)??0;
export function patternMatch(name,patterns){return patterns.trim().split(/\s+/).some(p=>new RegExp('^'+p.replace(/[.+^${}()|[\]\\]/g,'\\$&').replaceAll('*','.*').replaceAll('?','.')+'$').test(name));}
export function generate(kind,v,start){
 const n=Number(v.samples??1),rate=Number(v.sample_rate??60),channels={};
 for(let c=0;c<Number(v.channels??1);c++){
  const out=new Float32Array(n);
  for(let i=0;i<n;i++){
   const t=start+i/rate,phase=t*Number(v.frequency??1)+Number(v.phase??0),f=phase-Math.floor(phase);let x=0;
   if(kind==='Constant')x=Number(v.value??1);
   else if(kind==='Noise'){const r=Math.sin((i+Math.floor(start*rate)+c*131+Number(v.seed??0))*12.9898)*43758.5453;x=(r-Math.floor(r))*2-1;}
   else if(kind==='Expression')x=evaluateExpression(expression(v.expression),{t,i,x:i/Math.max(1,n-1),y:0,c,v:0,a:0,b:0,w:n,h:Number(v.channels)});
   else x={sine:()=>Math.sin(phase*Math.PI*2),triangle:()=>1-4*Math.abs(f-.5),saw:()=>f*2-1,square:()=>f<.5?1:-1,ramp:()=>f}[v.wave]();
   if(kind==='Oscillator'||kind==='Noise')x=x*Number(v.amplitude)+Number(v.offset);
   out[i]=Number.isFinite(x)?x:0;
  }
  channels['chan'+c]=out;
 }
 return {channels,sampleRate:rate,start};
}
export function process(kind,data,v,memory={},other){
 const channels={},rate=data.sampleRate,n=Object.values(data.channels)[0]?.length??1;
 if(kind==='Select'){for(const [name,values]of Object.entries(data.channels))if(patternMatch(name,v.pattern))channels[name]=values;}
 if(kind==='Merge'){
  Object.assign(channels,data.channels);
  for(const [key,values]of Object.entries(other?.channels??{})){let name=key;while(name in channels)name+='_';channels[name]=Float32Array.from({length:n},(_,i)=>(()=>{const x=i*(values.length-1)/Math.max(1,n-1),lo=Math.floor(x),hi=Math.min(values.length-1,lo+1);return values[lo]+(values[hi]-values[lo])*(x-lo);})());}
 }else if(kind!=='Select')for(const [c,[name,values]]of Object.entries(Object.entries(data.channels))){
  const out=new Float32Array(values.length);let prev=memory[name]??values[0],acc=memory[name]??0;
  for(let i=0;i<out.length;i++){
   const x=values[i];let y=x;
   if(kind==='Expression')y=evaluateExpression(expression(v.expression),{t:data.start+i/rate,i,x:i/Math.max(1,n-1),y:0,c:Number(c),v:x,a:x,b:0,w:n,h:Object.keys(data.channels).length});
   if(kind==='Math')y={multiply:()=>x*Number(v.value),add:()=>x+Number(v.value),subtract:()=>x-Number(v.value),divide:()=>x/(Math.abs(v.value)>1e-9?v.value:1e-9),abs:()=>Math.abs(x),clamp:()=>Math.max(v.low,Math.min(v.high,x)),fit:()=>Number(v.low)+(x+1)*.5*(v.high-v.low)}[v.operation]();
   if(kind==='Logic')y=x>=Number(v.threshold)?1:0;
   if(kind==='Lag'){prev+=(x-prev)*(1-Math.exp(-1/(rate*Math.max(.00001,Number(v.seconds)))));y=prev;}
   if(kind==='Speed'){acc+=x/rate;y=acc;}
   if(kind==='Slope'){y=(x-prev)*rate;prev=x;}
   out[i]=Number.isFinite(y)?y:0;
  }
  if(kind==='Lag'||kind==='Slope')memory[name]=prev;if(kind==='Speed')memory[name]=acc;
  channels[name]=out;
 }
 return {channels,sampleRate:rate,start:data.start};
}
