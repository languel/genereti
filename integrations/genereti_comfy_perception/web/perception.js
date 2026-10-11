import {joinStreams} from './join.js';
import {app} from '../../scripts/app.js';
import {attachExecutionMode,subscribeLive,publishLive} from '/extensions/genereti_comfy_p5/js/live-runtime.js';
import {previewControls} from '/extensions/genereti_comfy_stream/js/preview-controls.js';
import {LatestFrame,StreamRegistry,resultFor,table} from './contract.js';
import {RuleEngine,parseRules} from './rules.js';
export const streams=new StreamRegistry();
const eventListeners=new Set();
const events={subscribe(fn){eventListeners.add(fn);return ()=>eventListeners.delete(fn);},emit(event){for(const fn of eventListeners){try{fn(event);}catch(e){console.error(e);}}window.dispatchEvent(new CustomEvent('genereti-perception-event',{detail:event}));}};
window.generetiPerception={version:1,streams,events};
streams.subscribe(name=>window.dispatchEvent(new CustomEvent('genereti-perception-frame',{detail:{name}})));
const value=(n,k)=>n.widgets?.find(w=>w.name===k)?.value;
function button(bar,glyph,title,fn){const b=document.createElement('button');b.type='button';b.textContent=glyph;b.title=b.ariaLabel=title;b.onclick=fn;bar.append(b);return b;}
function statusWidget(node){const row=document.createElement('div');row.style.cssText='font-size:12px;font-variant-numeric:tabular-nums;white-space:normal';node.addDOMWidget('perception_status','GENERETI_PERCEPTION_STATUS',row,{serialize:false}).computeSize=w=>[w,Math.max(30,row.scrollHeight)];return row;}
function provider(node){
 const status=statusWidget(node),queue=new LatestFrame(),input=document.createElement('canvas'),ctx=input.getContext('2d',{willReadFrequently:true}),canvas=document.createElement('canvas');canvas.width=canvas.height=256;canvas.style.cssText='width:100%;height:auto;object-fit:contain;background:transparent';
 let worker,ready=false,running=false,dead=false,release,timer,polling=false,claimed='',loadedKind='',sourceKey='',lastSent=-Infinity,loadEpoch=0,loadMs=0,copyMs=0;
 const report=text=>status.textContent=text;
 const preview=previewControls(canvas,status,node);const surface=document.createElement('div');surface.append(preview.toolbar,canvas);node.addDOMWidget('perception_preview','GENERETI_PERCEPTION_PREVIEW',surface,{serialize:false});
 node._generetiPerception={get state(){return {running,ready,inflight:queue.inflight?.id??null,pending:!!queue.pending,revision:queue.revision,stream:claimed};}};
 node._generetiLiveSource={retain(){},release(){}};node._generetiDatTable=()=>table(streams.read(claimed,10000));
 function clear(state){queue.reset();sourceKey='';streams.update(claimed,node,null,state);}
 function stop(){running=false;release?.();release=null;clearTimeout(timer);clear('paused');input.width=input.height=1;node._generetiTransportRefresh?.();report(ready?'Paused · model loaded':'Stopped · load a task');}
 function unload(){loadEpoch++;stop();worker?.terminate();worker=null;ready=false;loadedKind='';queue.inflight=null;report('Unloaded · download ↓ · load ↑ · start ▶');}
 function pump(){
  clearTimeout(timer);if(!ready||!running||queue.inflight||!queue.pending)return;
  const wait=1000/Math.max(1,Math.min(60,Number(value(node,'max_fps'))||15))-(performance.now()-lastSent);
  if(wait>0){timer=setTimeout(pump,wait);return;}
  const meta=queue.take();const started=performance.now(),rgba=ctx.getImageData(0,0,input.width,input.height).data;meta.copyMs=copyMs+performance.now()-started;meta.sentAt=lastSent=performance.now();
  worker.postMessage({type:'frame',...meta,timestamp:meta.producedAt,rgba:rgba.buffer},[rgba.buffer]);
 }
 async function load(){
  unload();const epoch=loadEpoch,kind=value(node,'task');report('Checking optional assets…');
  try{
   const response=await fetch('/genereti/perception/status');if(!response.ok)throw Error('Perception backend unavailable; restart Comfy');const data=await response.json();if(epoch!==loadEpoch||dead)return;
   if(!data.tasks[kind]?.installed)throw Error('Download selected task and WASM runtime with ↓ first');
   const current=worker=new Worker(new URL('./segment-worker.mjs',import.meta.url));loadedKind=kind;report('Loading '+kind+' · WASM CPU…');
   current.onerror=e=>{if(current!==worker)return;unload();report('Worker failed: '+e.message);};
   current.onmessage=({data:m})=>{
    if(current!==worker){m.bitmap?.close();return;}
    if(m.type==='ready'){ready=true;loadMs=m.loadMs;report(`Loaded ${kind} · ${Math.round(loadMs)} ms · press ▶`);node._generetiTransportRefresh?.();}
    if(m.type==='error'){unload();report(m.message);}
    if(m.type==='result'){
     const meta=queue.inflight;const valid=queue.finish(m.id,m.revision);
     try{if(valid&&meta&&running&&!dead){const now=performance.now();canvas.width=meta.width;canvas.height=meta.height;canvas.getContext('2d').drawImage(m.bitmap,0,0);const result=resultFor(meta,kind,m.features,{copy:meta.copyMs,model:m.modelMs,worker:m.workerMs,roundtrip:now-meta.sentAt,cold_load:loadMs},now);streams.update(claimed,node,result);publishLive(node,canvas);preview.publish({bitmap:canvas});window.dispatchEvent(new CustomEvent('genereti-control-frame',{detail:{nodeId:node.id}}));report(`${kind} · ${Math.round(m.modelMs)} ms model · ${Math.round(result.age_ms)} ms age · ${meta.width}×${meta.height}`);}}finally{m.bitmap.close();}pump();
    }
   };current.postMessage({type:'load',task:kind});
  }catch(e){if(epoch===loadEpoch&&!dead){unload();report(e.message);}}
 }
 function start(){
  if(running){stop();return;}if(!ready){report('Load the task with ↑ first');return;}if(node._generetiExecutionMode==='Comfy Queue')return;
  try{claimed=streams.claim(value(node,'stream'),node);}catch(e){report(e.message);return;}
  running=true;lastSent=-Infinity;node._generetiTransportRefresh?.();
  const subscription=subscribeLive(node,frame=>{
   if(!running||!frame.bitmap)return;const {width,height}=frame.bitmap;
   if(width<2||height<2||Math.max(width,height)>1024){stop();report('Resize source explicitly to 2–1024 px per side');return;}
   const key=JSON.stringify([frame.nodeId,frame.outputSlot??0,width,height,frame.sourceRevision??0]);
   if(key!==sourceKey){clear('waiting');sourceKey=key;input.width=width;input.height=height;}
   const began=performance.now();ctx.clearRect(0,0,width,height);ctx.drawImage(frame.bitmap,0,0);copyMs=performance.now()-began;
   queue.offer({nodeId:frame.nodeId,outputSlot:frame.outputSlot??0,width,height,producedAt:frame.producedAt??performance.now()});pump();
  },text=>{clear('waiting');report(text);},{inputName:'image'});
  if(running)release=subscription;else subscription();
 }
 node._generetiToggleTransport=start;node._generetiTransportState=()=>({text:running?'Ⅱ':'▶',title:running?'Pause MediaPipe stream':'Start loaded MediaPipe stream · does not start camera',disabled:node._generetiExecutionMode==='Comfy Queue'});node._generetiSetExecutionMode=mode=>{if(mode==='Comfy Queue')stop();};attachExecutionMode(node);
 const bar=node._generetiExecutionModeElement;bar.append(...preview.actions.childNodes);
 const dl=button(bar,'↓','Download selected MediaPipe task and shared runtime · Apache-2.0',async()=>{unload();try{const r=await fetch('/genereti/perception/download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task:value(node,'task')})});if(!r.ok)throw Error(await r.text());report('Downloading optional assets…');}catch(e){report(e.message);}});
 button(bar,'↑','Load selected task · WASM CPU worker',load);button(bar,'↺','Reset source revision and landmark history',()=>{clear('waiting');report('Source history reset · waiting for a new frame');});button(bar,'×','Unload · terminate worker and release model memory',unload);
 const poll=setInterval(async()=>{
  if(loadedKind&&loadedKind!==value(node,'task'))unload();
  if(claimed&&claimed!==String(value(node,'stream')).trim()){stop();streams.remove(claimed,node);claimed='';}
  if(polling||dead)return;polling=true;
  try{const r=await fetch('/genereti/perception/status');if(!r.ok)return;const s=await r.json();if(dead)return;const selected=s.tasks[value(node,'task')];dl.disabled=selected?.installed||s.phase==='download';dl.textContent=selected?.installed?'✓':'↓';dl.title=dl.ariaLabel=selected?.installed?'Selected task installed':`Download ${value(node,'task')} and runtime · ${(selected?.bytes/1e6).toFixed(1)} MB · Apache-2.0`;if(s.phase==='download')report(`Download ${Math.round(s.done/s.total*100)}%`);if(s.phase==='error')report(s.detail);}catch{}finally{polling=false;}
 },1000);
 const previous=node.onRemoved;function dispose(){dead=true;unload();streams.remove(claimed,node);preview.close();clearInterval(poll);canvas.width=canvas.height=1;window.removeEventListener('pagehide',dispose);}
 node.onRemoved=function(){dispose();return previous?.apply(this,arguments);};window.addEventListener('pagehide',dispose);report('Optional task · download ↓ · load ↑ · start ▶');
}
function consumer(node,isEvents){
 const status=statusWidget(node);let dead=false,running=!isEvents,engine,config='',result=null,latestEvents=[],count=0,channels={};
 const enabled=()=>running&&node._generetiExecutionMode!=='Comfy Queue';
 node._generetiTransportState=()=>({text:running?'Ⅱ':'▶',title:running?'Pause stream reader':'Read shared stream · no camera or model start'});node._generetiToggleTransport=()=>{running=!running;engine?.reset();tick();node._generetiTransportRefresh?.();};node._generetiSetExecutionMode=()=>queueMicrotask(tick);attachExecutionMode(node);
 const picker=document.createElement('select');picker.title=picker.ariaLabel='Choose global perception stream';node._generetiExecutionModeElement.append(picker);picker.onchange=()=>{const w=node.widgets.find(w=>w.name==='stream');w.value=picker.value;w.callback?.(w.value);engine?.reset();tick();};let pickerKey='';
 let featurePicker;if(!isEvents){featurePicker=document.createElement('select');featurePicker.title=featurePicker.ariaLabel='Choose observed numeric feature';node._generetiExecutionModeElement.append(featurePicker);featurePicker.onchange=()=>{const w=node.widgets.find(w=>w.name==='feature');w.value=featurePicker.value;w.callback?.(w.value);tick();};}let featureKey='';
 node._generetiDatTable=()=>isEvents?{rows:[['event','phase','count'],...latestEvents.map(e=>[e.name,e.phase,String(count)])],jsonValue:{version:1,events:latestEvents,count,source:result?.source??null}}:table(result);
 node._generetiChop={get latest(){return {channels:Object.fromEntries(Object.entries(channels).map(([k,v])=>[k,[v]])),sample_rate:15,start:performance.now()/1000};}};
 node._generetiLiveValue=slot=>slot===1&&!isEvents?Number(channels.value??0):undefined;
 let editor;
 if(isEvents)editor=ruleEditor(node,status,()=>{config='';tick();},()=>engine);
 function tick(){
  if(dead)return;const names=[...new Set([String(value(node,'stream')??''),...streams.list().map(d=>d.name)])].filter(Boolean);const pk=JSON.stringify([names,value(node,'stream')]);if(pk!==pickerKey){pickerKey=pk;picker.replaceChildren(...names.map(n=>new Option(n,n)));picker.value=value(node,'stream');}
  const now=performance.now();result=enabled()?streams.read(value(node,'stream'),Number(value(node,'max_age_ms'))||500):null;
  if(isEvents){
   const text=value(node,'rules');if(text!==config){try{engine=new RuleEngine(text);config=text;editor?.render();}catch(e){engine?.reset();channels={valid:0,count};status.textContent=e.message;return;}}
   result=enabled()?joinStreams(streams,engine?.doc,value(node,'stream'),Number(value(node,'max_age_ms'))||500):null;
   const fired=engine?.tick(result,now)??[];if(fired.length){latestEvents=fired;for(const e of fired){if(e.phase==='entry')count++;events.emit({...e,stream:value(node,'stream'),producer_node:node.id,streams:result?.streams});}}
   channels={valid:+!!result,count,...Object.fromEntries(engine?.doc.rules.map((r,i)=>[r.name,+engine.states[i].active])??[])};
   editor?.update(result);status.textContent=!running?'Paused · edit rules, then ▶':result?`${Math.round(result.age_ms)} ms age · ${count} entries`:'Waiting for a fresh shared stream';
  }else{
   const features=[...new Set([String(value(node,'feature')??''),...Object.keys(result?.features??{})])].filter(Boolean);const fk=JSON.stringify([features,value(node,'feature')]);if(fk!==featureKey){featureKey=fk;featurePicker.replaceChildren(...features.map(n=>new Option(n,n)));featurePicker.value=value(node,'feature');}
   const scalar=result?.features[value(node,'feature')];channels={value:typeof scalar==='number'?scalar:0,valid:+(typeof scalar==='number'),age_ms:result?.age_ms??-1};
   status.textContent=result?(typeof scalar==='number'?`${value(node,'feature')} · ${scalar.toFixed(3)} · ${Math.round(result.age_ms)} ms age`:'Choose a feature available in this stream'):'Waiting for a fresh shared stream';
  }
  window.dispatchEvent(new CustomEvent('genereti-control-frame',{detail:{nodeId:node.id}}));
 }
 const unsubscribe=streams.subscribe(()=>tick()),timer=setInterval(tick,100);tick();
 const removed=node.onRemoved;node.onRemoved=function(){dead=true;clearInterval(timer);unsubscribe();return removed?.apply(this,arguments);};
}
function ruleEditor(node,status,onApply,getEngine){
 const host=document.createElement('div');host.style.cssText='display:flex;flex-direction:column;gap:6px;font-size:12px;width:100%;';const bar=document.createElement('div');bar.className='genereti-node-controls';const list=document.createElement('div');host.append(bar,list);
 const raw=node.widgets.find(w=>w.name==='rules');let doc;const progress=[];const pickers=[];
 const persist=()=>{try{doc=parseRules(doc);raw.value=JSON.stringify(doc);raw.callback?.(raw.value);onApply();node.graph?.setDirtyCanvas(true,true);}catch(e){status.textContent=e.message;}};
 const edit=(label,initial,change,type='text')=>{const el=document.createElement('input');el.type=type;if(type==='number')el.step='any';el.value=initial;el.title=el.ariaLabel=label;el.style.cssText='min-width:0;width:100%;background:var(--comfy-input-bg,#222);color:inherit;border:0;padding:4px';el.onchange=()=>{change(type==='number'?Number(el.value):el.value);persist();};return el;};
 button(bar,'+','Add event rule',()=>{doc??={version:1,rules:[]};let id=1;while(doc.rules.some(r=>r.name==='event.'+id))id++;doc.rules.push({name:'event.'+id,steps:[{feature:'pose.nose.x',op:'>',value:.5,hold_ms:120}],within_ms:1500,cooldown_ms:800});persist();});
 button(bar,'↓','Export portable perception rules JSON',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(parseRules(raw.value),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='perception-rules.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 button(bar,'↑','Import portable perception rules JSON',()=>{const f=document.createElement('input');f.type='file';f.accept='.json,application/json';f.onchange=async()=>{try{if(f.files[0].size>65536)throw Error('Rules file exceeds 64 KB');doc=parseRules(await f.files[0].text());persist();}catch(e){status.textContent=e.message;}};f.click();});
 const render=()=>{
  signature='';
  try{doc=parseRules(raw.value);}catch{return;}list.replaceChildren();progress.length=pickers.length=0;
  doc.rules.forEach((r,i)=>{
   const box=document.createElement('div');box.style.cssText='padding:6px 0;border-bottom:1px solid color-mix(in srgb,currentColor 15%,transparent)';const head=document.createElement('div');head.style.cssText='display:grid;grid-template-columns:1fr 20px';head.append(edit('Event name',r.name,v=>r.name=v));button(head,'×','Delete event rule',()=>{doc.rules.splice(i,1);persist();});box.append(head);
   r.steps.forEach((s,j)=>{
    const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:minmax(100px,1fr) 42px 56px 60px 20px;gap:2px;margin:4px 0';
    const feature=edit('Feature path, or distance:pointA,pointB',s.feature??'distance:'+s.distance.join(','),v=>{if(v.startsWith('distance:')){s.distance=v.slice(9).split(',').map(x=>x.trim());delete s.feature;}else{s.feature=v;delete s.distance;}});const dl=document.createElement('datalist');dl.id='perception-features-'+crypto.randomUUID();feature.setAttribute('list',dl.id);pickers.push(dl);
    const op=document.createElement('select');op.title=op.ariaLabel='Comparison';op.style.cssText='background:transparent;color:inherit;border:0';for(const v of ['>','<','>=','<='])op.add(new Option(v,v));op.value=s.op;op.onchange=()=>{s.op=op.value;persist();};
    row.append(feature,op,edit('Threshold · distance in image-height units',s.value,v=>s.value=v,'number'),edit('Hold milliseconds',s.hold_ms,v=>s.hold_ms=v,'number'));const del=button(row,'×','Delete step',()=>{r.steps.splice(j,1);persist();});del.disabled=r.steps.length===1;box.append(row,dl);
   });
   const foot=document.createElement('div');foot.style.cssText='display:grid;grid-template-columns:20px 1fr 1fr;gap:4px';button(foot,'+','Add sequence step',()=>{r.steps.push({feature:'pose.nose.x',op:'<',value:.5,hold_ms:120});persist();});foot.append(edit('Sequence timeout milliseconds',r.within_ms,v=>r.within_ms=v,'number'),edit('Cooldown milliseconds',r.cooldown_ms,v=>r.cooldown_ms=v,'number'));box.append(foot);
   const p=document.createElement('progress');p.max=1;p.value=0;p.style.width='100%';p.title=r.name+' sequence progress';progress.push(p);box.append(p);list.append(box);
  });
 };
 node.addDOMWidget('perception_rules_editor','GENERETI_PERCEPTION_RULES',host,{serialize:false}).computeSize=w=>[w,Math.max(100,host.scrollHeight)];
 let signature='';return {render,update(result){const keys=[...Object.keys(result?.features??{}),...streams.list().flatMap(d=>Object.keys(streams.read(d.name)?.features??{}).map(k=>d.name+'::'+k))],next=keys.join('|');if(next!==signature){signature=next;for(const dl of pickers)dl.replaceChildren(...keys.map(k=>new Option(k,k)));}getEngine()?.states.forEach((s,i)=>{if(progress[i]){progress[i].value=s.progress;progress[i].title=`${s.value??'unavailable'} · ${Math.round(s.progress*100)}%`;}});}};
}
app.registerExtension({name:'Genereti.Perception',nodeCreated(node){if(node.comfyClass==='GeneretiPerceptionProvider')provider(node);if(node.comfyClass==='GeneretiPerceptionRead')consumer(node,false);if(node.comfyClass==='GeneretiPerceptionEvents')consumer(node,true);}});
