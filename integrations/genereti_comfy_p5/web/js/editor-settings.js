import {app} from '../../../scripts/app.js';
import {defaultAppearance} from '../lib/editor.mjs?v=27024ccf1ec1c74f';
const listeners=new Set();
const definitions=[
 ['theme','Theme','combo','dark',['dark','light','midnight','paper','mono-dark','mono-light','transparent-dark','transparent-light']],
 ['fontFamily','Font','combo',defaultAppearance.fontFamily,[defaultAppearance.fontFamily,'Menlo, monospace','Monaco, monospace','"Courier New", monospace','system-ui, sans-serif']],
 ['fontSize','Default font size','number',14],['lineHeight','Line height','number',1.55],
 ['wrap','Wrap','boolean',true],['autocomplete','Autocomplete','boolean',true],['hoverDocs','Hover docs','boolean',true],
 ['css','Preview CSS','text',''],['overlayBackground','Overlay background','combo','glyphs',['transparent','glyphs','solid']],['overlayOpacity','Backdrop opacity','number',.75],
 ...['foreground','background','keyword','string','number','comment','selection','activeLine','bracket','selectionMatch','searchMatch','popupBackground','popupText'].map(key=>[key,`Color: ${key}`,'text',''])
];
const id=key=>`Genereti.Editor.${key}`;
export function globalEditorAppearance(){return {...defaultAppearance,...Object.fromEntries(definitions.map(([key,label,type,fallback])=>[key,app.ui.settings.getSettingValue(id(key),fallback)]).filter(([key,value])=>value!==''||key==='css'))};}
export function editorAppearance(node){return {...globalEditorAppearance(),fontSize:node.properties?.generetiEditorFontSize??node.properties?.generetiOperatorFont??globalEditorAppearance().fontSize};}
export function subscribeEditorAppearance(callback){listeners.add(callback);return ()=>listeners.delete(callback);}
export async function saveGlobalEditorAppearance(appearance){const snapshot={...appearance};await Promise.all(definitions.map(([key,label,type,fallback])=>app.ui.settings.setSettingValue(id(key),snapshot[key]??fallback)));}
export function captureFontShortcut(node,element,apply){
 const handler=event=>{
  if(event.defaultPrevented||event.isComposing||event.altKey||!(event.ctrlKey||event.metaKey)||!event.shiftKey||!['Equal','Minus','NumpadAdd','NumpadSubtract'].includes(event.code))return;
  const focused=element.contains(document.activeElement);
  const typing=document.activeElement?.closest?.('input,textarea,select,[contenteditable],.cm-editor,[role=dialog]');
  const selected=Object.values(app.canvas?.selected_nodes||{});
  if(!focused&&(typing||selected.length!==1||selected[0]!==node))return;
  event.preventDefault();event.stopImmediatePropagation();
  node.properties.generetiEditorFontSize=Math.max(9,Math.min(36,Number(editorAppearance(node).fontSize)+(['Equal','NumpadAdd'].includes(event.code)?1:-1)));
  apply();node.setDirtyCanvas?.(true,true);
 };
 window.addEventListener('keydown',handler,true);return ()=>window.removeEventListener('keydown',handler,true);
}
app.registerExtension({name:'Genereti.EditorDefaults',settings:definitions.map(([key,name,type,defaultValue,options])=>({
 id:id(key),name,category:['Genereti','Editor',name],type,defaultValue,...(options?{options}:{}),
 ...(type==='number'?{attrs:{min:key==='fontSize'?9:key==='lineHeight'?.8:0,max:key==='fontSize'?36:key==='lineHeight'?2.5:1,step:key==='fontSize'?1:.05}}:{}),
 tooltip:key==='fontSize'?'Shared editor default. Cmd/Ctrl+Shift+Plus or Minus overrides the focused or selected node.':key.startsWith('overlay')?'Shared code overlay appearance.':key==='css'?'CSS for Livecode output documents.':key==='theme'?'Shared CodeMirror theme. Empty color overrides use this palette.':'Shared editor preference; updates open editors.',
 onChange:()=>{for(const callback of listeners)callback();}
}))});
