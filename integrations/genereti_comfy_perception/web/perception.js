import {taskSelection,parseSelection} from './selection.js';
import {paintProviderImages} from './provider-images.js';
import {attachSelectionEditor} from './selection-editor.js';
import {joinStreams} from './join.js';
import {app} from '../../scripts/app.js';
import {attachExecutionMode,subscribeLive,publishLive} from '/extensions/genereti_comfy_p5/js/live-runtime.js';
import {choiceGlyph} from '/extensions/genereti_comfy_p5/js/choice-glyphs.js';
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
 const segments=node.comfyClass==='GeneretiPerceptionSegments',status=statusWidget(node),queue=new LatestFrame(),input=document.createElement('canvas'),ctx=input.getContext('2d',{willReadFrequently:true}),canvas=document.createElement('canvas'),cutout=document.createElement('canvas'),clean=document.createElement('canvas'),overlay=document.createElement('canvas');canvas.width=canvas.height=256;canvas.style.cssText='width:100%;height:auto;background:transparent';
 let worker,ready=false,running=false,dead=false,release,timer,polling=false,claimed='',loadedKind='',sourceKey='',lastSent=-Infinity,loadEpoch=0,loadMs=0,copyMs=0,sourcePaused=false;
 const report=text=>status.textContent=text;
 const selectedTasks=()=>segments?[value(node,'model')||'segment']:taskSelection(value(node,'task')||'pose',value(node,'tasks')||'');
 const signature=()=>selectedTasks().join('+');
 const preview=previewControls(canvas,status,node),surface=document.createElement('div');surface.append(preview.toolbar,canvas);node.addDOMWidget('perception_preview','GENERETI_PERCEPTION_PREVIEW',surface,{serialize:false}).computeSize=w=>[w,w*canvas.height/canvas.width+24+(selectionEditor?.details.open?selectionEditor.details.scrollHeight:0)];
 const segmentKind=()=>selectedTasks().find(k=>['segment','multiclass'].includes(k))??null;
 const selectionEditor=segments?attachSelectionEditor(node,surface,{read:()=>value(node,'regions')??'',write:names=>{const w=node.widgets.find(w=>w.name==='regions');if(w){w.value=names.join(' ');w.callback?.(w.value);node.graph?.change?.(node);}},segment:segmentKind}):null;
 node._generetiPerception={get state(){return {running,ready,inflight:queue.inflight?.id??null,pending:!!queue.pending,revision:queue.revision,stream:claimed,tasks:selectedTasks()};}};
 node._generetiLiveSource={retain(){},release(){}};node._generetiDatTable=()=>table(streams.read(claimed,10000));
 function clear(state){queue.reset();sourceKey='';streams.update(claimed,node,null,state);}
 function stop(hold=true){const previous=streams.read(claimed,Infinity);running=false;release?.();release=null;clearTimeout(timer);clear('paused');if(hold&&previous)streams.update(claimed,node,previous,'paused');input.width=input.height=1;node._generetiTransportRefresh?.();report(ready?'Paused · models loaded':'Stopped · choose tasks and load');}
 function unload(){loadEpoch++;stop(false);worker?.terminate();worker=null;ready=false;loadedKind='';queue.inflight=null;report('Unloaded · download ↓ · load ↑ · start ▶');}
 function pump(){
  clearTimeout(timer);if(!ready||!running||queue.inflight||!queue.pending)return;
  const wait=1000/Math.max(1,Math.min(60,Number(value(node,'max_fps'))||15))-(performance.now()-lastSent);
  if(wait>0){timer=setTimeout(pump,wait);return;}
  const meta=queue.take(),started=performance.now(),rgba=ctx.getImageData(0,0,input.width,input.height).data;meta.copyMs=copyMs+performance.now()-started;meta.sentAt=lastSent=performance.now();
  worker.postMessage({type:'frame',...meta,timestamp:meta.producedAt,rgba:rgba.buffer,regions:parseSelection(value(node,'regions')),threshold:Number(value(node,'threshold')??.5),softness:Number(value(node,'softness')??.1),invert:!!value(node,'invert')},[rgba.buffer]);
 }
 async function load(resume=false){
  unload();const epoch=loadEpoch;report('Checking optional assets…');
  try{
   const kinds=selectedTasks(),kind=kinds.join('+'),response=await fetch('/genereti/perception/status');if(!response.ok)throw Error('Perception backend unavailable; restart Comfy');const data=await response.json();if(epoch!==loadEpoch||dead)return;
   const missing=kinds.filter(k=>!data.tasks[k]?.installed);if(missing.length)throw Error('Download '+missing.join(' + ')+' and WASM runtime with ↓ first');
   const current=worker=new Worker(new URL('./segment-worker.mjs?v=4',import.meta.url));loadedKind=kind;report('Loading '+kind+' · WASM CPU…');
   current.onerror=e=>{if(current!==worker)return;unload();report('Worker failed: '+e.message);};
   current.onmessage=({data:m})=>{
    if(current!==worker){m.bitmap?.close();m.cutout?.close();return;}
    if(m.type==='ready'){if(m.tasks?.join('+')!==loadedKind){unload();report('Cached worker is incompatible · refresh Comfy');return;}ready=true;loadMs=m.loadMs;report('Loaded '+kind+' · '+Math.round(loadMs)+' ms · press ▶');node._generetiTransportRefresh?.();if(resume)start();}
    if(m.type==='error'){unload();report(m.message);}
    if(m.type==='result'){
     const meta=queue.inflight,valid=queue.finish(m.id,m.revision);
     try{if(valid&&meta&&running&&!dead){
      const now=performance.now(),features=m.features;
      if(segmentKind()){canvas.width=meta.width;canvas.height=meta.height;canvas.getContext('2d').drawImage(m.bitmap,0,0);}
      else paintProviderImages(clean,overlay,m.bitmap,features,meta.width,meta.height);
      const result=resultFor(meta,kind,features,{copy:meta.copyMs,model:m.modelMs,worker:m.workerMs,roundtrip:now-meta.sentAt,cold_load:loadMs},now);
      result.tasks=kinds;result.models=kinds.map(k=>({id:k,backend:'WASM CPU'}));result.timings_ms.tasks=m.taskMs;if(segmentKind())result.selection={regions:parseSelection(value(node,'regions'))};streams.update(claimed,node,result,sourcePaused?'paused':'running');
      if(segmentKind())publishLive(node,canvas);else{publishLive(node,clean,0);publishLive(node,overlay,2);refreshPreview();}if(m.cutout){cutout.width=meta.width;cutout.height=meta.height;const c=cutout.getContext('2d');c.clearRect(0,0,meta.width,meta.height);c.drawImage(m.cutout,0,0);if(segments)publishLive(node,cutout,1);}
      preview.publish({bitmap:canvas});window.dispatchEvent(new CustomEvent('genereti-control-frame',{detail:{nodeId:node.id}}));
      report(kind+' · '+Math.round(m.modelMs)+' ms total model · '+Math.round(result.age_ms)+' ms age · '+(segmentKind()?(parseSelection(value(node,'regions')).join(' + ')||'person'):'all features'));
     }}finally{m.bitmap?.close();m.cutout?.close();}pump();
    }
   };current.postMessage({type:'load',tasks:kinds});
  }catch(e){if(epoch===loadEpoch&&!dead){unload();report(e.message);}}
 }
 function start(){
  if(running){stop();return;}if(!ready){void load(true);return;}if(node._generetiExecutionMode==='Comfy Queue')return;
  try{claimed=streams.claim(value(node,'stream'),node);}catch(e){report(e.message);return;}
  running=true;sourcePaused=false;lastSent=-Infinity;node._generetiTransportRefresh?.();
  const subscription=subscribeLive(node,frame=>{
   if(!running||!frame.bitmap)return;sourcePaused=frame.held===true;const {width,height}=frame.bitmap;
   if(width<2||height<2||Math.max(width,height)>1024){stop();report('Resize source explicitly to 2–1024 px per side');return;}
   const key=JSON.stringify([frame.nodeId,frame.outputSlot??0,width,height,frame.sourceRevision??0]);if(key!==sourceKey){clear('waiting');sourceKey=key;input.width=width;input.height=height;}
   const began=performance.now();ctx.clearRect(0,0,width,height);ctx.drawImage(frame.bitmap,0,0);copyMs=performance.now()-began;queue.offer({nodeId:frame.nodeId,outputSlot:frame.outputSlot??0,width,height,producedAt:frame.producedAt??performance.now()});pump();
  },text=>{clear('waiting');report(text);},{inputName:'image'});if(running)release=subscription;else subscription();
 }
 node._generetiToggleTransport=start;node._generetiTransportState=()=>({text:running?'Ⅱ':'▶',title:running?'Pause MediaPipe stream':(ready?'Start loaded MediaPipe stream · does not start camera':'Start MediaPipe · loads installed models · does not start camera'),disabled:node._generetiExecutionMode==='Comfy Queue'});node._generetiSetExecutionMode=mode=>{if(mode==='Comfy Queue')stop(false);};attachExecutionMode(node);
 if(!segments)for(const name of ['task','tasks','features']){const w=node.widgets.find(w=>w.name===name);if(w){w.type='hidden';w.options={...w.options,hidden:true};w.computeSize=()=>[0,-4];w.draw=()=>{};}}
 const bar=node._generetiExecutionModeElement;bar.append(...preview.actions.childNodes);
 function refreshPreview(){if(segments||segmentKind()||!clean.width)return;canvas.width=clean.width;canvas.height=clean.height;const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(node.properties.generetiProviderOverlay?overlay:clean,0,0);preview.publish({bitmap:canvas});}
 function outputSockets(){if(segments)return;if(node.outputs?.[0])node.outputs[0].name='image';if(!node.outputs?.some(o=>o.name==='overlay'))node.addOutput('overlay','IMAGE');}
 outputSockets();
 const diagnostic=segments?null:button(bar,'','Show diagnostic landmarks in preview · clean image output stays unchanged',()=>{node.properties.generetiProviderOverlay=!node.properties.generetiProviderOverlay;diagnostic.setAttribute('aria-pressed',String(!!node.properties.generetiProviderOverlay));node.graph?.change?.(node);refreshPreview();});
 if(diagnostic){diagnostic.innerHTML=choiceGlyph('vertices','Landmark overlay','Feature picking');diagnostic.setAttribute('aria-pressed',String(!!node.properties.generetiProviderOverlay));}
 const toggles=[];let pipeline;
 function chooseTasks(list){const wasRunning=running,wasLoaded=ready,w=node.widgets.find(w=>w.name==='tasks');if(w){w.value=list.join(' ');w.callback?.(w.value);}selectionEditor?.render();syncTasks();node.graph?.change?.(node);if(wasLoaded||wasRunning)void load(wasRunning);else unload();}
 if(!segments){
  pipeline=document.createElement('select');pipeline.title=pipeline.ariaLabel='Tracking pipeline';pipeline.add(new Option('Holistic · coordinated pose, hands and face','holistic'));pipeline.add(new Option('Independent models · choose tasks','independent'));bar.append(pipeline);
  pipeline.onchange=()=>{if(pipeline.value==='holistic'){node.properties.generetiIndependentTasks=selectedTasks().filter(k=>['pose','hands','face'].includes(k));chooseTasks(['holistic']);}else chooseTasks(node.properties.generetiIndependentTasks?.length?node.properties.generetiIndependentTasks:['pose','hands','face']);};
  for(const task of ['pose','hands','face']){const b=button(bar,'','Include '+task+' landmarks',()=>{let list=selectedTasks().filter(k=>['pose','hands','face'].includes(k));if(list.includes(task)&&list.length>1)list=list.filter(k=>k!==task);else if(!list.includes(task))list.push(task);chooseTasks(list);});b.innerHTML=choiceGlyph(task==='pose'?'body':task==='hands'?'left':'face',task,'Anatomical selection map');toggles.push([task,b]);}
 }
 function syncTasks(){const kinds=selectedTasks();if(pipeline)pipeline.value=kinds.includes('holistic')?'holistic':'independent';for(const [task,b]of toggles){b.hidden=kinds.includes('holistic');b.style.display=b.hidden?'none':'';b.setAttribute('aria-pressed',String(kinds.includes(task)));}}
 let downloading=false;
 const dl=button(bar,'↓','Download selected MediaPipe tasks and shared runtime · Apache-2.0',async()=>{
  unload();downloading=true;
  try{for(const task of selectedTasks()){
   let s=await (await fetch('/genereti/perception/status')).json();if(s.tasks[task]?.installed)continue;
   const r=await fetch('/genereti/perception/download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task})});if(!r.ok)throw Error(await r.text());
   do{await new Promise(r=>setTimeout(r,300));if(dead)return;s=await (await fetch('/genereti/perception/status')).json();if(s.phase==='error')throw Error(s.detail);}while(s.phase==='download'||!s.tasks[task]?.installed);
  }report('Selected tasks installed · load ↑');}catch(e){report(e.message);}finally{downloading=false;}
 });
 button(bar,'↑','Load selected tasks · WASM CPU worker',()=>load());button(bar,'↺','Reset source revision and landmark history',()=>{clear('waiting');report('Source history reset · waiting for a new frame');});button(bar,'×','Unload · terminate worker and release model memory',unload);
 const poll=setInterval(async()=>{
  try{if(loadedKind&&loadedKind!==signature())unload();syncTasks();if(claimed&&claimed!==String(value(node,'stream')).trim()){stop();streams.remove(claimed,node);claimed='';}
   if(polling||dead)return;polling=true;const r=await fetch('/genereti/perception/status');if(!r.ok)return;const s=await r.json();if(dead)return;const kinds=selectedTasks(),installed=kinds.every(k=>s.tasks[k]?.installed);dl.disabled=installed||downloading||s.phase==='download';dl.textContent=installed?'✓':'↓';dl.title=dl.ariaLabel=installed?'Selected tasks installed':'Download '+kinds.join(' + ')+' and shared runtime · Apache-2.0';if(s.phase==='download')report('Download '+Math.round(s.done/s.total*100)+'%');if(s.phase==='error')report(s.detail);
  }catch(e){report(e.message);}finally{polling=false;}
 },1000);
 const sourceState=e=>{const state=e.detail;if(!running||!sourceKey)return;const key=JSON.parse(sourceKey);if(String(key[0])!==String(state.nodeId)||(key[1]??0)!==(state.outputSlot??0))return;if(state.state==='cleared'){clear('waiting');return;}sourcePaused=state.state==='paused';const previous=streams.read(claimed,Infinity);streams.update(claimed,node,state.state==='cleared'?null:previous,sourcePaused?'paused':'running');};window.addEventListener('genereti-live-state',sourceState);
 const configured=node.onConfigure;node.onConfigure=function(info){const r=configured?.apply(this,arguments);if(!segments&&!info?.widgets_values_named?.tasks&&Array.isArray(info?.widgets_values)&&info.widgets_values.length<=4){const w=node.widgets.find(w=>w.name==='tasks');if(w)w.value='';}outputSockets();if(diagnostic)diagnostic.setAttribute('aria-pressed',String(!!node.properties.generetiProviderOverlay));syncTasks();return r;};
 const previous=node.onRemoved;function dispose(){dead=true;window.removeEventListener('genereti-live-state',sourceState);unload();streams.remove(claimed,node);preview.close();clearInterval(poll);canvas.width=canvas.height=cutout.width=cutout.height=clean.width=clean.height=overlay.width=overlay.height=1;window.removeEventListener('pagehide',dispose);}
 node.onRemoved=function(){dispose();return previous?.apply(this,arguments);};window.addEventListener('pagehide',dispose);syncTasks();report('Optional models · download ↓ · start ▶');
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
app.registerExtension({name:'Genereti.Perception',nodeCreated(node){if(['GeneretiPerceptionProvider','GeneretiPerceptionSegments'].includes(node.comfyClass))provider(node);if(node.comfyClass==='GeneretiPerceptionRead')consumer(node,false);if(node.comfyClass==='GeneretiPerceptionEvents')consumer(node,true);}});
