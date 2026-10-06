// A reference is a temporal edge, never an IMAGE wire in Comfy's queue graph.
export function referenceFor(node,outputSlot=0){
 node.properties??={};node.properties.generetiLessonRef??=crypto.randomUUID();
 // Comfy copy/paste duplicates properties. Keep the earlier instance's address
 // and give a later copy its own identity instead of aliasing two outputs.
 let graph;try{graph=node.graph;}catch{}
 const first=graph?._nodes?.find(n=>n.properties?.generetiLessonRef===node.properties.generetiLessonRef);
 if(first&&first!==node)node.properties.generetiLessonRef=crypto.randomUUID();
 return JSON.stringify({ref:node.properties.generetiLessonRef,outputSlot});
}
export function resolveReference(graph,value){
 if(typeof value!=='string'||!value.trim())return null;
 const nodes=graph?._nodes??[];let target,slot=0;
 try{
  const parsed=JSON.parse(value);
  if(!parsed||typeof parsed.ref!=='string')return null;
  const matches=nodes.filter(n=>n.properties?.generetiLessonRef===parsed.ref);if(matches.length!==1)return null;
  target=matches[0];slot=parsed.outputSlot??0;
 }catch{
  const text=value.trim();
  if(text.startsWith('#'))target=nodes.find(n=>String(n.id)===text.slice(1));
  else if(text.startsWith('@')){const matches=nodes.filter(n=>n.properties?.generetiLessonRef===text.slice(1));if(matches.length===1)target=matches[0];}
  else {const matches=nodes.filter(n=>n.title===text);if(matches.length===1)target=matches[0];}
 }
 if(!Number.isInteger(slot)||slot<0||target?.outputs?.[slot]?.type!=='IMAGE')return null;
 return target?{node:target,outputSlot:slot}:null;
}

// Double buffering protects the sampled frame from producers which overwrite
// their borrowed output texture later in the same graph tick.
export class FrameLatch {
 current=null;pending=null;index=0;
 capture(copy){this.pending=copy(1-this.index);}
 commit(){if(!this.pending)return false;this.current=this.pending;this.pending=null;this.index=1-this.index;return true;}
 reset(){this.current=this.pending=null;this.index=0;}
}
