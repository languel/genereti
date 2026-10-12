// Deterministic rules over named features. No eval, commands, or model calls.
const ops=new Set(['>','<','>=','<=']);
const number=(v,min,max,label)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error('Invalid '+label);return v;};
export function parseRules(value){
 const doc=typeof value==='string'?JSON.parse(value):value;
 if(!doc||doc.version!==1||!Array.isArray(doc.rules)||doc.rules.length>32)throw Error('Expected version 1 with up to 32 rules');
 const names=new Set();
 return {version:1,rules:doc.rules.map(r=>{
  if(typeof r.name!=='string'||!r.name.trim()||r.name.length>80||names.has(r.name))throw Error('Use unique event names (1–80 characters)');names.add(r.name);
  if(!Array.isArray(r.steps)||!r.steps.length||r.steps.length>16)throw Error('Use 1–16 steps per rule');
  return {name:r.name,within_ms:number(r.within_ms??1500,1,60000,'sequence time'),cooldown_ms:number(r.cooldown_ms??800,0,60000,'cooldown'),steps:r.steps.map(s=>{
   if(!ops.has(s.op))throw Error('Choose >, <, >= or <=');
   const out={op:s.op,value:number(s.value,-1e6,1e6,'threshold'),hold_ms:number(s.hold_ms??120,0,60000,'hold')};
   if(s.distance){if(!Array.isArray(s.distance)||s.distance.length!==2||s.distance.some(x=>typeof x!=='string'||!x||x.length>120))throw Error('Distance requires two point feature prefixes');out.distance=[...s.distance];}
   else {if(typeof s.feature!=='string'||!s.feature||s.feature.length>120)throw Error('Choose a feature');out.feature=s.feature;}
   return out;
  })};
 })};
}
export function condition(step,features,source){
 let v=features?.[step.feature];
 if(step.distance){const [a,b]=step.distance;if([a,b].some(p=>(features?.[p+'.visibility']??1)<.4||(features?.[p+'.presence']??1)<.4))return {value:null,ok:false};const pts=[features?.[a+'.x'],features?.[a+'.y'],features?.[b+'.x'],features?.[b+'.y']];if(pts.some(x=>typeof x!=='number'||!Number.isFinite(x)))return {value:null,ok:false};const ratio=source.width/source.height;v=Math.hypot((pts[0]-pts[2])*ratio,pts[1]-pts[3]);}
 if(typeof v!=='number'||!Number.isFinite(v))return {value:null,ok:false};
 return {value:v,ok:step.op==='>'?v>step.value:step.op==='<'?v<step.value:step.op==='>='?v>=step.value:v<=step.value};
}
export class RuleEngine {
 constructor(doc){this.set(doc);}
 set(doc){this.doc=parseRules(doc);this.reset();}
 reset(){this.states=this.doc.rules.map(()=>({step:0,since:null,began:null,firedAt:-Infinity,armed:true,active:false,progress:0,value:null}));this.source=null;this.lastFrame=null;}
 tick(result,now){
  if(!result||result.held){this.reset();return [];}
  const source=JSON.stringify([result.source.id,result.source.output_slot,result.source.revision,result.source.width,result.source.height,result.selection?.names??result.selection?.selectors,result.selection?.regions]);
  if(source!==this.source){this.reset();this.source=source;}
  // A held old frame cannot complete a hold. Time is source frame time.
  const t=result.source.frame_timestamp_ms;if(t===this.lastFrame)return [];this.lastFrame=t;
  const events=[];
  this.doc.rules.forEach((r,i)=>{const s=this.states[i];
   const first=condition(r.steps[0],result.features,result.source);
   if(!s.armed){if(!first.ok){s.armed=true;s.active=false;events.push({name:r.name,phase:'exit',timestamp_ms:t,source:result.source});}return;}
   if(t-s.firedAt<r.cooldown_ms)return;
   if(s.began!==null&&t-s.began>r.within_ms){s.step=0;s.since=s.began=null;}
   const step=r.steps[s.step],c=condition(step,result.features,result.source);s.value=c.value;
   if(!c.ok){s.since=null;s.progress=s.step/r.steps.length;return;}
   s.since??=t;s.began??=t;s.progress=(s.step+Math.min(1,(t-s.since)/Math.max(1,step.hold_ms)))/r.steps.length;
   if(t-s.since<step.hold_ms)return;
   if(++s.step===r.steps.length){events.push({name:r.name,phase:'entry',timestamp_ms:t,evaluated_at_ms:now,source:result.source});s.firedAt=t;s.armed=false;s.active=true;s.step=0;s.progress=1;s.since=s.began=null;}
   else s.since=null;
  });return events;
 }
}
