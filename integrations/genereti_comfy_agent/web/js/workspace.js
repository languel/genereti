// One registry shared by the sidebar, browser callers and the local MCP bridge.
// Inspired by Artist–Model Studio's visible, replayable tool seam.
export function createWorkspace(app, {review=async()=>false}={}) {
 const tools=new Map();let lastUndo=null;
 const graph=()=>app.graph;
 const nodes=()=>graph()._nodes||[];
 const get=id=>{const node=graph().getNodeById(id);if(!node)throw Error(`Node #${id} no longer exists`);return node;};
 const clean=(value,limit=24000)=>typeof value==='string'?value.startsWith('data:')?'[image data omitted]':value.slice(0,limit):typeof value==='number'||typeof value==='boolean'||value===null?value:undefined;
 function nodeInfo(node,full=false){return {id:node.id,type:node.comfyClass||node.type,title:node.title,position:[...node.pos],inputs:(node.inputs||[]).map(s=>({name:s.name,type:s.type,link:s.link})),outputs:(node.outputs||[]).map(s=>({name:s.name,type:s.type,links:s.links})),widgets:Object.fromEntries((node.widgets||[]).filter(w=>!/(key|password|token|secret|canvas)/i.test(w.name)).map(w=>[w.name,clean(w.value,full?24000:180)])),images:(node.imgs||[]).map(img=>img.src).filter(src=>src&&!src.startsWith('data:')).slice(0,4),editor:full?editorInfo(node):undefined};}
 function editorInfo(node){const info=node._generetiEditorContext?.();if(!info)return undefined;return {...info,source:clean(info.source),selection:info.selection?.map(r=>({...r,text:clean(r.text)}))};}
 function selected(){const candidates=[...Object.values(app.canvas.selected_nodes||{}),...Array.from(app.canvas.selectedItems||[])];return [...new Set(candidates.filter(n=>n?.id!=null&&graph().getNodeById(n.id)===n).map(n=>String(n.id)))];}
 function snapshot(){return {nodes:nodes().slice(0,300).map(n=>nodeInfo(n)),selected:selected(),errors:{validation:app.lastNodeErrors||app.extensionManager?.lastNodeErrors||null,execution:app.lastExecutionError||null},truncated:nodes().length>300};}
 function definition(name,description,properties={},required=[],handler,mutates=false){tools.set(name,{name,description,inputSchema:{type:'object',properties,required,additionalProperties:false},handler,mutates});}
 const id={type:['integer','string'],description:'Comfy node ID'};
 definition('workspace_context','Read current nodes, selection, connections and validation errors.',{},[],()=>snapshot());
 definition('node_read','Read widgets, livecode source and text selection for a node.',{id},['id'],a=>nodeInfo(get(a.id),true));
 definition('node_focus','Select and center a node without modifying it.',{id},['id'],a=>{const node=get(a.id);app.canvas.deselectAllNodes();app.canvas.selectNode(node);app.canvas.centerOnNode?.(node);return nodeInfo(node);});
 definition('node_set','Update one widget. Changes are reviewed and undoable; livecode remains paused until explicitly run.',{id,widget:{type:'string'},value:{}},['id','widget','value'],async a=>{
  const node=get(a.id),widget=node.widgets?.find(w=>w.name===a.widget);if(!widget)throw Error('Unknown widget');
  if(/key|password|token|secret|canvas/i.test(a.widget))throw Error('This widget is not exposed to the agent');
  if(!['string','number','boolean'].includes(typeof a.value))throw Error('Widget values must be text, number or boolean');
  if(typeof widget.value!==typeof a.value)throw Error(`Expected ${typeof widget.value}`);
  if(typeof a.value==='string'&&a.value.length>100000)throw Error('Source too large');
  const choices=typeof widget.options?.values==='function'?widget.options.values():widget.options?.values;
  if(Array.isArray(choices)&&!choices.includes(a.value))throw Error('Value is not in the widget choices');
  if(typeof a.value==='number'&&(!Number.isFinite(a.value)||a.value<(widget.options?.min??-Infinity)||a.value>(widget.options?.max??Infinity)))throw Error('Number is outside widget limits');
  const expected=widget.value;
  if(!await review({tool:'node_set',node:nodeInfo(node),widget:a.widget,before:widget.value,after:a.value}))return {cancelled:true};
  // Approval can wait while a user edits: never overwrite newer content.
  if(get(a.id)!==node||widget.value!==expected)throw Error('Node changed while awaiting review');
  const before=widget.value,auto=node.widgets.find(w=>w.name==='auto_update'),autoBefore=auto?.value;
  const source=['code','sketch'].includes(a.widget);
  graph().beforeChange?.();if(source&&auto){auto.value=false;auto.callback?.(false);}widget.value=a.value;widget.callback?.(a.value);graph().afterChange?.();graph().setDirtyCanvas(true,true);
  lastUndo=()=>{if(get(a.id)!==node||widget.value!==a.value)throw Error('Node has newer edits; use Comfy undo instead');graph().beforeChange?.();widget.value=before;widget.callback?.(before);if(source&&auto){auto.value=autoBefore;auto.callback?.(autoBefore);}graph().afterChange?.();graph().setDirtyCanvas(true,true);};
  return {id:node.id,widget:a.widget,value:clean(widget.value),pausedAutoUpdate:source&&!!auto};
 },true);
 definition('node_create','Add a registered node to the visible workspace.',{type:{type:'string'},title:{type:'string'},x:{type:'number'},y:{type:'number'}},['type'],async a=>{
  if(!globalThis.LiteGraph?.registered_node_types?.[a.type])throw Error('Unknown node type; call catalog_search first');
  if(!await review({tool:'node_create',type:a.type,title:a.title}))return {cancelled:true};
  const node=globalThis.LiteGraph.createNode(a.type);if(!node)throw Error('Unable to create node');
  node.pos=[a.x??400,a.y??300];if(a.title)node.title=a.title;graph().beforeChange?.();graph().add(node);graph().afterChange?.();lastUndo=()=>{graph().beforeChange?.();graph().remove(node);graph().afterChange?.();};return nodeInfo(node);
 },true);
 definition('nodes_connect','Connect compatible output/input slots by name.',{from:id,output:{type:'string'},to:id,input:{type:'string'}},['from','output','to','input'],async a=>{
  const from=get(a.from),to=get(a.to),output=from.findOutputSlot(a.output),input=to.findInputSlot(a.input);
  if(output<0||input<0)throw Error('Unknown slot');if(to.inputs[input].link!=null)throw Error('Input already connected; edit that connection manually');
  if(!await review({tool:'nodes_connect',...a}))return {cancelled:true};
  if(get(a.from)!==from||get(a.to)!==to||to.inputs[input].link!=null)throw Error('Connection changed while awaiting review');
  graph().beforeChange?.();const link=from.connect(output,to,input);graph().afterChange?.();if(!link)throw Error('Incompatible slots');
  lastUndo=()=>{graph().beforeChange?.();graph().removeLink(link.id);graph().afterChange?.();};return {link:link.id};
 },true);
 definition('livecode_run','Compile/run a livecode node. Code runs in its existing preview sandbox.',{id},['id'],async a=>{const node=get(a.id);if(!node._generetiRun)throw Error('Use this tool with a Livecode node');if(!await review({tool:'livecode_run',id:a.id,title:node.title}))return {cancelled:true};await node._generetiRun();return {requested:true,status:node._generetiEditorContext?.().status};},true);
 definition('livecode_stop','Pause a livecode node, retaining the last frame.',{id},['id'],a=>{const node=get(a.id);if(!node._generetiStop)throw Error('Use this tool with a Livecode node');node._generetiStop();return {stopped:true};});
 definition('workflow_run','Queue the currently visible Comfy graph. May use models or paid API nodes; review the graph first.',{},[],async()=>{if(!await review({tool:'workflow_run',nodes:snapshot().nodes.map(n=>({id:n.id,type:n.type}))}))return {cancelled:true};await app.queuePrompt(0,1);return {queued:true};},true);
 definition('catalog_search','Search installed node types and input schemas.',{query:{type:'string'}},['query'],async a=>{const response=await fetch('/object_info');if(!response.ok)throw Error('Node catalog unavailable');const all=await response.json(),q=a.query.toLowerCase();return Object.entries(all).filter(([name,d])=>[name,d.display_name,d.category,...(d.search_aliases||[])].join(' ').toLowerCase().includes(q)).slice(0,12).map(([name,d])=>({name,display_name:d.display_name,description:d.description,input:d.input,output:d.output}));});
 definition('workspace_undo','Undo the last assistant edit if its target has not been edited since.',{},[],()=>{if(!lastUndo)throw Error('No assistant edit to undo');lastUndo();lastUndo=null;return {undone:true};});
 return {snapshot,nodeInfo,tools:()=>[...tools.values()].map(({handler,...t})=>t),call:async(name,args={})=>{const tool=tools.get(name);if(!tool)throw Error(`Unknown tool ${name}`);for(const key of tool.inputSchema.required)if(args[key]===undefined)throw Error(`Missing ${key}`);return tool.handler(args);}};
}
