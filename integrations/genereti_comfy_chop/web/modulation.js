import {visualNodeControls} from '/extensions/genereti_comfy_stream/js/node-output-view.js';
import {app} from '../../scripts/app.js';
import {ensureControlStyle} from '/extensions/genereti_comfy_p5/js/control-style.js';
import {quarterNotes,wave,smooth,validateGesture,gestureAt} from './modulation-core.js';

const states=new Set();let raf;
function text(element,value){if(element.textContent!==value)element.textContent=value;}
function attr(element,name,value){if(element.getAttribute(name)!==value)element.setAttribute(name,value);}
function style(element,name,value){if(element.style[name]!==value)element.style[name]=value;}
function values(node){const out=Object.fromEntries(node.widgets.filter(w=>['number','string','boolean'].includes(typeof w.value)).map(w=>[w.name,w.value]));for(let i=0;i<node.inputs.length;i++){const l=node.getInputLink?.(i);if(!l)continue;const source=node.graph?.getNodeById(l.origin_id),v=source?._generetiLiveValue?.(l.origin_slot);if(v!==undefined)out[node.inputs[i].widget?.name??node.inputs[i].name]=v;else if(['PrimitiveFloat','PrimitiveInt','PrimitiveBoolean'].includes(source?.comfyClass))out[node.inputs[i].widget?.name??node.inputs[i].name]=source.widgets.find(w=>w.name==='value')?.value;}return Object.assign(out,node._generetiPerformanceValues??{});}
function set(node,name,value){const w=node.widgets.find(w=>w.name===name);if(w){w.value=value;w.callback?.(value);}node.setDirtyCanvas?.(true,true);}
function button(glyph,title,action){const b=document.createElement('button');b.textContent=glyph;b.title=b.ariaLabel=title;b.type='button';b.onclick=action;return b;}
function tick(now){for(const s of states){try{s.update(now);}catch(error){s.status.textContent=error.message;}}raf=states.size?requestAnimationFrame(tick):undefined;}
function rangeControl(node,axis,state){
 const box=document.createElement('div');box.style.cssText='display:flex;align-items:center;gap:6px';const label=document.createElement('span');label.textContent=axis;label.style.fontSize='11px';const range=document.createElement('input');range.type='range';range.min=0;range.max=1;range.step=.001;range.value=.5;range.ariaLabel=`Gesture ${axis.toUpperCase()}`;range.title='Drag to perform or record. Cmd/Ctrl-drag the left/right corner to adjust low/high range.';range.style.cssText='min-width:0;flex:1;accent-color:var(--input-text);touch-action:none';const readout=document.createElement('span');readout.style.cssText='font:11px monospace;min-width:40px';box.append(label,range,readout);
 let edit;
 range.addEventListener('pointerdown',e=>{
  e.stopPropagation();const r=range.getBoundingClientRect(),p=(e.clientX-r.left)/r.width;
  if((e.metaKey||e.ctrlKey)&&(p<.18||p>.82)){e.preventDefault();const v=values(node);edit={name:axis+(p<.18?'_low':'_high'),start:e.clientX,value:v[axis+(p<.18?'_low':'_high')],span:Math.max(.01,Math.abs(v[axis+'_high']-v[axis+'_low']))};range.setPointerCapture(e.pointerId);return;}
  state.begin();
 });
 range.oninput=()=>{state.manual[axis==='x'?0:1]=Number(range.value);state.append();};
 range.addEventListener('pointermove',e=>{if(edit){e.preventDefault();const v=values(node),next=edit.value+(e.clientX-edit.start)/100*edit.span;set(node,edit.name,edit.name.endsWith('_low')?Math.min(v[axis+'_high']-.001,next):Math.max(v[axis+'_low']+.001,next));}});
 const end=e=>{e.stopPropagation();if(edit){edit=null;return;}state.finish();};range.addEventListener('pointerup',end);range.addEventListener('pointercancel',end);range.addEventListener('lostpointercapture',()=>{edit=null;});
 return {box,range,readout,axis};
}
app.registerExtension({name:'Genereti.Modulation',nodeCreated(node){
 if(!['GeneretiChopLfo','GeneretiChopGesture'].includes(node.comfyClass))return;
 ensureControlStyle();node.properties??={};const gesture=node.comfyClass==='GeneretiChopGesture';
 const surface=document.createElement('div');surface.style.cssText='display:flex;flex-direction:column;gap:6px;width:100%;color:var(--input-text)';
 const tools=document.createElement('div');tools.className='genereti-node-controls';
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=gesture?300:120;canvas.style.cssText='display:block;width:100%;height:auto;touch-action:none;cursor:crosshair;background:color-mix(in srgb,var(--input-text) 4%,transparent);border:1px solid var(--border-color);border-radius:4px';canvas.ariaLabel=gesture?'Gesture recording pad':'LFO waveform';
 const status=document.createElement('span');status.style.cssText='font-size:11px;font-variant-numeric:tabular-nums';status.setAttribute('role','status');surface.append(tools,canvas);
 const state={node,status,manual:[.5,.5],playing:!gesture,armed:false,capturing:false,latest:null,running:false,previous:[],start:performance.now()/1000,phase:0,clip:validateGesture({version:1,duration:1,points:[]})};
 const play=button(gesture?'▶':'Ⅱ',gesture?'Play or pause recorded gesture':'Pause or resume LFO',()=>{
  if(gesture&&state.capturing)state.finish();
  if(gesture&&!state.clip.points.length){status.textContent='Record a gesture first';return;}
  state.playing=!state.playing;state.previous=[];state.start=performance.now()/1000;
  const v=values(node),s=window.generetiPerformance?.clock.read();state.anchor=s?.quarterNotes??0;state.lastClock=s;
  state.pending=gesture&&state.playing&&v.interval!=='free'&&v.quantize&&s?{...window.generetiPerformance.clock.nextBoundary(v.interval)}:null;
  if(!gesture)state.start-=state.phase*Math.max(.001,Number(v.period))/Number(v.speed);
 });tools.append(play);
 if(gesture){
  const record=button('●','Arm gesture recording · drag the pad or a slider',()=>{if(state.capturing){state.finish();return;}state.armed=!state.armed;state.playing=false;record.setAttribute('aria-pressed',String(state.armed));status.textContent=state.armed?'Armed · drag to record':'Recording disarmed';});state.recordButton=record;
  tools.prepend(record);tools.append(button('↶','Restart gesture playback',()=>{state.playing=false;play.click();}),button('×','Clear recorded gesture',()=>{state.playing=false;state.armed=false;state.capturing=false;state.clip={version:1,duration:1,points:[]};set(node,'recording',JSON.stringify(state.clip));}));
  const hidden=node.widgets.find(w=>w.name==='recording');hidden.type='hidden';hidden.options={...hidden.options,hidden:true};hidden.computeSize=()=>[0,-4];hidden.serializeValue=()=>JSON.stringify(state.capturing?state.draftClip():state.clip);
  state.draftClip=()=>({version:1,duration:Math.max(.001,performance.now()/1000-state.recordStart),points:state.points});
  state.begin=()=>{state.playing=false;if(!state.armed||state.capturing)return;state.recordStart=performance.now()/1000;state.points=[];state.capturing=true;state.append();};
  state.append=()=>{if(!state.capturing)return;const t=performance.now()/1000-state.recordStart;if(t>=600||state.points.length>=8191){state.finish();return;}state.points.push({t,x:state.manual[0],y:state.manual[1]});};
  state.finish=()=>{if(!state.capturing)return;const duration=Math.max(.001,Math.min(600,performance.now()/1000-state.recordStart));state.points.push({t:duration,x:state.manual[0],y:state.manual[1]});state.clip=validateGesture({version:1,duration,points:state.points});state.capturing=false;state.armed=false;set(node,'recording',JSON.stringify(state.clip));state.recordButton.setAttribute('aria-pressed','false');status.textContent=`Saved ${duration.toFixed(2)} s · press Play`;};
  let pointer;
  function move(e){const r=canvas.getBoundingClientRect(),v=values(node);if(v.mode!=='Y')state.manual[0]=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));if(v.mode!=='X')state.manual[1]=Math.max(0,Math.min(1,1-(e.clientY-r.top)/r.height));state.append();}
  canvas.onpointerdown=e=>{e.preventDefault();e.stopPropagation();pointer=e.pointerId;canvas.setPointerCapture(pointer);move(e);state.begin();};
  canvas.onpointermove=e=>{if(pointer===e.pointerId){e.preventDefault();move(e);}};
  canvas.onpointerup=e=>{if(pointer!==e.pointerId)return;move(e);pointer=null;state.finish();};canvas.onpointercancel=()=>{pointer=null;state.finish();};canvas.onlostpointercapture=()=>{pointer=null;state.finish();};
  state.sliders=['x','y'].map(axis=>rangeControl(node,axis,state));for(const s of state.sliders)surface.append(s.box);
  const configured=node.onConfigure;node.onConfigure=function(){const r=configured?.apply(this,arguments);state.playing=false;state.armed=false;state.capturing=false;try{state.clip=validateGesture(node.widgets.find(w=>w.name==='recording').value);}catch(error){status.textContent=error.message;}return r;};
 }else {
  tools.append(button('↶','Reset free LFO phase',()=>{state.start=performance.now()/1000;state.phase=0;state.previous=[];}));
  let pointer;const shift=e=>{const r=canvas.getBoundingClientRect();set(node,'phase',(e.clientX-r.left)/r.width-(state.phase-Math.floor(state.phase)));};
  canvas.title='Drag the waveform to shift phase';canvas.onpointerdown=e=>{e.preventDefault();e.stopPropagation();pointer=e.pointerId;canvas.setPointerCapture(pointer);shift(e);};canvas.onpointermove=e=>{if(pointer===e.pointerId)shift(e);};canvas.onpointerup=canvas.onpointercancel=()=>pointer=null;
 }
 tools.append(button('▷','Play or pause shared project transport',()=>{const clock=window.generetiPerformance?.clock;if(clock)clock.read().playing?clock.pause():clock.play();}),button('▥','Open project timeline',()=>app.extensionManager.command.execute('Workspace.ToggleBottomPanelTab.genereti-timeline')));
 visualNodeControls(node,canvas,tools);
 surface.append(status);
 node.addDOMWidget('modulation_controls','GENERETI_MODULATION',surface,{serialize:false,hideOnZoom:false}).computeSize=w=>[w,gesture?Math.max(0,w-24)*(values(node).mode==='XY'?300:120)/512+110:Math.max(0,w-24)*120/512+50];
 node._generetiChop=state;node._generetiLiveValue=slot=>gesture?(slot===0?state.latest:slot===1?state.output?.[0]:slot===2?state.output?.[1]:slot===3?state.output?.[values(node).mode==='Y'?1:0]:undefined):(slot===0?state.latest:slot===1?state.output?.[0]:undefined);
 state.update=now=>{
  const v=values(node),s=window.generetiPerformance?.clock.read(),free=v.interval==='free',dt=state.last===undefined?0:Math.min(.1,(now-state.last)/1000);state.last=now;
  if(state.pending){if(s?.epoch!==state.pending.epoch||s?.iteration!==state.pending.iteration){state.pending=null;state.playing=false;status.textContent='Launch cancelled · transport changed';}else if(s.quarterNotes>=state.pending.quarterNotes){state.anchor=state.pending.quarterNotes;state.pending=null;}}
  if(state.playing&&!state.pending){
   if(gesture){if(!free&&state.lastClock&&(s?.quarterNotes<state.lastClock.quarterNotes||s?.iteration!==state.lastClock.iteration))state.anchor=s.quarterNotes;state.phase=(free?(now/1000-state.start)/state.clip.duration:((s?.quarterNotes??0)-state.anchor)/quarterNotes(v.interval,s?.signature))*Number(v.speed);state.manual=gestureAt(state.clip,state.phase,Boolean(v.loop));if(!v.loop&&state.phase>=1)state.playing=false;}
   else state.phase=(free?(now/1000-state.start)/Math.max(.001,Number(v.period)):(s?.quarterNotes??0)/quarterNotes(v.interval,s?.signature))*Number(v.speed);
  }
  state.lastClock=s;const raw=gesture?state.manual:[wave(v.wave,state.phase+Number(v.phase),Number(v.seed))];
  state.output=raw.map((x,i)=>{const key=i?'y':'x',low=Number(v[gesture?key+'_low':'low']),high=Number(v[gesture?key+'_high':'high']);return smooth(state.previous[i],low+(high-low)*x,dt,Number(v.smooth));});state.previous=state.output;
  state.latest={channels:gesture?{x:new Float32Array([state.output[0]]),y:new Float32Array([state.output[1]])}:{lfo:new Float32Array([state.output[0]])},sampleRate:60,start:now/1000};
  window.dispatchEvent(new CustomEvent('genereti-control-frame',{detail:{nodeId:node.id}}));
  text(play,state.playing?'Ⅱ':'▶');attr(play,'aria-pressed',String(state.playing));
  if(gesture&&state.mode!==v.mode){state.mode=v.mode;canvas.height=v.mode==='XY'?300:120;node.setSize?.([node.size[0],Math.max(node.size[1],node.computeSize()[1])]);}
  if(gesture){attr(state.recordButton,'aria-pressed',String(state.armed));for(const slider of state.sliders){style(slider.box,'display',v.mode==='XY'||v.mode===slider.axis.toUpperCase()?'flex':'none');const value=String(state.manual[slider.axis==='x'?0:1]);if(document.activeElement!==slider.range&&slider.range.value!==value)slider.range.value=value;if(now-(state.readoutTime??0)>=100)text(slider.readout,state.output[slider.axis==='x'?0:1].toFixed(3));}style(canvas,'opacity',v.mode==='XY'?'1':'.65');}if(now-(state.readoutTime??0)>=100)state.readoutTime=now;
  { const paintKey=JSON.stringify([state.phase,raw,state.output.map(x=>x.toFixed(3)),v.wave,v.phase,v.seed,v.mode,v.interval,state.armed,Boolean(state.pending),s?.playing,state.capturing?state.points.length:0]);if(paintKey===state.paintKey&&state.paintedClip===state.clip&&!state.capturing)return;state.nextPaintKey=paintKey;}
  if(now-(state.paintTime??0)<40)return;state.paintTime=now;state.paintKey=state.nextPaintKey;state.paintedClip=state.clip;
  // Read theme color occasionally, before painting; avoid a style flush every frame.
  if(!state.foreground||now-(state.themeTime??0)>1000){state.foreground=getComputedStyle(surface).color;state.themeTime=now;}
  const ctx=canvas.getContext('2d'),fg=state.foreground;ctx.clearRect(0,0,512,canvas.height);ctx.strokeStyle=fg;ctx.fillStyle=fg;ctx.lineWidth=2;
  ctx.beginPath();if(gesture){const pts=state.capturing?state.points:state.clip.points;pts.forEach((p,i)=>{const x=(v.mode==='XY'?p.x:p.t/state.clip.duration)*512,y=(1-(v.mode==='X'?p.x:p.y))*canvas.height;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});}else for(let i=0;i<=512;i++){const y=(1-wave(v.wave,Math.floor(state.phase)+i/512+Number(v.phase),Number(v.seed)))*110+5;i?ctx.lineTo(i,y):ctx.moveTo(i,y);}ctx.stroke();
  const point=gesture?(v.mode==='XY'?state.manual:[Math.max(0,state.phase-Math.floor(state.phase)),state.manual[v.mode==='Y'?1:0]]):[state.phase-Math.floor(state.phase),raw[0]];ctx.beginPath();ctx.arc(point[0]*512,gesture?(1-point[1])*canvas.height:(1-point[1])*110+5,5,0,Math.PI*2);ctx.fill();
  text(status,state.capturing?`Recording · ${(now/1000-state.recordStart).toFixed(2)} s`:state.armed?'Armed · drag to record':state.pending?'Waiting for musical boundary':`${gesture?state.clip.duration.toFixed(2)+' s gesture':state.output[0].toFixed(3)} · ${free?'free time':v.interval+' · project '+(s?.playing?'running':'paused')}${gesture&&!state.clip.points.length?' · press Record then drag':''}`);
 };
 states.add(state);if(!raf)raf=requestAnimationFrame(tick);
 const removed=node.onRemoved;node.onRemoved=function(){states.delete(state);return removed?.apply(this,arguments);};
}});
