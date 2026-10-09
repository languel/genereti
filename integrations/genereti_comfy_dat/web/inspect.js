import {previewFirst} from '/extensions/genereti_comfy_p5/js/preview-order.js';
import {visualNodeControls} from '/extensions/genereti_comfy_stream/js/node-output-view.js';
import {app} from '../../scripts/app.js';
import {createEditor} from '/extensions/genereti_comfy_p5/lib/editor.mjs';
import {editorAppearance,subscribeEditorAppearance,captureFontShortcut} from '/extensions/genereti_comfy_p5/js/editor-settings.js';
import {ensureControlStyle} from '/extensions/genereti_comfy_p5/js/control-style.js';
import {documentExportControls} from '/extensions/genereti_comfy_p5/js/document-export.js';
import {display} from './inspect-value.js';
app.registerExtension({name:'Genereti.Inspect',nodeCreated(node){
 if(node.comfyClass!=='GeneretiDatInspect')return;ensureControlStyle();
 const surface=document.createElement('div'),tools=document.createElement('div'),body=document.createElement('div'),status=document.createElement('span');surface.style.cssText='width:100%;display:flex;flex-direction:column;gap:4px';tools.className='genereti-node-controls';body.style.cssText='height:220px;min-height:0;overflow:hidden';status.style.cssText='font:11px monospace;opacity:.8';surface.append(tools,body,status);
 visualNodeControls(node,body,tools);
 const appearance=()=>({...editorAppearance(node),readOnly:true,autocomplete:false,hoverDocs:false});
 const editor=createEditor(body,'Connect an input to inspect its value.','javascript',()=>{},()=>{},appearance());editor.dom.style.height='100%';editor.contentDOM.setAttribute('aria-label','Inspected value');
 let frozen=false,text='',queued='',sourceKey='',disposed=false;
 const freeze=document.createElement('button');freeze.textContent='❄';freeze.title='Freeze display only · upstream keeps running';freeze.setAttribute('aria-label',freeze.title);freeze.setAttribute('aria-pressed','false');freeze.onclick=()=>{frozen=!frozen;freeze.setAttribute('aria-pressed',String(frozen));};tools.append(freeze);
 tools.append(documentExportControls(()=>({title:node.title,source:text,mode:'markdown'}),e=>status.textContent=e.message));
 const set=(next,label)=>{status.textContent=frozen?'Frozen display':label;if(frozen||next===text)return;const previous=editor.state.doc.toString();text=next;let from=0,end=previous.length,to=next.length;while(from<end&&from<to&&previous[from]===next[from])from++;while(end>from&&to>from&&previous[end-1]===next[to-1]){end--;to--;}editor.dispatch({changes:{from,to:end,insert:next.slice(from,to)}});};
 const tick=()=>{if(disposed||frozen||document.hidden)return;try{
  let link;try{link=node.getInputLink?.(0);}catch{return;}const upstream=node.graph?.getNodeById(link?.origin_id);const key=link?`${link.origin_id}:${link.origin_slot}`:'';if(key!==sourceKey){sourceKey=key;queued='';}
  if(!upstream){set('Connect an input to inspect its value.','No input');return;}
  const slot=link.origin_slot??0,type=upstream.outputs?.[slot]?.type;
  const scalar=upstream._generetiLiveValue?.(slot);let value=scalar;
  if(value===undefined&&type==='GENERETI_CHOP')value=upstream._generetiChop?.latest??upstream._generetiDatSignal?.()??upstream._generetiMusic?.latest;
  if(value===undefined&&type==='GENERETI_DAT')value=upstream._generetiDat?.latest??upstream._generetiDatTable?.();
  if(value===undefined&&['GENERETI_AUDIO_BUS','GENERETI_AUDIO_CLOCK'].includes(type))value={type,node:upstream.title,parameters:Object.fromEntries(upstream.widgets.filter(w=>['string','number','boolean'].includes(typeof w.value)).map(w=>[w.name,w.value]))};
  if(value===undefined&&['FLOAT','INT','BOOLEAN','STRING'].includes(type))value=upstream.widgets?.find(w=>w.name==='value')?.value;
  if(value===undefined){set(queued||`Connected: ${upstream.title} · ${type}\nQueue to inspect this output.`,queued?'Queued value':'Waiting for queued value');return;}
  set(display(value,node.widgets.find(w=>w.name==='format')?.value,Number(node.widgets.find(w=>w.name==='limit')?.value)||32),'Live value');
 }catch(e){status.textContent=e.message;}};
 body.addEventListener('wheel',e=>{e.stopPropagation();if(e.ctrlKey)e.preventDefault();},{passive:false});surface.addEventListener('pointerdown',e=>e.stopPropagation());
 const unsub=subscribeEditorAppearance(()=>editor.setAppearance(appearance())),font=captureFontShortcut(node,body,()=>editor.setAppearance(appearance()));
 const timer=setInterval(tick,200);const executed=node.onExecuted;node.onExecuted=function(data){const result=executed?.apply(this,arguments);queued=data.genereti_inspect?.[0]??'';set(queued,'Queued value');return result;};
 node._generetiLiveValue=slot=>slot===0?text:undefined;
 const previewWidget=node.addDOMWidget('inspect_display','GENERETI_INSPECT',surface,{serialize:false,hideOnZoom:false});previewWidget.computeSize=w=>[w,260];previewFirst(node,previewWidget);
 const removed=node.onRemoved;node.onRemoved=function(){disposed=true;clearInterval(timer);unsub();font();editor.destroy();return removed?.apply(this,arguments);};
}});
