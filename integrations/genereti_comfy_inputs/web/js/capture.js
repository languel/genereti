import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";

const SELECTOR_NODE = "GeneretiInputSelect";
const SOURCES = {
  GeneretiCameraCapture: { label: "Webcam", button: "Start camera", widget: "GENERETI_CAMERA_CAPTURE" },
  GeneretiScreenCapture: { label: "Window / Screen", button: "Start sharing", widget: "GENERETI_SCREEN_CAPTURE" },
};

function makeButton(label) {
  const el = document.createElement("button");
  el.type = "button";
  el.textContent = label;
  Object.assign(el.style, {
    border: "1px solid rgba(255,255,255,.2)", borderRadius: "5px", padding: "5px 10px",
    color: "var(--fg-color, #eee)", background: "var(--comfy-input-bg, #333)", cursor: "pointer",
  });
  return el;
}

function selectedSource() {
  const nodes = app.graph?._nodes ?? [];
  const selectors = nodes.filter((node) => node.comfyClass === SELECTOR_NODE);
  return selectors.map((node) => node.widgets?.find((widget) => widget.name === "source")?.value);
}

function makeCaptureWidget(node, inputName, kind) {
  const spec = SOURCES[kind];
  const state = { stream: null, video: null, starting: false };
  const container = document.createElement("div");
  Object.assign(container.style, { display: "flex", flexDirection: "column", gap: "6px", width: "100%", minHeight: "96px" });

  const controls = document.createElement("div");
  Object.assign(controls.style, { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" });
  const device = document.createElement("select");
  device.title = "Camera device";
  Object.assign(device.style, {
    display: kind === "GeneretiCameraCapture" ? "block" : "none",
    maxWidth: "180px", minWidth: "100px", padding: "5px", color: "var(--fg-color, #eee)",
    background: "var(--comfy-input-bg, #333)", border: "1px solid rgba(255,255,255,.2)", borderRadius: "5px",
  });
  const start = makeButton(spec.button);
  const stop = makeButton("Stop");
  stop.hidden = true;
  const status = document.createElement("span");
  status.textContent = kind === "GeneretiCameraCapture" ? "Camera off" : "Not sharing";
  Object.assign(status.style, { fontSize: "11px", opacity: ".75" });
  controls.append(device, start, stop, status);

  const video = document.createElement("video");
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  Object.assign(video.style, {
    display: "block", width: "100%", maxHeight: "220px", minHeight: "80px", objectFit: "contain",
    background: "#111", borderRadius: "4px",
  });
  container.append(controls, video);
  state.video = video;
  node._generetiCapture = state;

  const stopCapture = () => {
    state.stream?.getTracks().forEach((track) => track.stop());
    state.stream = null;
    video.srcObject = null;
    start.hidden = false;
    stop.hidden = true;
    status.textContent = kind === "GeneretiCameraCapture" ? "Camera off" : "Not sharing";
  };

  const enumerateCameras = async () => {
    try {
      const cameras = (await navigator.mediaDevices.enumerateDevices()).filter((item) => item.kind === "videoinput");
      const current = device.value;
      device.replaceChildren();
      for (const camera of cameras) {
        const option = document.createElement("option");
        option.value = camera.deviceId;
        option.textContent = camera.label || `Camera ${device.length + 1}`;
        device.append(option);
      }
      if (cameras.some((item) => item.deviceId === current)) device.value = current;
    } catch (_) {
      // Labels are optional; the stream can still start with the default camera.
    }
  };

  const beginCapture = async () => {
    if (state.starting) return;
    state.starting = true;
    start.disabled = true;
    status.textContent = kind === "GeneretiCameraCapture" ? "Starting camera…" : "Choose a window, tab, or display…";
    try {
      if (kind === "GeneretiCameraCapture") {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access is unavailable in this browser.");
        const videoConstraint = device.value ? { deviceId: { exact: device.value } } : true;
        state.stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: false });
        video.srcObject = state.stream;
        await video.play();
        await enumerateCameras();
        status.textContent = "Camera ready · one frame is captured when queued";
      } else {
        if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Window sharing is unavailable in this browser.");
        state.stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        video.srcObject = state.stream;
        await video.play();
        status.textContent = "Sharing · one frame is captured when queued";
      }
      state.stream.getVideoTracks()[0]?.addEventListener("ended", stopCapture, { once: true });
      start.hidden = true;
      stop.hidden = false;
    } catch (error) {
      state.stream = null;
      const cancelled = error?.name === "NotAllowedError" || error?.name === "AbortError";
      status.textContent = cancelled ? "Capture cancelled" : `Capture failed: ${error.message}`;
    } finally {
      state.starting = false;
      start.disabled = false;
    }
  };

  start.addEventListener("click", (event) => { event.preventDefault(); void beginCapture(); });
  stop.addEventListener("click", (event) => { event.preventDefault(); stopCapture(); });
  device.addEventListener("change", async () => {
    if (state.stream) {
      stopCapture();
      await beginCapture();
    }
  });

  const widget = node.addDOMWidget(inputName, spec.widget, container, { serialize: false, hideOnZoom: false });
  widget.computeSize = (width) => [width, kind === "GeneretiCameraCapture" ? 150 : 132];
  state.stopCapture = stopCapture;
  return { widget };
}

async function captureToComfy(node, kind) {
  const source = SOURCES[kind].label;
  if (!selectedSource().includes(source)) return `GENERETI_OFF:${source}`;

  const state = node._generetiCapture;
  const video = state?.video;
  if (!state?.stream || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    throw new Error(`Select ${source} in Genereti Input Source, then start that capture node.`);
  }
  const maxSide = 1024;
  const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
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
    capture.serializeValue = () => captureToComfy(node, kind);

    const originalRemoved = node.onRemoved;
    node.onRemoved = function () {
      node._generetiCapture?.stopCapture?.();
      return originalRemoved?.apply(this, arguments);
    };
  },
});
