import {icon} from './icons.js';
import {timing,count,snapshot as performanceSnapshot,reset as resetPerformance} from './performance.js';
import {DrawingBridge} from './drawing-bridge.js';
const $ = id => document.getElementById(id);
const input = $('input'), output = $('output');
const ctx = input.getContext('2d'), out = output.getContext('2d');
const video = $('video');
let appliedPrompt=$('prompt').value,appliedPromptB=$('promptB').value;
const promptControls=document.createElement('div');promptControls.className='prompt-submit-controls';
promptControls.innerHTML='<button id="applyPrompt" type="button" title="Apply prompts (Cmd+Enter / Ctrl+Enter)" aria-label="Apply prompts">'+icon('play')+'</button><label title="Apply prompt edits as you type"><input id="livePrompt" type="checkbox" role="switch"> Live prompt</label>';
$('prompt').closest('.prompt-row').after(promptControls);
try{$('livePrompt').checked=localStorage.getItem('genereti-live-prompt')==='true';}catch{}
function markPromptDraft(){const dirty=$('prompt').value!==appliedPrompt||$('promptB').value!==appliedPromptB;$('applyPrompt').disabled=!dirty;$('applyPrompt').classList.toggle('pending',dirty);}
function applyPrompts(){appliedPrompt=$('prompt').value;appliedPromptB=$('promptB').value;markPromptDraft();updateMode();recoverFrame();}
$('applyPrompt').onclick=applyPrompts;
for(const id of ['prompt','promptB'])$(id).addEventListener('input',()=>{if($('livePrompt').checked)applyPrompts();else markPromptDraft();});
$('livePrompt').onchange=()=>{try{localStorage.setItem('genereti-live-prompt',String($('livePrompt').checked));}catch{}if($('livePrompt').checked)applyPrompts();};
document.addEventListener('keydown',event=>{if(!event.isComposing&&event.key==='Enter'&&(event.metaKey||event.ctrlKey)&&['prompt','promptB'].includes(event.target.id)){event.preventDefault();event.stopPropagation();applyPrompts();}},true);
markPromptDraft();

let drawingExpanded=false,drawingInputSnapshot=null,frameDrawingLayer=null,inputVersion=0,inputEncodingCache=null;
const frameInputEnabled=()=>document.body.dataset.host==='excalidraw'&&$('frameInputMode')?.checked;
const compositeInput=document.createElement('canvas');compositeInput.width=compositeInput.height=512;
const drawingEditor=new DrawingBridge({iframe:$('drawingEditor'),onFrame:async frame=>{
 if($('source').value!=='editor'&&!frameInputEnabled())return;
 try{if(frameInputEnabled()&&frame.layer){const layer=new Image();layer.src=frame.layer;await layer.decode();if(frame.revision===drawingEditor.revision){frameDrawingLayer=layer;drawingInputSnapshot={scene:frame.scene,revision:frame.revision,artboard:frame.artboard};}}
  if($('source').value!=='editor')return;
 const image=new Image();image.src=frame.image;await image.decode();
  if($('source').value==='editor'&&frame.revision===drawingEditor.revision){ctx.clearRect(0,0,512,512);ctx.drawImage(image,0,0,512,512);inputVersion++;drawingInputSnapshot={scene:frame.scene,revision:frame.revision,artboard:frame.artboard||{x:0,y:0,width:512,height:512}};recoverFrame();}}
 catch(error){message('Drawing preview failed: '+error.message,true);}
},onOutputMode:enabled=>document.body.classList.toggle('drawing-canvas-output',enabled),onError:error=>message('Drawing editor: '+error,true)});
function expandDrawing(value){
 if(document.body.dataset.host==='excalidraw'){window.generetiDrawing?.fit();return;}
 drawingExpanded=value;document.body.classList.toggle('drawing-expanded',value);
 $('drawingBackdrop').hidden=$('drawingExpandedHeader').hidden=!value;
 // Resizing the existing iframe retains its document and editable scene.
 requestAnimationFrame(()=>drawingEditor.send('fit'));
}
$('expandDrawing').onclick=()=>expandDrawing(true);
$('closeDrawing').onclick=()=>expandDrawing(false);
window.addEventListener('keydown',event=>{
 // The host handles shortcuts directly; forwarding would dispatch them twice.
 if(document.body.dataset.host==='excalidraw')return;
 if($('source').value!=='editor'||$('helpDialog').open||document.activeElement?.matches('input,textarea,select,[contenteditable="true"]'))return;
 if((!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.shiftKey&&['s','g'].includes(event.key.toLowerCase()))||(event.code==='KeyD'&&event.altKey&&event.shiftKey)){
  event.preventDefault();drawingEditor.send('shortcut',{event:{key:event.key,code:event.code,altKey:event.altKey,shiftKey:event.shiftKey,ctrlKey:event.ctrlKey,metaKey:event.metaKey}});
 }
});

const capture = document.createElement('canvas'); capture.width=capture.height=512;
const capctx=capture.getContext('2d');
let ready=false, running=false, busy=false, socket, retryTimer, sentAt=0, frameId=0;
let stream, uploadedImage, fileURL, referenceDataUrl=null, referenceName='', referenceFileURL=null, shapeGuideDataUrl=null, shapeGuideName='', shapeGuideFileURL=null, recording, chunks=[], lastFrame=0, phase=0, demoTime=0;
let showingGuide=false,lastHostSourcePreview=0;
let previousRAF=performance.now(), fpsTimes=[], lastSent=0, timeout, lastStats;
let pendingGeneration=null,lastGeneration=null;
let poseWorker, poseReady=false, poseBusy=false, poseLandmarks=[], lastPose=0;
let drawing=false, lastPoint, pointer={x:.5,y:.5};
let availableModels=new Set(),availableUpscalers=new Set();
let changingSize=false,frameBlocked=false;
let mixerPoseDataUrl=null,mixerPoseName='';
const presets={
 robot:'a friendly colorful toy robot, full body, rounded metal body, waving arms, beautiful studio lighting, 3d render',
 stage:'A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition',
 dancer:'a dancer made of folded colored paper, full body, graceful pose, origami sculpture, clean studio background',
 jellyfish:'a luminous jellyfish floating in a deep blue ocean, bioluminescent, ethereal underwater photograph',
 tree:'an ancient twisting bonsai tree, Japanese ink and watercolor painting, expressive branches, white background',
 portrait:'a clay sculpture portrait, colorful ceramic, expressive face, studio lighting',
};
function message(text,error=false){const badge=$('hostNotice');if(badge){badge.hidden=!error;badge.title=text;badge.innerHTML=error?icon('alert'):'';badge.setAttribute('aria-label',error?text:'');}$('message').textContent=text;$('message').classList.toggle('error',error);}
function notice(text){$('inputNotice').textContent=text;$('inputNotice').hidden=!text;}
function modelStatus(label){
 const status=$('status');status.title=label;status.setAttribute('aria-label',label);status.textContent=document.body.dataset.host==='excalidraw'?'':label;
}
function setRunning(value){
 running=value;if(value)frameBlocked=false; if(document.body.dataset.host==='excalidraw'){const label=running?'Pause live generation':'Start live generation';$('run').innerHTML=icon(running?'pause':'play');$('run').title=label+' (Alt + Space)';$('run').setAttribute('aria-label',label);$('run').setAttribute('aria-pressed',String(running));}else $('run').textContent=running?'Pause':'Start live';$('run').classList.toggle('live',running);
 fpsTimes=[];
 if(!running) $('fps').textContent='—';
 if(running) message('Live · each result is a newly generated frame.');
 else message('Paused. The last generated frame stays available to connected applications.');
}
function connection(){
 clearTimeout(retryTimer);
 socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);
 socket.onopen=()=>{busy=false;};
 socket.onmessage=async ({data})=>{
  clearTimeout(timeout);
  const result=JSON.parse(data);
  if(result.type==='error'){
   count(result.status===429?'serverBusy':'errors');busy=false;
   pendingGeneration=null;
   if(result.status===429){message(result.error,true);$('fps').textContent='—';lastSent=performance.now()+500;return;}
   if(result.status===503){message(result.error+' · retrying shortly.',true);lastSent=performance.now()+2000;return;}
   frameBlocked=true;$('fps').textContent='—';
   message(result.error+' · Last image kept. Change a control to resume.',true);return;
  }
  const displayStarted=performance.now();
  try{
   if(result.guide){if(document.body.dataset.host==='excalidraw')drawingEditor.send('guide',{image:result.guide});const gi=new Image();gi.src=result.guide;await gi.decode();$('guide').getContext('2d').drawImage(gi,0,0,512,512);}
   const img=new Image(); img.src=result.image; await img.decode();
   if(output.width!==img.naturalWidth) output.width=output.height=img.naturalWidth;
   out.drawImage(img,0,0);drawingEditor.setOutput({image:result.image,model:result.model,frame:result.frame});lastFrame=result.frame;lastStats=result;
   if(pendingGeneration){lastGeneration={...pendingGeneration,completedAt:new Date().toISOString()};pendingGeneration=null;}
   $('empty').hidden=true;
   for(const id of ['save','copyImage','saveScene','copyScene','record'])$(id).disabled=false;
   const now=performance.now();timing('roundtrip',now-sentAt);timing('display',now-displayStarted);timing('server',result.server_ms);timing('inference',result.inference_ms);timing('postprocess',result.postprocess_ms);timing('preprocess',result.preprocess_ms);timing('unet',result.unet_ms);timing('control',result.control_ms);timing('upscalerLoad',result.upscaler_load_ms);count('generated'); fpsTimes.push(now);if(fpsTimes.length>30)fpsTimes.shift();
   const fps=fpsTimes.length>1?(fpsTimes.length-1)*1000/(now-fpsTimes[0]):1000/(now-sentAt);
   $('fps').textContent=running?fps.toFixed(1):'—';
   $('latency').textContent=`${Math.round(now-sentAt)} ms round trip`;
   const upscaler=result.postprocess?.ai_upscaler;
   const upscaleIterations=Number(result.postprocess?.upscale_iterations||1);
   const upscalerLabel=upscaler&&upscaler!=='off'?` + Real-ESRGAN ${upscaler==='animevideo'?'AnimeVideo':'General'} 4×${upscaleIterations>1?` · ${upscaleIterations} feedback passes`:''}`:'';
   $('model').textContent=`${result.model}${result.style==='anime'?' + Anime LoRA':''}${upscalerLabel} · ${result.size} × ${result.size} · Core ML`;
   output.dataset.frame=String(result.frame); output.dataset.inferenceMs=String(result.inference_ms);
  }catch(error){message('Could not display the generated frame: '+error.message,true);}
  busy=false;
 };
 socket.onclose=()=>{clearTimeout(timeout);busy=false; if(running)message('Connection interrupted. Reconnecting…',true);retryTimer=setTimeout(connection,1500);};
 socket.onerror=()=>message('Local server unavailable. Start-Genereti.command launches it.',true);
}
async function pollStatus(){
 try{
  const data=await fetch('/api/status').then(r=>r.json());
  ready=data.ready; $('run').disabled=!ready;
  modelStatus(data.error?'Model error':ready?'Local model ready':data.loading||'Starting…');
  $('status').classList.toggle('ready',ready);
  if(data.error)message(data.error,true);
  if(ready&& !$('empty').hidden)$('empty').querySelector('small').textContent='Press Start live to generate.';
  if(ready&&!lastFrame) $('model').textContent=`Local models · ${data.size} × ${data.size} · Core ML`;
  if(data.available_models){availableModels=new Set(data.available_models);availableUpscalers=new Set(data.available_upscalers||[]);updateAvailability(data);}
 }catch{ready=false;$('run').disabled=true;modelStatus('Server offline');}
}
function releaseMedia(){
 if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
 video.pause();video.srcObject=null;video.removeAttribute('src');video.load();
 if(fileURL){URL.revokeObjectURL(fileURL);fileURL=null;}
 uploadedImage=null;poseLandmarks=[];
}
function updateMode(){
 const mode=$('mode').value, source=$('source').value;
 const animeAvailable=mode==='sdxs_mixer'?availableModels.has('anime_sdxs_residual_unet'):availableModels.has('anime_unet')&&availableModels.has('anime_controlled_unet');
 if(availableModels.size){$('style').querySelector('[value=anime]').disabled=!animeAvailable;if(!animeAvailable)$('style').value='base';}
 if(['text','image'].includes(mode)){if(document.body.dataset.host==='excalidraw')drawingEditor.send('guide-mode',{enabled:false});showingGuide=false;$('guide').hidden=true;$('guideToggle').textContent='View guide';}
 $('guideToggle').disabled=['text','image'].includes(mode);
 $('drawingHost').hidden=$('source').value!=='editor'||showingGuide;
 $('controlWrap').hidden=!['sketch','canny','depth','pose','composite','sdxs_mixer'].includes(mode);
 const guideNames={sketch:'Sketch influence',canny:'Canny influence',depth:'Depth influence',pose:'Pose influence',composite:'Sketch influence',sdxs_mixer:'Overall guide influence'};
 $('controlLabel').textContent=guideNames[mode]||'Guide influence';
 $('controlValue').setAttribute('aria-label',`${guideNames[mode]||'Guide'} value`);
 $('styleWrap').hidden=!['text','sketch','composite','sdxs_mixer'].includes(mode);
 $('cannyControlWrap').hidden=mode!=='composite';
 $('compositeMixWrap').hidden=mode!=='composite';
 $('compositeModeWrap').hidden=mode!=='composite';
 $('compositeGuideWrap').hidden=!['composite','sdxs_mixer'].includes(mode);
 $('sdxsMixer').hidden=mode!=='sdxs_mixer';
 $('invertSketchWrap').hidden=!['sketch','composite','sdxs_mixer'].includes(mode);
 $('invertCannyWrap').hidden=!['canny','composite','sdxs_mixer'].includes(mode);
 $('invertDepthWrap').hidden=!['depth','sdxs_mixer'].includes(mode);
 $('invertPoseWrap').hidden=!['pose','sdxs_mixer'].includes(mode);
 $('strengthWrap').hidden=mode!=='image';
 $('motionWrap').hidden=false;
 $('rawGuideWrap').hidden=!['canny','depth'].includes(mode);
 $('feedbackWrap').hidden=mode!=='image';
 $('mixWrap').hidden=!appliedPromptB.trim();
 $('poseWrap').hidden=source!=='camera';
 $('mirrorWrap').hidden=source!=='camera';
 if(mode==='pose'&&source==='camera'){$('pose').checked=true;startPose();}
 if($('pose').checked&&source==='camera'&&!poseWorker)startPose();
}
function updateAvailability(data){
 const has=name=>availableModels.has(name);
 updateSizeOptions(data);
 $('mode').querySelector('[value=text]').disabled=!has('unet');
 $('mode').querySelector('[value=image]').disabled=!(has('turbo_unet')&&has('encoder'));
 $('mode').querySelector('[value=sdxs_mixer]').disabled=!(has('sdxs_sketch_control')&&has('sdxs_residual_unet'));
 $('mode').querySelector('[value=sketch]').disabled=!has('controlled_unet');
 for(const name of ['canny','depth','pose'])$('mode').querySelector(`[value=${name}]`).disabled=!(has(`control_${name}`)&&has('turbo_residual_unet'));
 $('mode').querySelector('[value=composite]').disabled=!(has('controlled_unet')&&has('control_canny')&&has('turbo_residual_unet'));
 $('style').querySelector('[value=anime]').disabled=$('mode').value==='sdxs_mixer'?!has('anime_sdxs_residual_unet'):!(has('anime_unet')&&has('anime_controlled_unet'));
 for(const option of $('aiUpscaler').options)if(option.value!=='off')option.disabled=!availableUpscalers.has(option.value);
 if($('aiUpscaler').selectedOptions[0]?.disabled)$('aiUpscaler').value='off';
 if($('style').selectedOptions[0]?.disabled)$('style').value='base';
 if($('mode').selectedOptions[0]?.disabled){
  const first=[...$('mode').options].find(option=>!option.disabled);
  if(first)$('mode').value=first.value;
 }
 updateUpscalerControls();
 updateMode();
}
function updateUpscalerControls(){
 const enabled=$('aiUpscaler').value!=='off';
 for(const id of ['upscaleIterationsWrap','upscaleFeedbackWrap','upscaleOutputWrap'])$(id).hidden=!enabled;
}
function updateSizeOptions(data){
 const select=$('size'),sizes=data.available_sizes||[];
 const current=select.value;
 select.replaceChildren(...sizes.map(value=>new Option(`${value} × ${value}`,String(value))));
 select.dataset.activeSize=String(data.size??256);
 if(!changingSize)select.value=String(data.size??current??256);
 if(!select.options.length){select.add(new Option(`${data.size||256} × ${data.size||256}`,String(data.size||256)));select.value=String(data.size||256);}
}
async function changeModelSize(size){
 if(!size||Number(size)===Number($('size').dataset.activeSize))return;
 changingSize=true;setRunning(false);$('size').disabled=true;
 message(`Loading ${size}px Core ML models… this may take a while the first time.`);
 try{
  const response=await fetch('/api/config/size',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({size:Number(size)})});
  const result=await response.json();if(!response.ok)throw new Error(result.detail||'Could not load the selected model size.');
  message(`${result.size}px models ready. Some pipelines are available only at 256px.`);
 }catch(error){message(error.message,true);}
 finally{changingSize=false;await pollStatus();$('size').disabled=false;}
}
function updateReferenceControls(){
 const enabled=Boolean(referenceDataUrl);$('paletteStrength').disabled=!enabled;$('paletteStrengthValue').disabled=!enabled;
 $('paletteWrap').classList.toggle('inactive-control',!enabled);
}
function clear(){ctx.fillStyle='white';ctx.fillRect(0,0,512,512);}
function sourceChanged(){
 document.body.dataset.source=$('source').value;
 if(document.body.dataset.host==='excalidraw')drawingEditor.send('source',{kind:$('source').value});
 releaseMedia();clear();notice('');
 if(drawingExpanded)expandDrawing(false);
 drawingInputSnapshot=null;frameDrawingLayer=null;
 if(frameInputEnabled())drawingEditor.send('refresh');
 const source=$('source').value;
 $('drawingHost').hidden=source!=='editor'||showingGuide;
 $('input').style.visibility=source==='editor'?'hidden':'';
 $('expandDrawing').hidden=source!=='editor';
 if(source==='editor')drawingEditor.activate();
 $('clear').hidden=$('brushLabel').hidden=source!=='draw';
 $('connectCamera').hidden=$('camera').hidden=source!=='camera';
 $('captureScreen').hidden=source!=='screen';$('chooseFile').hidden=source!=='file';
 if($('mode').value!=='sdxs_mixer'||source==='text')$('mode').value=['demo','draw','editor'].includes(source)?'sketch':source==='text'?'text':'image';
 updateMode();
 const labels={demo:'Animated sketch · no camera needed',draw:'Draw black lines on white · right click to erase',editor:'Editable shapes · fixed artboard · drag, rotate, recolor',camera:'Camera stays on this Mac',screen:'Share a window to transform it',file:'Local image or looping video',text:'Text + fixed seed · no image input'};
 $('inputLabel').textContent=labels[source];
 if(source==='camera')notice('Enable camera, then choose SketchCam or another device.');
 if(source==='screen')notice('Choose a window or screen to transform.');
 if(source==='file')notice('Choose a local image or video.');
 if(source==='text')notice('The prompt and seed are the input.');
}
function fitImage(context,source){
 const w=source.videoWidth||source.naturalWidth||source.width,h=source.videoHeight||source.naturalHeight||source.height;
 if(!w||!h)return;
 const s=Math.min(w,h);context.drawImage(source,(w-s)/2,(h-s)/2,s,s,0,0,512,512);
}
async function cameraStart(){
 try{
  releaseMedia();
  const deviceId=$('camera').value;
  stream=await navigator.mediaDevices.getUserMedia({video:deviceId?{deviceId:{exact:deviceId},width:{ideal:640},height:{ideal:480}}:{width:{ideal:640},height:{ideal:480}},audio:false});
  video.srcObject=stream;await video.play();notice('');
  const selected=stream.getVideoTracks()[0].getSettings().deviceId;
  const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');
  $('camera').replaceChildren(...devices.map((d,i)=>new Option(d.label||`Camera ${i+1}`,d.deviceId,false,d.deviceId===selected)));
  $('connectCamera').textContent='Restart camera';
  message('Camera connected. Frames are processed locally and are not saved automatically.');
  if($('pose').checked)startPose();
 }catch(error){notice('Camera could not open. Check browser permission or choose another device.');message(error.message,true);}
}
async function screenStart(){
 try{releaseMedia();stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:15},audio:false});video.srcObject=stream;await video.play();notice('');
  stream.getVideoTracks()[0].onended=()=>{notice('Screen sharing ended. Choose a window to resume.');setRunning(false);};
 }catch(error){message('Screen sharing: '+error.message,true);}
}
function startPose(){
 if(poseWorker)return;
 $('poseStatus').textContent='Loading local MediaPipe pose model…';
 poseWorker=new Worker('./pose-worker.js');
 poseWorker.onmessage=({data})=>{
  if(data.type==='ready'){poseReady=true;$('poseStatus').textContent='Pose tracker ready. Stand back so your body is visible.';}
  if(data.type==='pose'){poseBusy=false;poseLandmarks=data.landmarks;$('poseStatus').textContent=poseLandmarks.length?'Tracking · silhouette → sketch ControlNet':'No person detected. Stand back so your body is visible.';}
  if(data.type==='error'){poseWorker?.terminate();poseWorker=null;poseReady=poseBusy=false;$('poseStatus').textContent='Pose tracker: '+data.error;message('Pose tracker failed; camera image mode is still available.',true);}
 };
 poseWorker.onerror=event=>{poseWorker?.terminate();poseWorker=null;poseReady=poseBusy=false;$('poseStatus').textContent='Pose tracker: '+event.message;message('Pose worker failed; camera image mode is still available.',true);};
 poseWorker.postMessage({type:'init'});
}
function stroke(points,width=7){ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
function body(points){
 const p=(i)=>[points[i].x*512,points[i].y*512];
 clear();ctx.strokeStyle='#111';ctx.fillStyle='white';
 const head=p(0),left=p(11),right=p(12),hipL=p(23),hipR=p(24);
 const scale=Math.max(35,Math.hypot(left[0]-right[0],left[1]-right[1]));
 ctx.beginPath();ctx.ellipse(head[0],head[1],scale*.24,scale*.3,0,0,Math.PI*2);ctx.fill();ctx.lineWidth=7;ctx.stroke();
 stroke([left,right,hipR,hipL,left],8);
 for(const chain of [[11,13,15],[12,14,16],[23,25,27],[24,26,28]]) stroke(chain.map(p),Math.max(8,scale*.15));
}
function fromMediaPipe(p){
 const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 return [p[0],midpoint(p[11],p[12]),p[12],p[14],p[16],p[11],p[13],p[15],p[24],p[26],p[28],p[23],p[25],p[27],p[5],p[2],p[8],p[7]];
}
function demoPose(t){
 const wave=Math.sin(t)*.12;
 return [[.5,.16],[.5,.28],[.38,.3],[.27,.42+wave],[.17,.25+wave],[.62,.3],[.73,.42-wave],[.83,.25-wave],[.43,.55],[.38,.73],[.33,.9],[.57,.55],[.62,.73],[.67,.9],[.47,.145],[.53,.145],[.44,.16],[.56,.16]].map(([x,y])=>({x,y,visibility:1}));
}
function drawPose(points){
 ctx.fillStyle='black';ctx.fillRect(0,0,512,512);
 const bones=[[1,2],[1,5],[2,3],[3,4],[5,6],[6,7],[1,8],[8,9],[9,10],[1,11],[11,12],[12,13],[1,0],[0,14],[14,16],[0,15],[15,17]];
 const colors=['#ff0000','#ff5500','#ffaa00','#ffff00','#aaff00','#55ff00','#00ff00','#00ff55','#00ffaa','#00ffff','#00aaff','#0055ff','#0000ff','#5500ff','#aa00ff','#ff00ff','#ff00aa','#ff0055'];
 bones.forEach(([a,b],i)=>{if((points[a].visibility??1)<.4||(points[b].visibility??1)<.4)return;ctx.strokeStyle=colors[i];stroke([[points[a].x*512,points[a].y*512],[points[b].x*512,points[b].y*512]],8);});
 points.forEach((p,i)=>{if((p.visibility??1)<.4)return;ctx.fillStyle=colors[i];ctx.beginPath();ctx.arc(p.x*512,p.y*512,5,0,Math.PI*2);ctx.fill();});
}
function drawDemo(t){
 clear();ctx.strokeStyle='#111';ctx.fillStyle='#fff';
 const sway=Math.sin(t)*18, lift=Math.sin(t*1.25)*38;
 ctx.save();ctx.translate(sway,0);
 ctx.lineWidth=7;ctx.beginPath();ctx.roundRect(197,58,118,105,25);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.arc(231,108,11,0,Math.PI*2);ctx.arc(282,108,11,0,Math.PI*2);ctx.stroke();
 stroke([[238,140],[273,140]],5);stroke([[256,58],[256,35]],5);
 ctx.beginPath();ctx.roundRect(181,183,150,145,26);ctx.fill();ctx.stroke();
 stroke([[181,208],[127,238-lift],[85,150-lift]],20);
 stroke([[330,208],[379,244+lift],[427,167+lift]],20);
 stroke([[221,331],[205,401],[179,461]],24);
 stroke([[290,331],[312,400],[339,461]],24);
 ctx.restore();
}
function frame(now){
 timing('cadence',now-previousRAF);const dt=Math.min((now-previousRAF)/1000,.1);previousRAF=now;
 const motion=parameterValue('motion');
 demoTime+=dt*motion*2;
 if($('source').value==='demo'){if($('mode').value==='pose')drawPose(demoPose(demoTime));else drawDemo(demoTime);}
 if(['camera','screen','file'].includes($('source').value)){
  if(uploadedImage)fitImage(ctx,uploadedImage);
  else if(video.readyState>=2){
   capctx.save();if($('source').value==='camera'&&$('mirror').checked){capctx.translate(512,0);capctx.scale(-1,1);}fitImage(capctx,video);capctx.restore();
   if($('source').value==='camera'&&$('pose').checked){
    if(poseReady&&!poseBusy&&now-lastPose>90){poseBusy=true;lastPose=now;createImageBitmap(capture).then(bitmap=>poseWorker.postMessage({type:'frame',bitmap,timestamp:now},[bitmap])).catch(e=>{poseBusy=false;message(e.message,true);});}
    if(poseLandmarks.length){if($('mode').value==='pose')drawPose(fromMediaPipe(poseLandmarks));else body(poseLandmarks);}else clear();
   }else ctx.drawImage(capture,0,0);
  }
 }
 if(document.body.dataset.host==='excalidraw'&&!['editor','text'].includes($('source').value)&&now-lastHostSourcePreview>125){lastHostSourcePreview=now;drawingEditor.send('source',{kind:$('source').value,image:input.toDataURL('image/jpeg',.8)});}
 if(running&&ready&&!busy&&!frameBlocked&&socket?.readyState===WebSocket.OPEN&&now-lastSent>=1000/parameterValue('maxfps')-1){
  const source=$('source').value,mode=$('mode').value;
  const hasInput=mode==='text'||['demo','draw'].includes(source)||(source==='editor'&&drawingInputSnapshot)||uploadedImage||video.readyState>=2;
  if(hasInput && !(source==='camera'&&$('pose').checked&&!poseLandmarks.length)){
   busy=true;sentAt=lastSent=now;
   // Orbit the two seed noises in every pipeline, including the SDXS mixer.
   phase+=motion*.035;
   const compositeStarted=performance.now();let requestInput=input;
   if(frameInputEnabled()&&source!=='editor'&&frameDrawingLayer){const composite=compositeInput.getContext('2d');composite.clearRect(0,0,512,512);composite.drawImage(input,0,0);composite.drawImage(frameDrawingLayer,0,0);requestInput=compositeInput;}
   timing('composite',performance.now()-compositeStarted);
   const encodeStarted=performance.now(),mime=mode==='sdxs_mixer'?'image/png':'image/jpeg',cacheKey=`${inputVersion}:${mime}`;
   let capturedInput=null;
   if(mode!=='text'){if(source==='editor'&&inputEncodingCache?.key===cacheKey)capturedInput=inputEncodingCache.image;else {capturedInput=requestInput.toDataURL(mime,.9);if(source==='editor')inputEncodingCache={key:cacheKey,image:capturedInput};}}
   timing('inputEncode',performance.now()-encodeStarted);
   const request={id:++frameId,style:$('style').value,preprocess:!$('rawGuide').checked,return_guide:showingGuide,prompt:appliedPrompt,prompt_b:appliedPromptB,prompt_mix:parameterValue('mix'),mode,
    seed:Number($('seed').value)||0,strength:parameterValue('strength'),control_scale:parameterValue('control'),
    canny_control_scale:parameterValue('cannyControl'),composite_mix:parameterValue('compositeMix'),composite_mode:$('compositeMode').value,
    invert_sketch_guide:$('invertSketch').checked,invert_canny_guide:$('invertCanny').checked,
    invert_depth_guide:$('invertDepth').checked,invert_pose_guide:$('invertPose').checked,
    sdxs_sketch_weight:parameterValue('sdxsSketch'),sdxs_canny_weight:parameterValue('sdxsCanny'),
    sdxs_depth_weight:parameterValue('sdxsDepth'),sdxs_pose_weight:parameterValue('sdxsPose'),
    sdxs_sketch_kind:$('sdxsSketchKind').value,canny_low:Number($('cannyLow').value),canny_high:Number($('cannyHigh').value),guide_line_width:Number($('guideLineWidth').value),pose_image:mode==='sdxs_mixer'?mixerPoseDataUrl:null,
    source_value_strength:parameterValue('sourceValue'),source_color_strength:parameterValue('sourceColor'),source_color_spread:parameterValue('colorSpread'),
    feedback:parameterValue('feedback'),noise_phase:phase,palette_strength:parameterValue('paletteStrength'),
    black_point:Math.round(parameterValue('blackPoint')),white_point:Math.round(parameterValue('whitePoint')),gamma:parameterValue('gamma'),
    brightness:parameterValue('brightness'),contrast:parameterValue('contrast'),saturation:parameterValue('saturation'),
    sharpen:parameterValue('sharpen'),emboss:parameterValue('emboss'),ai_upscaler:$('aiUpscaler').value,
    upscale_iterations:Number($('upscaleIterations').value),upscale_feedback:parameterValue('upscaleFeedback'),upscale_output:$('upscaleOutput').value,
    upscale:Number($('upscale').value),upscale_filter:$('upscaleFilter').value,
    image:capturedInput,control_image:shapeGuideDataUrl,reference_image:referenceDataUrl};
   const {image:ignoredImage,control_image:ignoredControlImage,reference_image:ignoredReference,pose_image:ignoredPose,...requestMetadata}=request;
   pendingGeneration={startedAt:new Date().toISOString(),settings:{...readSettings(),prompt:appliedPrompt,promptB:appliedPromptB,referenceIncluded:Boolean(referenceDataUrl),referenceName,shapeGuideIncluded:Boolean(shapeGuideDataUrl),shapeGuideName},request:requestMetadata,inputDataUrl:capturedInput,drawing:source==='editor'||frameInputEnabled()?drawingInputSnapshot:null,mixerPoseDataUrl,mixerPoseName,referenceDataUrl,referenceName,shapeGuideDataUrl,shapeGuideName};
   count('requested');socket.send(JSON.stringify(request));
   timeout=setTimeout(()=>{message('Generation timed out; reconnecting.',true);socket.close();},120000);
  }
 }
 requestAnimationFrame(frame);
}
$('run').onclick=()=>setRunning(!running);
$('mixerPoseFile').onchange=async()=>{
 const file=$('mixerPoseFile').files[0];if(!file)return;
 try{const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas');canvas.width=canvas.height=512;canvas.getContext('2d').drawImage(bitmap,0,0,512,512);bitmap.close();mixerPoseDataUrl=canvas.toDataURL('image/png');mixerPoseName=file.name;$('mixerPoseName').textContent=file.name;}
 catch(error){message('Could not load pose guide: '+error.message,true);}
};
$('clearMixerPose').onclick=()=>{mixerPoseDataUrl=null;mixerPoseName='';$('mixerPoseFile').value='';$('mixerPoseName').textContent='No pose guide loaded';};
$('source').onchange=sourceChanged;
$('mode').onchange=updateMode;
$('clear').onclick=clear;
$('guideToggle').onclick=()=>{showingGuide=!showingGuide;if(document.body.dataset.host==='excalidraw')drawingEditor.send('guide-mode',{enabled:showingGuide});$('guide').hidden=!showingGuide;$('guideToggle').textContent=showingGuide?'View input':'View guide';$('drawingHost').hidden=$('source').value!=='editor'||showingGuide;};
$('random').onclick=()=>{$('seed').value=Math.floor(Math.random()*2**31);phase=0;};
$('connectCamera').onclick=cameraStart;$('camera').onchange=cameraStart;$('captureScreen').onclick=screenStart;
$('chooseFile').onclick=()=>$('file').click();
$('file').onchange=async()=>{
 const file=$('file').files[0];if(!file)return;releaseMedia();fileURL=URL.createObjectURL(file);
 try{
  if(file.type.startsWith('video/')){video.src=fileURL;video.loop=true;await video.play();}
  else{uploadedImage=new Image();uploadedImage.src=fileURL;await uploadedImage.decode();fitImage(ctx,uploadedImage);}
  notice('');
 }catch(error){message('File could not be loaded: '+error.message,true);}
};
$('chooseReference').onclick=()=>$('referenceFile').click();
$('clearReference').onclick=()=>{
 if(referenceFileURL)URL.revokeObjectURL(referenceFileURL);
 referenceFileURL=null;referenceDataUrl=null;referenceName='';$('referenceFile').value='';
 $('referenceName').textContent='No palette image loaded';$('clearReference').disabled=true;
 updateReferenceControls();
};
$('referenceFile').onchange=async()=>{
 const file=$('referenceFile').files[0];if(!file)return;
 try{
  if(referenceFileURL)URL.revokeObjectURL(referenceFileURL);
  referenceFileURL=URL.createObjectURL(file);const image=new Image();image.src=referenceFileURL;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;fitImage(canvas.getContext('2d'),image);
  referenceDataUrl=canvas.toDataURL('image/jpeg',.9);referenceName=file.name;
  $('referenceName').textContent=`${file.name} · palette only`;$('clearReference').disabled=false;
  updateReferenceControls();
 }catch(error){message('Palette reference could not be loaded: '+error.message,true);}
};
$('chooseShapeGuide').onclick=()=>$('shapeGuideFile').click();
$('clearShapeGuide').onclick=()=>{
 if(shapeGuideFileURL)URL.revokeObjectURL(shapeGuideFileURL);
 shapeGuideFileURL=null;shapeGuideDataUrl=null;shapeGuideName='';$('shapeGuideFile').value='';
 $('shapeGuideName').textContent='Uses the main input unless an image is selected';$('clearShapeGuide').disabled=true;
};
$('shapeGuideFile').onchange=async()=>{
 const file=$('shapeGuideFile').files[0];if(!file)return;
 try{
  if(shapeGuideFileURL)URL.revokeObjectURL(shapeGuideFileURL);
  shapeGuideFileURL=URL.createObjectURL(file);const image=new Image();image.src=shapeGuideFileURL;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;fitImage(canvas.getContext('2d'),image);
  shapeGuideDataUrl=canvas.toDataURL('image/jpeg',.9);shapeGuideName=file.name;
  $('shapeGuideName').textContent=`${file.name} · Canny shape only`;$('clearShapeGuide').disabled=false;
 }catch(error){message('Canny guide image could not be loaded: '+error.message,true);}
};
$('pose').onchange=()=>{if($('pose').checked){startPose();if($('mode').value!=='pose')$('mode').value='sketch';}else{$('mode').value='image';}updateMode();};
const parameterLimits={sourceValue:[0,1],sourceColor:[0,1],colorSpread:[0,128],sdxsSketch:[0,4],sdxsCanny:[0,4],sdxsDepth:[0,4],sdxsPose:[0,4],control:[0,65504],cannyControl:[0,65504],compositeMix:[0,1],strength:[.05,1],motion:[0,100],mix:[0,1],feedback:[0,1],maxfps:[1,120],paletteStrength:[0,1],blackPoint:[0,254],whitePoint:[1,255],gamma:[.1,5],brightness:[0,4],contrast:[0,4],saturation:[0,4],sharpen:[0,4],emboss:[0,1],upscaleFeedback:[0,1]};
function parameterValue(id){
 const value=Number($(`${id}Value`).value);
 return Number.isFinite(value)?value:parameterLimits[id][0];
}
function formatParameter(id,value){return id==='maxfps'?String(Math.round(value)):Number(value).toFixed(2);}
function syncParameter(id,source){
 const range=$(id),number=$(`${id}Value`),[min,max]=parameterLimits[id];
 if(source==='range'){
  number.value=formatParameter(id,Number(range.value));
 }else{
  let value=Number(number.value);
  if(!Number.isFinite(value))value=Number(range.value);
  value=Math.min(max,Math.max(min,value));
  number.value=formatParameter(id,value);
  range.value=String(value); // The slider clamps to its display range; the number remains authoritative.
 }
 const value=Number(number.value),outside=value<Number(range.min)||value>Number(range.max);
 number.dataset.outsideSlider=String(outside);
 number.title=outside?`Using ${formatParameter(id,value)} directly; slider display is limited to ${range.min}–${range.max}.`:'Click to type a value.';
}
for(const id of Object.keys(parameterLimits)){
 $(id).addEventListener('input',()=>syncParameter(id,'range'));
 $(`${id}Value`).addEventListener('change',()=>syncParameter(id,'number'));
 $(`${id}Value`).addEventListener('keydown',event=>{
  if(event.key==='Enter'){$(`${id}Value`).blur();}
  if(event.key==='Escape'){syncParameter(id,'range');$(`${id}Value`).blur();}
 });
}

$('size').onchange=()=>changeModelSize(Number($('size').value));
$('aiUpscaler').onchange=updateUpscalerControls;
updateUpscalerControls();
$('upscale').onchange=()=>{};
function point(e){const box=input.getBoundingClientRect();return[(e.clientX-box.left)*512/box.width,(e.clientY-box.top)*512/box.height];}
input.onpointerdown=e=>{if($('source').value!=='draw')return;recoverFrame();e.preventDefault();drawing=true;lastPoint=point(e);input.setPointerCapture(e.pointerId);};
input.onpointermove=e=>{if(!drawing)return;const next=point(e);ctx.strokeStyle=e.buttons===2?'white':'#111';stroke([lastPoint,next],Number($('brush').value)*(e.buttons===2?3:1));lastPoint=next;};
input.onpointerup=input.onpointercancel=()=>drawing=false;
input.oncontextmenu=e=>e.preventDefault();
$('help').onclick=()=>$('helpDialog').showModal();
$('full').onclick=()=>(document.body.dataset.host==='excalidraw'?document.documentElement:output).requestFullscreen().catch(error=>message(error.message,true));
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function dataURLToBlob(dataURL){
 const [header,encoded]=dataURL.split(',',2),mime=header.match(/^data:([^;]+)/)?.[1]||'application/octet-stream';
 const binary=atob(encoded),bytes=new Uint8Array(binary.length);
 for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);
 return new Blob([bytes],{type:mime});
}
function canvasBlob(canvas,type='image/png'){
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not encode image.')),type));
}
const crcTable=(()=>{
 const table=new Uint32Array(256);
 for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}
 return table;
})();
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return(crc^0xffffffff)>>>0;}
function pngChunk(type,payload){
 const typeBytes=new TextEncoder().encode(type),body=new Uint8Array(typeBytes.length+payload.length);body.set(typeBytes);body.set(payload,typeBytes.length);
 const chunk=new Uint8Array(12+payload.length),view=new DataView(chunk.buffer);
 view.setUint32(0,payload.length);chunk.set(body,4);view.setUint32(8+payload.length,crc32(body));return chunk;
}
async function embedPNGMetadata(blob,metadata){
 const bytes=new Uint8Array(await blob.arrayBuffer()),signature=[137,80,78,71,13,10,26,10];
 if(signature.some((byte,index)=>bytes[index]!==byte))throw new Error('Generated image is not a PNG.');
 let offset=8,iend=-1;
 while(offset+12<=bytes.length){
  const length=new DataView(bytes.buffer,bytes.byteOffset+offset,4).getUint32(0),type=new TextDecoder().decode(bytes.subarray(offset+4,offset+8));
  if(type==='IEND'){iend=offset;break;}
  offset+=12+length;
 }
 if(iend<0)throw new Error('PNG is missing its end marker.');
 const keyword=new TextEncoder().encode('Genereti Metadata'),text=new TextEncoder().encode(JSON.stringify(metadata,null,2));
 const payload=new Uint8Array(keyword.length+5+text.length);let cursor=0;
 payload.set(keyword,cursor);cursor+=keyword.length;payload[cursor++]=0;payload[cursor++]=0;payload[cursor++]=0;payload[cursor++]=0;payload[cursor++]=0;payload.set(text,cursor);
 const chunk=pngChunk('iTXt',payload),result=new Uint8Array(bytes.length+chunk.length);
 result.set(bytes.subarray(0,iend),0);result.set(chunk,iend);result.set(bytes.subarray(iend),iend+chunk.length);
 return new Blob([result],{type:'image/png'});
}
function metadataForLastGeneration(){
 if(!lastGeneration)throw new Error('Wait for a generated frame before exporting.');
 const {settings,request,inputDataUrl,referenceDataUrl,referenceName,shapeGuideDataUrl,shapeGuideName,mixerPoseDataUrl,mixerPoseName,drawing,startedAt,completedAt}=lastGeneration;
 const result=Object.fromEntries(Object.entries(lastStats||{}).filter(([key,value])=>key!=='image'&&key!=='guide'&&value!==undefined&&typeof value!=='function'));
 return {
  format:'genereti-scene-v1',app:'Genereti',createdAt:completedAt||startedAt,
  drawing:drawing||null,
  source:{editableDrawingIncluded:Boolean(drawing),kind:settings.source,mode:request.mode,imageIncluded:Boolean(inputDataUrl),mimeType:inputDataUrl?.match(/^data:([^;]+)/)?.[1]||null,
   referenceIncluded:Boolean(referenceDataUrl),referenceName:referenceName||null,
   shapeGuideIncluded:Boolean(shapeGuideDataUrl),shapeGuideName:shapeGuideName||null,poseGuideIncluded:Boolean(mixerPoseDataUrl),poseGuideName:mixerPoseName||null},
  settings,request,result,
 };
}
function safeStamp(iso){return(iso||new Date().toISOString()).replace(/[:.]/g,'-');}
async function outcomeWithMetadata(metadata=metadataForLastGeneration()){return embedPNGMetadata(await canvasBlob(output),metadata);}
async function loadImage(dataURL){const image=new Image();image.src=dataURL;await image.decode();return image;}
function wrapCanvasText(context,text,x,y,maxWidth,lineHeight,maxLines=3){
 const words=String(text||'').split(/\s+/);let line='',lines=0;
 for(const word of words){const next=line?`${line} ${word}`:word;if(context.measureText(next).width>maxWidth&&line){context.fillText(line,x,y);y+=lineHeight;line=word;if(++lines>=maxLines)return;}else line=next;}
 if(line&&lines<maxLines)context.fillText(line,x,y);
}
async function sceneBoard(metadata,sourceDataUrl,outcomeDataUrl,referenceDataUrl,shapeGuideDataUrl,poseDataUrl){
 const hasReference=Boolean(referenceDataUrl),hasShapeGuide=Boolean(shapeGuideDataUrl),columns=2+Number(hasReference)+Number(hasShapeGuide)+Number(Boolean(poseDataUrl));
 const canvas=document.createElement('canvas');canvas.width=columns===2?1400:columns*500;canvas.height=columns===2?900:920;
 const context=canvas.getContext('2d'),top=105,side=columns===2?580:420;
 const positions=columns===2?[70,750]:Array.from({length:columns},(_,i)=>40+i*500);
 const panels=[{label:'SHAPE SOURCE',url:sourceDataUrl},{label:'CANNY SHAPE GUIDE',url:shapeGuideDataUrl},{label:'POSE GUIDE',url:poseDataUrl},{label:'PALETTE REFERENCE',url:referenceDataUrl},{label:'GENERATED OUTCOME',url:outcomeDataUrl}]
  .filter(panel=>panel.label==='SHAPE SOURCE'||panel.label==='GENERATED OUTCOME'||Boolean(panel.url));
 context.fillStyle='#17191b';context.fillRect(0,0,canvas.width,canvas.height);
 context.fillStyle='#eceeeb';context.font='600 30px Inter, -apple-system, sans-serif';context.fillText('Genereti · Live image scene',70,52);
 context.fillStyle='#a4aaa8';context.font='16px Inter, -apple-system, sans-serif';context.textAlign='right';context.fillText(new Date(metadata.createdAt).toLocaleString(),canvas.width-50,50);context.textAlign='left';
 for(let index=0;index<panels.length;index++){
  const panel=panels[index],x=positions[index];context.fillStyle='#202326';context.fillRect(x,top,side,side);
  context.fillStyle='#eceeeb';context.font=columns===4?'600 12px Inter, -apple-system, sans-serif':'600 17px Inter, -apple-system, sans-serif';context.fillText(panel.label,x,top-18);
  if(panel.url){const image=await loadImage(panel.url);context.drawImage(image,x,top,side,side);}
  else{context.fillStyle='#a4aaa8';context.font='20px Inter, -apple-system, sans-serif';context.textAlign='center';context.fillText('Text prompt only',x+side/2,top+side/2);context.textAlign='left';}
 }
 const dividerY=columns===2?720:580,left=positions[0],contentWidth=canvas.width-left-50;
 context.strokeStyle='#363a3e';context.beginPath();context.moveTo(left,dividerY);context.lineTo(left+contentWidth,dividerY);context.stroke();
 context.fillStyle='#d1ec9c';context.font='600 14px Inter, -apple-system, sans-serif';context.fillText(`${metadata.result.model||'Local model'} · ${metadata.source.mode} · seed ${metadata.settings.seed}`,left,dividerY+32);
 context.fillStyle='#eceeeb';context.font='17px Inter, -apple-system, sans-serif';wrapCanvasText(context,metadata.settings.prompt,left,dividerY+64,contentWidth,24,3);
 context.fillStyle='#a4aaa8';context.font='14px Inter, -apple-system, sans-serif';
 context.fillText(`Sketch ${metadata.request.control_scale} · Canny ${metadata.request.canny_control_scale} · palette ${metadata.request.palette_strength} · sharpen ${metadata.request.sharpen} · ${metadata.result.inference_ms??'—'} ms`,left,canvas.height-24);
 return canvasBlob(canvas);
}
function concatBytes(parts){const length=parts.reduce((sum,part)=>sum+part.length,0),result=new Uint8Array(length);let offset=0;for(const part of parts){result.set(part,offset);offset+=part.length;}return result;}
function zipStored(entries){
 const encoder=new TextEncoder(),local=[],central=[];let localOffset=0;
 const now=new Date(),dosTime=(now.getHours()<<11)|(now.getMinutes()<<5)|(Math.floor(now.getSeconds()/2)),dosDate=((Math.max(1980,now.getFullYear())-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
 for(const entry of entries){
  const name=encoder.encode(entry.name),data=entry.bytes,crc=crc32(data),header=new Uint8Array(30+name.length),view=new DataView(header.buffer);
  view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x0800,true);view.setUint16(8,0,true);view.setUint16(10,dosTime,true);view.setUint16(12,dosDate,true);view.setUint32(14,crc,true);view.setUint32(18,data.length,true);view.setUint32(22,data.length,true);view.setUint16(26,name.length,true);view.setUint16(28,0,true);header.set(name,30);local.push(header,data);
  const directory=new Uint8Array(46+name.length),dv=new DataView(directory.buffer);
  dv.setUint32(0,0x02014b50,true);dv.setUint16(4,20,true);dv.setUint16(6,20,true);dv.setUint16(8,0x0800,true);dv.setUint16(10,0,true);dv.setUint16(12,dosTime,true);dv.setUint16(14,dosDate,true);dv.setUint32(16,crc,true);dv.setUint32(20,data.length,true);dv.setUint32(24,data.length,true);dv.setUint16(28,name.length,true);dv.setUint16(30,0,true);dv.setUint16(32,0,true);dv.setUint16(34,0,true);dv.setUint16(36,0,true);dv.setUint32(38,0,true);dv.setUint32(42,localOffset,true);directory.set(name,46);central.push(directory);localOffset+=header.length+data.length;
 }
 const centralBytes=concatBytes(central),end=new Uint8Array(22),view=new DataView(end.buffer);view.setUint32(0,0x06054b50,true);view.setUint16(4,0,true);view.setUint16(6,0,true);view.setUint16(8,entries.length,true);view.setUint16(10,entries.length,true);view.setUint32(12,centralBytes.length,true);view.setUint32(16,localOffset,true);view.setUint16(20,0,true);
 return new Blob([...local,centralBytes,end],{type:'application/zip'});
}
async function copyToClipboard(imageBlob,metadata){
 if(!navigator.clipboard?.write||!window.ClipboardItem)throw new Error('Image clipboard is unavailable here. Open Genereti from its local server in Chrome or Safari.');
 await navigator.clipboard.write([new ClipboardItem({'image/png':imageBlob,'text/plain':new Blob([JSON.stringify(metadata,null,2)],{type:'text/plain'})})]);
}
$('save').onclick=async()=>{try{const metadata=metadataForLastGeneration(),blob=await outcomeWithMetadata(metadata);download(blob,`genereti-image-${safeStamp(metadata.createdAt)}.png`);message('Saved PNG with embedded Genereti metadata.');}catch(error){message(error.message,true);}};
$('copyImage').onclick=async()=>{try{const metadata=metadataForLastGeneration(),blob=await outcomeWithMetadata(metadata);await copyToClipboard(blob,metadata);message('Copied the image with embedded Genereti metadata.');}catch(error){message(error.message,true);}};
$('saveScene').onclick=async()=>{try{
 const metadata=metadataForLastGeneration(),sourceDataUrl=lastGeneration?.inputDataUrl,shapeGuideDataUrl=lastGeneration?.shapeGuideDataUrl,referenceDataUrl=lastGeneration?.referenceDataUrl,guideDataUrl=lastStats?.guide,outcome=await outcomeWithMetadata(metadata),entries=[
  {name:'outcome.png',bytes:new Uint8Array(await outcome.arrayBuffer())},
  {name:'metadata.json',bytes:new TextEncoder().encode(JSON.stringify(metadata,null,2))},
  {name:'README.txt',bytes:new TextEncoder().encode('Genereti scene export\n\ndrawing.excalidraw is included for editable vector input and preserves element IDs, coordinates, rotation, colors and embedded files. Open it in the Shapes editor to continue editing. source.jpg (or source.png) is the exact input image sent to the SDXS branch. shape-guide.jpg is an optional independent Canny structure guide. reference.jpg is an optional palette reference. outcome.png is the generated result and embeds metadata. pose-guide.png is included when an explicit mixer pose guide was loaded. guide.jpg (or guide.png) is included when the pipeline returned a preprocessed guide. metadata.json records the prompt, controls, post-processing, and result metrics. Text-only scenes omit the source image.\n')},
 ];
 if(lastGeneration.drawing)entries.push({name:'drawing.excalidraw',bytes:new TextEncoder().encode(JSON.stringify(lastGeneration.drawing.scene,null,2))});
 if(sourceDataUrl){const source=dataURLToBlob(sourceDataUrl),extension=source.type==='image/png'?'png':'jpg';entries.push({name:`source.${extension}`,bytes:new Uint8Array(await source.arrayBuffer())});}
 if(shapeGuideDataUrl){const shape=dataURLToBlob(shapeGuideDataUrl),extension=shape.type==='image/png'?'png':'jpg';entries.push({name:`shape-guide.${extension}`,bytes:new Uint8Array(await shape.arrayBuffer())});}
 if(referenceDataUrl){const reference=dataURLToBlob(referenceDataUrl),extension=reference.type==='image/png'?'png':'jpg';entries.push({name:`reference.${extension}`,bytes:new Uint8Array(await reference.arrayBuffer())});}
 if(lastGeneration.mixerPoseDataUrl){const pose=dataURLToBlob(lastGeneration.mixerPoseDataUrl);entries.push({name:'pose-guide.png',bytes:new Uint8Array(await pose.arrayBuffer())});}
 if(guideDataUrl){const guide=dataURLToBlob(guideDataUrl),extension=guide.type==='image/png'?'png':'jpg';entries.push({name:`guide.${extension}`,bytes:new Uint8Array(await guide.arrayBuffer())});}
 const zip=zipStored(entries),stamp=safeStamp(metadata.createdAt);download(zip,`genereti-scene-${stamp}.zip`);message('Saved scene ZIP with source, outcome, and metadata.');
 }catch(error){message(error.message,true);}};
 $('copyScene').onclick=async()=>{try{const metadata=metadataForLastGeneration(),sourceDataUrl=lastGeneration?.inputDataUrl,referenceDataUrl=lastGeneration?.referenceDataUrl,shapeGuideDataUrl=lastGeneration?.shapeGuideDataUrl,outcomeDataUrl=output.toDataURL('image/png'),board=await embedPNGMetadata(await sceneBoard(metadata,sourceDataUrl,outcomeDataUrl,referenceDataUrl,shapeGuideDataUrl,lastGeneration?.mixerPoseDataUrl),metadata);await copyToClipboard(board,metadata);message('Copied the source + guides + outcome scene board with metadata.');}catch(error){message(error.message,true);}};
$('record').onclick=()=>{
 if(recording?.state==='recording'){recording.stop();$('record').textContent='Record';return;}
 if(!window.MediaRecorder){message('This browser does not support recording.',true);return;}
 chunks=[];const type=['video/webm;codecs=vp9','video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
 const captureStream=output.captureStream(30);
 try{recording=new MediaRecorder(captureStream,type?{mimeType:type}:{});}catch(error){captureStream.getTracks().forEach(t=>t.stop());message(error.message,true);return;}
 recording.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
 recording.onstop=()=>{download(new Blob(chunks,{type:recording.mimeType}),`genereti-${Date.now()}.${recording.mimeType.includes('mp4')?'mp4':'webm'}`);captureStream.getTracks().forEach(t=>t.stop());};
 recording.start(1000);$('record').textContent='Stop recording';
};
window.addEventListener('keydown',e=>{if(document.body.dataset.host==='excalidraw'&&!e.altKey)return;if(e.code==='Space'&&!['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement.tagName)&&!$('helpDialog').open){e.preventDefault();if(ready)setRunning(!running);}});
window.addEventListener('beforeunload',()=>{releaseMedia();poseWorker?.terminate();socket?.close();});
window.genereti={performance:{snapshot:performanceSnapshot,reset:resetPerformance},drawing:{getScene(){return drawingInputSnapshot?structuredClone(drawingInputSnapshot.scene):null;},loadScene(scene){if($('source').value!=='editor'){$('source').value='editor';sourceChanged();}drawingEditor.load(scene);},fit(){drawingEditor.send('fit');}},get state(){return{ready,running,busy,frame:lastFrame,metrics:lastStats};},setPrompt(prompt){$('prompt').value=prompt;applyPrompts();},pause(){setRunning(false);},start(){if(ready)setRunning(true);}};
const savedFields=['sdxsSketchKind','cannyLow','cannyHigh','guideLineWidth','prompt','promptB','source','mode','style','seed','rawGuide','invertSketch','invertCanny','invertDepth','invertPose','mirror','compositeMode','aiUpscaler','upscaleIterations','upscaleOutput','upscale','upscaleFilter'];
const parameterFields=['sourceValue','sourceColor','colorSpread','sdxsSketch','sdxsCanny','sdxsDepth','sdxsPose','control','cannyControl','compositeMix','strength','motion','mix','feedback','maxfps','paletteStrength','blackPoint','whitePoint','gamma','brightness','contrast','saturation','sharpen','emboss','upscaleFeedback'];
function readSettings(){
 return Object.fromEntries([
  ...savedFields.map(id=>[id,$(id).type==='checkbox'?$(id).checked:$(id).value]),
  ...parameterFields.map(id=>[id,parameterValue(id)]),
  ...(document.body.dataset.host==='excalidraw'?['frameInputMode','inputFrameSelect','overlayOutput','overlayInputOrder'].map(id=>[id,$(id).type==='checkbox'?$(id).checked:$(id).value]):[]),
 ]);
}
function restoreSettings(settings={}){
 if(settings.source!==undefined){$('source').value=settings.source;sourceChanged();}
 for(const id of savedFields)if(settings[id]!==undefined&&id!=='source'){
  if($(id).type==='checkbox')$(id).checked=Boolean(settings[id]);else $(id).value=settings[id];
 }
 for(const id of parameterFields){
  const number=$(`${id}Value`);
  const stored=settings[id]??settings[`${id}_value`];
  if(stored!==undefined)number.value=stored;
  syncParameter(id,'number');
 }
 if(document.body.dataset.host==='excalidraw')for(const id of ['frameInputMode','inputFrameSelect','overlayOutput','overlayInputOrder'])if(settings[id]!==undefined){const field=$(id);if(field.type==='checkbox')field.checked=Boolean(settings[id]);else field.value=settings[id];field.dispatchEvent(new Event('change',{bubbles:true}));}
 applyPrompts();
 updateUpscalerControls();
 updateMode();
}
const userPresetsKey='genereti-presets-v1';
let userPresets=[];
try{userPresets=JSON.parse(localStorage.getItem(userPresetsKey)||'[]');if(!Array.isArray(userPresets))userPresets=[];}catch{userPresets=[];}
function renderPresetOptions(selected=''){
 const select=$('preset'), group=[...select.querySelectorAll('optgroup')].find(node=>node.label==='Saved setups');
 if(group)group.remove();
 if(userPresets.length){
  const saved=document.createElement('optgroup');saved.label='Saved setups';
  for(const preset of userPresets){const option=new Option(preset.name,`saved:${preset.id}`);saved.append(option);}
  select.append(saved);
 }
 select.value=selected;
 $('deletePreset').disabled=!selected.startsWith('saved:');
}
function persistPresets(){
 try{localStorage.setItem(userPresetsKey,JSON.stringify(userPresets));}catch{message('Could not save presets in this browser.',true);}
}
$('preset').onchange=()=>{
 closePresetEditor();
 const key=$('preset').value;
 if(key.startsWith('saved:')){
  const selected=userPresets.find(item=>item.id===key.slice(6));
  if(selected)restoreSettings(selected.settings);
 }else if(key.startsWith('prompt:')){
  const name=key.slice(7);$('prompt').value=presets[name]||'';applyPrompts();
  $('source').value=['jellyfish','tree','portrait'].includes(name)?'text':'demo';
  sourceChanged();
 }
 $('deletePreset').disabled=!key.startsWith('saved:');
};
$('savePreset').onclick=()=>{
 $('presetTools').hidden=true;
 $('presetSaveError').hidden=true;
 $('presetSaveForm').hidden=false;
 $('presetName').value='';
 $('presetName').focus();
};
function closePresetEditor(){
 $('presetSaveForm').hidden=true;
 $('presetTools').hidden=false;
 $('presetSaveError').hidden=true;
}
$('cancelPresetSave').onclick=closePresetEditor;
$('presetSaveForm').addEventListener('submit',event=>{
 event.preventDefault();
 const name=$('presetName').value.trim();
 if(!name){$('presetSaveError').hidden=false;$('presetName').focus();return;}
 const preset={id:crypto.randomUUID(),name,settings:readSettings()};
 userPresets.push(preset);persistPresets();renderPresetOptions(`saved:${preset.id}`);
 closePresetEditor();
 message(`Saved preset “${preset.name}”.`);
});
$('deletePreset').onclick=()=>{
 const key=$('preset').value;
 if(!key.startsWith('saved:'))return;
 const selected=userPresets.find(item=>item.id===key.slice(6));
 userPresets=userPresets.filter(item=>item.id!==key.slice(6));
 persistPresets();renderPresetOptions();
 if(selected)message(`Deleted preset “${selected.name}”.`);
};
renderPresetOptions();updateReferenceControls();
try{
 const saved=JSON.parse(localStorage.getItem('genereti-controls')||'{}');
 restoreSettings(saved);
}catch{clear();updateMode();}
function recoverFrame(){
 if(frameBlocked){frameBlocked=false;lastSent=0;if(running)message('Controls updated · resuming live generation.');}
}
const recoverControl=event=>{if(!['prompt','promptB'].includes(event.target.id))recoverFrame();};
document.addEventListener('input',recoverControl);
document.addEventListener('change',recoverControl);
$('clearMixerPose').addEventListener('click',recoverFrame);
$('random').addEventListener('click',recoverFrame);
document.addEventListener('change',()=>{try{localStorage.setItem('genereti-controls',JSON.stringify(readSettings()));}catch{}});
connection();pollStatus();setInterval(pollStatus,3000);requestAnimationFrame(frame);
