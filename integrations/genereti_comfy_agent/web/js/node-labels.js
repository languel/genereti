import { app } from '../../../../scripts/app.js';

// Titles are presentation. Saved workflow identity remains the Genereti node ID.
export function generetiTitle(title) {
  const label = String(title ?? '').replace(/^Genereti\s+/i, '').replace(/^ꘇ\s*/, '');
  return 'ꘇ' + (/^(top|chop|dat|mod)\./i.test(label) ? '' : ' ') + label;
}
function labelNode(node) {
  if (node.comfyClass?.startsWith('Genereti')) node.title = generetiTitle(node.title);
}
app.registerExtension({
  name: 'Genereti.NodeLabels',
  beforeRegisterNodeDef(nodeType, data) {
    if (!data.name?.startsWith('Genereti')) return;
    data.display_name = generetiTitle(data.display_name ?? data.name);
    const label = data.display_name.replace(/^ꘇ\s*/, '');
    const family = /^(top|chop|dat|mod)\./i.exec(label)?.[1];
    data.search_aliases = [...new Set([...(data.search_aliases ?? []), 'genereti', label,
      'genereti ' + label, ...(family ? [family, 'genereti ' + family] : [])])];
  },
  nodeCreated(node) {
    if (!node.comfyClass?.startsWith('Genereti')) return;
    labelNode(node);
    const configure = node.onConfigure;
    node.onConfigure = function (...args) {
      const result = configure?.apply(this, args);
      labelNode(this);
      return result;
    };
  },
  afterConfigureGraph() { for (const node of app.graph?._nodes ?? []) labelNode(node); },
});
