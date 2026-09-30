const $ = id => document.getElementById(id);
const input = $('input'), output = $('output');
const ctx = input.getContext('2d'), out = output.getContext('2d');
const video = $('video');
const capture = document.createElement('canvas'); capture.width=capture.height=512;
const capctx=capture.getContext('2d');
let ready=false, running=false, busy=false, socket, retryTimer, sentAt=0, frameId=0;
let stream, uploadedImage, fileURL, recording, chunks=[], lastFrame=0, phase=0, demoTime=0;
let showingGuide=false;
let previousRAF=performance.now(), fpsTimes=[], lastSent=0, timeout, lastStats;
let poseWorker, poseReady=false, poseBusy=false, poseLandmarks=[], lastPose=0;
let drawing=false, lastPoint, pointer={x:.5,y:.5};
const presets={
 robot:'a friendly colorful toy robot, full body, rounded metal body, waving arms, beautiful studio lighting, 3d render',
 stage:'A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition',
 dancer:'a dancer made of folded colored paper, full body, graceful pose, origami sculpture, clean studio background',
 jellyfish:'a luminous jellyfish floating in a deep blue ocean, bioluminescent, ethereal underwater photograph',
 tree:'an ancient twisting bonsai tree, Japanese ink and watercolor painting, expressive branches, white background',
 portrait:'a clay sculpture portrait, colorful ceramic, expressive face, studio lighting',
};
function message(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error);}
function notice(text){$('inputNotice').textContent=text;$('inputNotice').hidden=!text;}
function setRunning(value){
 running=value; $('run').textContent=running?'Pause':'Start live';$('run').classList.toggle('live',running);
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
   busy=false;
   if(result.status===429){message(result.error,true);lastSent=performance.now()+500;return;}
   message(result.error,true);setRunning(false);message(result.error,true);return;
  }
  try{
   if(result.guide){const gi=new Image();gi.src=result.guide;await gi.decode();$('guide').getContext('2d').drawImage(gi,0,0,512,512);}
   const img=new Image(); img.src=result.image; await img.decode();
   if(output.width!==img.naturalWidth) output.width=output.height=img.naturalWidth;
   out.drawImage(img,0,0);lastFrame=result.frame;lastStats=result;
   $('empty').hidden=true;$('save').disabled=false;$('record').disabled=false;
   const now=performance.now(); fpsTimes.push(now);if(fpsTimes.length>30)fpsTimes.shift();
   const fps=fpsTimes.length>1?(fpsTimes.length-1)*1000/(now-fpsTimes[0]):1000/(now-sentAt);
   $('fps').textContent=running?fps.toFixed(1):'—';
   $('latency').textContent=`${Math.round(now-sentAt)} ms round trip`;
   $('model').textContent=`${result.model}${result.style==='anime'?' + Anime LoRA':''} · ${result.size} × ${result.size} · Core ML`;
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
  $('status').textContent=data.error?'Model error':ready?'Local model ready':data.loading||'Starting…';
  $('status').classList.toggle('ready',ready);
  if(data.error)message(data.error,true);
  if(ready&& !$('empty').hidden)$('empty').querySelector('small').textContent='Press Start live to generate.';
  if(ready&&!lastFrame) $('model').textContent=`Local models · ${data.size} × ${data.size} · Core ML`;
  if(ready&&data.available_models){for(const mode of ['canny','depth','pose'])$('mode').querySelector(`[value=${mode}]`).disabled=!data.available_models.includes('control_'+mode);$('style').querySelector('[value=anime]').disabled=!data.available_models.includes('anime_unet');}
  $('mode').querySelector('[value=sketch]').disabled=ready&&!data.controlnet;
 }catch{ready=false;$('run').disabled=true;$('status').textContent='Server offline';}
}
function releaseMedia(){
 if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
 video.pause();video.srcObject=null;video.removeAttribute('src');video.load();
 if(fileURL){URL.revokeObjectURL(fileURL);fileURL=null;}
 uploadedImage=null;poseLandmarks=[];
}
function updateMode(){
 if(['text','image'].includes($('mode').value)){showingGuide=false;$('guide').hidden=true;$('guideToggle').textContent='View guide';}
 $('guideToggle').disabled=['text','image'].includes($('mode').value);
 $('controlWrap').hidden=!['sketch','canny','depth','pose'].includes($('mode').value);
 $('style').disabled=!['text','sketch'].includes($('mode').value);
 if($('mode').value==='pose'&&$('source').value==='camera'){$('pose').checked=true;startPose();}
 $('strengthWrap').hidden=$('mode').value!=='image';
 if($('mode').value==='text'){ $('controlWrap').hidden=true; $('strengthWrap').hidden=true; }
 // Keep fixed column positions without adding a dead slider.
}
function clear(){ctx.fillStyle='white';ctx.fillRect(0,0,512,512);}
function sourceChanged(){
 releaseMedia();clear();notice('');
 const source=$('source').value;
 $('clear').hidden=$('brushLabel').hidden=source!=='draw';
 $('connectCamera').hidden=$('camera').hidden=source!=='camera';
 $('captureScreen').hidden=source!=='screen';$('chooseFile').hidden=source!=='file';
 $('mode').value=['demo','draw'].includes(source)?'sketch':source==='text'?'text':'image';
 updateMode();
 const labels={demo:'Animated sketch · no camera needed',draw:'Draw black lines on white · right click to erase',camera:'Camera stays on this Mac',screen:'Share a window to transform it',file:'Local image or looping video',text:'Text + fixed seed · no image input'};
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
 const dt=Math.min((now-previousRAF)/1000,.1);previousRAF=now;
 const motion=Number($('motion').value);
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
 if(running&&ready&&!busy&&socket?.readyState===WebSocket.OPEN&&now-lastSent>1000/Number($('maxfps').value)){
  const source=$('source').value,mode=$('mode').value;
  const hasInput=mode==='text'||['demo','draw'].includes(source)||uploadedImage||video.readyState>=2;
  if(hasInput && !(source==='camera'&&$('pose').checked&&!poseLandmarks.length)){
   busy=true;sentAt=lastSent=now;
   // Keep sketches anchored; noise morph only in text and image modes.
   if(mode==='text'||mode==='image')phase+=motion*.035;
   const request={id:++frameId,style:$('style').value,preprocess:!$('rawGuide').checked,return_guide:true,prompt:$('prompt').value,prompt_b:$('promptB').value,prompt_mix:Number($('mix').value),mode,
    seed:Number($('seed').value)||0,strength:Number($('strength').value),control_scale:Number($('control').value),
    feedback:Number($('feedback').value),noise_phase:phase,image:mode==='text'?null:input.toDataURL('image/jpeg',.9)};
   socket.send(JSON.stringify(request));
   timeout=setTimeout(()=>{message('Generation timed out; reconnecting.',true);socket.close();},120000);
  }
 }
 requestAnimationFrame(frame);
}
$('run').onclick=()=>setRunning(!running);
$('source').onchange=sourceChanged;
$('mode').onchange=updateMode;
$('clear').onclick=clear;
$('guideToggle').onclick=()=>{showingGuide=!showingGuide;$('guide').hidden=!showingGuide;$('guideToggle').textContent=showingGuide?'View input':'View guide';};
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
$('pose').onchange=()=>{if($('pose').checked){startPose();if($('mode').value!=='pose')$('mode').value='sketch';}else{$('mode').value='image';}updateMode();};
$('preset').onchange=()=>{const key=$('preset').value;if(!key)return;$('prompt').value=presets[key];
 if(key==='jellyfish'||key==='tree'||key==='portrait'){$('source').value='text';sourceChanged();}
 else{$('source').value='demo';sourceChanged();}
};
for(const id of ['control','strength','motion','mix','feedback','maxfps']) $(id).addEventListener('input',()=>$(id+'Value').textContent=id==='maxfps'?$(id).value:Number($(id).value).toFixed(2));
function point(e){const box=input.getBoundingClientRect();return[(e.clientX-box.left)*512/box.width,(e.clientY-box.top)*512/box.height];}
input.onpointerdown=e=>{if($('source').value!=='draw')return;e.preventDefault();drawing=true;lastPoint=point(e);input.setPointerCapture(e.pointerId);};
input.onpointermove=e=>{if(!drawing)return;const next=point(e);ctx.strokeStyle=e.buttons===2?'white':'#111';stroke([lastPoint,next],Number($('brush').value)*(e.buttons===2?3:1));lastPoint=next;};
input.onpointerup=input.onpointercancel=()=>drawing=false;
input.oncontextmenu=e=>e.preventDefault();
$('help').onclick=()=>$('helpDialog').showModal();
$('full').onclick=()=>output.requestFullscreen().catch(error=>message(error.message,true));
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
$('save').onclick=()=>output.toBlob(blob=>download(blob,`genereti-${Date.now()}.png`));
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
window.addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement.tagName)&&!$('helpDialog').open){e.preventDefault();if(ready)setRunning(!running);}});
window.addEventListener('beforeunload',()=>{releaseMedia();poseWorker?.terminate();socket?.close();});
window.genereti={get state(){return{ready,running,busy,frame:lastFrame,metrics:lastStats};},setPrompt(prompt){$('prompt').value=prompt;},pause(){setRunning(false);},start(){if(ready)setRunning(true);}};
const savedFields=['prompt','promptB','source','mode','style','seed','strength','control','motion','mix','feedback','maxfps','rawGuide','mirror'];
try{
 const saved=JSON.parse(localStorage.getItem('genereti-controls')||'{}');
 for(const id of savedFields)if(saved[id]!==undefined){if($(id).type==='checkbox')$(id).checked=saved[id];else $(id).value=saved[id];}
 const selectedMode=$('mode').value;sourceChanged();$('mode').value=selectedMode;updateMode();
 for(const id of ['control','strength','motion','mix','feedback','maxfps'])$(id).dispatchEvent(new Event('input'));
}catch{clear();updateMode();}
document.addEventListener('change',()=>{try{localStorage.setItem('genereti-controls',JSON.stringify(Object.fromEntries(savedFields.map(id=>[id,$(id).type==='checkbox'?$(id).checked:$(id).value]))));}catch{}});
connection();pollStatus();setInterval(pollStatus,3000);requestAnimationFrame(frame);
