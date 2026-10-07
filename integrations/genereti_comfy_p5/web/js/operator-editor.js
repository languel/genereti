import {editorAppearance,subscribeEditorAppearance,captureFontShortcut} from './editor-settings.js';
import {app} from '../../../scripts/app.js';
import {ensureControlStyle} from './control-style.js';
import {captureEditorInput} from './editor-input.js';
import {createEditor,defaultAppearance} from '../lib/editor.mjs?v=b6ff352abf50e6b1';
// Small CodeMirror surface shared by DAT text and TOP/CHOP expressions. Values
// remain ordinary STRING inputs in saved/queued workflows.
app.registerExtension({name:'Genereti.OperatorEditor',getCustomWidgets(){return {
 GENERETI_OPERATOR_TEXT(node,name,inputData){
  ensureControlStyle();let source=inputData?.[1]?.default??'',held=false;node.properties??={};
  const surface=document.createElement('div');surface.style.cssText='display:flex;flex-direction:column;gap:4px;width:100%';surface.className='genereti-operator-editor';
  const tools=document.createElement('div');tools.className='genereti-node-controls';
  const toggle=document.createElement('button');toggle.textContent='⌄';toggle.title='Minimize code editor';toggle.setAttribute('aria-label',toggle.title);toggle.setAttribute('aria-expanded','true');tools.append(toggle);
  const run=document.createElement('button');run.textContent='▶';run.title=node.comfyClass==='GeneretiDatLesson'?'Run authored lesson · Cmd/Ctrl+Enter':'Apply text · Cmd/Ctrl+Enter';run.setAttribute('aria-label',run.title);tools.append(run);
  const auto=document.createElement('button');auto.innerHTML='<span class="genereti-lightning" aria-hidden="true">ϟ</span>';auto.title='Apply while typing';auto.setAttribute('aria-label',auto.title);auto.setAttribute('aria-pressed','true');tools.append(auto);
  const code=document.createElement('div');code.style.cssText='height:160px;min-height:0;width:100%;overflow:hidden';surface.append(tools,code);
  let editorHeight=160;
  const divider=document.createElement('div');divider.tabIndex=0;divider.setAttribute('role','separator');divider.setAttribute('aria-label','Code / output split');divider.setAttribute('aria-orientation','horizontal');divider.setAttribute('aria-valuemin','64');divider.setAttribute('aria-valuemax','1200');divider.title='Drag to resize code / output · arrows to adjust · double click to reset';divider.style.cssText='height:6px;min-height:6px;flex-shrink:0;border-top:1px solid var(--border-color,#555);cursor:row-resize;touch-action:none';surface.append(divider);
  function resizeEditor(next,persist=true){editorHeight=Math.max(64,Math.min(1200,Number(next)||160));code.style.height=editorHeight+'px';divider.setAttribute('aria-valuenow',String(Math.round(editorHeight)));if(persist){node.properties.generetiOperatorHeights={...node.properties.generetiOperatorHeights,[name]:editorHeight};if(node.size&&node.computeSize)node.setSize?.([node.size[0],Math.max(node.size[1],node.computeSize()[1])]);node.setDirtyCanvas?.(true,true);}}
  let drag;divider.onpointerdown=event=>{event.preventDefault();event.stopPropagation();drag={y:event.clientY,height:editorHeight,scale:code.getBoundingClientRect().height/editorHeight||1};divider.setPointerCapture(event.pointerId);};divider.onpointermove=event=>{if(!drag)return;event.preventDefault();event.stopPropagation();resizeEditor(drag.height+(event.clientY-drag.y)/drag.scale);};divider.onpointerup=divider.onpointercancel=event=>{event.stopPropagation();drag=null;};divider.ondblclick=event=>{event.preventDefault();event.stopPropagation();resizeEditor(160);};divider.onkeydown=event=>{if(!['ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();event.stopPropagation();resizeEditor(editorHeight+(event.key==='ArrowUp'?-16:16));};
  resizeEditor(node.properties.generetiOperatorHeights?.[name],false);
  let draft=source;const apply=()=>{source=draft;node.setDirtyCanvas?.(true,true);};
  const runAction=()=>{apply();return node._generetiOperatorRun?.();};
  const appearance=()=>({...editorAppearance(node),fillHeight:true});
  const view=createEditor(code,source,(name==='expression'||name==='guide')?'javascript':node.comfyClass==='GeneretiDatJSON'?'javascript':'markdown',text=>{draft=text;if(!held)apply();},runAction,appearance());
  run.onclick=runAction;auto.onclick=()=>{held=!held;auto.setAttribute('aria-pressed',String(!held));if(!held)apply();};toggle.onclick=()=>{code.hidden=!code.hidden;divider.hidden=code.hidden;toggle.textContent=code.hidden?'›':'⌄';toggle.setAttribute('aria-expanded',String(!code.hidden));node.setSize?.([node.size[0],node.computeSize()[1]]);};
  const refreshAppearance=()=>view.setAppearance(appearance());
  const releaseAppearance=subscribeEditorAppearance(refreshAppearance),releaseFont=captureFontShortcut(node,surface,refreshAppearance);
  const releaseInput=captureEditorInput(view,appearance);
  const widget=node.addDOMWidget(name,'GENERETI_OPERATOR_TEXT',surface,{serialize:true,getValue:()=>source,setValue:value=>{source=draft=String(value??'');if(view.state.doc.toString()!==source)view.replaceDocument(source);}});widget.computeSize=width=>[width,code.hidden?34:editorHeight+48];widget.serializeValue=()=>source;
  // Restore DOM text explicitly: newer Comfy frontends do not call the
  // DOM widget setter when replaying widgets_values during graph loading.
  const configured=node.onConfigure;node.onConfigure=function(data){configured?.apply(this,arguments);refreshAppearance();resizeEditor(data?.properties?.generetiOperatorHeights?.[name]??node.properties.generetiOperatorHeights?.[name],false);const saved=data?.properties?.generetiOperatorText?.[name]??data?.widgets_values?.[node.widgets.indexOf(widget)];if(typeof saved==='string')widget.options.setValue(saved);};
  const serialized=node.onSerialize;node.onSerialize=function(data){serialized?.apply(this,arguments);data.properties??={};data.properties.generetiOperatorHeights={...data.properties.generetiOperatorHeights,[name]:editorHeight};data.properties.generetiOperatorText={...data.properties.generetiOperatorText,[name]:source};};
  const removed=node.onRemoved;node.onRemoved=function(){releaseInput();releaseAppearance();releaseFont();view.destroy();return removed?.apply(this,arguments);};
  return {widget};
 }
};}});
