import {app} from '../../../scripts/app.js';

// Every node's status line sits in one bottom bar, below all controls and sockets, so it never overlaps toolbar
// buttons or the node's own labels. Nodes tag their status element with `genereti-status`; this moves it.
const BAR = 'genereti_status_bar';
const STYLE_ID = 'genereti-status-bar-style';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.genereti-status-bar{display:flex;align-items:center;gap:6px;min-height:18px;padding:2px 6px 0;box-sizing:border-box;width:100%;overflow:hidden;color:var(--fg-color,#eee);font:11px system-ui,sans-serif}
.genereti-status-bar .genereti-status{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.7;font-variant-numeric:tabular-nums}
.genereti-status-bar .genereti-status:empty{display:none}
.genereti-status-bar .genereti-status[hidden]{display:none}
`;
  document.head.append(style);
}

/** Move every tagged status (outside disclosure panels, which keep their own) into the node's bottom bar. */
export function dockStatus(node) {
  if (!node?.widgets) return;
  const statuses = [];
  for (const widget of node.widgets) {
    if (widget.name === BAR || !widget.element) continue;
    for (const status of widget.element.querySelectorAll?.('.genereti-status') ?? []) {
      if (!status.closest('details')) statuses.push(status);
    }
  }
  if (!statuses.length && !node._generetiStatusBar) return;
  ensureStyle();
  if (!node._generetiStatusBar) {
    const bar = document.createElement('div');
    bar.className = 'genereti-status-bar';
    bar.addEventListener('pointerdown', event => event.stopPropagation());
    const widget = node.addDOMWidget(BAR, 'GENERETI_STATUS_BAR', bar, {serialize: false, hideOnZoom: false});
    widget.computeSize = width => [width, 22];
    node._generetiStatusBar = bar;
  }
  // Keep the bar last so it sits under every control and socket row added before it.
  const widget = node.widgets.find(w => w.name === BAR);
  node.widgets.splice(node.widgets.indexOf(widget), 1);
  node.widgets.push(widget);
  node._generetiStatusBar.append(...statuses);
  node.setDirtyCanvas?.(true, true);
}

app.registerExtension({
  name: 'Genereti.StatusBar',
  nodeCreated(node) {
    // Runs after the node's own setup, which creates its status elements.
    queueMicrotask(() => dockStatus(node));
    const configured = node.onConfigure;
    node.onConfigure = function () {
      const result = configured?.apply(this, arguments);
      queueMicrotask(() => dockStatus(node));
      return result;
    };
  },
});
