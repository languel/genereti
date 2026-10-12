import {parseParameters,parameterValues,prepareParameterSource} from './code-parameters.js';
const safe=s=>String(s).replace(/<\/script/gi,'<\\/script');
export const standaloneModes=['p5','glsl','tixy','playcore','orca','three','manim','html','svg','hyperframes','markdown','latex'];
export function standaloneHTML({source,mode,parameters={},render={width:512,height:512},appearance={},renderer='',extras=''}) {
 if(!standaloneModes.includes(mode))throw Error(`${mode} standalone export is unavailable`);
 const values=parameterValues(parseParameters(source),parameters);
 const config={source,mode,parameters:values,render,appearance};
 const data=JSON.stringify(config).replaceAll('<','\\u003c');
 if(mode==='html'||mode==='svg'){
  const interpolated=source.replace(/\{\{\s*(params\.\w+|render\.(?:width|height)|inputSize\.(?:width|height))\s*\}\}/g,(_,path)=>{const [group,key]=path.split('.');return String((group==='params'?values:group==='render'?render:{width:0,height:0})[key]??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));});
  const bridge=`<script>window.__={params:${JSON.stringify(values).replaceAll('<','\\u003c')},render:${JSON.stringify(render)},inputSize:{width:0,height:0},streams:{read:()=>null,list:()=>[]},events:{on:()=>()=>{}}};window.inputImage=null;</script>`;
  if(mode==='html'){
   if(/<head(?:\s[^>]*)?>/i.test(interpolated))return interpolated.replace(/<head(?:\s[^>]*)?>/i,m=>m+bridge);
   return `<!doctype html><meta charset="utf-8">${bridge}${interpolated}`;
  }
  return `<!doctype html><meta charset="utf-8"><style>html,body{margin:0}svg{display:block;max-width:100%;height:auto}</style>${interpolated}`;
 }
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Genereti ${mode}</title><style>html,body{margin:0;background:#111;color:#eee}canvas{display:block;max-width:100%;height:auto}</style></head><body><script>window.__GENERETI_EXPORT__=${data}</script><script>${safe(extras)}</script><script>${safe(renderer)}</script></body></html>`;
}
