import {editorAppearance,subscribeEditorAppearance} from '/extensions/genereti_comfy_p5/js/editor-settings.js';
export {editorAppearance};
export function attachEditorDefaults(node,editor){const unsubscribe=subscribeEditorAppearance(()=>editor.setAppearance?.(editorAppearance(node)));const removed=node.onRemoved;node.onRemoved=function(){unsubscribe();return removed?.apply(this,arguments);};}
