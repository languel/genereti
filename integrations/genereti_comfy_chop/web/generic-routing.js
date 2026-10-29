// Resolution is deliberately graph-local and guarded against hidden cycles.
export const isFlow=n=>n?.comfyClass?.startsWith('GeneretiFlow');
export const flowKind=n=>n?.comfyClass?.slice('GeneretiFlow'.length);
export const widget=(n,name,fallback)=>n?.widgets?.find(w=>w.name===name)?.value??fallback;
export function flowLink(n,name){const i=n?.inputs?.findIndex(x=>x.name===name||x.name===`sources.${name}`)??-1;if(i<0)return null;const link=n.getInputLink?.(i)??n.graph?.links?.[n.inputs[i].link];const node=n.graph?.getNodeById(link?.origin_id);return node?{node,slot:link.origin_slot??0}:null;}
export function flowSender(n){const key=String(widget(n,'name','')).trim(),senders=(n?.graph?._nodes??[]).filter(x=>x.comfyClass==='GeneretiFlowSend'&&String(widget(x,'name','')).trim()===key);return key&&senders.length===1?senders[0]:null;}
export function flowParents(n,slot=0){const kind=flowKind(n);if(kind==='Receive'){const s=flowSender(n);return s?[{node:s,slot:0}]:[];}if(kind==='Route'&&slot!==Math.max(0,Math.min(63,Number(widget(n,'index',0)))))return [];if(kind==='Send'||kind==='Route')return [flowLink(n,'input')].filter(Boolean);if(kind==='Select')return [flowLink(n,`input_${Math.max(0,Math.min(63,Number(widget(n,'index',0))))}`)].filter(Boolean);if(kind==='Merge')return (n.inputs??[]).filter(x=>/^(?:sources\.)?input_\d+$/.test(x.name)&&x.link!=null).sort((a,b)=>Number(a.name.split('input_').at(-1))-Number(b.name.split('input_').at(-1))).map(x=>flowLink(n,x.name)).filter(Boolean);return [];}
export function flowLeaves(node,slot=0,seen=new Set()){const key=`${node?.id}:${slot}`;if(!node||seen.has(key))return [];if(!isFlow(node))return [{node,slot}];const next=new Set(seen);next.add(key);return flowParents(node,slot).flatMap(p=>flowLeaves(p.node,p.slot,next));}
export function genericValue(node,slot=0,seen=new Set()){
 if(!node)return undefined;const key=`${node.id}:${slot}`;if(seen.has(key))return undefined;if(!isFlow(node))return node._generetiLiveValue?.(slot)??node._generetiChop?.latest??node._generetiDatSignal?.()??node.widgets?.find(w=>w.name==='value')?.value;
 const next=new Set(seen);next.add(key);const parents=flowParents(node,slot),values=parents.map(p=>genericValue(p.node,p.slot,next)).filter(v=>v!==undefined&&v!==null);if(!values.length)return undefined;if(flowKind(node)!=='Merge'||values.length===1)return values[0];
 if(values.every(v=>typeof v==='number'))return values.reduce((a,b)=>a+b,0);
 if(values.every(v=>v?.channels)){let base=values[0],channels={...base.channels};for(const v of values.slice(1))for(const [k,data] of Object.entries(v.channels)){let name=k;while(name in channels)name+='_';const n=Object.values(base.channels)[0]?.length??1;channels[name]=Float32Array.from({length:n},(_,i)=>{const x=i*(data.length-1)/Math.max(1,n-1),lo=Math.floor(x),hi=Math.min(data.length-1,lo+1);return data[lo]+(data[hi]-data[lo])*(x-lo);});}return {...base,channels};}
 return undefined;
}
