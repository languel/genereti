import {validateBox} from './measures.js';
export function parseRegions(value){const doc=typeof value==='string'?JSON.parse(value):structuredClone(value);if(!doc||doc.version!==1||!Array.isArray(doc.boxes)||doc.boxes.length>64)throw Error('Expected version 1 with up to 64 boxes');const names=new Set();for(const b of doc.boxes){if(typeof b.name!=='string'||!/^[A-Za-z][\w.-]{0,79}$/.test(b.name)||names.has(b.name))throw Error('Use unique region names');names.add(b.name);validateBox(b.box);}return doc;}
export class RegionRegistry {
 constructor(){this.entries=new Map();}
 claim(name,owner){if(typeof name!=='string'||!/^[A-Za-z][\w.-]{0,79}$/.test(name))throw Error('Choose a region set name');const entry=this.entries.get(name);if(entry&&entry.owner!==owner)throw Error('Region set name already in use: '+name);if(!entry&&this.entries.size>=16)throw Error('At most 16 region sets');if(!entry)this.entries.set(name,{owner,doc:{version:1,boxes:[]}});return name;}
 update(name,owner,doc){if(this.entries.get(name)?.owner===owner)this.entries.get(name).doc=parseRegions(doc);}
 remove(name,owner){if(this.entries.get(name)?.owner===owner)this.entries.delete(name);}
 read(path){if(typeof path!=='string')return null;const at=path.indexOf('::');if(at<0)return null;const e=this.entries.get(path.slice(0,at));return e?.doc.boxes.find(b=>b.name===path.slice(at+2))?.box??null;}
 list(){return [...this.entries].flatMap(([name,e])=>e.doc.boxes.map(b=>name+'::'+b.name));}
}
