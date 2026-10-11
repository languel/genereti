export function switchPair(index,mode,count){
 if(!count)throw Error('Connect at least one switch source');
 let x=Number(index);if(!Number.isFinite(x))throw Error('Switch index must be finite');
 x=Math.max(0,Math.min(count-1,x));const a=Math.floor(x);return [a,Math.min(a+1,count-1),mode==='float'?x-a:0];
}
export function sourceSlots(node){return (node.inputs??[]).filter(i=>/^(?:sources\.)?source\d+$/.test(i.name)&&i.link!=null).sort((a,b)=>Number(a.name.split('source').at(-1))-Number(b.name.split('source').at(-1)));}
export function interpolateData(a,b,t){
 if(t===0)return a;if(t===1)return b;
 if(typeof a==='number'&&typeof b==='number'&&Number.isFinite(a)&&Number.isFinite(b))return a+(b-a)*t;
 if(Array.isArray(a)&&Array.isArray(b)&&a.length===b.length)return a.map((v,i)=>interpolateData(v,b[i],t));
 if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){const near=t<.5?a:b;return Object.fromEntries(Object.keys(near).map(k=>[k,Object.hasOwn(a,k)&&Object.hasOwn(b,k)?interpolateData(a[k],b[k],t):near[k]]));}
 return t<.5?a:b;
}
export function switchChop(sources,index,mode){
 const [i,j,t]=switchPair(index,mode,sources.length),a=sources[i],b=sources[j];if(!t)return a;
 const channels={},n=Object.values(a.channels)[0]?.length??1;
 for(const [name,x] of Object.entries(a.channels)){const y=b.channels[name];if(!y)throw Error('CHOP switch requires matching channel names');channels[name]=Float32Array.from(x,(v,k)=>{const p=k*(y.length-1)/Math.max(1,n-1),lo=Math.floor(p),hi=Math.min(lo+1,y.length-1);return v*(1-t)+(y[lo]+(y[hi]-y[lo])*(p-lo))*t;});}
 if(Object.keys(a.channels).length!==Object.keys(b.channels).length)throw Error('CHOP switch requires matching channel names');
 return {...a,channels};
}
