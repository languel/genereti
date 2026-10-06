import {nodeReference,resolveNode,coalesceAction,validateActions} from './guide-actions.js';
import {captureNode,applyPatchAction,applyWidget} from './guide-patch.js';
const scalar=v=>['string','number','boolean'].includes(typeof v)&&(!(typeof v==='number')||Number.isFinite(v));
const host=n=>document.querySelector(`.lg-node[data-node-id="${CSS.escape(String(n.id))}"]`);
function surface(n,t){const h=host(n);if(!h)return null;if(t.part==='code')return h.querySelector('.cm-editor')??h;return h;}
const point=(el,x,y)=>{const r=el.getBoundingClientRect();return [Math.max(0,Math.min(1,(x-r.left)/r.width)),Math.max(0,Math.min(1,(y-r.top)/r.height))];};
export function createRecorder(app,owner,onStatus){
 let running=false,timer,steps=[],actions=[],target,before,down,lastAt=0,graph,wrappedAdd,wrappedRemove,originalAdd,originalRemove;
 const nodes=()=>graph._nodes.filter(n=>n!==owner);
 const snapshot=()=>new Map(nodes().map(n=>[String(n.id),{node:n,widgets:new Map((n.widgets??[]).filter(w=>w.options?.serialize!==false&&scalar(w.value)).map(w=>[w.name,w.value])),links:(n.inputs??[]).map(i=>i.link),position:Array.from(n.pos??[0,0]),size:Array.from(n.size??[300,200]),title:n.title,mode:n.mode??0,collapsed:!!n.flags?.collapsed}]));
 function flush(title){if(!actions.length)return;steps.push({title:title??`Step ${steps.length+1}`,text:'Describe what the learner should do.',hint:'',target:{...target,part:target.part??'node'},actions:validateActions(actions)});actions=[];target=null;}
 const add=a=>{if(actions.length>=100)flush();const now=Date.now();if(lastAt)a.delayMs=Math.min(2000,Math.max(0,now-lastAt));lastAt=now;coalesceAction(actions,a);target??=a.target;onStatus?.(`${steps.length+1} · ${actions.length} recorded actions`);};
 function scan(){if(!running)return;if(app.graph!==graph){running=false;clean();onStatus?.('Recording stopped: workflow changed');return;}const next=snapshot();
  // Create all new instances before recording their interconnections.
  for(const n of nodes())if(!before?.has(String(n.id)))add(captureNode(n));
  for(const n of nodes()){const prev=before?.get(String(n.id)),now=next.get(String(n.id));
   if(prev){for(const [name,value] of now.widgets)if(prev.widgets.has(name)&&prev.widgets.get(name)!==value)add({kind:typeof value==='string'?'type-text':'set-widget',target:{...nodeReference(n),widget:name,part:typeof value==='string'?'code':'parameter'},value});
    if(JSON.stringify([prev.position,prev.size,prev.title,prev.mode,prev.collapsed])!==JSON.stringify([now.position,now.size,now.title,now.mode,now.collapsed]))add({kind:'layout',target:nodeReference(n),position:now.position,size:now.size,title:String(now.title??n.type),mode:now.mode,collapsed:now.collapsed});
   }
   now.links.forEach((link,i)=>{if(link===(prev?.links[i]??null))return;const input=n.inputs[i].name;if(link==null)add({kind:'disconnect',target:nodeReference(n),input});else{const l=graph.links?.[link]??graph.links?.get?.(link),from=l&&graph.getNodeById(l.origin_id);if(from)add({kind:'connect',target:nodeReference(n),input,source:nodeReference(from),output:from.outputs[l.origin_slot].name});}});
  }
  for(const [id,prev]of before??[])if(!next.has(id))add({kind:'delete-node',target:nodeReference(prev.node)});
  before=next;
 }
 function commit(){scan();flush();onStatus?.(`${steps.length} steps recorded`);}
 function pointerDown(e){if(!running||e.button!==0)return;scan();const h=e.target.closest?.('.lg-node');if(!h)return;const n=graph.getNodeById(h.dataset.nodeId);if(!n||n===owner)return;const t=nodeReference(n);add({kind:'select',target:t});down={target:t,el:h,from:point(h,e.clientX,e.clientY)};}
 function pointerUp(e){if(!running||!down)return;const to=point(down.el,e.clientX,e.clientY),distance=Math.hypot(to[0]-down.from[0],to[1]-down.from[1]);add({kind:'pointer',target:down.target,gesture:distance>.025?'drag':'click',from:down.from,to});down=null;scan();}
 function click(e){if(!running)return;const b=e.target.closest?.('button'),h=b?.closest('.lg-node'),n=h&&graph.getNodeById(h.dataset.nodeId);if(!n||n===owner)return;if(n.comfyClass==='GeneretiLivecode'&&b.closest('.genereti-livecode-toolbar')&&b.getAttribute('aria-label')==='Run'){scan();add({kind:'run-code',target:nodeReference(n)});return;}const label=(b.getAttribute('aria-label')??'').toLowerCase(),view=label.includes('output overlay')?'overlay':label.includes('output backdrop')?'backdrop':label.includes('freeze')?'freeze':label.includes('node preview')?'minimize':null;if(view)add({kind:'view',target:nodeReference(n),view,enabled:b.getAttribute('aria-pressed')==='true'});}
 function clean(){clearInterval(timer);window.removeEventListener('click',click,false);window.removeEventListener('pointerdown',pointerDown,true);window.removeEventListener('pointerup',pointerUp,true);if(graph&&wrappedAdd&&graph.add===wrappedAdd)graph.add=originalAdd;if(graph&&wrappedRemove&&graph.remove===wrappedRemove)graph.remove=originalRemove;down=null;}
 return {get running(){return running;},start({includeExisting=false}={}){if(running)return;graph=app.graph;steps=[];actions=[];target=null;lastAt=0;before=snapshot();running=true;
  if(includeExisting){for(const n of nodes())add(captureNode(n));for(const n of nodes())for(const input of n.inputs??[]){const l=graph.links?.[input.link]??graph.links?.get?.(input.link),from=l&&graph.getNodeById(l.origin_id);if(from)add({kind:'connect',target:nodeReference(n),input:input.name,source:nodeReference(from),output:from.outputs[l.origin_slot].name});}flush('Starting patch');}
  originalAdd=graph.add;originalRemove=graph.remove;
  if(originalAdd){wrappedAdd=function(){const result=originalAdd.apply(this,arguments);scan();return result;};graph.add=wrappedAdd;}
  if(originalRemove){wrappedRemove=function(){scan();const result=originalRemove.apply(this,arguments);scan();return result;};graph.remove=wrappedRemove;}
  timer=setInterval(scan,120);window.addEventListener('pointerdown',pointerDown,true);window.addEventListener('pointerup',pointerUp,true);window.addEventListener('click',click,false);onStatus?.('Recording patch · add tools, connect, edit and arrange · + separates steps');},next:commit,stop(){if(!running)return [];commit();running=false;clean();return steps;},cancel(){running=false;clean();}};
}
function cueElement(){let el=document.querySelector('.genereti-tutorial-cursor');if(el)return el;el=document.createElement('div');el.className='genereti-tutorial-cursor';el.style.cssText='position:fixed;z-index:2147483001;pointer-events:none;width:18px;height:18px;border:2px solid var(--fg-color,#ddd);border-radius:50%;background:#8884;box-shadow:0 0 8px #0006;left:0;top:0;transform:translate(-100px,-100px)';document.body.append(el);return el;}
function animate(duration,fn,signal){return new Promise((resolve,reject)=>{const start=performance.now();function tick(now){if(signal?.aborted){reject(Error('Tutorial playback stopped'));return;}const t=Math.min(1,(now-start)/duration);fn(t);if(t<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});}
export async function playActions(app,actions,{signal,instant=false}={}){
 actions=validateActions(actions);const graph=app.graph;
 const get=t=>resolveNode(graph,t);
 // Check dependencies in order against a virtual graph before editing live nodes.
 const planned={_nodes:[...graph._nodes]};
 for(const a of actions){
  if(a.kind==='create-node'){if(!globalThis.LiteGraph?.registered_node_types?.[a.target.nodeType])throw Error('Install node type: '+a.target.nodeType);if(!planned._nodes.some(n=>n.properties?.generetiLessonRef===a.target.ref))planned._nodes.push({type:a.target.nodeType,properties:{generetiLessonRef:a.target.ref},_planned:true});continue;}
  const n=resolveNode(planned,a.target),w=a.target.widget?n.widgets?.find(w=>w.name===a.target.widget):null;
  if(['type-text','set-widget'].includes(a.kind)&&!n._planned&&!w)throw Error('Widget is missing: '+a.target.widget);
  if(w){const choices=typeof w.type==='object'?w.type:w.options?.values;if(Array.isArray(choices)&&!choices.includes(a.value))throw Error('Value is not in widget choices');if(typeof a.value==='number'&&(a.value<(w.options?.min??-Infinity)||a.value>(w.options?.max??Infinity)))throw Error('Value is outside widget limits');}
  if(a.kind==='run-code'&&((n.comfyClass??n.type)!=='GeneretiLivecode'||n.widgets?.find(w=>w.name==='language')?.value==='strudel'))throw Error('Audio/code activation requires the tool’s explicit Run control');
  if(a.kind==='connect'){resolveNode(planned,a.source);if(!n._planned&&!n.inputs?.some(i=>i.name===a.input))throw Error('Input is missing');}
  if(a.kind==='delete-node')planned._nodes=planned._nodes.filter(other=>other!==n);
 }
 const cursor=cueElement();graph.beforeChange?.();try{for(const a of actions){if(signal?.aborted||app.graph!==graph)throw Error('Tutorial playback stopped or workflow changed');
  if(!instant&&a.delayMs)await animate(a.delayMs,()=>{},signal);
  if(signal?.aborted||app.graph!==graph)throw Error('Tutorial playback stopped or workflow changed');
  if(['create-node','delete-node','layout'].includes(a.kind)){const n=applyPatchAction(app,a);if(a.kind==='create-node'&&n){app.canvas.centerOnNode?.(n);app.canvas.setDirty?.(true,true);}continue;}
  const n=get(a.target),w=a.target.widget?n.widgets?.find(w=>w.name===a.target.widget):null;
  if(a.kind==='select'){app.canvas.deselectAllNodes?.();app.canvas.selectNode?.(n);continue;}
  if(a.kind==='pointer'){const el=surface(n,a.target);if(!el)throw Error('Target view is not visible');if(!instant)await animate(a.gesture==='drag'?650:250,t=>{const r=el.getBoundingClientRect(),x=(a.from[0]+(a.to[0]-a.from[0])*t)*r.width+r.left,y=(a.from[1]+(a.to[1]-a.from[1])*t)*r.height+r.top;cursor.style.transform=`translate(${x-9}px,${y-9}px) scale(${a.gesture==='click'?1+Math.sin(t*Math.PI)*.6:1})`;},signal);continue;}
  if(a.kind==='set-widget'||a.kind==='type-text'){
   // Source stays paused while visibly typing; Run remains a separate action.
   if(!w)throw Error('Widget is missing: '+a.target.widget);
   const auto=n.widgets.find(w=>w.name==='auto_update');if(a.kind==='type-text'&&auto){auto.value=false;auto.callback?.(false);}
   const set=value=>{if(signal?.aborted||app.graph!==graph||!graph._nodes.includes(n))throw Error('Tutorial playback stopped or workflow changed');if(w.options?.setValue)w.options.setValue(value);else w.value=value;n.setDirtyCanvas?.(true,true);};
   if(a.kind==='type-text'&&!instant)await animate(Math.min(2500,Math.max(250,a.value.length*12)),t=>set(a.value.slice(0,Math.ceil(a.value.length*t))),signal);applyWidget(n,a.target.widget,a.value);
  }else if(a.kind==='connect'){const from=get(a.source),out=from.outputs?.findIndex(o=>o.name===a.output),input=n.inputs.findIndex(i=>i.name===a.input);if(typeof out!=='number'||out<0||!from.connect(out,n,input))throw Error('Could not connect tutorial sockets');}
  else if(a.kind==='disconnect'){const i=n.inputs?.findIndex(i=>i.name===a.input);if(i<0)throw Error('Input is missing');n.disconnectInput(i);}
  else if(a.kind==='run-code'){if(n.widgets?.find(w=>w.name==='language')?.value==='strudel')throw Error('Use explicit audio Run');await n._generetiLivecode.evaluate(undefined,undefined,true);}
  else if(a.kind==='view'){const labels={overlay:'output overlay',backdrop:'output backdrop',freeze:'Freeze',minimize:'node preview'},buttons=[...(host(n)?.querySelectorAll('button[aria-pressed]')??[])],b=buttons.find(b=>b.getAttribute('aria-label')?.includes(labels[a.view]));if(!b)throw Error('Preview control is unavailable');if((b.getAttribute('aria-pressed')==='true')!==a.enabled)b.click();}
 }}finally{cursor.remove();graph.afterChange?.();graph.setDirtyCanvas?.(true,true);}
}
