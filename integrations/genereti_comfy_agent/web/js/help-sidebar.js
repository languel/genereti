// Keep Comfy's Vue-owned tab button in place. A footer trigger opens that same
// tab; the native trigger is hidden, rather than moving Vue's DOM between groups.
export function installHelpSidebarButton(){
 const css=document.createElement('style');css.textContent='[data-testid="genereti-assistant-tab-button"][data-genereti-footer-trigger]{display:none!important}.genereti-help-sidebar-glyph{width:24px;height:24px;display:block}';document.head.append(css);
 let native,button,toolbar,toolbarObserver;
 function sync(){
  const source=document.querySelector('[data-testid="genereti-assistant-tab-button"]'),help=document.querySelector('[data-testid="help-center-button"]');
  if(!source||!help)return;
  source.setAttribute('data-genereti-footer-trigger','');
  if(native!==source){native=source;button?.remove();button=source.cloneNode(false);button.dataset.testid='genereti-help-button';button.removeAttribute('data-pd-tooltip');button.setAttribute('aria-label','Genereti reference and assistant');button.title='Genereti reference and assistant';button.innerHTML='<svg class="genereti-help-sidebar-glyph" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14a1 1 0 0 1 1 1v17H6a2 2 0 0 1-2-2V5a2 2 0 0 1 1-2ZM4 18h16M7 3v15"/><text x="13" y="13" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="currentColor" stroke="none">ꘇ</text></svg>';button.onclick=()=>native.click();}
  if(button.className!==source.className)button.className=source.className;
  button.setAttribute('aria-pressed',String(source.classList.contains('side-bar-button-selected')));
  if(help.previousElementSibling!==button)help.before(button);
  const root=help.parentElement.parentElement;
  if(toolbar!==root){toolbar=root;toolbarObserver?.disconnect();toolbarObserver=new MutationObserver(sync);toolbarObserver.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});}
 }
 // Bootstrap/recover when Comfy recreates the toolbar. Ignore text/readout
 // mutations: these are not a reason to scan or redecorate the graph.
 new MutationObserver(records=>{if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&(node.matches?.('[data-testid="help-center-button"]')||node.querySelector?.('[data-testid="help-center-button"]')))))sync();}).observe(document.body,{childList:true,subtree:true});
 sync();
}
