import {hoverTooltip} from '@codemirror/view';
import {syntaxTree} from '@codemirror/language';
let worker,serial=0;const requests=new Map();
function ask(data){
 if(!worker){worker=new Worker('/extensions/genereti_comfy_p5/lib/language-worker.mjs',{type:'module'});worker.onmessage=({data})=>{const request=requests.get(data.id);if(!request)return;clearTimeout(request.timeout);requests.delete(data.id);data.error?request.reject(Error(data.error)):request.resolve(data.result);};worker.onerror=()=>{for(const r of requests.values()){clearTimeout(r.timeout);r.reject(Error('Language service unavailable'));}requests.clear();worker.terminate();worker=null;};}
 return new Promise((resolve,reject)=>{const id=++serial,timeout=setTimeout(()=>{requests.delete(id);reject(Error('Language service timed out'));},15000);requests.set(id,{resolve,reject,timeout});worker.postMessage({...data,id});});
}
function excluded(state,pos){const token=syntaxTree(state).resolveInner(pos,-1);return /Comment|String|RegExp/i.test(token.name);}
export function semanticCompletion(mode){return async context=>{
 if(excluded(context.state,context.pos))return null;
 const word=context.matchBefore(/[\w$]+/),before=context.state.sliceDoc(0,context.pos),member=/\.\s*[\w$]*$/.test(before);
 if(!context.explicit&&!word&&!member)return null;
 const source=context.state.doc.toString(),pos=context.pos;
 try{const options=await ask({mode,source,pos});if(context.aborted||!options.length)return null;return {from:word?.from??pos,options:options.map(option=>({...option,info:async()=>{const detail=await ask({mode,source,pos,operation:'detail',name:option.label});const element=document.createElement('div');element.style.cssText='white-space:pre-wrap;max-width:420px';element.textContent=detail?`${detail.signature}\n\n${detail.description}`:option.label;return element;}})),validFor:/^[\w$]*$/};}catch{return null;}
};}
export function semanticHover(mode){return hoverTooltip(async(view,pos)=>{
 if(excluded(view.state,pos))return null;try{const info=await ask({mode,source:view.state.doc.toString(),pos,operation:'hover'});if(!info)return null;return {pos:info.from,end:info.to,above:true,create:()=>{const dom=document.createElement('div');dom.style.cssText='padding:6px 8px;white-space:pre-wrap;max-width:420px';dom.textContent=`${info.signature}\n\n${info.description}`;return {dom};}};}catch{return null;}
},{hoverTime:350});}
// GLSL declarations are typed explicitly, so completion can offer variables,
// user functions, struct fields and vector swizzles without a JS language server.
const glslTypes='float int bool void vec2 vec3 vec4 ivec2 ivec3 ivec4 bvec2 bvec3 bvec4 mat2 mat3 mat4 sampler2D samplerCube';
const glslFunctions={mix:'mix(x, y, amount)',smoothstep:'smoothstep(edge0, edge1, x)',clamp:'clamp(x, minValue, maxValue)',dot:'dot(x, y)',cross:'cross(x, y)',normalize:'normalize(x)',length:'length(x)',distance:'distance(p0, p1)',reflect:'reflect(I, N)',refract:'refract(I, N, eta)',texture2D:'texture2D(sampler, uv, bias?)',textureCube:'textureCube(sampler, direction, bias?)',atan:'atan(y, x?)',pow:'pow(x, exponent)',mod:'mod(x, divisor)'};
const builtinWords='radians degrees sin cos tan asin acos exp log exp2 log2 sqrt inversesqrt abs sign floor ceil fract min max step faceforward matrixCompMult lessThan lessThanEqual greaterThan greaterThanEqual equal notEqual any all not dFdx dFdy fwidth';
export function glslCompletion(context){
 if(excluded(context.state,context.pos))return null;
 const word=context.matchBefore(/[\w]+/),before=context.state.sliceDoc(0,context.pos),member=before.match(/\b(\w+)\.([\w]*)$/);
 if(!context.explicit&&!word&&!member)return null;
 const source=context.state.doc.toString().replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,s=>' '.repeat(s.length));
 const structures=new Map();for(const match of source.matchAll(/\bstruct\s+(\w+)\s*\{([^}]+)\}/g)){structures.set(match[1],[...match[2].matchAll(/\b(\w+)\s+(\w+)\s*[;\[]/g)].map(m=>({label:m[2],type:'property',detail:m[1]})));}
 const declarations=new Map();const typePattern=[...glslTypes.split(' '),...structures.keys()].join('|');for(const match of source.slice(0,context.pos).matchAll(new RegExp(`\\b(${typePattern})\\s+(\\w+)\\s*([(;=,\\[])?`,'g')))declarations.set(match[2],{label:match[2],type:match[3]==='('?'function':'variable',detail:match[1]});
 // Runtime uniforms and fragment builtins remain available without declarations.
 for(const [name,type] of [['u_resolution','vec2'],['u_mouse','vec2'],['u_time','float'],['gl_FragCoord','vec4'],['gl_FragColor','vec4'],['gl_PointCoord','vec2']])if(!declarations.has(name))declarations.set(name,{label:name,type:'variable',detail:type});
 let options;
 if(member){const type=declarations.get(member[1])?.detail,size=Number(type?.match(/vec([234])/)?.[1]);options=structures.get(type)||[];if(size){options=[];for(const alphabet of ['xyzw','rgba','stpq']){const letters=alphabet.slice(0,size);for(const c of letters)options.push({label:c,type:'property',detail:'float'});for(const n of [2,3,4]){const add=prefix=>{if(prefix.length===n){options.push({label:prefix,type:'property',detail:'vec'+n});return;}for(const c of letters)add(prefix+c);};add('');}}}}
 else options=[...declarations.values(),...glslTypes.split(' ').map(label=>({label,type:'type'})),...'uniform varying const attribute precision highp mediump lowp if else for while return discard struct in out inout true false'.split(' ').map(label=>({label,type:'keyword'})),...Object.entries(glslFunctions).map(([label,detail])=>({label,type:'function',detail,info:detail})),...builtinWords.split(' ').map(label=>({label,type:'function',detail:label+'(x)'}))];
 return {from:member?context.pos-member[2].length:word?.from??context.pos,options,validFor:/^\w*$/};
}
