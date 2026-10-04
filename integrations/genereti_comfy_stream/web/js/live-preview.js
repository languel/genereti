import { previewState } from '/extensions/genereti_comfy_p5/js/preview-state.js';
import { app } from '../../../scripts/app.js';
import { projectorLink } from './projector-link.js';
import { ensureControlStyle } from '/extensions/genereti_comfy_p5/js/control-style.js';
import { publishLive } from '/extensions/genereti_comfy_p5/js/live-runtime.js';

const BASE = 'http://127.0.0.1:8765';
const value = (node, name) => node.widgets?.find(w => w.name === name)?.value;

function sourceNode(node, seen = new Set()) {
  if (!node || seen.has(node.id)) throw new Error('Connect a drawing, browser capture or livecode source.');
  seen.add(node.id);
  if (!['GeneretiGenerate','GeneretiLivePreview','GeneretiLiveGenerator','GeneretiSDXSGenerate','GeneretiSDTurboGenerate'].includes(node.comfyClass) && node.comfyClass !== 'GeneretiInputSelect') return node;
  const name = ['GeneretiGenerate','GeneretiLivePreview','GeneretiLiveGenerator','GeneretiSDXSGenerate','GeneretiSDTurboGenerate'].includes(node.comfyClass) ? 'image' :
    ({ Doodle: 'doodle', Webcam: 'webcam', 'Window / Screen': 'screen' })[value(node, 'source')];
  const linkId = node.inputs?.find(input => input.name === name)?.link;
  const link = app.graph.links[linkId];
  return sourceNode(app.graph.getNodeById(link?.origin_id), seen);
}

export function nativeParameters(node) {
  return {model_path:value(node,'model_path'),family:node.comfyClass==='GeneretiSDTurboGenerate'?'sd_turbo':'sdxs'};
}

export async function captureInput(node, size, canvas) {
  if (value(node, 'mode') === 'text') return undefined;
  const source = sourceNode(node);
  if (source._generetiTexture?.captureDataUrl) return source._generetiTexture.captureDataUrl();
  if (source._generetiDrawing?.captureDataUrl) return source._generetiDrawing.captureDataUrl();
  if (source._generetiLivecode?.captureDataUrl) return source._generetiLivecode.captureDataUrl({live:true});
  if (source._generetiP5?.captureDataUrl) return source._generetiP5.captureDataUrl();
  const capture=source._generetiCapture;
  if(capture?.stream&&capture.canvas){await capture.sample?.();if(capture.hasFrame)return capture.canvas.toDataURL('image/jpeg',.9);}
  const video = capture?.video;
  if (!source._generetiCapture?.stream || !video || video.readyState < 2) {
    throw new Error('Live preview supports drawing, started webcam/screen and running livecode sources. Use Queue for other IMAGE sources.');
  }
  const scale=Math.min(1,size/Math.max(video.videoWidth,video.videoHeight));
  canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', .9);
}

export function attachLivePreview(node) {
  const native = ['GeneretiSDXSGenerate','GeneretiSDTurboGenerate'].includes(node.comfyClass);
  const generatorOnly = native || node.comfyClass === 'GeneretiLiveGenerator';
  const backend = native ? '/genereti/coreml' : BASE + '/api';
  if (generatorOnly) ensureControlStyle();
  let failedSettings = null;
  const settingsKey=()=>JSON.stringify([node.widgets?.map(w=>[w.name,w.value]),native?nativeParameters(node):null]);
  let running = false, timer, controller, disposed = false, previous = 0, epoch = 0, noisePhase = 0;
  const container = document.createElement('div');container.classList.add('genereti-live-surface');
  container.style.cssText = 'display:flex;flex-direction:column;gap:6px;width:100%';
  const button = document.createElement('button');
  button.type = 'button'; setRunning(false);
  const status = document.createElement('span');
  status.style.cssText = 'font-size:11px;font-variant-numeric:tabular-nums;white-space:normal;overflow-wrap:anywhere;max-width:100%';
  if(generatorOnly)status.style.flexBasis='100%';
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  function showError(error){let message=error.message??String(error);try{message=JSON.parse(message).detail??message;}catch{}status.textContent='Generation error · '+message;status.title=message;console.error('Genereti generation:',message);}
  const output = document.createElement('canvas');
  output.width = output.height = 512;
  output.style.cssText = 'display:block;width:100%;height:auto;aspect-ratio:1;object-fit:contain;background:transparent';
  const localPreview=generatorOnly?null:previewState(node,output);
  if (generatorOnly) {
    container.append(status);
  } else container.append(button, localPreview.actions, output, status);
  // Keep drafts visible and saved; only committed text enters live requests.
  node.properties ??= {};
  let appliedPrompt = node.properties.genereti_applied_prompt ?? value(node,'prompt');
  let livePrompt = node.properties.genereti_live_prompt ?? true;
  const promptToggle=document.createElement('button');promptToggle.type='button';promptToggle.textContent='↯';
  const sendPrompt=document.createElement('button');sendPrompt.type='button';sendPrompt.textContent='↑';
  sendPrompt.title='Send prompt · Cmd/Ctrl+Enter';sendPrompt.setAttribute('aria-label',sendPrompt.title);
  function commitPrompt(){appliedPrompt=value(node,'prompt');node.properties.genereti_applied_prompt=appliedPrompt;}
  function updatePromptToggle(){promptToggle.title=livePrompt?'Send prompt while typing':'Hold prompt draft until Send or Cmd/Ctrl+Enter';promptToggle.setAttribute('aria-label',promptToggle.title);promptToggle.setAttribute('aria-pressed',String(livePrompt));}
  promptToggle.onclick=()=>{livePrompt=!livePrompt;node.properties.genereti_live_prompt=livePrompt;if(livePrompt)commitPrompt();updatePromptToggle();};
  sendPrompt.onclick=commitPrompt;updatePromptToggle();
  function bindPrompt(){
    const w=node.widgets?.find(w=>w.name==='prompt');if(!w)return;
    if(!w._generetiPromptBound){
      w._generetiPromptBound=true;const changed=w.callback;
      w.callback=function(){const result=changed?.apply(this,arguments);if(livePrompt)commitPrompt();return result;};
      w.serializeValue=()=>livePrompt?w.value:appliedPrompt;
    }
    const editor=w.inputEl??w.element?.querySelector?.('textarea')??(w.element?.tagName==='TEXTAREA'?w.element:null);
    if(editor && !editor._generetiPromptBound){editor._generetiPromptBound=true;
      editor.addEventListener('input',()=>{w.value=editor.value;if(livePrompt)commitPrompt();});
      editor.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();e.stopPropagation();w.value=editor.value;commitPrompt();}});
    }
  }
  const toolbar=document.createElement('div');toolbar.className='genereti-node-controls';
  toolbar.append(button,promptToggle,sendPrompt);
  function mountToolbar(){const delivery=node._generetiExecutionModeElement;if(delivery){delivery.append(button,promptToggle,sendPrompt,status);toolbar.style.display='none';}}
  if(generatorOnly)container.append(toolbar);
  bindPrompt();mountToolbar();
  node._generetiMountTransport=mountToolbar;
  node._generetiRestorePrompt=()=>{appliedPrompt=node.properties?.genereti_applied_prompt??value(node,'prompt');livePrompt=node.properties?.genereti_live_prompt??true;bindPrompt();updatePromptToggle();};
  const configured=node.onConfigure;node.onConfigure=function(){const result=configured?.apply(this,arguments);appliedPrompt=node.properties?.genereti_applied_prompt??value(node,'prompt');livePrompt=node.properties?.genereti_live_prompt??true;bindPrompt();updatePromptToggle();mountToolbar();return result;};
  const input = document.createElement('canvas');
  node._generetiLiveSource={retain(){},release(){}};
  let size = 512, users = 0, enabled = true, starting = false;
  const project = document.createElement('button');
  project.type = 'button'; project.textContent = 'Open live projector';
  if (!generatorOnly) container.insertBefore(project, status);
  const projector = generatorOnly ? {publish(){},close(){}} : projectorLink(container, '/extensions/genereti_comfy_stream/projector.html', status);
  project.onclick = () => projector.open();

  function setRunning(active) {
    button.textContent = generatorOnly ? (active ? '■' : '▶') : (active ? 'Pause live preview' : 'Start live preview');
    button.title = active ? 'Pause generation' : 'Start generation';
    button.setAttribute('aria-label',button.title);button.setAttribute('aria-pressed',String(active));
  }
  function stop() {
    running = false; epoch++; clearTimeout(timer); controller?.abort();
    setRunning(false);
  }
  async function tick() {
    if (!running || disposed) return;
    const session = epoch;
    const start = performance.now();
    let delay = 0;
    try {
      controller = new AbortController();
      const abortTimeout = setTimeout(() => controller.abort(), 60000);
      let response, captureMs=0;
      try {
        const effectiveMode=value(node,'mode');
        if(effectiveMode!=='text'){const source=sourceNode(node);if(source._generetiLivePaused||source._generetiExecutionMode==='Comfy Queue'){status.textContent='Source live delivery paused';delay=250;return;}}
        const image = await captureInput(node, size, input);
        captureMs=performance.now()-start;
        if (!running || session !== epoch) return;
        const payload = { image, ai_upscaler: 'off' };
        for (const key of ['prompt', 'mode', 'style', 'preprocess', 'seed', 'strength', 'control_scale']) {
          payload[key] = value(node, key);
          if(native&&['style'].includes(key))delete payload[key];
        }
        payload.prompt=livePrompt?value(node,'prompt'):appliedPrompt;
        noisePhase=(noisePhase+Number(value(node,'movement')??0)*.035)%(2*Math.PI);payload.noise_phase=noisePhase;
        if(native){const inversion=value(node,'invert');payload.invert=typeof inversion==='boolean'?inversion:false;}
        const resolution=value(node,'resolution');
        if(resolution!==undefined)payload.resolution=native?String(resolution):resolution==='auto'?'auto':Number(resolution);
        if(native){Object.assign(payload,nativeParameters(node));delete payload.ai_upscaler;payload.preprocess??=false;}
        response = await fetch(backend + '/generate', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload), signal: controller.signal,
        });
        if (!response.ok) {
          if (response.status === 429) {
            status.textContent = 'Generator busy · pause other live producers'; delay = 750; return;
          }
          throw new Error(await response.text());
        }
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        if (!running || session !== epoch) { bitmap.close(); return; }
        if (!generatorOnly && localPreview.visible) {
          output.width = bitmap.width; output.height = bitmap.height;output.style.aspectRatio=`${bitmap.width} / ${bitmap.height}`;
          output.getContext('2d').drawImage(bitmap, 0, 0);
        }
        projector.publish({blob});
        publishLive(node,bitmap);
        bitmap.close();
      } finally { clearTimeout(abortTimeout); }
      const now = performance.now();
      status.textContent = `${previous ? (1000 / (now - previous)).toFixed(1) : '—'} fps · ${Math.round(now-start)} ms total · ${Math.round(captureMs)} ms input · ${Math.round(Number(response.headers.get('X-Inference-Ms')))} ms model`;
      previous = now;
      delay = Math.max(0, 1000 / 24 - (now - start));
    } catch (error) {
      if (running && session === epoch) { try{failedSettings=settingsKey();}catch{} stop(); showError(error); }
    } finally {
      if (running && !disposed && session === epoch) timer = setTimeout(tick, delay);
    }
  }
  async function start() {
    if(running || starting || disposed || (generatorOnly && (!enabled || node._generetiExecutionMode==='Comfy Queue'))) return;
    starting=true;const session=epoch;status.textContent='Starting generation…';
    button.disabled = true;
    try {
      const response = await fetch(backend + '/status', {signal: AbortSignal.timeout(5000)});
      if (!response.ok) throw new Error('Start Genereti first.');
      const state = await response.json();
      if (disposed || session!==epoch) return;
      if (!state.ready) throw new Error(state.error || (native?'No installed native model packages. Check models/genereti.':'Generator not ready.'));
      if(native)nativeParameters(node);
      size = state.size;
      if (generatorOnly && node._generetiExecutionMode==='Comfy Queue') return;
      failedSettings=null;running = true; previous = 0; setRunning(true); void tick();
    } catch (error) { showError(new Error(error instanceof TypeError ? (native?'Native Comfy backend unavailable · restart ComfyUI after installing this update':'Start Genereti (./run.sh) · local generator at 127.0.0.1:8765 is unavailable') : error.message)); }
    finally { starting=false;button.disabled = generatorOnly && node._generetiExecutionMode==='Comfy Queue'; }
  }
  button.onclick = async () => {
    if(running || starting){enabled=false;stop();status.textContent='Paused';return;}
    enabled=true;await start();
  };
  if(generatorOnly) node._generetiLiveSource={
    retain(){users++;if(enabled)void start();},
    release(){users=Math.max(0,users-1);if(!users){stop();status.textContent='Live · waiting for a viewer';}},
  };
  if (generatorOnly) node._generetiSetExecutionMode=mode=>{
    button.disabled=mode==='Comfy Queue';
    if(mode==='Comfy Queue'){stop();status.textContent='Comfy Queue · inference runs on Run';}
    else {enabled=true;status.textContent='Live · waiting for a viewer';if(users)void start();}
  };
  const widget = node.addDOMWidget('genereti_live_preview', 'GENERETI_LIVE_PREVIEW', container, {serialize:false});
  widget.computeSize = width => [width, generatorOnly ? (node._generetiExecutionModeElement?0:64) : (localPreview.minimized?0:Math.max(0,width-24)*output.height/output.width) + 176];
  const recover=setInterval(()=>{bindPrompt();mountToolbar();if(failedSettings && enabled && users && !running){try{if(settingsKey()!==failedSettings)void start();}catch{}}},500);
  const removed = node.onRemoved;
  node.onRemoved = function() { disposed = true; clearInterval(recover);stop(); projector.close(); return removed?.apply(this, arguments); };
  window.addEventListener('pagehide', () => { stop(); projector.close(); }, {once:true});
}

app.registerExtension({
  name: 'Genereti.DirectLivePreview',
  nodeCreated(node) { if (['GeneretiLivePreview','GeneretiLiveGenerator','GeneretiSDXSGenerate','GeneretiSDTurboGenerate'].includes(node.comfyClass)) attachLivePreview(node); },
});
