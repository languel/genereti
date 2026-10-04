import { app } from '../../../scripts/app.js';

const previews=new Map();
function editing(event){
  return event.composedPath?.().some(target=>target?.isContentEditable||target?.matches?.('input,textarea,select,[contenteditable],.cm-editor,.monaco-editor')) || event.target?.isContentEditable || event.target?.closest?.('input,textarea,select,[contenteditable],.cm-editor,.monaco-editor');
}
export function registerPreviewShortcuts(node,controls){
  previews.set(node,controls);
  return ()=>{if(previews.get(node)===controls)previews.delete(node);};
}
export function routePreviewShortcut(event){
  if(event.defaultPrevented||event.repeat||event.isComposing||editing(event)||event.ctrlKey||event.metaKey)return;
  if(event.altKey&&((!event.shiftKey&&event.code==='KeyP')||(event.shiftKey&&['KeyZ','KeyI'].includes(event.code)))){window.dispatchEvent(new CustomEvent('genereti-workspace-shortcut',{detail:event}));return;}
  if(event.shiftKey)return;
  const backdrop=!event.altKey&&(event.code==='KeyD'||event.key?.toLowerCase()==='d');
  const overlay=event.altKey&&event.code==='KeyW';
  const fill=event.altKey&&event.code==='KeyF';
  const escape=!event.altKey&&event.key==='Escape';
  if(!backdrop&&!overlay&&!fill&&!escape)return;
  if(escape){const filled=[...previews].reverse().find(([node,controls])=>node.graph===app.graph&&controls.isFilled?.());if(!filled)return;event.preventDefault();event.stopPropagation();filled[1].toggleFill();return;}
  const selected=[...new Set([...Object.values(app.canvas?.selected_nodes||{}),...Array.from(app.canvas?.selectedItems||[])])].filter(node=>node.graph===app.graph);
  const hovered=(overlay||fill)&&([...previews].reverse().find(([node,controls])=>node.graph===app.graph&&controls.isHovered?.()));
  const node=hovered?.[0]||(selected.length===1?selected[0]:null);
  const action=previews.get(node)?.[backdrop?'toggleBackdrop':fill?'toggleFill':'toggleOverlay'];
  if(!action)return;
  event.preventDefault();event.stopPropagation();action();
}
window.addEventListener('keydown',routePreviewShortcut,true);
