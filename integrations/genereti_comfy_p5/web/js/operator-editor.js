import {editorAppearance,subscribeEditorAppearance,captureFontShortcut} from './editor-settings.js';
import {app} from '../../../scripts/app.js';
import {ensureControlStyle} from './control-style.js';
import {captureEditorInput} from './editor-input.js';
import {createEditor,defaultAppearance} from '../lib/editor.mjs?v=ffb57dd5c16bd92c';
// Small CodeMirror surface shared by DAT text and TOP/CHOP expressions. Values
// remain ordinary STRING inputs in saved/queued workflows.
app.registerExtension({name:'Genereti.OperatorEditor',getCustomWidgets(){return {
 GENERETI_OPERATOR_TEXT(node,name,inputData){
  ensureControlStyle();let source=inputData?.[1]?.default??'',held=false;node.properties??={};
  const surface=document.createElement('div');surface.style.cssText='display:flex;flex-direction:column;gap:4px;width:100%';surface.className='genereti-operator-editor';
  const tools=document.createElement('div');tools.className='genereti-node-controls';
  const toggle=document.createElement('button');toggle.textContent='⌄';toggle.title='Minimize code editor';toggle.setAttribute('aria-label',toggle.title);toggle.setAttribute('aria-expanded','true');tools.append(toggle);
  const run=document.createElement('button');run.textContent='▶';run.title=node.comfyClass==='GeneretiDatLesson'?'Run authored lesson · Cmd/Ctrl+Enter':'Apply text · Cmd/Ctrl+Enter';run.setAttribute('aria-label',run.title);tools.append(run);
  const auto=document.createElement('button');auto.textContent='ϟ';auto.title='Apply while typing';auto.setAttribute('aria-label',auto.title);auto.setAttribute('aria-pressed','true');tools.append(auto);
  const code=document.createElement('div');code.style.cssText='height:160px;min-height:0;width:100%;overflow:hidden';surface.append(tools,code);
  let draft=source;const apply=()=>{source=draft;node.setDirtyCanvas?.(true,true);};
  const runAction=()=>{apply();return node._generetiOperatorRun?.();};
  const appearance=()=>({...editorAppearance(node),fillHeight:true});
  const view=createEditor(code,source,(name==='expression'||name==='guide')?'javascript':node.comfyClass==='GeneretiDatJSON'?'javascript':'markdown',text=>{draft=text;if(!held)apply();},runAction,appearance());
  run.onclick=runAction;auto.onclick=()=>{held=!held;auto.setAttribute('aria-pressed',String(!held));if(!held)apply();};toggle.onclick=()=>{code.hidden=!code.hidden;toggle.textContent=code.hidden?'›':'⌄';toggle.setAttribute('aria-expanded',String(!code.hidden));node.setSize?.([node.size[0],node.computeSize()[1]]);};
  const refreshAppearance=()=>view.setAppearance(appearance());
  const releaseAppearance=subscribeEditorAppearance(refreshAppearance),releaseFont=captureFontShortcut(node,surface,refreshAppearance);
  const releaseInput=captureEditorInput(view,appearance);
  const widget=node.addDOMWidget(name,'GENERETI_OPERATOR_TEXT',surface,{serialize:true,getValue:()=>source,setValue:value=>{source=draft=String(value??'');if(view.state.doc.toString()!==source)view.replaceDocument(source);}});widget.computeSize=width=>[width,code.hidden?34:198];widget.serializeValue=()=>source;
  // Restore DOM text explicitly: newer Comfy frontends do not call the
  // DOM widget setter when replaying widgets_values during graph loading.
  const configured=node.onConfigure;node.onConfigure=function(data){configured?.apply(this,arguments);refreshAppearance();const saved=data?.properties?.generetiOperatorText?.[name]??data?.widgets_values?.[node.widgets.indexOf(widget)];if(typeof saved==='string')widget.options.setValue(saved);};
  const serialized=node.onSerialize;node.onSerialize=function(data){serialized?.apply(this,arguments);data.properties??={};data.properties.generetiOperatorText={...data.properties.generetiOperatorText,[name]:source};};
  const removed=node.onRemoved;node.onRemoved=function(){releaseInput();releaseAppearance();releaseFont();view.destroy();return removed?.apply(this,arguments);};
  return {widget};
 }
};}});
