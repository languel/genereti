import { app } from '../../../scripts/app.js';

export function editing(event){
 return event.composedPath?.().some(target=>target?.isContentEditable||target?.matches?.('input,textarea,select,[contenteditable],.cm-editor,.monaco-editor'))||event.target?.isContentEditable||event.target?.closest?.('input,textarea,select,[contenteditable],.cm-editor,.monaco-editor');
}
export function physicalKey(event){
 // Option produces alternate characters on macOS; bindings still refer to keys.
 if(event.altKey&&/^Key[A-Z]$/.test(event.code))return event.code.slice(3).toLowerCase();
 if(event.code==='BracketLeft')return '[';
 if(event.code==='BracketRight')return ']';
 return event.key;
}
export function routeNativeShortcut(event){
 if(event.defaultPrevented||event.repeat||event.isComposing||editing(event)||event.target?.isContentEditable||event.target?.closest?.('[role=dialog],[role=menu]'))return;
 const manager=app.extensionManager;
 // Comfy exposes commands publicly but not its binding lookup. Keep this
 // compatibility seam isolated, and defer to Comfy if its store changes.
 const store=manager?._p?._s?.get('keybinding');
 const key=physicalKey(event);
 const lookup=value=>value&&store?.getKeybinding?.({serialize:()=>`${value.toUpperCase()}:${Boolean(event.ctrlKey||event.metaKey)}:${Boolean(event.altKey)}:${Boolean(event.shiftKey)}`});
 const binding=lookup(event.key)||lookup(key);
 if(!binding)return;
 const target=binding.targetElementId;
 if(target&&!document.getElementById(target==='graph-canvas'?'graph-canvas-container':target)?.contains(event.target))return;
 let command=binding.commandId;
 // P retains Comfy's pin behavior for a selection and toggles parameters only
 // on an empty graph selection. Follow the native Pin binding if remapped.
 if(command==='Comfy.Canvas.ToggleSelected.Pin'&&!Object.keys(app.canvas?.selected_nodes||{}).length&&!app.canvas?.selectedItems?.size)command='Genereti.TogglePropertiesPanel';
 if(!command.startsWith('Genereti.'))return;
 if(manager._p._s.get('dialog')?.dialogStack?.length)return;
 event.preventDefault();event.stopImmediatePropagation?.();event.stopPropagation?.();
 manager.command.execute(command).catch(console.error);
}
window.addEventListener('keydown',routeNativeShortcut,true);
