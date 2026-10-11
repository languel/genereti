import {fromJSON} from './tables.js';
export function jsonEntries(data){
 const value=Object.hasOwn(data,'jsonValue')?data.jsonValue:data.rows;
 if(Array.isArray(value))return value.map((value,index)=>({index,row:(Array.isArray(value)?value:[value]).map(v=>typeof v==='string'?v:JSON.stringify(v)),value}));
 if(value!==null&&typeof value==='object')return Object.entries(value).map(([key,value],index)=>({index,key,value,row:[key,typeof value==='string'?value:JSON.stringify(value)]}));
 return [{index:0,value,row:[JSON.stringify(value)]}];
}
export function selectedIndices(text){if(!String(text).trim())return null;return new Set(String(text).trim().split(/[\s,]+/).map(v=>{if(!/^\d+$/.test(v))throw Error('Selection must contain zero-based row indices');return Number(v);}));}
export function matchingEntries(data,filter=''){const q=String(filter).toLocaleLowerCase();return jsonEntries(data).filter(e=>e.row.some(v=>String(v).toLocaleLowerCase().includes(q)));}
export function selectJSON(data,filter='',selection=''){
 if(!String(filter)&&!String(selection).trim())return data;
 const selected=selectedIndices(selection),entries=matchingEntries(data,filter).filter(e=>!selected||selected.has(e.index));
 if(!Object.hasOwn(data,'jsonValue'))return {rows:entries.map(e=>data.rows[e.index])};
 const v=data.jsonValue;let result;
 if(Array.isArray(v))result=entries.map(e=>e.value);
 else if(v!==null&&typeof v==='object')result=Object.fromEntries(entries.map(e=>[e.key,e.value]));
 else result=entries.length?v:null;
 return fromJSON(JSON.stringify(result));
}
