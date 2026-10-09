import {attachExpressionParameters} from '/extensions/genereti_comfy_texture/expression-controls.js';
import { app } from '../../scripts/app.js';
import { attachExecutionMode, subscribeLive } from '/extensions/genereti_comfy_p5/js/live-runtime.js';
import { previewState } from '/extensions/genereti_comfy_p5/js/preview-state.js';
import { previewControls } from '/extensions/genereti_comfy_stream/js/preview-controls.js';
import { textureGPU, parameters } from './texture-gpu.js';
import { readTextureValues } from './texture-parameters.js';
import { referenceFor, resolveReference, FrameLatch } from './texture-reference.js';

function valuesFor(node,kind){const values=readTextureValues(node);if(kind==='Expression'){const expression=node._generetiExpressionValues?.();if(expression){values.expression=expression.source;values.expressionParameters=expression.values;}}if(kind==='Feedback')values.blend??=node.properties?.generetiFeedbackBlend??'screen';return values;}

const states=new Map(),dirty=new Set(),copyParams=new Float32Array(48);let clock=0,flushing=false;
function schedule(state){if(state.dead||!state.users||state.node._generetiLivePaused||state.node._generetiExecutionMode==='Comfy Queue')return;dirty.add(state);if(!clock&&!flushing)clock=requestAnimationFrame(flush);}
function flush(now){
 clock=0;flushing=true;const done=new Set(),visiting=new Set();
 const run=state=>{
  if(done.has(state)||!dirty.has(state)||state.dead)return;
  if(visiting.has(state)){state.status.textContent='Live texture cycles are not supported · use Feedback history';dirty.delete(state);return;}
  visiting.add(state);
  for(const input of state.node.inputs??[]){const link=state.node.graph?.links?.[input.link];const upstream=states.get(state.node.graph?.getNodeById(link?.origin_id));if(upstream)run(upstream);}
  visiting.delete(state);dirty.delete(state);done.add(state);
  if(!state.users||state.node._generetiLivePaused||state.node._generetiExecutionMode==='Comfy Queue')return;
  try{state.render(now);}catch(error){state.status.textContent=error.message;if(state.performancePanel)state.performancePanel.open=true;}
 };
 for(const state of dirty)run(state);
 // Temporal edges become visible only after the complete graph tick.
 for(const state of states.values())if(state.latch?.commit())schedule(state);
 flushing=false;
 for(const state of states.values())if((state.kind==='Expression'||state.kind==='Noise'&&Number(valuesFor(state.node,state.kind).speed)!==0||state.kind==='FeedbackRef'&&state.referenceKey||state.kind==='Feedback'&&state.inputs[0]))schedule(state);
 if(dirty.size&&!clock)clock=requestAnimationFrame(flush);
}

window.addEventListener('genereti-control-frame',event=>{for(const state of states.values())if(state.node.inputs?.some(input=>input.type!=='IMAGE'&&state.node.graph?.links?.[input.link]?.origin_id===event.detail.nodeId))schedule(state);});

// One low-rate poll covers built-in scalar wires and source-independent edits.
setInterval(()=>{for(const state of states.values())if(state.users&&!state.dead&&JSON.stringify(valuesFor(state.node,state.kind))!==state.signature)schedule(state);},250);

app.registerExtension({name:'Genereti.Textures',nodeCreated(node){
 if(!node.comfyClass?.startsWith('GeneretiTexture'))return;
 const kind=node.comfyClass.slice('GeneretiTexture'.length),prefix=`texture:${node.id}:${crypto.randomUUID()}:`;
 if(kind==='Expression')attachExpressionParameters(node);
 const surface=document.createElement('div');surface.className='genereti-live-surface genereti-texture-surface';surface.style.cssText='display:flex;flex-direction:column;gap:4px;width:100%';
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;canvas.style.cssText='display:block;width:100%;height:auto;aspect-ratio:1;object-fit:contain;background:transparent';
 const status=document.createElement('span');status.style.cssText='font-size:11px;font-variant-numeric:tabular-nums';status.textContent='Initializing WebGPU';
 const preview=document.createElement('div');preview.style.cssText='position:relative;width:100%;overflow:hidden;aspect-ratio:1';preview.append(canvas);
 const local=previewState(node,preview,{capture:()=>{
   if(!frame)throw Error('Run the source before freezing its preview');
   // WebGPU canvas swap buffers expire after presentation. Freeze a one-shot
   // snapshot from the last GPU texture, rather than relying on that swap buffer.
   const snapshot=document.createElement('canvas');gpu.present(frame,snapshot);
   try{return snapshot.toDataURL('image/png');}finally{gpu.releaseCanvas(snapshot);}
 },getFit:()=>node.properties?.genereti_preview_fit??'contain'});
 let gpu,frame,presentationCanvas,presentedFrame,output,localRunning=true,reset=true,history=0,lastStatus=0,times=[];
 const state={node,kind,status,dead:false,users:0,inputs:[],inputKeys:[],stops:[],render(now){
  if(!gpu||(!state.inputs[0]&&!['Expression','Noise','FeedbackRef'].includes(kind)))return;
  const values=valuesFor(node,kind);const signature=JSON.stringify(values);
  if(kind==='FeedbackRef')bindReference(values.reference);
  if(state.signature!==signature){state.params=parameters(kind,values);state.signature=signature;}
  const p=state.params;
  const transport=window.generetiPerformance,linked=transport?.linked(node),snapshot=transport?.clock.read();if(linked&&frame&&state.lastPerformanceTime===snapshot.seconds&&state.lastPerformanceEpoch===snapshot.epoch&&state.lastPerformanceIteration===snapshot.iteration&&state.lastSignature===signature&&state.lastPerformanceRevision===transport.revision&&['Expression','Noise','Feedback','FeedbackRef'].includes(kind)&&(!state.inputs[0]||kind.startsWith('Feedback')))return;state.lastPerformanceRevision=transport?.revision;state.signatureUnchanged=state.lastSignature===signature;state.lastSignature=signature;state.lastPerformanceTime=snapshot?.seconds;state.lastPerformanceEpoch=snapshot?.epoch;state.lastPerformanceIteration=snapshot?.iteration;
  const a=(kind==='FeedbackRef'?state.latch.current:null)??state.inputs[0]??gpu.target(prefix+'empty',Number(values.width),Number(values.height)),b=state.inputs[1];
  if(['Composite','Displace'].includes(kind)&&!b){status.textContent=kind==='Displace'?'Connect a live displacement map':'Connect a live background';return;}
  if(kind==='Math')p[3]=b?1:0;
  let previous=b;
  if(kind==='Feedback'){
    if(reset||!frame||frame.width!==a.width||frame.height!==a.height){gpu.release(prefix+'history');frame=null;reset=false;history=0;}
    previous=frame??gpu.target(prefix+'history:empty',a.width,a.height);
    history=1-history;
  }
  if(kind==='Expression'||kind==='Noise'){
   if(kind==='Noise')values.expression=`noise:${values.algorithm}:${values.dimensions}`;
   if(state.expression!==values.expression){state.expression=values.expression;state.expressionPipeline=null;const source=values.expression;(kind==='Noise'?gpu.noisePipeline(values.algorithm,values.dimensions):gpu.expressionPipeline(source)).then(pipeline=>{if(state.dead||state.expression!==source)return;state.expressionPipeline=pipeline;schedule(state);}).catch(error=>{if(state.expression===source)status.textContent=error.message;});}
   if(!state.expressionPipeline)return;
   p.set([(window.generetiPerformance?.timeFor(node,now)??now/1000)+Number(values.time)+Number(values.offset_t??0),a.width,a.height,state.inputs[0]?1:0]);
   if(kind==='Expression')p.set(values.expressionParameters??[],20);
   const global=window.generetiPerformance?.expressionValues()??{};p.set(['g_time','g_beat','g_bar','g_bpm','g_ticks','g_phase','g_playing','g_rate','g_root','g_tuning'].map(k=>Number(global[k]??(k==='g_bpm'?120:k==='g_tuning'?440:k==='g_rate'?1:0))),4);p[14]=Number(values.offset_x??0);p[15]=Number(values.offset_y??0);p[16]=Number(values.offset_z??0);
   if(kind==='Noise')p.set([Number(values.scale),Number(values.seed),Number(values.z),Number(values.speed),Number(values.octaves),Number(values.lacunarity),Number(values.gain),+(values.color==='RGB')],20);
   frame=gpu.expression(a,p,prefix+'output',a.width,a.height,state.expressionPipeline);
  }else if(kind==='Bloom'){
   const stage=state.bloomParams??=new Float32Array(48);stage[0]=9;stage[2]=values.threshold;
   const bright=gpu.run(a,null,stage,prefix+'bloom:bright');stage[0]=11;stage[2]=values.radius;
   const horizontal=gpu.run(bright,null,stage,prefix+'bloom:horizontal');stage[0]=12;
   const blurred=gpu.run(horizontal,null,stage,prefix+'bloom:blurred');frame=gpu.run(a,blurred,p,prefix+'output');
  }else frame=gpu.run(a,previous,p,prefix+(kind==='Feedback'?`history:${history}`:'output'));
  frame={...frame,producedAt:now};presentedFrame=null;
  if(local.visible){const aspect=`${frame.width}/${frame.height}`,changed=preview.style.aspectRatio.replaceAll(' ','')!==aspect;if(changed)preview.style.aspectRatio=canvas.style.aspectRatio=aspect;gpu.present(frame,canvas);if(changed)node.setSize?.([node.size[0],Math.max(node.size[1],node.computeSize()[1])]);}
  // Viewers share one presentation conversion, created lazily at the boundary.
  window.dispatchEvent(new CustomEvent('genereti-live-frame',{detail:{nodeId:node.id,outputSlot:0,texture:frame,producedAt:now}}));
  if(outputOpened())output.publish({bitmap:present(frame)});
  if(times.length&&now-times.at(-1)>2000)times=[];times.push(now);while(times.length>2&&times[0]<now-2000)times.shift();
  if(now-lastStatus>250){const fps=times.length>1?(1000*(times.length-1)/(now-times[0])).toFixed(1):'—';status.textContent=kind==='FeedbackRef'&&!state.latch.current?'Pick a live reference · seed / empty frame':`${fps} fps · WebGPU · ${a.width} × ${a.height}${kind==='FeedbackRef'?' · previous frame':''}`;lastStatus=now;}
 }};
 if(kind==='FeedbackRef')state.latch=new FrameLatch();
 node._generetiPerformanceSeek=()=>{reset=true;state.latch?.reset();state.lastPerformanceTime=undefined;schedule(state);};
 let openViewers=0;
 const outputOpened=()=>openViewers>0;
 function present(next){
  if(presentedFrame===next)return presentationCanvas;
  presentationCanvas??=document.createElement('canvas');gpu.present(next,presentationCanvas);presentedFrame=next;return presentationCanvas;
 }
 node._generetiTexturePresent=detail=>present(detail.texture);
 node._generetiTexture={captureDataUrl:()=>{if(!frame)throw Error('Texture has no live frame · run its source first');return present(frame).toDataURL('image/png');}};
 function releaseInput(index){
   const key=state.inputKeys[index];if(key&&gpu){const cached=gpu.imports.get(key);cached?.refs.delete(prefix+index);if(cached&&!cached.refs.size){gpu.release(key);gpu.imports.delete(key);}}
   state.inputKeys[index]=null;state.inputs[index]=null;
 }
 function stopReference(){const stop=state.referenceStop;state.referenceStop=null;state.referenceKey=null;stop?.();state.latch?.reset();gpu?.release(prefix+'reference:');}
 function stopInputs(){state.stops.forEach(stop=>stop());state.stops=[];state.inputKeys.forEach((_,i)=>releaseInput(i));state.inputs=[];stopReference();}
 function bindReference(value){
  if(kind!=='FeedbackRef'||state.referenceBinding)return;
  const resolved=resolveReference(node.graph,value),target=resolved?.node===node?null:resolved;
  const key=target?`${target.node.id}:${target.outputSlot}`:null;
  if(key===state.referenceKey)return;
  state.referenceBinding=true;stopReference();state.referenceKey=key;
  if(target){
   const proxy={id:`reference:${node.id}`,graph:node.graph,comfyClass:'GeneretiLiveImagePreview',inputs:[{name:'image',type:'IMAGE'}],getInputLink:()=>({origin_id:target.node.id,origin_slot:target.outputSlot})};
   state.referenceStop=subscribeLive(proxy,detail=>{
    if(state.dead||!state.users||node._generetiLivePaused||node._generetiExecutionMode==='Comfy Queue')return;
    state.latch.capture(index=>detail.texture?gpu.run(detail.texture,null,copyParams,prefix+'reference:'+index):gpu.upload(detail.bitmap,prefix+'reference:'+index));schedule(state);
   },()=>{state.latch.reset();},{gpu:true});
  }
  state.referenceBinding=false;
 }

 output=previewControls(canvas,status,node,()=>{}, {initialFrame:()=>frame?{bitmap:present(frame)}:{bitmap:canvas},getRenderSize:()=>frame??canvas,onFitChange:value=>local.setFit(value),onViewerChange:opened=>{openViewers=Math.max(0,openViewers+(opened?1:-1));}});
 const performancePanel=document.createElement('details');const summary=document.createElement('summary');summary.title='Performance details';summary.setAttribute('aria-label','Performance details');summary.style.cssText='width:30px;cursor:pointer';performancePanel.append(summary,status);state.performancePanel=performancePanel;
 surface.append(output.toolbar,local.actions,preview,performancePanel);
 const widget=node.addDOMWidget('texture_preview','GENERETI_TEXTURE_PREVIEW',surface,{serialize:false,hideOnZoom:false});
 widget.computeSize=width=>[width,(local.minimized?0:Math.max(0,width-24)*canvas.height/canvas.width)+60];

 const resize=new ResizeObserver(()=>{
  const host=surface.closest('.lg-node'),grid=host?.querySelector('.lg-node-widgets');
  if(grid){const rows=(grid.style.gridTemplateRows||'').split(/\s+(?![^()]*\))/);const tracks=rows.map(()=> 'min-content').join(' ');if(grid.style.gridTemplateRows!==tracks)grid.style.setProperty('grid-template-rows',tracks,'important');}
 });
 function watch(){if(state.dead)return;const host=surface.closest('.lg-node');if(host)resize.observe(host);else requestAnimationFrame(watch);}requestAnimationFrame(watch);
 node._generetiMountTransport=()=>node._generetiExecutionModeElement?.append(output.actions);
 if(kind==='Feedback'&&!node.widgets.some(w=>w.name==='blend')){
  const blend=document.createElement('select');blend.title='Feedback blend · screen/add keep trails visible beneath opaque black; over uses source alpha';blend.setAttribute('aria-label','Feedback blend');for(const mode of ['screen','add','over'])blend.append(new Option(mode,mode));blend.value=node.properties?.generetiFeedbackBlend??'screen';blend.onchange=()=>{node.properties.generetiFeedbackBlend=blend.value;state.signature=null;schedule(state);};output.actions.append(blend);const configured=node.onConfigure;node.onConfigure=function(){configured?.apply(this,arguments);blend.value=node.properties?.generetiFeedbackBlend??'screen';};
 }
 if(kind==='Feedback'){
  const button=document.createElement('button');button.textContent='↺';button.type='button';button.title='Reset feedback history';button.setAttribute('aria-label',button.title);button.onclick=()=>{reset=true;schedule(state);};output.actions.append(button);
 }
 if(kind==='FeedbackRef'){
  const picker=document.createElement('select');picker.title='Reference node/output · sampled one frame later; reference the final composite for a recursive loop';picker.setAttribute('aria-label','Feedback reference node');
  const label=document.createElement('label');label.className='genereti-node-controls';label.append(picker);
  const pickWidget=node.addDOMWidget('reference_picker','GENERETI_REFERENCE_PICKER',label,{serialize:false,hideOnZoom:false});pickWidget.computeSize=width=>[width,34];
  node.widgets.splice(node.widgets.indexOf(pickWidget),1);node.widgets.splice(node.widgets.findIndex(w=>w.name==='reference')+1,0,pickWidget);
  let optionsKey='';const refresh=()=>{
   if(state.dead)return;
   let graph;try{graph=node.graph;}catch{return;}
   const selected=valuesFor(node,kind).reference??'',choices=[['','Pick reference node…']];
   const refSlot=node.inputs?.findIndex(input=>input.name==='reference');picker.disabled=refSlot>=0&&Boolean(node.getInputLink?.(refSlot));
   for(const candidate of graph?._nodes??[])if(candidate!==node)for(const [slot,socket]of(candidate.outputs??[]).entries())if(socket.type==='IMAGE')choices.push([referenceFor(candidate,slot),`${candidate.title} · ${socket.name??'image'} (#${candidate.id})`]);
   if(selected&&!choices.some(([value])=>value===selected))choices.push([selected,resolveReference(graph,selected)?selected:'Missing reference · '+selected]);
   const next=JSON.stringify(choices);if(next!==optionsKey){optionsKey=next;picker.replaceChildren(...choices.map(([value,title])=>new Option(title,value)));schedule(state);}picker.value=selected;
  };
  picker.onchange=()=>{const w=node.widgets.find(w=>w.name==='reference');if(w){w.value=picker.value;w.callback?.(w.value);}schedule(state);};
  picker.addEventListener('focus',refresh);state.referencePickerTimer=setInterval(refresh,500);requestAnimationFrame(refresh);
  const button=document.createElement('button');button.type='button';button.textContent='↺';button.title='Clear delayed reference frame';button.setAttribute('aria-label',button.title);button.onclick=()=>{state.latch.reset();schedule(state);};output.actions.append(button);
 }
 function bind(){
  if(state.stops.length||state.binding||!state.users||!gpu||state.dead)return;state.binding=true;
  const names=kind==='Composite'?['image','background']:kind==='Displace'?['image','displacement']:kind==='Channels'?['image','image_b']:kind==='Math'?['image','operand']:['image'];
  state.stops=names.map((name,index)=>{
   // subscribeLive resolves the actual producer and handles rewiring/retention.
   const proxy={get id(){return node.id;},get graph(){return node.graph;},comfyClass:'GeneretiLiveImagePreview',
     get inputs(){const slot=node.inputs?.findIndex(i=>i.name===name);return slot<0?[]:[{...node.inputs[slot],name:'image'}];},
     getInputLink(){const slot=node.inputs?.findIndex(i=>i.name===name);return slot<0?null:node.getInputLink?.(slot);}};
   return subscribeLive(proxy,detail=>{
    // Upload once per producer dispatch, shared across branches.
    let input=detail.texture;
    if(input)releaseInput(index);
    if(!input){const key=`ingress:${detail.nodeId}:${detail.outputSlot??0}`;let cached=gpu.imports.get(key);
      if(!cached||cached.time!==detail.producedAt){cached={time:detail.producedAt,frame:gpu.upload(detail.bitmap,key),refs:cached?.refs??new Set()};gpu.imports.set(key,cached);}
      if(state.inputKeys[index]!==key)releaseInput(index);cached.refs.add(prefix+index);state.inputKeys[index]=key;input=cached.frame;
    }
    state.inputs[index]=input;schedule(state);
   },text=>{releaseInput(index);if(index===0)status.textContent=text;},{gpu:true});
  });
  state.binding=false;
 }
 node._generetiLiveSource={retain(){state.users++;bind();if(frame&&!node._generetiLivePaused&&node._generetiExecutionMode!=='Comfy Queue')window.dispatchEvent(new CustomEvent('genereti-live-frame',{detail:{nodeId:node.id,outputSlot:0,texture:frame,producedAt:frame.producedAt}}));schedule(state);},release(){state.users=Math.max(0,state.users-1);if(!state.users){stopInputs();dirty.delete(state);}}};
 node._generetiToggleTransport=()=>{node._generetiLivePaused=!node._generetiLivePaused;if(!node._generetiLivePaused)schedule(state);};
 node._generetiSetExecutionMode=mode=>{
  if(mode==='Live'&&!localRunning){localRunning=true;node._generetiLiveSource.retain();}
  if(mode!=='Live'&&localRunning){localRunning=false;node._generetiLiveSource.release();status.textContent='Comfy Queue · live feedback has no queued history';}
 };
 states.set(node,state);attachExecutionMode(node);node._generetiMountTransport();
 // Local preview keeps this node alive. Downstream retention works when minimized.
 node._generetiLiveSource.retain();
 textureGPU().then(engine=>{if(state.dead)return;gpu=engine;status.textContent='WebGPU · waiting for live image';bind();schedule(state);}).catch(error=>{status.textContent=error.message;performancePanel.open=true;});
 const removed=node.onRemoved;node.onRemoved=function(){state.dead=true;clearInterval(state.referencePickerTimer);resize.disconnect();dirty.delete(state);stopInputs();states.delete(node);output.close();gpu?.releaseCanvas(canvas);if(presentationCanvas)gpu?.releaseCanvas(presentationCanvas);gpu?.release(prefix);return removed?.apply(this,arguments);};
 const changed=node.onWidgetChanged;node.onWidgetChanged=function(){const result=changed?.apply(this,arguments);schedule(state);return result;};
 // Native widget callbacks also cover current Vue control edits.
 for(const w of node.widgets??[]){const callback=w.callback;w.callback=function(){const result=callback?.apply(this,arguments);schedule(state);return result;};}
 }});
