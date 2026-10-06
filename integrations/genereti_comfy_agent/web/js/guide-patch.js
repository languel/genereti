// Portable patch operations; no serialized graph IDs, runtime objects or code hooks.
import {nodeReference,resolveNode} from './guide-actions.js';
export function captureNode(node){
 const widgets={};for(const w of node.widgets??[]){if(w.options?.serialize===false)continue;const value=w.options?.getValue?.()??w.value;if(['string','number','boolean'].includes(typeof value))widgets[w.name]=value;}
 return {kind:'create-node',target:nodeReference(node),title:String(node.title??node.type),position:Array.from(node.pos??[0,0]),size:Array.from(node.size??[300,200]),widgets,mode:node.mode??0,collapsed:!!node.flags?.collapsed};
}
export function applyWidget(node,name,value){const w=node.widgets?.find(w=>w.name===name);if(!w)throw Error('Widget is missing: '+name);const choices=typeof w.type==='object'?w.type:w.options?.values;if(Array.isArray(choices)&&!choices.includes(value))throw Error('Value is not in widget choices');if(typeof value==='number'&&(value<(w.options?.min??-Infinity)||value>(w.options?.max??Infinity)))throw Error('Value is outside widget limits');if(w.options?.setValue)w.options.setValue(value);else w.value=value;w.callback?.(value);node.setDirtyCanvas?.(true,true);return w;}
export function applyPatchAction(app,a){
 const graph=app.graph;
 if(a.kind==='create-node'){
  // Replaying a lesson updates its own instances, never a same-type user node.
  let n=graph._nodes.find(n=>n.properties?.generetiLessonRef===a.target.ref);
  if(n&&(n.comfyClass??n.type)!==a.target.nodeType)throw Error('Recorded node reference has another type');
  if(!n){n=globalThis.LiteGraph?.createNode(a.target.nodeType);if(!n)throw Error('Install node type: '+a.target.nodeType);n.properties??={};n.properties.generetiLessonRef=a.target.ref;graph.add(n);}
  if(a.title!==undefined)n.title=a.title;
  n.pos=Array.from(a.position);restoreFlags(n,a);n.setSize?.(Array.from(a.size));
  for(const [name,value] of Object.entries(a.widgets))applyWidget(n,name,value);
  return n;
 }
 const n=resolveNode(graph,a.target);
 if(a.kind==='delete-node'){graph.remove(n);return null;}
 if(a.kind==='layout'){restoreFlags(n,a);if(a.position)n.pos=Array.from(a.position);if(a.size)n.setSize?.(Array.from(a.size));if(a.title!==undefined)n.title=a.title;n.setDirtyCanvas?.(true,true);return n;}
 return n;
}

function restoreFlags(n,a){if(a.mode!==undefined){if(n.changeMode)n.changeMode(a.mode);else n.mode=a.mode;}if(a.collapsed!==undefined){n.flags??={};n.flags.collapsed=a.collapsed;}}
