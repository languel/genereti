// Deterministic, model-free geometry over the provider's normalized landmarks.
import {expandSelection} from './selection.js';
import {RuleEngine,parseRules} from './rules.js';
export const measureTypes=['point','centroid','distance','inside','crossing','hand','mouth','eyes','gaze','gaze_target'];
const finite=Number.isFinite;
const bounded=(n,min,max,label)=>{if(!finite(n)||n<min||n>max)throw Error('Invalid '+label);return n;};
const safeName=n=>typeof n==='string'&&/^[A-Za-z][\w.-]{0,79}$/.test(n)&&!['__proto__','constructor','prototype'].includes(n);
export function parseMeasures(value){
 const raw=typeof value==='string'?JSON.parse(value):value;
 if(!raw||raw.version!==1)throw Error('Expected measures version 1');
 const doc=structuredClone(raw);doc.locators??=[];doc.measures??=[];doc.events??=[];doc.contacts??=[];
 if(![doc.locators,doc.measures,doc.events,doc.contacts].every(Array.isArray)||doc.locators.length>64||doc.measures.length>64||doc.events.length>32||doc.contacts.length>16)throw Error('Too many locators, measures or events');
 for(const list of [doc.locators,doc.measures,doc.events,doc.contacts]){const seen=new Set();for(const item of list){if(!safeName(item.name)||seen.has(item.name))throw Error('Use unique names beginning with a letter');seen.add(item.name);}}
 for(const l of doc.locators){if(!Array.isArray(l.points)||!l.points.length||l.points.length>1024||l.points.some(p=>typeof p!=='string'||p.length>160||p.startsWith('$')))throw Error('Locator requires landmark/group selectors');l.min_points=bounded(l.min_points??1,1,1024,'locator minimum');}
 const refs=new Set(doc.locators.map(l=>'$'+l.name));
 for(const m of doc.measures){if(!measureTypes.includes(m.type))throw Error('Unknown measure type: '+m.type);
  for(const key of ['a','b','c','d'])if(m[key]!==undefined&&(typeof m[key]!=='string'||!m[key]||m[key].length>160||m[key].startsWith('$')&&!refs.has(m[key])))throw Error('Unknown or invalid locator: '+m[key]);
  if(['point','centroid','distance','inside','crossing'].includes(m.type)&&!m.a)throw Error(m.type+' needs locator A');
  if(['distance','crossing'].includes(m.type)&&!m.b)throw Error(m.type+' needs locator B');
  if(m.type==='crossing'&&(!m.c||!m.d))throw Error('Crossing needs four segment endpoints');
  if(m.type==='inside'&&!(typeof m.region==='string'&&m.region||m.box))throw Error('Inside needs a region or box');
  if(m.box)validateBox(m.box);
  if(m.side!==undefined&&!['left','right'].includes(m.side))throw Error('Hand side must be left or right');
  if(m.angle!==undefined)bounded(m.angle,0,180,'finger angle');
  if(m.threshold!==undefined)bounded(m.threshold,0,2,'threshold');
  if(m.type==='gaze_target'&&m.calibration){const c=m.calibration;for(const k of ['x_min','x_max','y_min','y_max'])bounded(c[k],-10,10,'gaze calibration');if(c.x_min>=c.x_max||c.y_min>=c.y_max)throw Error('Gaze calibration ranges must increase');}
 }
 parseRules({version:1,rules:doc.events});
 for(const c of doc.contacts){if(typeof c.feature!=='string'||!c.feature||c.feature.length>160)throw Error('Contact needs a measure channel');c.close=bounded(c.close??.04,0,10,'contact close');c.open=bounded(c.open??.07,0,10,'contact open');if(c.open<=c.close)throw Error('Contact open must exceed close (hysteresis)');for(const [key,v]of Object.entries({hold_ms:40,tap_ms:350,click_ms:700,cooldown_ms:200}))c[key]=bounded(c[key]??v,0,60000,key);}
 return doc;
}
export function validateBox(box){if(!Array.isArray(box)||box.length!==4)throw Error('Box is [x,y,width,height]');box.forEach((v,i)=>bounded(v,0,1,'box'));if(box[2]<=0||box[3]<=0||box[0]+box[2]>1.000001||box[1]+box[3]>1.000001)throw Error('Box must fit normalized image');return box;}
function point(result,name,confidence){const f=result?.features??{},x=f[name+'.x'],y=f[name+'.y'];const c=Math.min(f[name+'.presence']??1,f[name+'.visibility']??1);return finite(x)&&finite(y)&&c>=confidence?{x,y,z:finite(f[name+'.z'])?f[name+'.z']:null,confidence:c}:null;}
const metric=(p,r)=>({x:p.x*r,y:p.y});
const distance=(a,b,r)=>Math.hypot((a.x-b.x)*r,a.y-b.y);
const angle=(a,b,c,r)=>{a=metric(a,r);b=metric(b,r);c=metric(c,r);const u=[a.x-b.x,a.y-b.y],v=[c.x-b.x,c.y-b.y],length=Math.hypot(...u)*Math.hypot(...v);return length>1e-10?Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/length)))*180/Math.PI:0;};
export function segmentsCross(a,b,c,d){
 const orient=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
 const on=(p,q,r)=>Math.abs(orient(p,q,r))<1e-9&&r.x>=Math.min(p.x,q.x)-1e-9&&r.x<=Math.max(p.x,q.x)+1e-9&&r.y>=Math.min(p.y,q.y)-1e-9&&r.y<=Math.max(p.y,q.y)+1e-9;
 const v=[orient(a,b,c),orient(a,b,d),orient(c,d,a),orient(c,d,b)];
 return v[0]*v[1]<0&&v[2]*v[3]<0||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);
}
export function evaluateMeasures(doc,result,{confidence=.4,regions=()=>null}={}){
 const output={},ratio=result?.source?.width/result?.source?.height;if(!result||!finite(ratio)||ratio<=0)return output;
 const centroid=names=>{const pts=expandSelection(names).map(n=>point(result,n,confidence)).filter(Boolean);return pts.length?{x:pts.reduce((s,p)=>s+p.x,0)/pts.length,y:pts.reduce((s,p)=>s+p.y,0)/pts.length,confidence:Math.min(...pts.map(p=>p.confidence)),count:pts.length}:null;};
 const locators=new Map(doc.locators.map(l=>{const p=centroid(l.points);return ['$'+l.name,p&&p.count>=l.min_points?p:null];}));
 const resolve=ref=>ref?.startsWith('$')?locators.get(ref):ref?.startsWith('@')?centroid([ref]):point(result,ref,confidence);
 for(const [name,p]of locators)if(p){output['locator.'+name.slice(1)+'.x']=p.x;output['locator.'+name.slice(1)+'.y']=p.y;}
 for(const m of doc.measures){const prefix=m.name+'.';const put=data=>{output[prefix+'valid']=1;for(const [k,v]of Object.entries(data))if(finite(v))output[prefix+k]=v;};output[prefix+'valid']=0;
  const a=resolve(m.a),b=resolve(m.b),c=resolve(m.c),d=resolve(m.d);
  if(m.type==='point'||m.type==='centroid'){if(a)put({x:a.x,y:a.y,...(finite(a.z)?{z:a.z}:{}),confidence:a.confidence,count:a.count??1});}
  else if(m.type==='distance'){if(a&&b)put({distance:distance(a,b,ratio)});}
  else if(m.type==='inside'){const box=m.box??regions(m.region);if(a&&box){const inside=a.x>=box[0]&&a.x<=box[0]+box[2]&&a.y>=box[1]&&a.y<=box[1]+box[3];put({inside:+inside,outside:+!inside});}}
  else if(m.type==='crossing'){if(a&&b&&c&&d){const valid=distance(a,b,ratio)>1e-7&&distance(c,d,ratio)>1e-7;if(valid)put({crossing:+segmentsCross(a,b,c,d)});}}
  else if(m.type==='hand'){
   const side=m.side??'left',get=n=>point(result,`hands.${side}.${n}`,confidence),w=get('wrist');
   const fingers=['index','middle','ring','pinky'].map(f=>[get(f+'_mcp'),get(f+'_pip'),get(f+'_tip')]);const thumb=[get('thumb_mcp'),get('thumb_ip'),get('thumb_tip')];
   if(w&&fingers.flat().every(Boolean)&&thumb.every(Boolean)){
    const extended=fingers.map(([mcp,pip,tip])=>angle(mcp,pip,tip,ratio)>(m.angle??155)&&distance(tip,w,ratio)>distance(pip,w,ratio)*1.05);
    const thumbOpen=angle(...thumb,ratio)>150&&distance(thumb[2],fingers[0][0],ratio)>distance(thumb[1],fingers[0][0],ratio)*1.05;
    const count=extended.filter(Boolean).length+ +thumbOpen,vertical=(thumb[2].y-thumb[0].y),horizontal=(thumb[2].x-thumb[0].x)*ratio;
    put({count,open:+(count===5),fist:+(count===0),thumbs_up:+(thumbOpen&&!extended.some(Boolean)&&vertical<0&&Math.abs(vertical)>Math.abs(horizontal)),thumbs_down:+(thumbOpen&&!extended.some(Boolean)&&vertical>0&&Math.abs(vertical)>Math.abs(horizontal)),thumb:+thumbOpen,...Object.fromEntries(extended.map((v,i)=>[['index','middle','ring','pinky'][i],+v]))});
   }
  }else if(m.type==='mouth'){
   const pts=[13,14,61,291].map(i=>point(result,'face.'+i,confidence));if(pts.every(Boolean)){const width=distance(pts[2],pts[3],ratio);if(width>1e-7){const aperture=distance(pts[0],pts[1],ratio)/width;put({aperture,open:+(aperture>(m.threshold??.15)),closed:+(aperture<=(m.threshold??.15))});}}
  }else if(m.type==='eyes'||m.type==='gaze'){
   let count=0,x=0,y=0;
   for(const [side,ids]of [['left',[263,362,386,374,473]],['right',[33,133,159,145,468]]]){
    const pts=ids.map(i=>point(result,'face.'+i,confidence));if(!pts.slice(0,4).every(Boolean))continue;
    const [e0,e1,up,down,iris]=pts,w=distance(e0,e1,ratio),h=distance(up,down,ratio);if(w<1e-7)continue;const aperture=h/w;
    if(m.type==='eyes'){output[prefix+side+'.aperture']=aperture;output[prefix+side+'.open']=+(aperture>(m.threshold??.15));output[prefix+side+'.closed']=+(aperture<=(m.threshold??.15));count++;}
    else if(iris&&aperture>(m.threshold??.08)&&h>1e-7){
     const ends=[metric(e0,ratio),metric(e1,ratio)].sort((a,b)=>a.x-b.x),mid={x:(ends[0].x+ends[1].x)/2,y:(ends[0].y+ends[1].y)/2},ip=metric(iris,ratio),axis={x:(ends[1].x-ends[0].x)/w,y:(ends[1].y-ends[0].y)/w};
     const gx=2*((ip.x-mid.x)*axis.x+(ip.y-mid.y)*axis.y)/w,gy=2*((ip.x-mid.x)*-axis.y+(ip.y-mid.y)*axis.x)/h;
     output[prefix+side+'.x']=gx;output[prefix+side+'.y']=gy;x+=gx;y+=gy;count++;
    }
   }
   if(count){output[prefix+'valid']=1;output[prefix+'eyes']=count;if(m.type==='gaze')Object.assign(output,{[prefix+'x']:x/count,[prefix+'y']:y/count,[prefix+'calibrated']:0});}
  }else if(m.type==='gaze_target'){
   const cal=m.calibration,box=m.box??regions(m.region),base=m.gaze??'gaze';output[prefix+'needs_calibration']=+!cal;
   if(cal&&box&&output[base+'.valid']&&finite(output[base+'.x'])&&finite(output[base+'.y'])){const x=(output[base+'.x']-cal.x_min)/(cal.x_max-cal.x_min),y=(output[base+'.y']-cal.y_min)/(cal.y_max-cal.y_min);put({x,y,inside:+(x>=box[0]&&x<=box[0]+box[2]&&y>=box[1]&&y<=box[1]+box[3]),calibrated:1});}
  }
 }
 return output;
}
export class MeasuresEngine {
 constructor(doc){this.set(doc);}
 set(doc){this.doc=parseMeasures(doc);this.rules=new RuleEngine({version:1,rules:this.doc.events});this.reset();}
 reset(){this.rules.reset();this.contacts=new Map();this.lastFrame=null;this.source=null;this.lastFeatures={};this.wasHeld=false;}
 tick(result,now,options={}){
  if(!result){this.reset();return {features:{valid:0},events:[]};}
  const signature=JSON.stringify([result.source.id,result.source.output_slot,result.source.revision,result.source.width,result.source.height]);const t=result.source.frame_timestamp_ms;
  if(signature!==this.source||t<this.lastFrame){this.reset();this.source=signature;}
  const features={valid:1,...evaluateMeasures(this.doc,result,options)};
  if(result.held){this.wasHeld=true;this.lastFrame=t;for(const r of this.doc.events)features[r.name+'.active']=this.lastFeatures[r.name+'.active']??0;for(const c of this.doc.contacts){features[c.name+'.active']=this.lastFeatures[c.name+'.active']??0;features[c.name+'.count']=this.lastFeatures[c.name+'.count']??0;}return {features,events:[]};}
  if(this.wasHeld){this.rules.reset();for(const state of this.contacts.values()){state.since=state.down=null;state.firedAt=-Infinity;}this.wasHeld=false;}
  if(t===this.lastFrame){for(const r of this.doc.events)features[r.name+'.active']=this.lastFeatures[r.name+'.active']??0;for(const c of this.doc.contacts)for(const key of ['active','count','valid'])features[c.name+'.'+key]=this.lastFeatures[c.name+'.'+key]??0;return {features,events:[]};}this.lastFrame=t;
  // Missing measure values stay absent: they can never masquerade as a zero.
  const events=this.rules.tick({...result,features},now);
  for(const c of this.doc.contacts){let state=this.contacts.get(c.name);if(!state){state={since:null,down:null,count:0,firedAt:-Infinity};this.contacts.set(c.name,state);}const v=features[c.feature];
   if(!finite(v)){state.since=state.down=null;features[c.name+'.valid']=0;features[c.name+'.active']=0;continue;}
   features[c.name+'.valid']=1;
   if(state.down===null){if(v<=c.close&&t-state.firedAt>=c.cooldown_ms){state.since??=t;if(t-state.since>=c.hold_ms){state.down=t;events.push({name:c.name+'.down',phase:'entry',timestamp_ms:t,source:result.source});}}else state.since=null;}
   else if(v>=c.open){const duration=t-state.since;events.push({name:c.name+'.up',phase:'exit',timestamp_ms:t,source:result.source,duration_ms:duration});if(duration<=c.click_ms){events.push({name:c.name+'.click',phase:'pulse',timestamp_ms:t,source:result.source,duration_ms:duration});state.count++;}if(duration<=c.tap_ms)events.push({name:c.name+'.tap',phase:'pulse',timestamp_ms:t,source:result.source,duration_ms:duration});state.down=state.since=null;state.firedAt=t;}
   features[c.name+'.active']=+(state.down!==null);features[c.name+'.count']=state.count;
  }
  for(const [i,r]of this.doc.events.entries())features[r.name+'.active']=+this.rules.states[i].active;
  this.lastFeatures=features;return {features,events};
 }
}
export const defaultMeasures={version:1,locators:[{name:'handL',points:['hands.left.thumb_tip']},{name:'fingerL',points:['hands.left.index_tip']}],measures:[{name:'nose',type:'point',a:'pose.nose'},{name:'pinch',type:'distance',a:'$handL',b:'$fingerL'}],events:[],contacts:[{name:'pinch',feature:'pinch.distance',close:.04,open:.07,hold_ms:40,tap_ms:350,click_ms:700,cooldown_ms:200}]};
