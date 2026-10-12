// Schematic geometry adapted from Threegrease's combinedBodyMapPicker.
// These positions are navigation aids; exported observations keep source coordinates.
import {topology,groups} from './selection.js';
import canonicalFace from './canonical-face-points.json' with {type:'json'};
export const mapColors={pose:'#79b4ff',left:'#71d9c2',right:'#f28ca8',face:'#f5e978',leftEye:'#80ef9c',rightEye:'#ff888e'};
export function anatomicalMap(mode='combined',{poseHands=false}={}){
 if(mode==='facemesh')return staticFaceMap();
 const points=[],edges=[],regions=[];
 const point=(id,p,color,name)=>points.push({id,x:p[0],y:p[1],color,name});
 const edge=(a,b)=>edges.push({a,b});
 const face=(transform=p=>p)=>{
  const positions=Object.fromEntries(Object.entries(topology.facePos).map(([id,p])=>[id,[...p]]));
  for(const id of new Set([...topology.faceGroups['face.lips'],...topology.faceGroups['face.lips_outer'],...topology.faceGroups['face.lips_inner']]))if(positions[id])positions[id][1]=253+(positions[id][1]-235)*.65;
  // Brows and nose supplement the curated Threegrease face loops.
  for(const [name,cx]of [['left_eyebrow',205],['right_eyebrow',95]]){
   const ids=topology.faceGroups['face.'+name];ids.forEach((id,i)=>positions[id]=[cx-32+(i%5)*16,60+Math.floor(i/5)*10-5*Math.sin((i%5)*Math.PI/4)]);
  }
  const nose=topology.faceGroups['face.nose'];const nosePositions=[[150,132],[150,140],[150,148],[150,156],[150,164],[150,172],[150,180],[150,188],[150,196],[150,204],[134,198],[142,202],[158,202],[166,198]];nose.forEach((id,i)=>positions[id]=nosePositions[i]);
  const eye=(id,side)=>topology.faceGroups['face.'+side+'_eye'].includes(id)||topology.faceGroups['face.'+side+'_iris'].includes(id)||topology.faceGroups['face.'+side+'_eyebrow'].includes(id);
  for(const [id,p]of Object.entries(positions))point('face.'+id,transform(p),eye(+id,'left')?mapColors.leftEye:eye(+id,'right')?mapColors.rightEye:mapColors.face,topology.facePointNames[id]??'Face vertex '+id);
  for(const [a,b]of topology.faceEdges)edge('face.'+a,'face.'+b);
  for(const group of groups.filter(g=>g.id.startsWith('@face.')&&!g.id.endsWith('.all'))){const set=new Set(group.members),lines=edges.filter(e=>set.has(e.a)&&set.has(e.b));if(!lines.length)for(let i=1;i<group.members.length;i++)lines.push({a:group.members[i-1],b:group.members[i]});regions.push({id:group.id,label:group.label,lines});}
 };
 const hand=(side,transform=p=>p)=>{
  topology.handPos.forEach((p,i)=>point('hands.'+side+'.'+topology.handNames[i],transform(p),mapColors[side],side+' '+topology.handNames[i].replaceAll('_',' ')));
  for(const [a,b]of topology.handEdges)edge('hands.'+side+'.'+topology.handNames[a],'hands.'+side+'.'+topology.handNames[b]);
  for(const group of groups.filter(g=>g.id.startsWith('@hands.'+side+'.')&&!g.id.endsWith('.all'))){const set=new Set(group.members);regions.push({id:group.id,label:group.label,lines:edges.filter(e=>set.has(e.a)&&set.has(e.b))});}
 };
 let bounds;
 if(mode==='combined'){
  bounds=[-220,0,1810,1470];
  const body={...topology.bodyPos};
  for(const [foot,ankle]of [[29,27],[31,27],[30,28],[32,28]])body[foot]=[2*body[ankle][0]-body[foot][0],body[foot][1]];
  if(poseHands)for(const [i,p]of Object.entries({17:[145,850],19:[125,816],21:[185,766],18:[1225,850],20:[1245,816],22:[1185,766]}))body[i]=p;
  for(const [i,p]of Object.entries(body))point('pose.'+topology.poseNames[i],[1370-p[0],p[1]],mapColors.pose,'Pose '+topology.poseNames[i].replaceAll('_',' '));
  for(const [a,b]of topology.poseEdges)if(body[a]&&body[b])edge('pose.'+topology.poseNames[a],'pose.'+topology.poseNames[b]);
  face(([x,y])=>[355+x*2.2,18+y*2.2]);
  // Separate upright detailed hands beside the ears when coarse pose hands are visible.
  // Otherwise keep the detailed wrists attached to the T-pose wrists.
  if(poseHands){
   hand('left',([x,y])=>[1280+2*(x-100),650+2*(y-210)]);
   hand('right',([x,y])=>[90+2*(100-x),650+2*(y-210)]);
  }else{
   hand('left',([x,y])=>[1165-2*(y-210),816+2*(x-100)]);
   hand('right',([x,y])=>[205+2*(y-210),816+2*(x-100)]);
  }
 }else if(mode==='face'){bounds=[-15,-15,330,360];face();}
 else if(mode==='left'||mode==='right'){bounds=[-10,-10,230,260];hand(mode);}
 else{bounds=[-10,-10,320,580];topology.posePos.forEach((p,i)=>{if(!poseHands&&i>=17&&i<=22)return;const ankle={29:27,31:27,30:28,32:28}[i],x=ankle===undefined?p[0]:2*topology.posePos[ankle][0]-p[0];point('pose.'+topology.poseNames[i],[300-x,p[1]],mapColors.pose,'Pose '+topology.poseNames[i].replaceAll('_',' '));});for(const [a,b]of topology.poseEdges)if(poseHands||!([a,b].some(i=>i>=17&&i<=22)))edge('pose.'+topology.poseNames[a],'pose.'+topology.poseNames[b]);}
 for(const group of groups.filter(g=>g.id.startsWith('@pose.')&&!g.id.endsWith('.all'))){const set=new Set(group.members);regions.push({id:group.id,label:group.label,lines:edges.filter(e=>set.has(e.a)&&set.has(e.b))});}
 return {bounds,points,edges,regions};
}
// A stable front-facing reference, independent of detector state or installed models.
export function staticFaceMap(){
 const styled=new Map(anatomicalMap('face').points.map(p=>[p.id,p.color]));
 const scale=330/(Math.max(...canonicalFace.points.map(p=>p[1]))-Math.min(...canonicalFace.points.map(p=>p[1])));
 const points=canonicalFace.points.map(([x,y],i)=>({id:'face.'+i,x:x*scale,y:y*scale,color:styled.get('face.'+i)??mapColors.face,name:topology.facePointNames[i]??'Face vertex '+i}));
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,pad=Math.max(w,h)*.08;
 return {bounds:[x-pad,y-pad,w+pad*2,h+pad*2],points,edges:[],regions:[]};
}
