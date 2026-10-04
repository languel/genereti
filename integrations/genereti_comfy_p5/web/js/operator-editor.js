import {app} from '../../../scripts/app.js';
import {ensureControlStyle} from './control-style.js';
import {createEditor,defaultAppearance} from '../lib/editor.mjs?v=c3242bf47c0d6db0';
// Small CodeMirror surface shared by DAT text and TOP/CHOP expressions. Values
// remain ordinary STRING inputs in saved/queued workflows.
app.registerExtension({name:'Genereti.OperatorEditor',getCustomWidgets(){return {
 GENERETI_OPERATOR_TEXT(node,name,inputData){
  ensureControlStyle();let source=inputData?.[1]?.default??'',held=false;node.properties??={};
  const surface=document.createElement('div');surface.style.cssText='display:flex;flex-direction:column;gap:4px;width:100%';surface.className='genereti-operator-editor';
  const tools=document.createElement('div');tools.className='genereti-node-controls';
  const toggle=document.createElement('button');toggle.textContent='▾';toggle.title='Minimize code editor';toggle.setAttribute('aria-label',toggle.title);toggle.setAttribute('aria-expanded','true');tools.append(toggle);
  const run=document.createElement('button');run.textContent='▶';run.title='Apply text · Cmd/Ctrl+Enter';run.setAttribute('aria-label',run.title);tools.append(run);
  const auto=document.createElement('button');auto.textContent='ϟ';auto.title='Apply while typing';auto.setAttribute('aria-label',auto.title);auto.setAttribute('aria-pressed','true');tools.append(auto);
  const fonts=document.createElement('select');fonts.setAttribute('aria-label','Operator font size');for(const n of [11,12,14,16,18])fonts.append(new Option(`${n} px`,String(n)));fonts.value=String(node.properties.generetiOperatorFont??12);tools.append(fonts);
  const code=document.createElement('div');code.style.cssText='height:160px;min-height:0;width:100%;overflow:hidden';surface.append(tools,code);
  let draft=source;const apply=()=>{source=draft;node.setDirtyCanvas?.(true,true);};
  const appearance=()=>({...defaultAppearance,fontSize:Number(fonts.value),fillHeight:true});
  const view=createEditor(code,source,(name==='expression'||name==='guide')?'javascript':node.comfyClass==='GeneretiDatJSON'?'javascript':'markdown',text=>{draft=text;if(!held)apply();},apply,appearance());
  run.onclick=apply;auto.onclick=()=>{held=!held;auto.setAttribute('aria-pressed',String(!held));if(!held)apply();};toggle.onclick=()=>{code.hidden=!code.hidden;toggle.textContent=code.hidden?'▸':'▾';toggle.setAttribute('aria-expanded',String(!code.hidden));node.setSize?.([node.size[0],node.computeSize()[1]]);};fonts.onchange=()=>{node.properties.generetiOperatorFont=Number(fonts.value);view.setAppearance(appearance());};
  code.addEventListener('wheel',event=>{event.preventDefault();event.stopPropagation();if(event.ctrlKey||event.metaKey)return;const k=event.deltaMode===1?Number(fonts.value)*1.55:event.deltaMode===2?view.scrollDOM.clientHeight:1;view.scrollDOM.scrollTop+=(event.shiftKey&&Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY)*k;if(!event.shiftKey)view.scrollDOM.scrollLeft+=event.deltaX*k;},{capture:true,passive:false});
  const widget=node.addDOMWidget(name,'GENERETI_OPERATOR_TEXT',surface,{serialize:true,getValue:()=>source,setValue:value=>{source=draft=String(value??'');if(view.state.doc.toString()!==source)view.replaceDocument(source);}});widget.computeSize=width=>[width,code.hidden?34:198];widget.serializeValue=()=>source;
  const removed=node.onRemoved;node.onRemoved=function(){view.destroy();return removed?.apply(this,arguments);};
  return {widget};
 }
};}});
