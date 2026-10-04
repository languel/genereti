// Source annotations, following Artist–Model Studio's range comments and
// Underscores' @param declarations. This parser never evaluates source.
const number='[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][-+]?\\d+)?';
const identifier='[A-Za-z_$][\\w$]*';
const rangePattern=new RegExp(`(${number})\\s*\\.\\.\\s*(${number})(?:\\s*,?\\s*step\\s*:?\\s*(${number}))?`);
const reserved=new Set(['__','inputImage','inputTexture','windowWidth','windowHeight','width','height','u_image','u_imageSize','u_resolution','u_time','u_mouse','constructor','prototype','__proto__','window','document','parent','p5','THREE','MANIM','scene','cue','katex','fetch','requestAnimationFrame','createImageBitmap']);

export function parseParameters(source) {
 const parameters=[],seen=new Set();let offset=0;
 for(const line of String(source).split('\n')){
  const annotation=new RegExp(`^\\s*(?://|<!--)\\s*@param\\s+(${identifier})\\s*=\\s*(.*?)\\s*(?:\\(([^)]*)\\))?\\s*(?:-->)?\\s*$`).exec(line);
  const inline=new RegExp(`^\\s*(?:(uniform)\\s+)?(float|int|bool|let|const|var)\\s+(${identifier})\\s*=\\s*(${number}|true|false)\\s*;?\\s*/\\*\\s*([^*]+)\\*/\\s*;?\\s*$`).exec(line);
  let name,raw,spec,kind,from,to;
  if(annotation){[,name,raw,spec]=annotation;kind='annotation';}
  else if(inline){name=inline[3];raw=inline[4];spec=inline[5];kind=inline[2];from=offset;to=offset+line.length;}
  offset+=line.length+1;
  if(!name||reserved.has(name)||seen.has(name))continue;
  const range=rangePattern.exec(spec||'');let type,initial;
  if(/^(true|false)$/.test(raw)){type='boolean';initial=raw==='true';}
  else if(new RegExp(`^${number}$`).test(raw)){type=kind==='int'||/^int\b/.test(spec||'')?'int':'float';initial=Number(raw);}
  else if(/^(string|text|color)$/.test(spec||'')){type='string';initial=raw.replace(/^(['"])(.*)\1$/,'$2');}
  else continue;
  if(inline&&!range&&type!=='boolean')continue;
  const min=range?Number(range[1]):Math.min(0,initial-1),max=range?Number(range[2]):Math.max(1,initial*2);
  if(type!=='string'&&type!=='boolean'&&(!Number.isFinite(initial)||!(max>min)))continue;
  const step=type==='int'?1:range?.[3]?Number(range[3]):Math.pow(10,Math.floor(Math.log10(max-min))-2);
  parameters.push({name,type,default:initial,min,max,step:step>0?step:.01,kind,from,to});seen.add(name);
  if(parameters.length===64)break;
 }
 return parameters;
}

export function parameterValues(definitions,overrides={}) {
 const values=Object.create(null);
 for(const p of definitions){let v=Object.hasOwn(overrides,p.name)?overrides[p.name]:p.default;
  if(p.type==='string')v=String(v);
  else if(p.type==='boolean')v=typeof v==='boolean'?v:p.default;
  else {v=Number(v);if(!Number.isFinite(v))v=p.default;v=Math.max(p.min,Math.min(p.max,v));if(p.type==='int')v=Math.round(v);}
  values[p.name]=v;
 }
 return values;
}

export function prepareParameterSource(source,mode,definitions=parseParameters(source)) {
 let result=source;
 for(const p of [...definitions].reverse())if(p.from!==undefined){const replacement=mode==='glsl'?`uniform ${p.type==='boolean'?'bool':p.type==='int'?'int':'float'} ${p.name};`:`/* live parameter: ${p.name} */`;result=result.slice(0,p.from)+replacement+result.slice(p.to);}
 if(mode==='glsl'){
  const declarations=[];
  for(const p of definitions){if(p.type==='string')continue;if(!new RegExp(`\\buniform\\s+\\w+\\s+${p.name}\\b`).test(result))declarations.push(`uniform ${p.type==='boolean'?'bool':p.type==='int'?'int':'float'} ${p.name};`);}
  // Put injected declarations after the float precision required by WebGL 1.
  const precision=/precision\s+(?:lowp|mediump|highp)\s+float\s*;/;
  const qualifier=result.match(precision)?.[0]||'precision mediump float;';result=result.replace(precision,'');const header=qualifier+'\n'+declarations.join('\n')+'\n';result=/^\s*#version[^\n]*\n/.test(result)?result.replace(/^(\s*#version[^\n]*\n)/,m=>m+header):header+result;
 }
 return result;
}
