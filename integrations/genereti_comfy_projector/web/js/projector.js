import { app } from "../../../scripts/app.js";

const NODE_NAME = "GeneretiProjector";
const PAGE_URL = new URL("/extensions/genereti_comfy_projector/projector.html", window.location.origin).href;
const projectors = new Set();

function imageUrl(image) {
  const query = new URLSearchParams({
    filename: image.filename,
    type: image.type || "temp",
  });
  if (image.subfolder) query.set("subfolder", image.subfolder);
  return `/view?${query.toString()}`;
}

function sendLatest(state) {
  if (!state.popup || state.popup.closed || !state.latestImage) return;
  state.popup.postMessage({ type: "genereti-projector-image", src: imageUrl(state.latestImage) }, window.location.origin);
}

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin || event.data?.type !== "genereti-projector-ready") return;
  for (const state of projectors) {
    if (event.source === state.popup) sendLatest(state);
  }
});

function makeProjectorWidget(node, inputName) {
  const state = { popup: null, latestImage: null, status: null };
  node._generetiProjector = state;
  const container = document.createElement("div");
  Object.assign(container.style, { display: "flex", flexDirection: "column", gap: "6px", width: "100%" });

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Open projector window";
  Object.assign(button.style, {
    width: "100%", border: "1px solid rgba(255,255,255,.2)", borderRadius: "5px", padding: "8px 10px",
    color: "var(--fg-color, #eee)", background: "var(--comfy-input-bg, #333)", cursor: "pointer",
  });
  const status = document.createElement("div");
  status.textContent = "Queue this workflow to send its image here.";
  Object.assign(status.style, { fontSize: "11px", opacity: ".75" });
  state.status = status;
  container.append(button, status);

  button.addEventListener("click", () => {
    if (state.popup && !state.popup.closed) {
      state.popup.focus();
      sendLatest(state);
      return;
    }
    const popupName = `genereti-projector-${node.id}`;
    state.popup = window.open(PAGE_URL, popupName, "popup,width=1280,height=800");
    if (!state.popup) {
      status.textContent = "Popup blocked. Allow popups for this ComfyUI page, then try again.";
      return;
    }
    projectors.add(state);
    status.textContent = state.latestImage ? "Projector window open." : "Projector open. Queue the workflow to send an image.";
  });

  const widget = node.addDOMWidget(inputName, "GENERETI_PROJECTOR", container, { serialize: false, hideOnZoom: false });
  widget.computeSize = (width) => [width, 62];
  return { widget };
}

app.registerExtension({
  name: "Genereti.ComfyProjector",

  getCustomWidgets() {
    return { GENERETI_PROJECTOR: makeProjectorWidget };
  },

  nodeCreated(node) {
    if (node.comfyClass !== NODE_NAME) return;
    // The widget factory stores the window and latest image on the node.
    node._generetiProjector ||= { popup: null, latestImage: null, status: null };
    const projector = node._generetiProjector;
    const widget = node.widgets?.find((item) => item.name === "projector_controls");
    const element = widget?.element;
    if (element && !projector.status) projector.status = element.querySelector("div:last-child");

    node.onExecuted = function (message) {
      const images = message?.images;
      if (Array.isArray(images) && images[0]?.filename) {
        projector.latestImage = images[0];
        if (projector.status) projector.status.textContent = "Image sent to projector.";
        sendLatest(projector);
      }
    };
  },
});
