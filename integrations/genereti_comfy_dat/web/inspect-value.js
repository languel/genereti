export function describe(value,limit=32,depth=0,seen=new Set()){
 if(depth>8)return '[depth limit]';
 if(value==null||typeof value==='boolean')return value??null;
 if(typeof value==='number')return Number.isFinite(value)?value:String(value);
 if(typeof value==='string')return value.slice(0,2000)+(value.length>2000?'…':'');
 if(typeof value!=='object')return `[${typeof value}]`;
 if(seen.has(value))return '[circular]';seen.add(value);
 let result;
 if(ArrayBuffer.isView(value))result={samples:Array.from(value.subarray?.(0,limit)??[]),length:value.length??value.byteLength,dtype:value.constructor.name};
 else if(Array.isArray(value)){result=value.slice(0,limit).map(v=>describe(v,limit,depth+1,seen));if(value.length>limit)result.push(`… ${value.length-limit} more items`);}
 else {const entries=Object.entries(value);result=Object.fromEntries(entries.slice(0,limit).map(([k,v])=>[k,describe(v,limit,depth+1,seen)]));if(entries.length>limit)result['…']=`${entries.length-limit} more keys`;}
 seen.delete(value);return result;
}
export function display(value,format='json',limit=32){const summary=describe(value,limit);return format==='text'&&typeof summary==='string'?summary:JSON.stringify(summary,null,2);}
