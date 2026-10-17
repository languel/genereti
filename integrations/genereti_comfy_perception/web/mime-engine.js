// ꘇ mediamime: regions drawn in Poliplan become triggers over a shared perception stream.
// Pure and DOM-free (tested in Node). Two kinds of geometry:
//  - stage marks, drawn over the live image (normalized image coordinates), and
//  - body marks, drawn on the homunculus and anchored to the skeleton (bone frames), so they move with the performer.
// Closed shapes are zones (enter/exit/inside), open strokes are tripwires (cross), points are small round targets.
import {topology,expandSelection,parseSelection} from './selection.js';

export const SCORE_VERSION=1;
export const BODY_BOARD={id:'body',title:'body',width:320,height:600};
export const BOARD_GAP=120;
export const TRIGGERS=['enter','exit','enterExit','inside','cross'];
export const ACTIONS=['event','midiNote','midiCc','osc','ws'];
export const VALUE_MODES=['constant','speed','normX','normY','distance','coverage','count','x','y'];
export const HITTER_PRESETS={
 index:'pose.left_index pose.right_index',
 wrists:'pose.left_wrist pose.right_wrist',
 hands:'@hands.left.all @hands.right.all',
 feet:'pose.left_foot_index pose.right_foot_index pose.left_heel pose.right_heel',
 limbs:'pose.left_index pose.right_index pose.left_foot_index pose.right_foot_index',
 head:'pose.nose',
 body:'@pose.all'
};

// The homunculus: Threegrease/Underscores schematic pose positions, facing the camera like the live image
// (the performer's left on image right). The schematic body is stored mirrored, its face is not.
const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
export const homunculus=(()=>{
 const pos={};topology.poseNames.forEach((name,i)=>{let [x,y]=topology.posePos[i];if(i>=11)x=300-x;pos[name]=[x+10,y+15];});
 pos.neck=mid(pos.left_shoulder,pos.right_shoulder);pos.pelvis=mid(pos.left_hip,pos.right_hip);return pos;
})();
// Bone frames that body marks anchor to. A chain names the limb whose own points cannot strike that limb.
export const BONES=[
 ['head','neck','nose',null],['torso','neck','pelvis',null],
 ['left_upper_arm','left_shoulder','left_elbow','left_arm'],['left_forearm','left_elbow','left_wrist','left_arm'],['left_hand','left_wrist','left_index','left_arm'],
 ['right_upper_arm','right_shoulder','right_elbow','right_arm'],['right_forearm','right_elbow','right_wrist','right_arm'],['right_hand','right_wrist','right_index','right_arm'],
 ['left_thigh','left_hip','left_knee','left_leg'],['left_shin','left_knee','left_ankle','left_leg'],['left_foot','left_ankle','left_foot_index','left_leg'],
 ['right_thigh','right_hip','right_knee','right_leg'],['right_shin','right_knee','right_ankle','right_leg'],['right_foot','right_ankle','right_foot_index','right_leg']
].map(([id,a,b,chain])=>({id,a,b,chain}));
const CHAINS={
 left_arm:['left_elbow','left_wrist','left_pinky','left_index','left_thumb'],right_arm:['right_elbow','right_wrist','right_pinky','right_index','right_thumb'],
 left_leg:['left_knee','left_ankle','left_heel','left_foot_index'],right_leg:['right_knee','right_ankle','right_heel','right_foot_index']
};
export function chainOf(name){
 if(name.startsWith('hands.'))return name.startsWith('hands.left.')?'left_arm':'right_arm';
 const short=name.replace(/^pose\./,'');return Object.keys(CHAINS).find(c=>CHAINS[c].includes(short))??null;
}
// Silhouette capsules for drawing the homunculus: [a, b, radius].
export const SILHOUETTE=[
 ['neck','pelvis',34],['left_shoulder','right_shoulder',20],['left_hip','right_hip',22],
 ['left_shoulder','left_elbow',13],['left_elbow','left_wrist',11],['right_shoulder','right_elbow',13],['right_elbow','right_wrist',11],
 ['left_hip','left_knee',17],['left_knee','left_ankle',13],['right_hip','right_knee',17],['right_knee','right_ankle',13],
 ['left_ankle','left_foot_index',8],['right_ankle','right_foot_index',8],['left_wrist','left_index',9],['right_wrist','right_index',9]
];

// ---- score --------------------------------------------------------------------------------------------------------
const finite=(v,d)=>typeof v==='number'&&Number.isFinite(v)?v:d;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const nameOk=n=>typeof n==='string'&&/^[A-Za-z][\w.-]{0,79}$/.test(n);
export function defaultAction(type='event',index=0){
 const base={type,trigger:type==='midiNote'?'enterExit':'enter'};
 if(type==='event')return {...base,name:''};
 if(type==='midiNote')return {...base,channel:1,note:[36,38,42,45,47,49,51,56][index%8],velocity:'speed',value:100,duration_ms:180};
 if(type==='midiCc')return {...base,trigger:'inside',channel:1,cc:20+index%40,value_mode:'normY',value:64};
 if(type==='osc')return {...base,address:'/mime/{region}',value_mode:'speed',value:1};
 return {...base,address:'mime/{region}',value_mode:'speed',value:1};
}
export function defaultRegion(kind,index,board){
 const prefix=board==='body'?'body':kind==='wire'?'wire':'zone';
 return {name:prefix+(index+1),hitters:board==='body'?HITTER_PRESETS.index:HITTER_PRESETS.limbs,mode:'points',threshold:.08,cooldown_ms:150,hold_ms:0,
  actions:[{...defaultAction('event'),trigger:kind==='wire'?'cross':'enter'},{...defaultAction('midiNote',index),trigger:kind==='wire'?'cross':'enterExit'}]};
}
export function parseScore(value){
 const doc=typeof value==='string'?(value.trim()?JSON.parse(value):{}):structuredClone(value??{});
 if(doc.version!==undefined&&doc.version!==SCORE_VERSION)throw Error('Expected mediamime score version 1');
 const regions={};
 for(const [id,r]of Object.entries(doc.regions??{})){
  if(Object.keys(regions).length>=128)break;
  const actions=(Array.isArray(r.actions)?r.actions:[]).slice(0,16).filter(a=>ACTIONS.includes(a?.type)).map(a=>({...defaultAction(a.type),...a,trigger:TRIGGERS.includes(a.trigger)?a.trigger:defaultAction(a.type).trigger}));
  regions[id]={name:nameOk(r.name)?r.name:'region'+(Object.keys(regions).length+1),hitters:typeof r.hitters==='string'?r.hitters.slice(0,2000):HITTER_PRESETS.limbs,
   mode:r.mode==='body'?'body':'points',threshold:clamp(finite(r.threshold,.08),.001,1),cooldown_ms:clamp(finite(r.cooldown_ms,150),0,60000),hold_ms:clamp(finite(r.hold_ms,0),0,60000),
   muted:!!r.muted,actions};
 }
 const stage={width:Math.round(clamp(finite(doc.stage?.width,640),64,4096)),height:Math.round(clamp(finite(doc.stage?.height,360),64,4096))};
 const outputs={midi:{port:String(doc.outputs?.midi?.port??'')},osc:{port:Math.round(clamp(finite(doc.outputs?.osc?.port,9000),1024,65535))},ws:{url:String(doc.outputs?.ws?.url??'ws://127.0.0.1:8765')}};
 return {version:SCORE_VERSION,stage,document:doc.document??null,regions,outputs};
}

// ---- geometry -----------------------------------------------------------------------------------------------------
export function boardsFor(stage){
 return [{id:'main',title:'stage',width:stage.width,height:stage.height,ground:'transparent',hideBorder:false,hideLabel:false},
  {id:BODY_BOARD.id,title:BODY_BOARD.title,width:BODY_BOARD.width,height:BODY_BOARD.height,ground:'transparent',x:stage.width+BOARD_GAP,y:0,hideBorder:false,hideLabel:false}];
}
const centroid=pts=>{let x=0,y=0;for(const p of pts){x+=p[0];y+=p[1];}return [x/pts.length,y/pts.length];};
export function insidePolygon(x,y,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/((yj-yi)||1e-12)+xi)inside=!inside;}return inside;}
function segmentsIntersect(p,q,a,b){
 const d=(u,v,w)=>(v[0]-u[0])*(w[1]-u[1])-(v[1]-u[1])*(w[0]-u[0]);
 const d1=d(a,b,p),d2=d(a,b,q),d3=d(p,q,a),d4=d(p,q,b);
 return ((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0));
}
// Which side of a polyline a point is on: the sign at the nearest segment.
function sideOf(pt,line){let best=Infinity,side=0;for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1e-12,t=clamp(((pt[0]-a[0])*dx+(pt[1]-a[1])*dy)/l),cx=a[0]+t*dx,cy=a[1]+t*dy,dist=Math.hypot(pt[0]-cx,pt[1]-cy);if(dist<best){best=dist;side=Math.sign(dx*(pt[1]-a[1])-dy*(pt[0]-a[0]));}}return side;}
const circle=(c,r,n=20)=>Array.from({length:n},(_,i)=>[c[0]+Math.cos(i/n*Math.PI*2)*r,c[1]+Math.sin(i/n*Math.PI*2)*r]);
function segmentDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1e-12,t=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l);return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
export function anchorBody(points){
 const c=centroid(points);let bone=BONES[0],best=Infinity;
 for(const b of BONES){const d=segmentDistance(c,homunculus[b.a],homunculus[b.b]);if(d<best){best=d;bone=b;}}
 const a=homunculus[bone.a],b=homunculus[bone.b],dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;
 return {bone:bone.id,coords:points.map(p=>[((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l,(dx*(p[1]-a[1])-dy*(p[0]-a[0]))/l])};
}
export function boneById(id){return BONES.find(b=>b.id===id);}
/** Regions from a Poliplan document: stage marks normalized to the stage board, body marks anchored to bones. */
export function regionsFromDocument(document,stage){
 const out=[];if(!document?.elements)return out;
 const bodyBoard=(document.boards??[]).find(b=>b.id===BODY_BOARD.id)??{x:stage.width+BOARD_GAP,y:0,width:BODY_BOARD.width,height:BODY_BOARD.height};
 const W=document.artboard?.width||stage.width,H=document.artboard?.height||stage.height;
 const stagesHidden=new Set((document.stages??[]).filter(s=>s.visible===false).map(s=>s.id));
 for(const e of document.elements){
  if(!e?.id||!Array.isArray(e.points)||!e.points.length||e.hidden||stagesHidden.has(e.stage)||['note','guide'].includes(e.role))continue;
  const pts=e.points.map(p=>[p[0],p[1]]),c=centroid(pts);
  const onStage=c[0]>=0&&c[1]>=0&&c[0]<=W&&c[1]<=H,onBody=c[0]>=bodyBoard.x&&c[1]>=bodyBoard.y&&c[0]<=bodyBoard.x+bodyBoard.width&&c[1]<=bodyBoard.y+bodyBoard.height;
  if(!onStage&&!onBody)continue;
  const board=onStage?'stage':'body',span=onStage?Math.min(W,H):BODY_BOARD.width;
  const closedLine=pts.length>3&&Math.hypot(pts[0][0]-pts.at(-1)[0],pts[0][1]-pts.at(-1)[1])<span*.04;
  let kind=e.role==='point'||pts.length===1?'point':e.role==='plane'||closedLine?'zone':'wire',shape=pts;
  if(kind==='point'){shape=circle(pts[0],span*.035);kind='zone';}
  if(kind==='wire'&&pts.length<2)continue;
  const region={id:e.id,board,kind,color:e.color??null};
  if(board==='stage')region.points=shape.map(([x,y])=>[x/W,y/H]);
  else{const local=shape.map(([x,y])=>[x-bodyBoard.x,y-bodyBoard.y]);region.template=local;region.anchor=anchorBody(local);}
  out.push(region);
 }
 return out;
}

// ---- live evaluation -----------------------------------------------------------------------------------------------
function landmark(features,name,W,H,minConfidence){
 const x=features?.[name+'.x'],y=features?.[name+'.y'];if(!Number.isFinite(x)||!Number.isFinite(y))return null;
 if(Math.min(features[name+'.visibility']??1,features[name+'.presence']??1)<minConfidence)return null;return [x*W,y*H];
}
function poseLive(features,W,H,minConfidence){
 const get=n=>landmark(features,'pose.'+n,W,H,minConfidence),pos={};
 for(const n of topology.poseNames){const p=get(n);if(p)pos[n]=p;}
 if(pos.left_shoulder&&pos.right_shoulder)pos.neck=mid(pos.left_shoulder,pos.right_shoulder);
 if(pos.left_hip&&pos.right_hip)pos.pelvis=mid(pos.left_hip,pos.right_hip);return pos;
}
/** A body mark placed on the live skeleton, in pixels; null when its bone is not detected. */
export function placeBody(anchor,pose){
 const bone=boneById(anchor.bone),a=pose[bone.a],b=pose[bone.b];if(!a||!b)return null;
 const dx=b[0]-a[0],dy=b[1]-a[1];return anchor.coords.map(([u,v])=>[a[0]+u*dx-v*dy,a[1]+u*dy+v*dx]);
}
export function hitterNames(text){return expandSelection(parseSelection(text)).filter(n=>/^(pose|hands)\./.test(n));}
const polyBox=poly=>{let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const [x,y]of poly){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}return [x0,y0,x1,y1];};
/** Fraction of mask cells inside the polygon that are set; the mask is {width,height,data} with one byte per cell. */
export function maskCoverage(mask,poly,W,H){
 if(!mask?.data||!mask.width||!mask.height)return null;
 const [x0,y0,x1,y1]=polyBox(poly),sx=mask.width/W,sy=mask.height/H;let inside=0,set=0,cx=0,cy=0;
 for(let j=Math.max(0,Math.floor(y0*sy));j<=Math.min(mask.height-1,Math.ceil(y1*sy));j++)for(let i=Math.max(0,Math.floor(x0*sx));i<=Math.min(mask.width-1,Math.ceil(x1*sx));i++){
  const x=(i+.5)/sx,y=(j+.5)/sy;if(!insidePolygon(x,y,poly))continue;inside++;if(mask.data[j*mask.width+i]>127){set++;cx+=x;cy+=y;}
 }
 return inside?{coverage:set/inside,x:set?cx/set:null,y:set?cy/set:null}:{coverage:0,x:null,y:null};
}

export class MimeEngine {
 constructor(){this.reset();}
 reset(){this.states=new Map();this.tracks=new Map();this.lastFrame=null;this.sourceKey=null;}
 /**
  * One frame. regions: regionsFromDocument output; config: score.regions; result: a perception-v1 stream record.
  * Returns {events, channels, live} where live holds each region's current polygon (normalized) and activity.
  */
 tick({regions,config,result,mask=null,minConfidence=.4,now=0}){
  const events=[],channels={},live=[];
  if(!result?.source||result.held){
   // A held (paused) source changes nothing. A lost stream ends every active region, so notes are released.
   for(const region of regions){const cfg=config[region.id],state=this.states.get(region.id);if(!cfg||!state)continue;
    if(!result&&state.active){state.active=false;state.since=null;events.push({region:region.id,name:cfg.name,phase:'exit',timestamp_ms:now,x:state.x,y:state.y,speed:0,count:0,coverage:0,hitter:null,lost:true});}
    Object.assign(channels,{[cfg.name+'.active']:+state.active,[cfg.name+'.valid']:0,[cfg.name+'.hits']:state.hits});}
   if(!result)this.lastFrame=null;
   return {events,channels,live,valid:false,held:!!result?.held};
  }
  const src=result.source,W=src.width||1,H=src.height||1,t=src.frame_timestamp_ms;
  const key=JSON.stringify([src.id,src.output_slot,src.width,src.height]);if(key!==this.sourceKey){this.reset();this.sourceKey=key;}
  const fresh=t!==this.lastFrame;this.lastFrame=t;
  const features=result.features??{},pose=poseLive(features,W,H,minConfidence);
  // Hitter positions and speeds (image heights per second), once per frame.
  const hitters=new Map();
  const hitter=name=>{if(hitters.has(name))return hitters.get(name);const p=landmark(features,name,W,H,minConfidence);let h=null;
   if(p){const prev=this.tracks.get(name);const dt=prev&&t>prev.t?(t-prev.t)/1000:0;const speed=dt?Math.hypot(p[0]-prev.p[0],p[1]-prev.p[1])/H/dt:prev?.speed??0;h={name,p,prev:prev&&t-prev.t<250?prev.p:null,speed};}
   hitters.set(name,h);return h;};
  for(const region of regions){
   const cfg=config[region.id];if(!cfg)continue;
   const state=this.states.get(region.id)??{active:false,since:null,lastEntry:-Infinity,lastInside:-Infinity,hits:0,value:0,x:null,y:null,speed:0,coverage:0,count:0,side:new Map()};this.states.set(region.id,state);
   const poly=region.board==='stage'?region.points.map(([x,y])=>[x*W,y*H]):placeBody(region.anchor,pose);
   const name=cfg.name;
   if(!poly){channels[name+'.valid']=0;channels[name+'.active']=+state.active;live.push({id:region.id,name,board:region.board,kind:region.kind,polygon:null,active:state.active});continue;}
   const names=hitterNames(cfg.hitters),chain=region.board==='body'?boneById(region.anchor.bone).chain:null;
   const usable=names.filter(n=>!chain||chainOf(n)!==chain).map(hitter).filter(Boolean);
   const [bx0,by0,bx1,by1]=polyBox(poly),bw=Math.max(1e-9,bx1-bx0),bh=Math.max(1e-9,by1-by0),c=centroid(poly),radius=Math.max(1e-9,...poly.map(p=>Math.hypot(p[0]-c[0],p[1]-c[1])));
   const metrics=(p,h)=>({x:p[0]/W,y:p[1]/H,normX:clamp((p[0]-bx0)/bw),normY:clamp((p[1]-by0)/bh),distance:clamp(Math.hypot(p[0]-c[0],p[1]-c[1])/radius),speed:clamp((h?.speed??0)/2),hitter:h?.name??'body'});
   if(region.kind==='wire'){
    for(const h of usable){const s=sideOf(h.p,poly),before=state.side.get(h.name);state.side.set(h.name,s);
     if(fresh&&h.prev&&before&&s&&s!==before&&t-state.lastEntry>=cfg.cooldown_ms){let crossed=false;for(let i=1;i<poly.length&&!crossed;i++)crossed=segmentsIntersect(h.prev,h.p,poly[i-1],poly[i]);
      if(crossed){state.lastEntry=t;state.hits++;const m=metrics(h.p,h);Object.assign(state,{x:m.x,y:m.y,speed:m.speed,value:m.speed});events.push({region:region.id,name,phase:'cross',direction:s,timestamp_ms:t,...m,count:1,coverage:0});}}}
    channels[name+'.hits']=state.hits;channels[name+'.valid']=1;channels[name+'.speed']=state.speed;
    live.push({id:region.id,name,board:region.board,kind:region.kind,polygon:poly.map(([x,y])=>[x/W,y/H]),active:t-state.lastEntry<200,hit:state.lastEntry});continue;
   }
   let inside=[],m=null,coverage=null;
   if(cfg.mode==='body'){const cov=maskCoverage(mask,poly,W,H);coverage=cov?.coverage??null;const on=coverage!==null&&coverage>=(state.active?cfg.threshold*.75:cfg.threshold);if(on){m=metrics([cov.x??c[0],cov.y??c[1]],null);inside=[{name:'body'}];}}
   else{inside=usable.filter(h=>insidePolygon(h.p[0],h.p[1],poly));if(inside.length){const lead=inside.reduce((a,b)=>(b.speed>a.speed?b:a));m=metrics(lead.p,lead);}}
   const present=inside.length>0;
   if(present){state.since??=t;state.lastInside=t;}else{state.since=null;state.blocked=false;}
   const held=present&&t-state.since>=cfg.hold_ms;
   const base={region:region.id,name,timestamp_ms:t,count:inside.length,coverage:coverage??0};
   // An entry inside the cooldown is consumed: the next hit needs an exit first (no late phantom hit).
   if(fresh&&!state.active&&held&&!state.blocked&&t-state.lastEntry<cfg.cooldown_ms)state.blocked=true;
   if(fresh&&!state.active&&held&&!state.blocked){state.active=true;state.lastEntry=t;state.hits++;state.emitted=t;events.push({...base,phase:'entry',...m});}
   else if(fresh&&state.active&&!present){state.active=false;events.push({...base,phase:'exit',x:state.x,y:state.y,normX:0,normY:0,distance:0,speed:state.speed,hitter:null});}
   else if(fresh&&state.active&&present&&t-(state.emitted??-Infinity)>=120){state.emitted=t;events.push({...base,phase:'inside',...m});}
   if(m)Object.assign(state,{x:m.x,y:m.y,speed:m.speed,value:m.normY});state.count=inside.length;state.coverage=coverage??0;
   Object.assign(channels,{[name+'.active']:+state.active,[name+'.valid']:1,[name+'.x']:state.x??0,[name+'.y']:state.y??0,[name+'.speed']:state.speed,[name+'.count']:state.count,[name+'.coverage']:state.coverage,[name+'.hits']:state.hits});
   live.push({id:region.id,name,board:region.board,kind:region.kind,polygon:poly.map(([x,y])=>[x/W,y/H]),active:state.active,hit:state.lastEntry,coverage});
  }
  for(const [name,h]of hitters)if(h)this.tracks.set(name,{p:h.p,t,speed:h.speed});
  return {events,channels,live,valid:true,pose:Object.fromEntries(Object.entries(pose).map(([k,[x,y]])=>[k,[x/W,y/H]]))};
 }
}

// ---- actions ------------------------------------------------------------------------------------------------------
const PHASE_OF={enter:['entry','cross'],exit:['exit'],enterExit:['entry','exit','cross'],inside:['inside'],cross:['cross']};
export function actionValue(action,event,mode){
 mode=mode??action.value_mode??'constant';
 if(mode==='constant')return null;
 if(mode==='count')return clamp((event.count??0)/4);
 const v=event[mode];return Number.isFinite(v)?clamp(v):0;
}
const midi7=v=>Math.round(clamp(v)*127);
const fill=(text,event,region)=>String(text??'').replaceAll('{region}',region).replaceAll('{phase}',event.phase);
/** The output messages for one event of one region (pure; the dispatcher sends them). */
export function planActions(cfg,event,{stream='mime'}={}){
 const out=[];if(cfg.muted)return out;
 const payload={region:cfg.name,phase:event.phase,x:event.x,y:event.y,speed:event.speed,normX:event.normX,normY:event.normY,distance:event.distance,coverage:event.coverage,count:event.count,hitter:event.hitter,direction:event.direction,timestamp_ms:event.timestamp_ms};
 cfg.actions.forEach((a,index)=>{
  if(!PHASE_OF[a.trigger]?.includes(event.phase))return;
  const off=event.phase==='exit';
  if(a.type==='event')out.push({kind:'event',name:fill(a.name,event,cfg.name)||cfg.name,payload,index});
  else if(a.type==='midiNote'){
   const channel=Math.round(clamp(finite(a.channel,1),1,16))-1,note=Math.round(clamp(finite(a.note,60),0,127));
   // A felt strike: velocity sources map onto 32–127, so a slow touch is still heard.
   const v=a.velocity==='constant'||!a.velocity?Math.round(clamp(finite(a.value,100),1,127)):Math.round(32+95*clamp(actionValue(a,event,a.velocity)));
   if(off){if(a.trigger==='enterExit')out.push({kind:'midi',bytes:[0x80|channel,note,0],index});}
   else{out.push({kind:'midi',bytes:[0x90|channel,note,v],index});if(a.trigger!=='enterExit'||event.phase!=='entry')out.push({kind:'midi',bytes:[0x80|channel,note,0],delay_ms:clamp(finite(a.duration_ms,180),10,10000),index});}
  }
  else if(a.type==='midiCc'){
   const channel=Math.round(clamp(finite(a.channel,1),1,16))-1,cc=Math.round(clamp(finite(a.cc,20),0,119));
   const value=off&&a.trigger==='enterExit'?0:a.value_mode==='constant'?Math.round(clamp(finite(a.value,64),0,127)):midi7(actionValue(a,event));
   out.push({kind:'midi',bytes:[0xB0|channel,cc,value],index});
  }
  else{
   const value=off&&a.trigger==='enterExit'?0:a.value_mode==='constant'?finite(a.value,1):actionValue(a,event);
   if(a.type==='osc')out.push({kind:'osc',address:fill(a.address||'/mime/{region}',event,cfg.name),values:[value,event.phase==='exit'?0:1],index});
   else out.push({kind:'ws',message:{stream,address:fill(a.address||'mime/{region}',event,cfg.name),value,...payload},index});
  }
 });
 return out;
}
