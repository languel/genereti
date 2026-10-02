import { app } from "../../../scripts/app.js";
import { projectorLink } from "./projector-link.js";

const NODE_NAME = "GeneretiProjector";
function imageUrl(image) {
  const query = new URLSearchParams({
    filename: image.filename,
    type: image.type || "temp",
  });
  if (image.subfolder) query.set("subfolder", image.subfolder);
  return `/view?${query.toString()}`;
}

function sendLatest(state) {
  if (!state.latestImage || (state.lastLive && performance.now()-state.lastLive<500)) return;
  state.link?.publish({src: imageUrl(state.latestImage)});
}

function makeProjectorWidget(node, inputName) {
  const state = { popup: null, latestImage: null, status: null };
  node._generetiProjector = state;
  const container = document.createElement("div");container.classList.add('genereti-live-surface');
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

  state.link = projectorLink(container, '/extensions/genereti_comfy_projector/live-projector.html', status);
  button.addEventListener('click', () => {state.link.open();sendLatest(state);});
  const removed = node.onRemoved;
  node.onRemoved = function() {state.link.close();return removed?.apply(this,arguments);};
  const realtime = document.createElement('button');
  realtime.type='button';realtime.textContent='Start realtime';container.insertBefore(realtime,button);
  let unsubscribe=null, loading=false;
  realtime.onclick=async()=>{
    if(unsubscribe){unsubscribe();unsubscribe=null;realtime.textContent='Start realtime';return;}
    if(loading)return;loading=true;
    try {
      const {subscribeLive}=await import('/extensions/genereti_comfy_p5/js/live-runtime.js');
      realtime.textContent='Pause realtime';
      unsubscribe=subscribeLive(node,({bitmap})=>{state.lastLive=performance.now();state.link.publish({bitmap});},text=>{status.textContent=text;});
    } catch(error){status.textContent=error.message;}finally{loading=false;}
  };
  const cleanup=node.onRemoved;
  node.onRemoved=function(){unsubscribe?.();return cleanup?.apply(this,arguments);};
  window.addEventListener('pagehide',()=>unsubscribe?.(),{once:true});
  window.addEventListener('pagehide' , () => state.link.close(), {once:true});

  const widget = node.addDOMWidget(inputName, "GENERETI_PROJECTOR", container, { serialize: false, hideOnZoom: false });
  widget.computeSize = (width) => [width, 188];
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
