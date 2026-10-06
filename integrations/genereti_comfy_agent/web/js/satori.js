import './shortcut-reference.js';
import { app } from '../../../../scripts/app.js';

// Presentation only: never change workflow, execution or stored Comfy layout settings.
const MODE = 'genereti-satori';
const PEEK = 'genereti-satori-panels';
const PROPERTIES_PEEK='genereti-satori-properties';
const PRESENTATION='genereti-presentation';
let dot,statsWanted,statsPeek=false;
const hooked=new WeakSet();
function presentation(){return document.documentElement.classList.contains(PRESENTATION);}
function syncCanvas(){
  const canvas=app.canvas;if(!canvas)return;
  statsWanted??=canvas.show_info;
  canvas.show_info=(presentation()||document.documentElement.classList.contains(MODE))?statsPeek:statsWanted;
  if(!hooked.has(canvas)){
    hooked.add(canvas);
    for(const method of ['drawConnections','drawGroups']){const original=canvas[method];if(original)canvas[method]=function(){if(!presentation())return original.apply(this,arguments);};}
    const front=canvas.drawFrontCanvas;
    canvas.drawFrontCanvas=function(){
      if(!presentation())return front.apply(this,arguments);
      this.dirty_canvas=false;
      const ctx=this.ctx,ratio=this.canvas.ownerDocument.defaultView.devicePixelRatio||1;
      ctx.save();ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,this.canvas.width/ratio,this.canvas.height/ratio);
      if(this.bgcanvas!==this.canvas)ctx.drawImage(this.bgcanvas,0,0,this.bgcanvas.width/ratio,this.bgcanvas.height/ratio);
      if(this.show_info)this.renderInfo(ctx,0,0);ctx.restore();
    };
  }
  canvas.setDirty?.(true,true);
}
function togglePresentation(){document.documentElement.classList.toggle(PRESENTATION);statsPeek=false;syncCanvas();}
function toggleStats(){
  if(presentation()||document.documentElement.classList.contains(MODE))statsPeek=!app.canvas?.show_info;
  else statsWanted=!app.canvas?.show_info;
  syncCanvas();
}

function toggle() {
  const enabled = document.documentElement.classList.toggle(MODE);
  document.documentElement.classList.remove(PEEK,PROPERTIES_PEEK);
  if (dot) dot.hidden = !enabled;
  statsPeek=false;syncCanvas();
  window.dispatchEvent(new Event('resize'));
}
async function toggleProperties(){
 const settings=app.ui.settings,key='Comfy.RightSidePanel.IsOpen';
 if(document.documentElement.classList.contains(MODE)){const show=document.documentElement.classList.toggle(PROPERTIES_PEEK);if(show&&!settings.getSettingValue(key))await settings.setSettingValue(key,true);}
 else await settings.setSettingValue(key,!settings.getSettingValue(key));
 window.dispatchEvent(new Event('resize'));
}
function editable(target) {
  return target instanceof Element && Boolean(target.closest('input,textarea,select,[contenteditable=true],.cm-editor,.monaco-editor'));
}
function markChrome() {
  // TopMenuSection has no public class; anchor to its stable actionbars test ID.
  const actions = document.querySelector('[data-testid="top-menu-actionbars"]');
  actions?.parentElement?.parentElement?.parentElement?.setAttribute('data-genereti-shell-top', '');
 const panel=document.querySelector('[data-testid=properties-panel]')?.closest('.p-splitterpanel,.p-splitter-panel');
 if(panel){panel.setAttribute('data-genereti-properties-panel','');if(panel.previousElementSibling?.classList.contains('p-splitter-gutter'))panel.previousElementSibling.setAttribute('data-genereti-properties-gutter','');}
}
app.registerExtension({
  name: 'Genereti.Satori',
  commands: [{id:'Genereti.TogglePropertiesPanel',label:'ꘇ Parameters sidebar',tooltip:'Toggle the right properties/parameters panel. P on blank canvas also toggles it; with selected nodes P keeps Comfy pin behavior.',icon:'pi pi-sidebar',function:toggleProperties},{id:'Genereti.ToggleSatori', label:'ꘇ Satori mode', tooltip:'Hide Comfy chrome and diagnostics; renderers continue.', icon:'pi pi-circle', function:toggle},{id:'Genereti.TogglePresentation',label:'ꘇ Presentation visibility',tooltip:'Hide graph nodes, code and links; renderers continue.',icon:'pi pi-eye-slash',function:togglePresentation},{id:'Genereti.ToggleCanvasStats',label:'ꘇ Canvas diagnostics',tooltip:'T: graph time; I: iterations; N: total [visible] nodes; V: revision; FPS: graph redraw rate, not output/generation FPS.',icon:'pi pi-chart-line',function:toggleStats}],
  keybindings: [{commandId:'Genereti.TogglePropertiesPanel',combo:{key:'r',alt:true,shift:true}},{commandId:'Genereti.ToggleSatori', combo:{key:'z',alt:true,shift:true}},{commandId:'Genereti.TogglePresentation',combo:{key:'p',alt:true}},{commandId:'Genereti.ToggleCanvasStats',combo:{key:'i',alt:true,shift:true}}],
  afterConfigureGraph(){syncCanvas();},
  setup() {
    const style = document.createElement('style');
    style.textContent = `
html.${PRESENTATION} .lg-node,html.${PRESENTATION} .dom-widget {visibility:hidden!important;pointer-events:none!important}
html.${PRESENTATION} .selection-toolbox {display:none!important}
html.${MODE} .comfy-menu,
html.${MODE} #comfyui-body-top,
html.${MODE} #comfyui-body-bottom,
html.${MODE} .workflow-tabs-container,
html.${MODE} .side-toolbar-container,
html.${MODE} .side-tool-bar-container,
html.${MODE} [data-genereti-shell-top],
html.${MODE} [role=toolbar][aria-label="Canvas Toolbar"],
html.${MODE} .minimap-main-container,
html.${MODE} .selection-toolbox {display:none!important}
html.${MODE}:not(.${PEEK}):not(.${PROPERTIES_PEEK}) [data-genereti-properties-panel],
html.${MODE}:not(.${PEEK}):not(.${PROPERTIES_PEEK}) [data-genereti-properties-gutter] {display:none!important}
html.${MODE}:not(.${PEEK}):not(.${PROPERTIES_PEEK}) #graph-canvas-container .p-splitter-gutter,
html.${MODE}:not(.${PEEK}) #graph-canvas-container .side-bar-panel,
html.${MODE}:not(.${PEEK}) #graph-canvas-container .bottom-panel,
html.${MODE}:not(.${PEEK}) #graph-canvas-container .p-splitter-panel:not(:has(.graph-canvas-panel)):not(.graph-canvas-panel) {display:none!important}
html.${MODE} .comfyui-body {grid-template-rows:0 1fr 0!important;grid-template-columns:0 1fr 0!important}
#genereti-satori-dot {position:fixed;bottom:10px;right:12px;z-index:10001;width:24px;height:24px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--fg-color,#aaa);font:20px system-ui;cursor:pointer;opacity:.45}
#genereti-satori-dot:hover,#genereti-satori-dot:focus-visible {opacity:1;background:var(--comfy-menu-bg,#222)}
#genereti-satori-dot[hidden] {display:none}
`;
    document.head.append(style);
    dot = document.createElement('button');
    dot.id = 'genereti-satori-dot';
    dot.textContent = '·';
    dot.title = 'Exit Satori · Alt+Shift+Z';
    dot.setAttribute('aria-label', dot.title);
    dot.hidden = true;
    dot.addEventListener('click', toggle);
    document.body.append(dot);
    markChrome();syncCanvas();
    // Comfy mounts/replaces shell regions when tabs and panels change.
    new MutationObserver(markChrome).observe(document.getElementById('vue-app') || document.body, {childList:true,subtree:true});
    const handleKey=event=>{
      if(event.defaultPrevented||event.repeat||event.isComposing||editable(event.target)||event.ctrlKey||event.metaKey)return;
      if (!document.documentElement.classList.contains(MODE)) return;
      if (event.code === 'Escape') document.documentElement.classList.remove(PEEK,PROPERTIES_PEEK);
      if (editable(event.target)) return;
      const panelKey = (!event.altKey && !event.ctrlKey && !event.metaKey && ['KeyA','KeyN','KeyM','KeyW'].includes(event.code)) ||
        ((event.ctrlKey || event.metaKey) && (event.code === 'Comma' || event.code === 'Backquote' || (event.shiftKey && event.code === 'KeyK')));
      // Reveal panel containers before Comfy's own shortcut opens the requested panel.
      if (panelKey) document.documentElement.classList.add(PEEK);
    };
    window.addEventListener('keydown',handleKey,true);
    window.addEventListener('genereti-workspace-shortcut',event=>handleKey(event.detail));
  }
});
