import {codeParameters} from '/extensions/genereti_comfy_p5/js/livecode-parameters.js';
import {parseExpressionParameters,prepareExpression} from './expression-parameters.js';
export function attachExpressionParameters(node){
 const editor=node.widgets?.find(w=>w.name==='expression');if(!editor)return;
 const params=codeParameters(node,()=>node.setDirtyCanvas?.(true,true),{parse:parseExpressionParameters,editorName:'expression',property:'generetiExpressionParameters'});
 node._generetiExpressionParameters=params;
 let source,sourceError,preparedKey,prepared,configuring=false;
 node._generetiExpressionValues=()=>{if(!configuring&&source!==editor.value){source=editor.value;sourceError=undefined;preparedKey=undefined;try{params.update(editor.value);delete node._generetiExpressionError;}catch(error){sourceError=error;}}if(sourceError)throw sourceError;const current=params.current();if(node.comfyClass==='GeneretiTextureExpression')return {source:editor.value,values:params.definitions.map(p=>current[p.name])};const key=JSON.stringify([editor.value,current]);if(key!==preparedKey){prepared=prepareExpression(editor.value,current);preparedKey=key;}return prepared;};
 const hidden=node.widgets.find(w=>w.name==='parameters');
 if(hidden){hidden.type='hidden';hidden.options={...hidden.options,hidden:true};hidden.computeSize=()=>[0,-4];hidden.serializeValue=()=>{node._generetiExpressionValues();return JSON.stringify({values:params.read(),slots:node.properties.generetiExpressionParameters.slots});};}
 const callback=editor.callback;editor.callback=function(){source=undefined;if(configuring)return callback?.apply(this,arguments);try{node._generetiExpressionValues();}catch(error){node._generetiExpressionError=error.message;}return callback?.apply(this,arguments);};
 const configure=node.configure;
 node.configure=function(info){
  configuring=true;
  try{return configure?.apply(this,arguments);}
  finally{
   configuring=false;
   // Positional widget arrays predate dynamic controls. Restore ordinary widgets
   // by name after Comfy configures them, before rebuilding parameter controls.
   for(const widget of node.widgets){if(info.widgets_values_named&&Object.hasOwn(info.widgets_values_named,widget.name)&&!widget.name.startsWith('controls.'))widget.value=info.widgets_values_named[widget.name];}
   source=undefined;try{node._generetiExpressionValues();}catch(error){node._generetiExpressionError=error.message;}
  }
 };
 // Editors and stored node properties finish loading before dynamic controls.
 requestAnimationFrame(()=>{try{node._generetiExpressionValues();}catch(error){node._generetiExpressionError=error.message;}});
}
