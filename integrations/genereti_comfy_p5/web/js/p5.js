import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";

const NODE_NAME = "GeneretiP5Sketch";
// The sketch runs in an opaque-origin srcdoc iframe, so resolve the bundled
// library from Comfy's origin explicitly instead of inheriting the module URL.
const P5_URL = new URL("/extensions/genereti_comfy_p5/p5.min.js", window.location.origin).href;
let p5SourcePromise;

function loadP5Source() {
  p5SourcePromise ||= fetch(P5_URL).then((response) => {
    if (!response.ok) throw new Error(`Bundled p5.js request failed (${response.status})`);
    return response.text();
  });
  return p5SourcePromise;
}
const DEFAULT_SKETCH = `// Draw with the mouse. Press C to clear and change the palette with keys 1–5.
let hueShift = 0;

function setup() {
  createCanvas(512, 512);
  colorMode(HSB, 360, 100, 100, 100);
  background(225, 28, 12);
}

function draw() {
  noStroke();
  if (mouseIsPressed) {
    fill((hueShift + frameCount * 0.8) % 360, 78, 100, 62);
    circle(mouseX, mouseY, 34 + 18 * sin(frameCount * 0.12));
  }
  if (keyIsPressed) {
    fill((hueShift + 180) % 360, 70, 100, 55);
    circle(mouseX, mouseY, 14);
  }
}

function keyPressed() {
  if (key === 'c' || key === 'C') background(225, 28, 12);
  if (key >= '1' && key <= '5') hueShift = (Number(key) - 1) * 72;
  return false;
}`;

function makeFrame(state, frameSlot, status, code, librarySource) {
  const frame = document.createElement("iframe");
  frame.title = "Interactive p5.js sketch";
  frame.setAttribute("sandbox", "allow-scripts");
  Object.assign(frame.style, {
    display: "block", width: "100%", height: "300px", border: "0", borderRadius: "4px", background: "#111",
  });
  frameSlot.replaceChildren(frame);
  state.frame = frame;

  const safeLibrary = librarySource.replace(/<\/script/gi, "<\\/script");
  const safeCode = code.replace(/<\/script/gi, "<\\/script");
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111;color:#eee;font:12px sans-serif}
    body{display:flex;align-items:center;justify-content:center}
    canvas{max-width:100%;max-height:100%;object-fit:contain;touch-action:none}
  </style></head><body><script>${safeLibrary}</script><script>${safeCode}</script><script>
    const stage = document.body;
    window.addEventListener('error', (event) => parent.postMessage({type:'error', message:event.message || 'Sketch error'}, '*'));
    try {
      new window.p5();
      setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!stage.querySelector('canvas')) {
          parent.postMessage({type:'error', message:'No canvas was created (p5=' + typeof window.p5 + ', setup=' + typeof window.setup + ').'}, '*');
          return;
        }
        parent.postMessage({type:'ready'}, '*');
      })), 100);
    } catch (error) { parent.postMessage({type:'error', message:String(error)}, '*'); }
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'capture') {
        try {
          const canvas = stage.querySelector('canvas');
          if (!canvas) throw new Error('The sketch has not created a canvas yet.');
          parent.postMessage({type:'capture', data:canvas.toDataURL('image/png')}, '*');
        } catch (error) { parent.postMessage({type:'error', message:String(error)}, '*'); }
      }
    });
  </script></body></html>`;

  status.textContent = "Running sketch…";
  frame.srcdoc = html;
}

function makeP5Editor(node, inputName) {
  const state = { frame: null, pendingCapture: null, timer: null };
  const container = document.createElement("div");
  Object.assign(container.style, { display: "flex", flexDirection: "column", gap: "6px", width: "100%" });

  const instructions = document.createElement("div");
  instructions.textContent = "Edit the sketch, then draw in the preview. Mouse and keyboard events go to the preview.";
  Object.assign(instructions.style, { fontSize: "11px", opacity: ".78", lineHeight: "1.35" });

  const textarea = document.createElement("textarea");
  textarea.spellcheck = false;
  textarea.value = node.widgets?.find((widget) => widget.name === inputName)?.value || DEFAULT_SKETCH;
  Object.assign(textarea.style, {
    display: "block", width: "100%", height: "210px", boxSizing: "border-box", resize: "vertical",
    padding: "8px", border: "1px solid rgba(255,255,255,.18)", borderRadius: "4px",
    color: "var(--fg-color, #eee)", background: "var(--comfy-input-bg, #202020)",
    font: "11px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", tabSize: "2",
  });
  const controls = document.createElement("div");
  Object.assign(controls.style, { display: "flex", gap: "8px", alignItems: "center" });
  const run = document.createElement("button");
  run.type = "button";
  run.textContent = "Run sketch";
  Object.assign(run.style, {
    border: "1px solid rgba(255,255,255,.2)", borderRadius: "5px", padding: "5px 10px",
    color: "var(--fg-color, #eee)", background: "var(--comfy-input-bg, #333)", cursor: "pointer",
  });
  const status = document.createElement("span");
  status.textContent = "Starting…";
  Object.assign(status.style, { fontSize: "11px", opacity: ".75" });
  controls.append(run, status);
  const frameSlot = document.createElement("div");
  Object.assign(frameSlot.style, { width: "100%", overflow: "hidden", borderRadius: "4px", background: "#111" });
  container.append(instructions, textarea, controls, frameSlot);

  const runSketch = async () => {
    clearTimeout(state.timer);
    status.textContent = "Loading p5.js…";
    try {
      const librarySource = await loadP5Source();
      makeFrame(state, frameSlot, status, textarea.value, librarySource);
    } catch (error) {
      status.textContent = `Sketch error: ${error.message || error}`;
    }
  };
  run.addEventListener("click", (event) => { event.preventDefault(); runSketch(); });
  textarea.addEventListener("input", () => {
    const widget = node.widgets?.find((item) => item.name === inputName);
    if (widget) widget.value = textarea.value;
    clearTimeout(state.timer);
    state.timer = setTimeout(runSketch, 900);
  });

  const widget = node.addDOMWidget(inputName, "GENERETI_P5_SKETCH", container, {
    serialize: true,
    hideOnZoom: false,
    getValue() { return textarea.value; },
    setValue(value) {
      textarea.value = value || DEFAULT_SKETCH;
      runSketch();
    },
  });
  widget.value = textarea.value;
  widget.getValue = () => textarea.value;
  widget.setValue = (value) => {
    textarea.value = value || DEFAULT_SKETCH;
    widget.value = textarea.value;
    runSketch();
  };
  state.runSketch = runSketch;
  state.status = status;
  state.frameSlot = frameSlot;
  state.textarea = textarea;
  node._generetiP5 = state;

  window.addEventListener("message", (event) => {
    if (!state.frame || event.source !== state.frame.contentWindow) return;
    if (event.data?.type === "ready") status.textContent = "Running · click the preview to draw or use keys";
    if (event.data?.type === "error") status.textContent = `Sketch error: ${event.data.message}`;
    if (event.data?.type === "capture" && state.pendingCapture) {
      state.pendingCapture.resolve(event.data.data);
      state.pendingCapture = null;
    }
  });

  runSketch();
  widget.computeSize = (width) => [width, 590];
  return { widget };
}

function captureSketchDataUrl(node) {
  const state = node._generetiP5;
  if (!state?.frame?.contentWindow) throw new Error("Run the p5 sketch before queueing it.");
  state.status.textContent = "Capturing sketch…";
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      state.pendingCapture = null;
      reject(new Error("p5 did not return a frame. Run the sketch again and queue once more."));
    }, 5000);
    state.pendingCapture = {
      resolve(value) { clearTimeout(timeout); state.status.textContent = "Frame captured"; resolve(value); },
    };
    state.frame.contentWindow.postMessage({ type: "capture" }, "*");
  });
}

function dataUrlToBlob(dataUrl) {
  const encoded = dataUrl.split(",", 2)[1];
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "image/png" });
}

async function serializeP5Canvas(node) {
  const dataUrl = await captureSketchDataUrl(node);
  const file = new File([dataUrlToBlob(dataUrl)], `genereti-p5-${Date.now()}.png`, { type: "image/png" });
  const body = new FormData();
  body.append("image", file);
  body.append("subfolder", "genereti-p5");
  body.append("type", "temp");
  const response = await api.fetchApi("/upload/image", { method: "POST", body });
  if (!response.ok) throw new Error(`ComfyUI image upload failed (${response.status}).`);
  const result = await response.json();
  return `${result.subfolder || "genereti-p5"}/${result.name || file.name} [${result.type || "temp"}]`;
}

app.registerExtension({
  name: "Genereti.ComfyP5.InteractiveSketch",

  getCustomWidgets() {
    return { GENERETI_P5_SKETCH: makeP5Editor };
  },

  nodeCreated(node) {
    if (node.comfyClass !== NODE_NAME) return;
    const sketch = node.widgets?.find((widget) => widget.name === "sketch");
    if (!sketch) return;
    sketch.serializeValue = () => serializeP5Canvas(node);

    const originalConfigured = node.onConfigure;
    node.onConfigure = function () {
      const result = originalConfigured?.apply(this, arguments);
      const value = sketch.getValue?.() || sketch.value;
      if (value && node._generetiP5?.textarea.value !== value) {
        node._generetiP5.textarea.value = value;
        node._generetiP5.runSketch();
      }
      return result;
    };

    const originalRemoved = node.onRemoved;
    node.onRemoved = function () {
      clearTimeout(node._generetiP5?.timer);
      node._generetiP5?.frame?.remove();
      return originalRemoved?.apply(this, arguments);
    };
  },
});
