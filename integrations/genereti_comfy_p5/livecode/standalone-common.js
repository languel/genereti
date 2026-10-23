import {parseParameters,parameterValues,prepareParameterSource} from '../web/js/code-parameters.js';
export function standaloneContext(){
 const data=window.__GENERETI_EXPORT__,definitions=parseParameters(data.source);
 const inputCanvas=document.createElement('canvas');inputCanvas.width=inputCanvas.height=1;
 const bridge=window.__={params:parameterValues(definitions,data.parameters),render:data.render,inputSize:{width:0,height:0},image:inputCanvas,streams:{list:()=>[],read:()=>null},regions:{list:()=>[],read:()=>null},events:{on:()=>()=>{}},controls:{},time:0,delta:0,playing:true,bpm:120};
 for(const [name,value] of Object.entries(bridge.params))window[name]=value;
 window.inputImage=null;
 return {data,definitions,bridge,inputCanvas,source:prepareParameterSource(data.source,data.mode,definitions)};
}
export function animate(runtime,bridge){const start=performance.now();let previous=start;document.body.append(runtime.canvas||runtime.root);function paint(now){bridge.time=(now-start)/1000;bridge.delta=(now-previous)/1000;previous=now;runtime.paint?.(bridge.time);requestAnimationFrame(paint);}requestAnimationFrame(paint);window.addEventListener('pagehide',()=>runtime.dispose?.(),{once:true});}
