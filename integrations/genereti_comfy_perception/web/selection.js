// Portable selection semantics. Anatomical group topology adapted from the
// user's Underscores ontology; schematic positions from Threegrease.
import topology from './landmark-topology.json' with {type:'json'};
export {topology};
const label=id=>id==='face.face_oval'?'Face outline':id.replace(/^@/,'').replaceAll('_',' ').replaceAll('.',' · ');
const group=(id,members)=>({id:'@'+id,label:label(id),members:[...new Set(members)]});
const pose=indices=>indices.map(i=>'pose.'+topology.poseNames[i]);
export const groups=[
 group('pose.all',pose(topology.poseNames.map((_,i)=>i))),
 group('pose.head',pose(Array.from({length:11},(_,i)=>i))),
 group('pose.torso',pose([11,12,23,24])),
 ...[['left_arm',[11,13,15]],['right_arm',[12,14,16]],['left_leg',[23,25,27,29,31]],['right_leg',[24,26,28,30,32]]].map(([id,indices])=>group('pose.'+id,pose(indices))),
 group('face.all',Array.from({length:478},(_,i)=>'face.'+i)),
 ...Object.entries(topology.faceGroups).map(([id,indices])=>group(id,indices.map(i=>'face.'+i))),
 ...['left','right'].flatMap(side=>[
  group('hands.'+side+'.all',topology.handNames.map(n=>'hands.'+side+'.'+n)),
  group('hands.'+side+'.palm',[0,5,9,13,17].map(i=>'hands.'+side+'.'+topology.handNames[i])),
  ...['thumb','index','middle','ring','pinky'].map((finger,i)=>group('hands.'+side+'.'+finger,[1,2,3,4].map(j=>'hands.'+side+'.'+topology.handNames[i*4+j])))
 ])
];
export const groupById=new Map(groups.map(g=>[g.id,g]));
export const catalog=[...groups,...topology.poseNames.map(n=>({id:'pose.'+n,label:label('pose.'+n)})),...['left','right'].flatMap(side=>topology.handNames.map(n=>({id:'hands.'+side+'.'+n,label:label('hands.'+side+'.'+n)}))),...Array.from({length:478},(_,i)=>({id:'face.'+i,label:'Face vertex '+i}))];
export const parseSelection=text=>[...new Set(String(text??'').split(/[\s,]+/).filter(Boolean))];
export function expandSelection(names){return [...new Set(names.flatMap(n=>groupById.get(n)?.members??[n]))];}
export function taskSelection(task,tasks=''){const list=parseSelection(tasks||task);if(!list.length||list.some(k=>!['pose','hands','face','holistic','segment','multiclass'].includes(k)))throw Error('Choose Holistic, Pose, Hands, Face or a segmentation model');if(list.includes('holistic')&&list.length!==1)throw Error('Holistic already includes pose, hands and face');if(list.some(k=>['segment','multiclass'].includes(k))&&list.length!==1)throw Error('Use a separate segmentation stream');return list;}
export function combineFeatures(results){const features={};for(const r of results)Object.assign(features,r.features);return features;}
export function filterSelected(features,selectors){if(!selectors.length)return {...features};const names=expandSelection(selectors);return Object.fromEntries(Object.entries(features).filter(([k])=>names.some(n=>k===n||k.startsWith(n+'.'))));}
export function selectedPointNames(result,selectors){return expandSelection(selectors).filter(n=>Number.isFinite(result?.features?.[n+'.x'])&&Number.isFinite(result?.features?.[n+'.y']));}
export function validateSelectionSets(raw){if(!Array.isArray(raw)||raw.length>64)throw Error('At most 64 selection sets');return raw.map(p=>{if(typeof p.name!=='string'||!p.name.trim()||p.name.length>80||!Array.isArray(p.selectors)||p.selectors.length>1024||p.selectors.some(s=>typeof s!=='string'||s.length>160))throw Error('Invalid selection set');return {name:p.name.trim(),selectors:[...new Set(p.selectors)]};});}
export const segmentLabels={segment:['background','person'],multiclass:['background','hair','body_skin','face_skin','clothes','accessories']};
export function segmentAlpha(v,{threshold=.5,softness=.1,invert=false}={}){const lo=threshold-softness/2,hi=threshold+softness/2;let a=softness>0?Math.max(0,Math.min(1,(v-lo)/(hi-lo))):+(v>=threshold);a=a*a*(3-2*a);return invert?1-a:a;}
export function landmarkFeatures(kind,result){
 const features={},lists=kind==='face'?result.faceLandmarks:result.landmarks;features[kind+'.count']=lists?.length??0;
 (lists??[]).forEach((points,entity)=>points.forEach((p,index)=>{
  const prefix=kind==='pose'?'pose.'+topology.poseNames[index]:kind==='hands'?'hands.'+entity+'.'+topology.handNames[index]:(entity?'face.person'+entity+'.':'face.')+index;
  // Face/hand Tasks emit placeholder visibility=0; only Pose defines visibility.
  for(const key of (kind==='pose'?['x','y','z','visibility','presence']:['x','y','z']))if(Number.isFinite(p[key]))features[prefix+'.'+key]=p[key];
 }));
 for(const shape of result.faceBlendshapes?.[0]?.categories??[])features['face.blend.'+shape.categoryName]=shape.score;
 const sides=new Map();
 for(const [i,h]of (result.handedness??[]).entries()){
  const label=h[0]?.categoryName?.toLowerCase(),score=h[0]?.score??0;features['hands.'+i+'.handedness_score']=score;features['hands.'+i+'.is_left']=+(label==='left');
  if(['left','right'].includes(label)&&score>(sides.get(label)?.score??-1))sides.set(label,{index:i,score});
 }
 for(const [side,{index,score}]of sides){features['hands.'+side+'.handedness_score']=score;for(const [key,v]of Object.entries(features)){const prefix='hands.'+index+'.';if(key.startsWith(prefix))features['hands.'+side+'.'+key.slice(prefix.length)]=v;}}
 return features;
}

export function holisticFeatures(result){
 const landmarks=[],handedness=[];
 for(const [side,lists]of [['Left',result.leftHandLandmarks],['Right',result.rightHandLandmarks]])if(lists?.[0]?.length){landmarks.push(lists[0]);handedness.push([{categoryName:side,score:1}]);}
 const hands=landmarkFeatures('hands',{landmarks,handedness});
 // Holistic assigns sides through its body graph; no handedness probability is supplied.
 for(const key of Object.keys(hands))if(key.endsWith('.handedness_score'))delete hands[key];
 return combineFeatures([
  {features:landmarkFeatures('pose',{landmarks:result.poseLandmarks})},
  {features:landmarkFeatures('face',{faceLandmarks:result.faceLandmarks,faceBlendshapes:result.faceBlendshapes})},
  {features:hands}
 ]);
}

export function regionForPoint(name){return groups.filter(g=>!g.id.endsWith('.all')&&g.members.includes(name)).sort((a,b)=>a.members.length-b.members.length)[0]?.id??name;}

// Display labels only: persisted selectors keep their full stable IDs.
export function compactSelectionLabel(id,label=id){
 const parts=id.replace(/^@/,'').split('.'),family=parts.shift();
 if(!['pose','face','hands'].includes(family))return {family:null,text:label};
 let side='';if(parts[0]==='left'||parts[0]==='right')side=parts.shift()==='left'?'L':'R';
 let text=parts.join('•').replace(/^(left|right)_/,(_,s)=>{side=s==='left'?'L':'R';return '';});
 text=text==='face_oval'?'outline':text.replaceAll('_','•');
 if(family==='face'&&/^\d+$/.test(text))text='v'+text;
 return {family:family==='hands'?'hand':family,text:text+(side?'•'+side:'')};
}

export function pointIdLabel(id){
 const parts=id.replace(/^(pose|face|hands)\./,'').split(/[._]/);
 return parts.length===1&&/^\d+$/.test(parts[0])?parts[0]:parts.map(p=>/^\d+$/.test(p)?p:p[0]?.toUpperCase()??'').join('');
}
