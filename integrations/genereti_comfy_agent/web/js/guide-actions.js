// Structured, local node actions. Imported guides cannot supply selectors or JS.
const kinds=new Set(['select','set-widget','type-text','connect','disconnect','view','pointer','run-code','create-node','delete-node','layout']);
const views=new Set(['overlay','backdrop','freeze','minimize']);
export function validateReference(value){
 if(!value||typeof value.nodeType!=='string'||value.nodeType.length>100)throw Error('Action requires a node type');
 const out={nodeType:value.nodeType};for(const key of ['ref','widget','part'])if(value[key]!==undefined){if(typeof value[key]!=='string'||value[key].length>100)throw Error('Invalid action reference');out[key]=value[key];}
 if(value.nodeId!==undefined){if(!['number','string'].includes(typeof value.nodeId))throw Error('Invalid node ID');out.nodeId=value.nodeId;}return out;
}
export function validateActions(actions){
 if(!Array.isArray(actions)||actions.length>100)throw Error('Expected at most 100 step actions');
 const name=value=>{if(typeof value!=='string'||value.length>100)throw Error('Invalid socket name');return value;};
 const point=value=>{if(!Array.isArray(value)||value.length!==2||value.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0||n>1))throw Error('Pointer coordinates must be normalized');return value;};
 return actions.map(a=>{if(!a||!kinds.has(a.kind))throw Error('Unknown tutorial action');const out={kind:a.kind,target:validateReference(a.target)};
  if(a.delayMs!==undefined){if(!Number.isFinite(a.delayMs)||a.delayMs<0||a.delayMs>5000)throw Error('Invalid action delay');out.delayMs=a.delayMs;}
  if(['create-node','layout'].includes(a.kind)){if(a.mode!==undefined){if(!Number.isInteger(a.mode)||a.mode<0||a.mode>4)throw Error('Invalid node mode');out.mode=a.mode;}if(a.collapsed!==undefined){if(typeof a.collapsed!=='boolean')throw Error('Invalid collapsed state');out.collapsed=a.collapsed;}const pair=(v,size=false)=>{if(!Array.isArray(v)||v.length!==2||v.some(n=>!Number.isFinite(n)||Math.abs(n)>100000||size&&n<1))throw Error('Invalid node geometry');return [...v];};if(a.position)out.position=pair(a.position);if(a.size)out.size=pair(a.size,true);if(a.title!==undefined){if(typeof a.title!=='string'||a.title.length>200)throw Error('Invalid node title');out.title=a.title;}if(a.kind==='create-node'){if(!out.target.ref||!out.position||!out.size)throw Error('Created node requires ref and geometry');if(!a.widgets||typeof a.widgets!=='object'||Array.isArray(a.widgets)||Object.keys(a.widgets).length>200)throw Error('Invalid node widgets');out.widgets={};for(const [key,value]of Object.entries(a.widgets)){name(key);if(!['string','number','boolean'].includes(typeof value)||typeof value==='number'&&!Number.isFinite(value)||typeof value==='string'&&value.length>100000)throw Error('Invalid node widget');out.widgets[key]=value;}}}
  if(a.kind==='set-widget'||a.kind==='type-text'){if(!out.target.widget)throw Error('Action requires a widget');if(!['string','number','boolean'].includes(typeof a.value)||typeof a.value==='number'&&!Number.isFinite(a.value)||typeof a.value==='string'&&a.value.length>100000)throw Error('Invalid widget value');if(a.kind==='type-text'&&typeof a.value!=='string')throw Error('Typing requires text');out.value=a.value;}
  if(a.kind==='connect'){out.source=validateReference(a.source);out.output=name(a.output);out.input=name(a.input);}
  if(a.kind==='disconnect')out.input=name(a.input);
  if(a.kind==='view'){if(!views.has(a.view)||typeof a.enabled!=='boolean')throw Error('Invalid preview action');out.view=a.view;out.enabled=a.enabled;}
  if(a.kind==='pointer'){if(!['move','click','drag'].includes(a.gesture))throw Error('Invalid pointer gesture');out.gesture=a.gesture;out.from=point(a.from);out.to=point(a.to??a.from);
   if(a.path!==undefined){if(!Array.isArray(a.path)||a.path.length<2||a.path.length>96)throw Error('Pointer path requires 2–96 samples');let last=-1;out.path=a.path.map(p=>{if(!Array.isArray(p)||p.length!==3||!Number.isFinite(p[2])||p[2]<last||p[2]>5000||p[2]<0)throw Error('Invalid pointer path time');last=p[2];return [...point(p.slice(0,2)),p[2]];});if(out.path[0][2]!==0)throw Error('Pointer path must start at zero');}
   if(a.value!==undefined||a.fromValue!==undefined){if(a.gesture==='move'||!out.target.widget||!Number.isFinite(a.value)||!Number.isFinite(a.fromValue))throw Error('Pointer value requires a named numeric widget and gesture');out.value=a.value;out.fromValue=a.fromValue;}
}
  return out;
 });
}
export function resolveNode(graph,target){
 const nodes=graph?._nodes??[];
 if(target.ref){const found=nodes.find(n=>n.properties?.generetiLessonRef===target.ref);if(found&&(found.comfyClass??found.type)===target.nodeType)return found;throw Error('Tutorial target is missing: '+target.nodeType);}
 if(target.nodeId!==undefined){const found=nodes.find(n=>String(n.id)===String(target.nodeId)&&(n.comfyClass??n.type)===target.nodeType);if(found)return found;}
 const matches=nodes.filter(n=>(n.comfyClass??n.type)===target.nodeType);if(matches.length===1)return matches[0];throw Error(matches.length?'Several matching nodes; record a specific target':'Tutorial target is missing: '+target.nodeType);
}
export function nodeReference(node){node.properties??={};node.properties.generetiLessonRef??=crypto.randomUUID();return {nodeType:node.comfyClass??node.type,nodeId:node.id,ref:node.properties.generetiLessonRef};}
export function coalesceAction(actions,action){
 // Consecutive slider changes or typed revisions become one committed value.
 const last=actions.at(-1);if(last&&['set-widget','type-text','layout'].includes(action.kind)&&last.kind===action.kind&&JSON.stringify(last.target)===JSON.stringify(action.target)){actions[actions.length-1]=action;}else actions.push(action);
}
