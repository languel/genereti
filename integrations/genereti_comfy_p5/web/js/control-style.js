import {decorateToolbarChoices,toolbarChoiceMutationRoots} from './choice-glyphs.js';
export const SETTINGS_GLYPH='<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M9 3h6l.6 2.5 2.1 1.2 2.4-.7 3 5.2-1.8 1.8v2.4l1.8 1.8-3 5.2-2.4-.7-2.1 1.2-.6 2.5H9l-.6-2.5-2.1-1.2-2.4.7-3-5.2 1.8-1.8V13l-1.8-1.8 3-5.2 2.4.7 2.1-1.2z" transform="translate(2 0) scale(.83)"/><circle cx="12" cy="12" r="3"/></svg>';
// Shared node chrome follows the livecode toolbar. See docs/node-ui-design.md.
export function ensureControlStyle() {
  if (document.getElementById('genereti-node-controls-style')) return;
  const style = document.createElement('style');
  style.id = 'genereti-node-controls-style';
  style.textContent = `
.genereti-node-controls{display:flex;align-items:center;flex-wrap:wrap;gap:4px;color:var(--fg-color,#eee)}
.genereti-lightning{display:inline-block;line-height:1;transform:scaleY(1.2);transform-origin:center}
.genereti-node-controls[hidden]{display:none!important}
/* Vue expands DOM widget grid tracks by default. Transport/settings rows
   are content-sized; livecode has its own editor-only expanding track. */
.lg-node:has(.genereti-node-controls):not(:has(.genereti-livecode)) .lg-node-widgets{grid-template-rows:none!important;grid-auto-rows:min-content;align-content:start;align-items:start}
.genereti-node-controls select,.genereti-node-controls button{height:30px;margin:0;border:0!important;border-radius:6px;box-shadow:none;background:transparent;color:inherit;font:inherit;cursor:pointer}
.genereti-node-controls select{padding:0 7px}
.genereti-node-controls select option{background:var(--comfy-input-bg,#222);color:var(--fg-color,#eee)}
:is(.genereti-node-controls,.genereti-livecode,.genereti-drawing-settings-panel) select:focus-visible{outline:2px solid currentColor!important;outline-offset:1px;box-shadow:none!important}
/* Browser-native menus use OS fonts and selection colors. Customizable selects
   keep native keyboard behavior while letting the popup follow Comfy's theme. */
@supports (appearance:base-select){
 :is(.genereti-node-controls,.genereti-livecode,.genereti-drawing-settings-panel) select,
 :is(.genereti-node-controls,.genereti-livecode,.genereti-drawing-settings-panel) select::picker(select){appearance:base-select}
 :is(.genereti-node-controls,.genereti-livecode,.genereti-drawing-settings-panel) select{display:inline-flex;align-items:center;gap:8px}
 :is(.genereti-node-controls,.genereti-livecode,.genereti-drawing-settings-panel) select::picker(select){font:inherit;font-size:calc(1em * var(--genereti-picker-scale,1));color:var(--fg-color,#eee);background:var(--comfy-input-bg,#222);border:1px solid var(--border-color,#555);border-radius:6px;padding:.333em;box-shadow:0 4px 16px #0004;min-width:anchor-size(width)}
 :is(.genereti-node-controls,.genereti-livecode,.genereti-drawing-settings-panel) select option{font:inherit;min-height:2.5em;padding:.333em .667em;border-radius:4px;background:transparent;color:inherit;gap:.667em;cursor:pointer}
 :is(.genereti-node-controls,.genereti-livecode,.genereti-drawing-settings-panel) select option:is(:checked,:hover,:focus){background:color-mix(in srgb,var(--fg-color,#eee) 12%,var(--comfy-input-bg,#222));color:var(--fg-color,#eee)}
 :is(.genereti-node-controls,.genereti-livecode,.genereti-drawing-settings-panel) select::picker-icon{content:"";display:block;width:6px;height:6px;margin-left:8px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:translateY(-2px) rotate(45deg);color:inherit;transition:none}
 :is(.genereti-node-controls,.genereti-livecode,.genereti-drawing-settings-panel) select option:focus-visible{outline:1px solid currentColor;outline-offset:-1px}
}
/* Chromium can retain its native value text alongside a dynamically inserted
   selectedcontent. Zero only the trigger's text; keep the menu's readable font. */
.genereti-glyph-choice{width:30px!important;min-width:30px!important;padding:0 6px!important;font-size:0!important;gap:0!important}
.genereti-glyph-choice::picker(select),.genereti-glyph-choice option{font-size:var(--genereti-choice-font-size,12px)!important}
.genereti-glyph-choice::picker-icon,.genereti-glyph-choice option::checkmark{display:none!important}
.genereti-glyph-choice::picker-icon{margin-left:0!important}
.genereti-glyph-choice>button{display:contents!important}
.genereti-glyph-choice selectedcontent{display:flex;align-items:center;justify-content:center}
.genereti-glyph-choice selectedcontent .genereti-choice-label{display:none}
.genereti-choice-icon{display:inline-flex;align-items:center;justify-content:center;width:18px;flex:none}
.genereti-choice-icon svg{width:18px;height:18px;display:block}
.genereti-glyph-choice::picker(select){min-width:160px!important}
.genereti-node-controls button{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;flex:none;width:30px;min-width:30px;padding:0}
.genereti-node-controls button svg{display:block;width:18px;height:18px;flex:none}
.genereti-node-controls select:hover{background:color-mix(in srgb,currentColor 8%,transparent)}
.genereti-node-controls button:hover,.genereti-node-controls button[aria-pressed=true]{background:color-mix(in srgb,currentColor 12%,transparent)}
.genereti-node-controls :is(button,select):focus-visible{outline:2px solid currentColor;outline-offset:1px}
.genereti-drawing-settings{position:relative}
.genereti-drawing-settings summary{display:flex;align-items:center;justify-content:center;width:30px;height:30px;cursor:pointer;list-style:none;border-radius:6px}
.genereti-drawing-settings summary::-webkit-details-marker{display:none}
.genereti-drawing-settings summary svg{width:18px;height:18px}
.genereti-drawing-settings[open] summary,.genereti-drawing-settings summary:hover{background:color-mix(in srgb,currentColor 12%,transparent)}
.genereti-drawing-settings summary:focus-visible{outline:2px solid currentColor}
.genereti-drawing-settings-panel{position:absolute;left:0;top:34px;z-index:30;width:280px;max-width:80vw;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:12px;border-radius:6px;background:var(--comfy-input-bg,#222);box-shadow:0 4px 16px #0004}
.genereti-drawing-settings-panel label{display:grid;gap:4px;font-size:11px;min-width:0}
.genereti-drawing-settings-panel :is(input,select){width:100%;min-width:0;box-sizing:border-box;height:30px;color:inherit;font:inherit}
.genereti-drawing-settings-panel input{background:transparent;border:1px solid var(--border-color,#555);border-radius:4px;padding:4px}
`;
  document.head.append(style);
  new MutationObserver(records=>{for(const root of toolbarChoiceMutationRoots(records))decorateToolbarChoices(root);}).observe(document.body,{childList:true,subtree:true});
  decorateToolbarChoices();
  document.addEventListener('change',event=>{if(event.target.matches?.('select'))decorateToolbarChoices(event.target);});
  // Pickers live in the top layer, outside the graph's CSS transform. Match the
  // control's displayed text size when opening, without work in the render loop.
  const syncPickerScale = event => {
    const select = event.target.closest?.('select');
    if (!select?.closest('.genereti-node-controls,.genereti-livecode,.genereti-drawing-settings-panel') || !select.offsetWidth) return;
    select.style.setProperty('--genereti-picker-scale', String(select.getBoundingClientRect().width / select.offsetWidth));
  };
  document.addEventListener('pointerdown', syncPickerScale, true);
  document.addEventListener('focusin', syncPickerScale, true);
}
