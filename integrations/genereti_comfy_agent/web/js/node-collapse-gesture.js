import {app} from '../../../../scripts/app.js';

// Capture the chord before Vue widgets or LiteGraph treat it as selection,
// dragging, or an edit. The node's own collapse method retains Comfy state.
export function installNodeCollapseGesture(canvas, target = window) {
  let suppress = null;
  const nodeAt = event => {
    const host = event.target?.closest?.('.lg-node[data-node-id]');
    if (host) return canvas.graph?.getNodeById(host.dataset.nodeId);
    if (event.target !== canvas.canvas) return null;
    const pos = canvas.convertEventToCanvasOffset(event);
    return canvas.graph?.getNodeOnPos?.(pos[0], pos[1]);
  };
  const consume = event => { event.preventDefault(); event.stopImmediatePropagation(); };
  const down = event => {
    if (event.button !== 0 || !event.metaKey || !event.shiftKey || event.ctrlKey || event.altKey) return;
    const node = nodeAt(event);
    if (!node?.collapse) return;
    consume(event);
    suppress = {pointerId: event.pointerId, until: performance.now() + 1000};
    canvas.emitBeforeChange?.();
    try { node.collapse(); } finally { canvas.emitAfterChange?.(); }
    canvas.setDirty?.(true, true);
  };
  const block = event => {
    if (!suppress) return;
    if (performance.now() > suppress.until) { suppress = null; return; }
    if (event.pointerId != null && event.pointerId !== suppress.pointerId) return;
    consume(event);
    if (event.type === 'click' || event.type === 'pointercancel') suppress = null;
  };
  target.addEventListener('pointerdown', down, true);
  for (const type of ['mousedown', 'pointerup', 'mouseup', 'click', 'pointercancel']) target.addEventListener(type, block, true);
  return () => {
    target.removeEventListener('pointerdown', down, true);
    for (const type of ['mousedown', 'pointerup', 'mouseup', 'click', 'pointercancel']) target.removeEventListener(type, block, true);
  };
}

app.registerExtension({name: 'Genereti.NodeCollapseGesture', setup() { installNodeCollapseGesture(app.canvas); }});
