import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";
import { publishLive } from '../../../extensions/genereti_comfy_p5/js/live-runtime.js';
import { ensureControlStyle } from '../../../extensions/genereti_comfy_p5/js/control-style.js';
import { drawSample, sampleDue, disposeSample } from './capture-frame.js';

import { previewState } from '../../../extensions/genereti_comfy_p5/js/preview-state.js';

const SOURCES = {
  GeneretiCameraCapture: { label: 'Webcam', widget: 'GENERETI_CAMERA_CAPTURE' },
  GeneretiScreenCapture: { label: 'Window / Screen', widget: 'GENERETI_SCREEN_CAPTURE' },
};
function selectedSource() {
  return (app.graph?._nodes ?? []).filter(n => n.comfyClass === 'GeneretiInputSelect')
    .map(n => n.widgets?.find(w => w.name === 'source')?.value);
}
function makeCaptureWidget(node, inputName, kind) {
  ensureControlStyle();
  const camera = kind === 'GeneretiCameraCapture';
  const spec = SOURCES[kind];
  const state = {stream:null, starting:false, hasFrame:false, last:-Infinity, users:0, epoch:0, busy:false};
  const container = document.createElement('div');
  Object.assign(container.style,{display:'flex',flexDirection:'column',gap:'6px',width:'100%'});
  const controls = document.createElement('div'); controls.className='genereti-node-controls';
  const select = (label, choices) => {
    const el=document.createElement('select'); el.title=label; el.setAttribute('aria-label',label);
    for(const [value,text] of choices) el.add(new Option(text,value));
    return el;
  };
  const device=select('Camera device', [['','Default camera']]);device.hidden=!camera;
  const size=select('Input resolution · longest side, keeps aspect ratio; never upscales', [['256','256 px'],['512','512 px'],['1024','1024 px'],['0','Native']]);
  const rate=select('Sampling rate · preview, live output and queued captures share the sampled frame', [['0','Hold input'],['0.2','0.2 fps'],['0.5','0.5 fps'],['1','1 fps'],['5','5 fps'],['15','15 fps'],['30','30 fps']]);
  const icon=(glyph,label)=>{const el=document.createElement('button');el.type='button';el.textContent=glyph;el.title=label;el.setAttribute('aria-label',label);return el;};
  const flip=icon('↔','Flip horizontally · affects preview and output');
  controls.append(device,flip,size,rate);
  const status=document.createElement('span');Object.assign(status.style,{fontSize:'11px',opacity:'.75'});
  const video=document.createElement('video'); video.muted=true;video.playsInline=true;
  const canvas=document.createElement('canvas');Object.assign(canvas.style,{width:'100%',maxHeight:'220px',minHeight:'80px',objectFit:'contain',background:'#111',borderRadius:'4px'});
  const sampled=document.createElement('canvas');
  container.append(controls,canvas,status);
  const preview=previewState(node,canvas,{resize:()=>{if(state.hasFrame&&preview.visible){if(canvas.width!==sampled.width||canvas.height!==sampled.height){canvas.width=sampled.width;canvas.height=sampled.height;}canvas.getContext('2d').drawImage(sampled,0,0);}if(node.computeSize)node.setSize?.([node.size[0],node.computeSize()[1]]);}});
  Object.assign(state,{video,canvas:sampled});node._generetiCapture=state;
  node.properties??={};
  let prefs={size:512,fps:30,flip:false,...node.properties.genereti_capture};
  const paint=()=>{
    flip.setAttribute('aria-pressed',String(prefs.flip));
    size.value=String(prefs.size);rate.value=String(prefs.fps);
    status.textContent=state.starting?'Starting capture…':state.stream?`${prefs.fps===0?'Input held':`${prefs.fps} fps`} · ${state.hasFrame?`${sampled.width} × ${sampled.height}`:'waiting for frame'}`:camera?'Camera off':'Not sharing';
    node._generetiTransportRefresh?.();
  };
  const sample=async(force=false)=>{
    if(state.busy || !state.stream || video.readyState<2 || (!force && !sampleDue(performance.now(),state.last,prefs.fps,false,state.hasFrame)))return;
    state.last=performance.now();state.busy=true;const epoch=state.epoch;
    try{drawSample(sampled,video,prefs.size,prefs.flip);}catch(error){state.busy=false;status.textContent=error.message;return;}
    state.hasFrame=true;if(preview.visible){if(canvas.width!==sampled.width||canvas.height!==sampled.height){canvas.width=sampled.width;canvas.height=sampled.height;}canvas.getContext('2d').drawImage(sampled,0,0);}paint();
    try{if(state.users){const bitmap=await createImageBitmap(sampled);try{if(epoch===state.epoch&&state.stream)publishLive(node,bitmap);}finally{bitmap.close();}}}
    catch(error){status.textContent=`Capture failed: ${error.message}`;}finally{state.busy=false;}
  };
  state.sample=sample;
  const stopCapture=()=>{
    state.epoch++;clearInterval(state.timer);const stream=state.stream;state.stream=null;
    stream?.getTracks().forEach(track=>track.stop());video.srcObject=null;
    node._generetiLivePaused=true;paint();
  };
  const enumerate=async()=>{
    try{const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');const current=device.value;device.replaceChildren(new Option('Default camera',''));for(const [i,d] of devices.entries())device.add(new Option(d.label||`Camera ${i+1}`,d.deviceId));device.value=current;}
    catch{/* Default camera remains available even without device labels. */}
  };
  const beginCapture=async()=>{
    if(state.starting)return;state.starting=true;paint();const epoch=++state.epoch;
    try{
      const media=navigator.mediaDevices;if(!media)throw Error('Capture is unavailable in this browser.');
      const stream=camera?await media.getUserMedia({video:{...(device.value?{deviceId:{exact:device.value}}:{}),width:{ideal:prefs.size||1920},frameRate:{ideal:30}},audio:false}):await media.getDisplayMedia({video:true,audio:false});
      if(epoch!==state.epoch){stream.getTracks().forEach(t=>t.stop());return;}
      state.stream=stream;video.srcObject=stream;await video.play();
      state.hasFrame=false;state.last=-Infinity;node._generetiLivePaused=false;
      stream.getVideoTracks()[0]?.addEventListener('ended',()=>{if(state.stream===stream)stopCapture();},{once:true});
      if(camera)await enumerate();
      await sample();state.timer=setInterval(()=>{if(preview.visible||state.users)void sample();},1000/60);
    }catch(error){stopCapture();status.textContent=`Capture failed: ${error.message}`;}
    finally{state.starting=false;node._generetiTransportRefresh?.();}
  };
  node._generetiLivePaused=true;
  node._generetiToggleTransport=()=>state.stream?stopCapture():beginCapture();
  node._generetiTransportState=()=>({text:state.stream?'■':'▶',title:state.stream?camera?'Stop camera · release device':'Stop sharing':camera?'Start camera':'Start sharing',disabled:state.starting});
  const update=()=>{node.properties.genereti_capture={...prefs};state.last=-Infinity;paint();node.graph?.change?.(node);};
  flip.onclick=()=>{prefs.flip=!prefs.flip;update();void sample(true);};
  size.onchange=async()=>{prefs.size=Number(size.value);update();try{if(camera)await state.stream?.getVideoTracks()[0]?.applyConstraints?.({width:{ideal:prefs.size||1920}});await sample(true);}catch(error){status.textContent=`Camera resolution: ${error.message}`;}};
  rate.onchange=()=>{prefs.fps=Number(rate.value);update();};
  device.onchange=async()=>{if(state.stream){stopCapture();await beginCapture();}};
  const configured=node.onConfigure;node.onConfigure=function(info){const result=configured?.apply(this,arguments);prefs={...prefs,...info?.properties?.genereti_capture};paint();return result;};
  const widget=node.addDOMWidget(inputName,spec.widget,container,{serialize:true,hideOnZoom:false});
  widget.computeSize=width=>[width,preview.minimized?64:280];
  container.addEventListener('pointerdown',event=>event.stopPropagation());
  node._generetiLiveSource={retain(){state.users++;if(state.hasFrame)void (async()=>{const bitmap=await createImageBitmap(sampled);try{publishLive(node,bitmap);}finally{bitmap.close();}})();},release(){state.users=Math.max(0,state.users-1);}};
  const cleanup=()=>{stopCapture();disposeSample(sampled);};window.addEventListener('pagehide',cleanup,{once:true});state.stopCapture=()=>{window.removeEventListener('pagehide',cleanup);cleanup();};paint();if(camera)void enumerate();return {widget};
}

async function captureToComfy(node, kind) {
  const source = SOURCES[kind].label;
  const direct=(node.outputs?.[0]?.links??[]).some(id=>{const link=node.graph?.links?.[id];return node.graph?.getNodeById(link?.target_id)?.comfyClass!=='GeneretiInputSelect';});
  if (!direct && selectedSource().length && !selectedSource().includes(source)) return `GENERETI_OFF:${source}`;

  const state = node._generetiCapture;
  const video = state?.video;
  if (!state?.stream || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    throw new Error(`Start the ${source} capture node before queuing.`);
  }
  await state.sample();
  if (!state.hasFrame) throw new Error('Waiting for the first camera frame.');
  const canvas = state.canvas;
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not capture a frame.")), "image/png");
  });
  const file = new File([blob], `genereti-${kind === "GeneretiCameraCapture" ? "webcam" : "screen"}-${Date.now()}.png`, { type: "image/png" });
  const body = new FormData();
  body.append("image", file);
  body.append("subfolder", "genereti-capture");
  body.append("type", "temp");
  const response = await api.fetchApi("/upload/image", { method: "POST", body });
  if (!response.ok) throw new Error(`ComfyUI image upload failed (${response.status}).`);
  const result = await response.json();
  return `${result.subfolder || "genereti-capture"}/${result.name || file.name} [${result.type || "temp"}]`;
}

app.registerExtension({
  name: "Genereti.ComfyInputs.BrowserCapture",

  getCustomWidgets() {
    return {
      GENERETI_CAMERA_CAPTURE: (node, inputName) => makeCaptureWidget(node, inputName, "GeneretiCameraCapture"),
      GENERETI_SCREEN_CAPTURE: (node, inputName) => makeCaptureWidget(node, inputName, "GeneretiScreenCapture"),
    };
  },

  nodeCreated(node) {
    const kind = node.comfyClass;
    if (!SOURCES[kind]) return;
    const capture = node.widgets?.find((widget) => widget.name === "capture");
    if (!capture) return;
    // graphToPrompt skips widgets with serialize:false, including serializeValue.
    capture.options = { ...capture.options, serialize: true };
    capture.serializeValue = () => captureToComfy(node, kind);

    const originalRemoved = node.onRemoved;
    node.onRemoved = function () {
      node._generetiCapture?.stopCapture?.();
      return originalRemoved?.apply(this, arguments);
    };
  },
});
