import {parseParameters,parameterValues} from './code-parameters.js';

// V3 Autogrow validates controls.value0..value63 on the backend. Human names
// are socket labels; stable indexed ids keep wires intact when source is edited.
export function codeParameters(node,onChange){
 let definitions=[],widgets=new Map(),syncing=false,queuedControls={};
 const saved=()=>node.properties.generetiLivecodeParameters??={values:{},slots:{}};
 function read(){const state=saved();return parameterValues(definitions,state.values);}
 function current(){const values=read(),state=saved();for(const p of definitions){const override=node._generetiPerformanceValues?.[`controls.value${state.slots[p.name]}`];if(override!==undefined)values[p.name]=override;}for(const p of definitions){const id=`controls.value${state.slots[p.name]}`,idx=node.inputs.findIndex(i=>i.name===id),link=idx>=0?node.getInputLink?.(idx):null;if(!link)continue;const upstream=node.graph?.getNodeById(link.origin_id);const widget=upstream?.widgets?.find(w=>w.name==='value');if(['PrimitiveFloat','PrimitiveInt','PrimitiveBoolean','PrimitiveString','PrimitiveNode'].includes(upstream?.comfyClass||upstream?.type)&&widget)values[p.name]=widget.value;else if(upstream?._generetiLiveValue?.(link.origin_slot)!==undefined)values[p.name]=upstream._generetiLiveValue(link.origin_slot);else if(Object.hasOwn(queuedControls,`value${state.slots[p.name]}`))values[p.name]=queuedControls[`value${state.slots[p.name]}`];}return parameterValues(definitions,values);}
 function update(source){
  syncing=true;definitions=parseParameters(source);const state=saved();state.values??={};state.slots??={};const activeNames=new Set(definitions.map(p=>p.name));for(const name of Object.keys(state.slots))if(!activeNames.has(name)||!Number.isInteger(state.slots[name])||state.slots[name]<0||state.slots[name]>=64)delete state.slots[name];
  for(const p of definitions)if(state.slots[p.name]===undefined){const used=new Set(Object.values(state.slots));const slot=Array.from({length:64},(_,i)=>i).find(i=>!used.has(i));if(slot!==undefined)state.slots[p.name]=slot;}
  const names=new Set(definitions.map(p=>p.name));
  for(const [name,widget] of widgets)if(!names.has(name)){node.widgets.splice(node.widgets.indexOf(widget),1);widgets.delete(name);}
  for(let i=(node.inputs?.length||0)-1;i>=0;i--){const input=node.inputs[i];if(input.name==='controls'||(input.name.startsWith('controls.')&&!definitions.some(p=>input.name===`controls.value${state.slots[p.name]}`)))node.removeInput(i);}
  const values=read();
  for(const p of definitions){const id=`controls.value${state.slots[p.name]}`,type=p.type==='boolean'?'BOOLEAN':p.type==='string'?'STRING':p.type==='int'?'INT':'FLOAT';
   let input=node.inputs.find(i=>i.name===id);if(!input){node.addInput(id,type,{label:p.name});input=node.inputs.at(-1);}if(input.type!==type&&input.link!=null)node.disconnectInput(node.inputs.indexOf(input));input.type=type;input.label=p.name;
   let widget=widgets.get(p.name);if(widget&&widget._paramType!==p.type){node.widgets.splice(node.widgets.indexOf(widget),1);widgets.delete(p.name);widget=null;}
   if(!widget){const shim=node.widgets.find(w=>w.name===id&&w.type==='shim');if(shim)node.widgets.splice(node.widgets.indexOf(shim),1);widget=node.widgets.find(w=>w.name===id)||node.addWidget(p.type==='boolean'?'toggle':p.type==='string'?'text':'number',id,values[p.name],v=>{saved().values[p.name]=v;onChange(current());},{serialize:false,min:p.min,max:p.max,step:p.step*10,precision:p.type==='int'?0:Math.min(8,Math.max(0,-Math.floor(Math.log10(p.step)))),tooltip:`Code parameter: ${p.name}. Connected ${type} overrides this value when queued.`});widget._paramType=p.type;widgets.set(p.name,widget);}
   widget.label=p.name;input.widget={name:id};
   widget.callback=v=>{saved().values[p.name]=v;onChange(current());};
   widget.value=values[p.name];widget.options={...widget.options,serialize:false,min:p.min,max:p.max,step:p.step*10};
   // Keep code last, beneath all regular controls.
   node.widgets.splice(node.widgets.indexOf(widget),1);const editor=node.widgets.findIndex(w=>w.name==='code');node.widgets.splice(editor<0?node.widgets.length:editor,0,widget);
  }
  const hidden=node.widgets.find(w=>w.name==='parameters');if(hidden)hidden.value=JSON.stringify(read());
  syncing=false;node.setDirtyCanvas?.(true,true);requestAnimationFrame(()=>node.onResize?.(node.size));
 }
 function connected(overrides={}){queuedControls=overrides;const values=read(),state=saved();for(const p of definitions){const key=`value${state.slots[p.name]}`;if(Object.hasOwn(overrides,key))values[p.name]=overrides[key];}return parameterValues(definitions,values);}
 return {update,read,current,connected,get definitions(){return definitions},serialize(){return JSON.stringify(read());},get syncing(){return syncing}};
}
