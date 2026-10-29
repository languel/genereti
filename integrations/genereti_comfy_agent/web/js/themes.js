import {upgradeDarkPalette} from './theme-migrations.js';
import {ensureControlStyle} from '/extensions/genereti_comfy_p5/js/control-style.js';
import {app} from '/scripts/app.js';
const ids=['genereti-dark','genereti-mono','genereti-light','genereti-transparent'];
const common=['base-background','base-foreground','primary-background','primary-background-hover','primary-foreground','secondary-background','secondary-foreground','muted-background','muted-foreground','p-primary-color','p-primary-hover-color','p-primary-active-color','p-primary-contrast-color','p-highlight-background','p-highlight-color','p-focus-ring-color','p-slider-range-background','p-slider-handle-background','p-slider-handle-hover-background','p-slider-handle-content-background','p-checkbox-checked-background','p-checkbox-checked-border-color','p-checkbox-icon-checked-color','p-toggleswitch-checked-background'];
app.registerExtension({name:'Genereti.Themes',async setup(){
 ensureControlStyle();
 const service=app.extensionManager?.colorPalette;if(!service?.addCustomColorPalette)return;
 const previous=app.ui.settings.getSettingValue('Comfy.ColorPalette','dark');
 const existing=app.ui.settings.getSettingValue('Comfy.CustomColorPalettes',{})||{};const palettes=new Map();
 // Fetch before registering: Comfy hydrates its runtime palette registry only
 // after extension setup. Saved settings IDs are not yet runtime entries.
 const bundled=new Map();
 for(const id of ids){try{const response=await fetch(new URL(`../themes/${id}.json`,import.meta.url),{cache:'no-store'});if(!response.ok)throw Error(`Theme HTTP ${response.status}`);bundled.set(id,await response.json());}catch(error){console.warn('Genereti theme:',id,error);}}
 const priorDark=await fetch(new URL('../themes/genereti-dark-v2.json',import.meta.url),{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
 const saved={...existing};
 for(const [id,theme] of bundled){
  const old=saved[id];
  if(old){
   // Upgrade only the original generated button colors; keep user edits.
   const original={'genereti-dark':'#91b7af','genereti-mono':'#bdbdbd','genereti-light':'#526d65','genereti-transparent':'#bdbdbd'}[id];
   if(old.genereti?.editorTheme===theme.genereti.editorTheme&&!old.genereti?.revision&&old.colors?.comfy_base?.['primary-background']===original){
    saved[id]=structuredClone(old);
    for(const key of ['primary-background','primary-background-hover','primary-foreground','p-primary-color','p-primary-hover-color','p-primary-active-color','p-primary-contrast-color'])saved[id].colors.comfy_base[key]=theme.colors.comfy_base[key];
    saved[id].genereti.revision=2;
   }
  }else saved[id]=theme;
  if(id==='genereti-dark'&&priorDark)saved[id]=upgradeDarkPalette(saved[id],theme,priorDark);
  palettes.set(id,structuredClone(saved[id]));
 }
 // Comfy hydrates customPalettes from settings after extension setup, so
 // persist the upgraded snapshot through the settings API as well.
 for(const theme of Object.values(saved))await service.addCustomColorPalette(theme);
 await app.ui.settings.setSettingValue('Comfy.CustomColorPalettes',structuredClone(saved));
 // Register choices without switching the user's current theme.
 await service.loadColorPalette(previous);
 const style=document.createElement('style');style.textContent=`
 /* Current Comfy's Tailwind/Reka controls use semantic tokens; older
    frontends use comfy_base and PrimeVue tokens. Keep both on one palette. */
 html[data-genereti-theme^="genereti-"]{
  accent-color:var(--primary-background);
  --primary:var(--primary-background)!important;
  --secondary:var(--secondary-background)!important;
  --background:var(--base-background)!important;
  --foreground:var(--base-foreground)!important;
  --muted:var(--muted-background)!important;
  --accent:var(--content-hover-bg,var(--secondary-background))!important;
  --input:var(--comfy-input-bg,var(--secondary-background))!important;
  --border:var(--border-color)!important;
  --ring:var(--p-focus-ring-color)!important;
  --popover:var(--comfy-menu-bg,var(--base-background))!important;
 }
 html[data-genereti-theme="genereti-mono"]{
  --p-primary-color:#bdbdbd;--p-focus-ring-color:#bdbdbd;
  --p-inputtext-focus-border-color:#bdbdbd;--p-select-focus-border-color:#bdbdbd;
  --p-listbox-option-selected-background:#383838;--p-listbox-option-selected-focus-background:#444;
  --p-select-option-selected-background:#383838;--p-select-option-selected-focus-background:#444;
  --p-listbox-option-selected-color:#e7e7e7;--p-select-option-selected-color:#e7e7e7;
 }
 html[data-genereti-theme="genereti-mono"] [role="option"][aria-selected="true"]{background:#383838!important;color:#e7e7e7!important}
 html[data-genereti-theme="genereti-mono"] :is(input,button,[role="combobox"]):focus-visible{outline-color:#bdbdbd!important;--tw-ring-color:#bdbdbd}
 html[data-genereti-theme="genereti-mono"] :is(.p-select-filter,.p-listbox-filter,.p-inputtext):focus{border-color:#bdbdbd!important;box-shadow:0 0 0 1px #bdbdbd!important}
 html[data-genereti-theme="genereti-transparent"],html[data-genereti-theme="genereti-transparent"] body,html[data-genereti-theme="genereti-transparent"] #app{background:transparent!important;background-image:none!important}
 html[data-genereti-theme="genereti-transparent"] .graph-canvas-container{background:transparent!important}
 `;document.head.append(style);
 let last='';const applied=new Map();
 function sync(){const id=service.getActiveColorPalette()?.id;if(id===last)return;last=id;
  const root=document.documentElement;root.dataset.generetiTheme=palettes.has(id)?id:'';
  for(const [key,value] of applied){if(root.style.getPropertyValue('--'+key)===value)root.style.removeProperty('--'+key);}applied.clear();
  if(palettes.has(id))for(const key of common){const value=palettes.get(id).colors.comfy_base[key];if(value){root.style.setProperty('--'+key,value);applied.set(key,value);}}
 }
 sync();const observer=new MutationObserver(sync);observer.observe(document.documentElement,{attributes:true,attributeFilter:['style','class']});window.addEventListener('beforeunload',()=>observer.disconnect());
}});
