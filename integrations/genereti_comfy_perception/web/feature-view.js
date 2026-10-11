import {app} from '../../scripts/app.js';
import {streams} from './perception.js';
import {pointsFor,selectedFeatures,nearestPoint} from './features.js';
import {table} from './contract.js';
import {attachExecutionMode,publishLive} from '/extensions/genereti_comfy_p5/js/live-runtime.js';
import {previewControls} from '/extensions/genereti_comfy_stream/js/preview-controls.js';
const value=(n,k)=>n.widgets?.find(w=>w.name===k)?.value;
app.registerExtension({name:'Genereti.PerceptionFeatures',nodeCreated(node){
 if(node.comfyClass!=='GeneretiPerceptionFeatures')return;
 const host=document.createElement('div'),canvas=document.createElement('canvas'),status=document.createElement('span'),ctx=canvas.getContext('2d');canvas.width=640;canvas.height=360;canvas.style.cssText='width:100%;height:auto;touch-action:none';status.style.cssText='font:11px monospace';
 const preview=previewControls(canvas,status,node);host.append(preview.toolbar,canvas,status);let running=true,dead=false,claimed='',result=null,selected=null,points=[],channels={},lastKey='';
 const names=()=>String(value(node,'features')??'').split(/[\s,]+/).filter(Boolean);
 const write=next=>{const w=node.widgets.find(w=>w.name==='features');w.value=next.join(' ');w.callback?.(w.value);node.graph?.change?.(node);tick();};
 const choices=document.createElement('select');choices.title=choices.ariaLabel='Choose stream feature to add';choices.onchange=()=>{if(choices.value)write([...new Set([...names(),choices.value])]);};
 const clear=document.createElement('button');clear.textContent='×';clear.title=clear.ariaLabel='Clear selected features';clear.onclick=()=>write([]);preview.toolbar.append(choices,clear);
 node._generetiTransportState=()=>({text:running?'Ⅱ':'▶',title:running?'Pause feature selection stream':'Read features · no camera or model start'});node._generetiToggleTransport=()=>{running=!running;tick();};node._generetiSetExecutionMode=()=>queueMicrotask(tick);attachExecutionMode(node);
 node._generetiChop={get latest(){return {channels:Object.fromEntries(Object.entries(channels).map(([k,v])=>[k,[v]])),sample_rate:15,start:performance.now()/1000};}};node._generetiDatTable=()=>table(selected);node._generetiLiveSource={retain(){},release(){}};
 canvas.onpointermove=e=>{const r=canvas.getBoundingClientRect(),p=nearestPoint(points,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height,r.width,r.height);canvas.title=p?`${p.name} · click to select · Shift-click adds/removes`: 'Select a landmark or choose a feature above';};
 canvas.onpointerdown=e=>{e.preventDefault();e.stopPropagation();const r=canvas.getBoundingClientRect(),p=nearestPoint(points,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height,r.width,r.height);if(!p)return;let next=names();write(e.shiftKey?(next.includes(p.name)?next.filter(n=>n!==p.name):[...next,p.name]):[p.name]);};
 function tick(){
  if(dead)return;const output=String(value(node,'selection_stream')??'').trim();if(output!==claimed){streams.remove(claimed,node);claimed='';}if(output&&!claimed){try{if(output===value(node,'stream'))throw Error('Selection stream must differ from input stream');claimed=streams.claim(output,node);}catch(e){channels={valid:0};selected=null;status.textContent=e.message;return;}}
  result=running&&node._generetiExecutionMode!=='Comfy Queue'?streams.read(value(node,'stream'),Number(value(node,'max_age_ms'))||500):null;
  const confidence=Number(value(node,'min_confidence'))||0;points=pointsFor(result,confidence);const wanted=names(),f=selectedFeatures(result,wanted,confidence);channels={valid:+!!result,...f};selected=result?{...result,features:f,selection:{names:wanted,input_stream:value(node,'stream')}}:null;
  if(claimed){const old=streams.read(claimed,10000),key=JSON.stringify([result?.source,wanted,f,running]);if(key!==lastKey||!old&&selected){lastKey=key;streams.update(claimed,node,selected,selected?'running':'waiting');}}
  const keys=[...new Set([...wanted,...points.map(p=>p.name),...Object.keys(result?.features??{}).filter(k=>!/[.](x|y|z|presence|visibility)$/.test(k))])];const sig=keys.join('|');if(choices.dataset.keys!==sig){choices.dataset.keys=sig;choices.replaceChildren(new Option('Add feature…',''),...keys.map(k=>new Option(k,k)));}
  const w=result?.source.width??640,h=result?.source.height??360;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.clearRect(0,0,w,h);
  ctx.strokeStyle='rgba(160,160,160,.18)';ctx.lineWidth=1;for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(w*i/4,0);ctx.lineTo(w*i/4,h);ctx.moveTo(0,h*i/4);ctx.lineTo(w,h*i/4);ctx.stroke();}
  const lookup=new Map(points.map(p=>[p.name,p]));const edges=[['left_shoulder','right_shoulder'],['left_shoulder','left_elbow'],['left_elbow','left_wrist'],['right_shoulder','right_elbow'],['right_elbow','right_wrist'],['left_shoulder','left_hip'],['right_shoulder','right_hip'],['left_hip','right_hip'],['left_hip','left_knee'],['left_knee','left_ankle'],['right_hip','right_knee'],['right_knee','right_ankle']];ctx.strokeStyle='rgba(180,190,200,.65)';for(const [a,b]of edges){const p=lookup.get('pose.'+a),q=lookup.get('pose.'+b);if(p&&q){ctx.beginPath();ctx.moveTo(p.x*w,p.y*h);ctx.lineTo(q.x*w,q.y*h);ctx.stroke();}}
  for(const p of points){ctx.fillStyle=wanted.includes(p.name)?'#f6ba60':'#72d3c1';ctx.beginPath();ctx.arc(p.x*w,p.y*h,wanted.includes(p.name)?6:3,0,Math.PI*2);ctx.fill();if(wanted.includes(p.name)){ctx.font='12px monospace';ctx.fillText(p.name,Math.max(0,Math.min(w-180,p.x*w+9)),Math.max(14,p.y*h-8));}}
  status.textContent=result?`${points.length} points · ${wanted.length} selected · ${Math.round(result.age_ms)} ms age`:'Waiting for fresh landmarks · start a provider';publishLive(node,canvas,2);preview.publish({bitmap:canvas});
 }
 const widget=node.addDOMWidget('feature_view','GENERETI_PERCEPTION_FEATURES',host,{serialize:false});widget.computeSize=w=>[w,w*canvas.height/canvas.width+64];
 // Publishing selection emits registry notifications; interval avoids recursive subscriptions.
 const timer=setInterval(tick,100);queueMicrotask(tick);const previous=node.onRemoved;node.onRemoved=function(){dead=true;clearInterval(timer);streams.remove(claimed,node);preview.close();return previous?.apply(this,arguments);};
}});
