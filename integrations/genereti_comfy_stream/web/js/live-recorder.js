import {app} from '../../../scripts/app.js';
import {subscribeLive} from '/extensions/genereti_comfy_p5/js/live-runtime.js';
import {ensureControlStyle} from '/extensions/genereti_comfy_p5/js/control-style.js';
import {LoopCapture} from './record-loop.js';

app.registerExtension({name:'Genereti.LiveRecorder',nodeCreated(node){
 if(node.comfyClass!=='GeneretiLiveRecorder')return;
 ensureControlStyle();node.properties??={};
 const root=document.createElement('div'),bar=document.createElement('div'),status=document.createElement('div'),preview=document.createElement('canvas');
 bar.className='genereti-node-controls';root.style.cssText='width:100%;display:flex;flex-direction:column;gap:6px';status.className='genereti-status';status.style.cssText='font-size:11px';preview.width=512;preview.height=288;preview.style.cssText='width:100%;height:auto;background:#111;display:block';
 const choice=(name,title,options,initial)=>{const el=document.createElement('select');el.title=el.ariaLabel=title;for(const [v,label] of options)el.add(new Option(label,v));el.value=node.properties[name]??initial;el.onchange=()=>{node.properties[name]=el.value;node.graph?.change?.();};return el;};
 const mode=choice('genereti_record_mode','Recording content',[['av','Audio + video'],['video','Video only'],['audio','Audio only']],'av');
 const timing=choice('genereti_record_timing','Recording timing',[['manual','Manual'],['loop','One project loop']],'manual');
 const fps=choice('genereti_record_fps','Video frame rate',[['15','15 fps'],['24','24 fps'],['30','30 fps'],['60','60 fps']],'30');
 const size=choice('genereti_record_size','Resolution (short side; Source size keeps the live image size, capped at 4K)',[['source','Source size'],['720','720p'],['1080','1080p'],['1440','1440p']],'source');
 const quality=choice('genereti_record_quality','Video bitrate',[['6','Draft · 6 Mbps'],['12','Good · 12 Mbps'],['25','High · 25 Mbps'],['50','Max · 50 Mbps']],'12');
 const configured=node.onConfigure;node.onConfigure=function(){const result=configured?.apply(this,arguments);mode.value=node.properties?.genereti_record_mode??'av';timing.value=node.properties?.genereti_record_timing??'manual';fps.value=node.properties?.genereti_record_fps??'30';size.value=node.properties?.genereti_record_size??'source';quality.value=node.properties?.genereti_record_quality??'12';fit();return result;};
 const record=document.createElement('button');record.type='button';record.textContent='●';record.title=record.ariaLabel='Start recording';record.setAttribute('aria-pressed','false');
 bar.append(mode,timing,size,quality,fps,record);root.append(bar,preview,status);root.addEventListener('pointerdown',e=>e.stopPropagation());
 node.addDOMWidget('recorder','GENERETI_RECORDER',root,{serialize:false,hideOnZoom:false}).computeSize=w=>[w,Math.max(180,w*9/16+65)];
 let hasFrame=false,rec=null,stream=null,tap=null,loop=null,timer=null,chunks=[],disposed=false,started=0,srcW=0,srcH=0;
 const setStatus=text=>{status.textContent=text;};
 const source=()=>{const i=node.inputs?.findIndex(x=>x.name==='audio'),link=i>=0?node.getInputLink?.(i):null;return node.graph?.getNodeById(link?.origin_id);};
 // The recorded canvas is sized from the live image: Source keeps it (capped at 4K); 720p/1080p/1440p set the short side. Never resized mid-take.
 const fit=()=>{if(!srcW||!srcH||rec||loop)return;const short=Math.min(srcW,srcH),long=Math.max(srcW,srcH),scale=Math.min(size.value==='source'?1:Number(size.value)/short,4096/long),even=v=>Math.max(2,Math.round(v*scale/2)*2),w=even(srcW),h=even(srcH);if(preview.width!==w||preview.height!==h){preview.width=w;preview.height=h;}};
 const sized=size.onchange;size.onchange=()=>{sized();fit();};
 const unsubscribe=subscribeLive(node,frame=>{const image=frame.bitmap??frame;if(!image?.width||!image?.height)return;if(image.width!==srcW||image.height!==srcH){srcW=image.width;srcH=image.height;fit();}hasFrame=true;preview.getContext('2d').drawImage(image,0,0,preview.width,preview.height);},text=>{if(!rec&&!loop)setStatus(text);},{inputName:'image'});
 function cleanup(){clearInterval(timer);timer=null;loop=null;tap?.close();tap=null;stream?.getTracks().forEach(t=>t.stop());stream=null;record.setAttribute('aria-pressed','false');record.textContent='●';record.title=record.ariaLabel='Start recording';mode.disabled=timing.disabled=size.disabled=quality.disabled=fps.disabled=false;}
 function finish(){if(loop&&!rec){cleanup();setStatus('Loop recording cancelled');return;}if(rec&&rec.state!=='inactive'){rec.stop();setStatus('Saving recording…');}}
 function start(){
  const withVideo=mode.value!=='audio',withAudio=mode.value!=='video';
  if(withVideo&&!hasFrame)throw Error('Connect a live image and wait for a frame');
  if(!window.MediaRecorder)throw Error('MediaRecorder is unavailable in this browser');
  let visualStream;
  try{
   if(withAudio){const n=source();if(n?.comfyClass!=='GeneretiAudioOutput')throw Error('Connect mod.output to audio');tap=window.generetiModularAudio?.recordingTap(n);if(!tap)throw Error('Modular audio is unavailable');}
   visualStream=withVideo?preview.captureStream(Number(fps.value)):null;
   stream=new MediaStream([...(visualStream?.getVideoTracks()??[]),...(tap?.stream.getAudioTracks()??[])]);
   const candidates=withVideo?['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4']:['audio/webm;codecs=opus','audio/webm','audio/mp4'];
   const mime=candidates.find(x=>MediaRecorder.isTypeSupported(x));if(!mime)throw Error('No supported recording format for this mode');
   chunks=[];rec=new MediaRecorder(stream,{mimeType:mime,...(withVideo?{videoBitsPerSecond:Number(quality.value)*1e6}:{}),...(withAudio?{audioBitsPerSecond:192000}:{})});const instance=rec;started=performance.now();
   instance.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   instance.onerror=e=>{setStatus('Recording failed: '+(e.error?.message??'encoder error'));};
   instance.onstop=()=>{const blob=new Blob(chunks,{type:instance.mimeType}),ext=instance.mimeType.includes('mp4')?'mp4':'webm';rec=null;cleanup();if(blob.size&&!disposed){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`genereti-recording-${Date.now()}.${ext}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);setStatus(`Saved ${(blob.size/1048576).toFixed(1)} MB · ${ext.toUpperCase()}${withVideo?` · ${preview.width}×${preview.height}`:''}`);}else if(!disposed)setStatus('Recording was empty');};
   instance.start(1000);record.setAttribute('aria-pressed','true');record.textContent='■';record.title=record.ariaLabel='Stop and save recording';mode.disabled=timing.disabled=size.disabled=quality.disabled=fps.disabled=true;setStatus('Recording…');
  }catch(error){visualStream?.getTracks().forEach(t=>t.stop());cleanup();throw error;}
 }
 function poll(){const clock=window.generetiPerformance?.clock;if(loop){const action=loop.update(clock?.read());if(action==='cancel'){if(rec){finish();setStatus('Transport changed · saving partial take');}else{cleanup();setStatus('Transport changed · loop capture cancelled');}return;}if(action==='start'){try{start();}catch(error){cleanup();setStatus(error.message);return;}}else if(action==='stop'){finish();return;}}
  if(rec){const audio=source();if(mode.value!=='video'&&(!audio||!window.generetiModularAudio?.isRunning?.(audio))){finish();setStatus('Audio stopped · saving partial take');return;}setStatus(`Recording · ${((performance.now()-started)/1000).toFixed(1)} s`);}}
 record.onclick=()=>{if(rec||loop){finish();return;}try{if(timing.value==='loop'){if(mode.value!=='audio'&&!hasFrame)throw Error('Connect a live image and wait for a frame');if(mode.value!=='video'){const n=source();if(!window.generetiModularAudio?.isRunning?.(n))throw Error('Connect a running mod.output to audio');}loop=new LoopCapture(window.generetiPerformance?.clock?.read());record.setAttribute('aria-pressed','true');record.textContent='■';record.title=record.ariaLabel='Cancel armed recording';mode.disabled=timing.disabled=size.disabled=quality.disabled=fps.disabled=true;setStatus('Armed · waiting for next loop');timer=setInterval(poll,10);}else{start();timer=setInterval(poll,100);}}catch(error){cleanup();setStatus(error.message);}};
 setStatus('Connect a live image and/or running mod.output');
 const removed=node.onRemoved;node.onRemoved=function(){disposed=true;unsubscribe();if(rec&&rec.state!=='inactive')rec.stop();cleanup();return removed?.apply(this,arguments);};
}});
