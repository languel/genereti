import { app } from '../../../../scripts/app.js';

// Titles are presentation. Saved workflow identity remains the Genereti node ID.
export function generetiTitle(title, className = '') {
  const core = (className.startsWith('GeneretiCore') || ['GeneretiSDXSGenerate','GeneretiSDTurboGenerate'].includes(className)) || (!className && /ꘅ/.test(String(title ?? '').match(/^[ꘇꘅ\s]*/)?.[0] ?? ''));
  const label = String(title ?? '').replace(/^(?:[ꘇꘅ]\s*)+/, '').replace(/^GeneretiCore\s+/i, '').replace(/^Genereti\s+/i, '');
  return (core ? 'ꘅ' : 'ꘇ') + ' ' + label;
}
function labelNode(node) {
  if (node.comfyClass?.startsWith('Genereti')) node.title = generetiTitle(node.title, node.comfyClass);
}
app.registerExtension({
  name: 'Genereti.NodeLabels',
  beforeRegisterNodeDef(nodeType, data) {
    if (!data.name?.startsWith('Genereti')) return;
    data.display_name = generetiTitle(data.display_name ?? data.name, data.name);
    const label = data.display_name.replace(/^[ꘇꘅ]\s*/, '');
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
