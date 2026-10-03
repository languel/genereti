import { app } from '../../../scripts/app.js';
import { projectorLink } from './projector-link.js';
import { publishLive } from '/extensions/genereti_comfy_p5/js/live-runtime.js';

const BASE = 'http://127.0.0.1:8765';
const value = (node, name) => node.widgets?.find(w => w.name === name)?.value;

function sourceNode(node, seen = new Set()) {
  if (!node || seen.has(node.id)) throw new Error('Connect a drawing, browser capture or livecode source.');
  seen.add(node.id);
  if (!['GeneretiGenerate','GeneretiLivePreview'].includes(node.comfyClass) && node.comfyClass !== 'GeneretiInputSelect') return node;
  const name = ['GeneretiGenerate','GeneretiLivePreview'].includes(node.comfyClass) ? 'image' :
    ({ Doodle: 'doodle', Webcam: 'webcam', 'Window / Screen': 'screen' })[value(node, 'source')];
  const linkId = node.inputs?.find(input => input.name === name)?.link;
  const link = app.graph.links[linkId];
  return sourceNode(app.graph.getNodeById(link?.origin_id), seen);
}

export async function captureInput(node, size, canvas) {
  if (value(node, 'mode') === 'text') return undefined;
  const source = sourceNode(node);
  if (source._generetiDrawing?.captureDataUrl) return source._generetiDrawing.captureDataUrl();
  if (source._generetiLivecode?.captureDataUrl) return source._generetiLivecode.captureDataUrl();
  if (source._generetiP5?.captureDataUrl) return source._generetiP5.captureDataUrl();
  const video = source._generetiCapture?.video;
  if (!source._generetiCapture?.stream || !video || video.readyState < 2) {
    throw new Error('Live preview supports drawing, started webcam/screen and running livecode sources. Use Queue for other IMAGE sources.');
  }
  canvas.width = canvas.height = size;
  canvas.getContext('2d').drawImage(video, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', .9);
}

export function attachLivePreview(node) {
  let running = false, timer, controller, disposed = false, previous = 0, epoch = 0;
  const container = document.createElement('div');container.classList.add('genereti-live-surface');
  container.style.cssText = 'display:flex;flex-direction:column;gap:6px;width:100%';
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = 'Start live preview';
  button.title = 'Direct Genereti stream; bypasses Comfy Queue and downstream nodes';
  const status = document.createElement('span');
  status.style.cssText = 'font-size:11px;font-variant-numeric:tabular-nums';
  const output = document.createElement('canvas');
  output.width = output.height = 512;
  output.style.cssText = 'width:100%;aspect-ratio:1;object-fit:contain;background:#111';
  container.append(button, status, output);
  const input = document.createElement('canvas');
  node._generetiLiveSource={retain(){},release(){}};
  let size = 512;
  const project = document.createElement('button');
  project.type = 'button'; project.textContent = 'Open live projector';
  container.insertBefore(project, status);
  const projector = projectorLink(container, '/extensions/genereti_comfy_stream/projector.html', status);
  project.onclick = () => projector.open();

  function stop() {
    running = false; epoch++; clearTimeout(timer); controller?.abort();
    button.textContent = 'Start live preview';
  }
  async function tick() {
    if (!running || disposed) return;
    const session = epoch;
    const start = performance.now();
    let delay = 0;
    try {
      controller = new AbortController();
      const abortTimeout = setTimeout(() => controller.abort(), 60000);
      let response;
      try {
        const image = await captureInput(node, size, input);
        if (!running || session !== epoch) return;
        const payload = { image, ai_upscaler: 'off' };
        for (const key of ['prompt', 'mode', 'style', 'preprocess', 'seed', 'strength', 'control_scale']) {
          payload[key] = value(node, key);
        }
        response = await fetch(BASE + '/api/generate', {
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
        output.width = bitmap.width; output.height = bitmap.height;
        output.getContext('2d').drawImage(bitmap, 0, 0);
        projector.publish({blob});
        publishLive(node,bitmap);
        bitmap.close();
      } finally { clearTimeout(abortTimeout); }
      const now = performance.now();
      status.textContent = `${previous ? (1000 / (now - previous)).toFixed(1) : '—'} fps · ${Math.round(now-start)} ms round trip · ${Math.round(Number(response.headers.get('X-Inference-Ms')))} ms model`;
      previous = now;
      delay = Math.max(0, 1000 / 24 - (now - start));
    } catch (error) {
      if (running && session === epoch) { stop(); status.textContent = error.message; }
    } finally {
      if (running && !disposed && session === epoch) timer = setTimeout(tick, delay);
    }
  }
  button.onclick = async () => {
    if (running) { stop(); status.textContent = 'Paused'; return; }
    button.disabled = true;
    try {
      const response = await fetch(BASE + '/api/status', {signal: AbortSignal.timeout(5000)});
      if (!response.ok) throw new Error('Start Genereti first.');
      const state = await response.json();
      if (disposed) return;
      if (!state.ready) throw new Error(state.error || 'Generator not ready.');
      size = state.size;
      running = true; previous = 0; button.textContent = 'Pause live preview'; void tick();
    } catch (error) { status.textContent = error instanceof TypeError ? 'Start Genereti (./run.sh) · local generator at 127.0.0.1:8765 is unavailable' : error.message; }
    finally { button.disabled = false; }
  };
  const widget = node.addDOMWidget('genereti_live_preview', 'GENERETI_LIVE_PREVIEW', container, {serialize:false});
  widget.computeSize = width => [width, width + 176];
  const removed = node.onRemoved;
  node.onRemoved = function() { disposed = true; stop(); projector.close(); return removed?.apply(this, arguments); };
  window.addEventListener('pagehide', () => { stop(); projector.close(); }, {once:true});
}

app.registerExtension({
  name: 'Genereti.DirectLivePreview',
  nodeCreated(node) { if (node.comfyClass === 'GeneretiLivePreview') attachLivePreview(node); },
});
