// One image/time/dimension convention for WebGL 1, WebGL 2 and mainImage code.
export function glslSource(source){
 const gl2=/^\s*#version\s+300\s+es/.test(source);
 if(!/precision\s+(?:lowp|mediump|highp)\s+float\s*;/.test(source))source=source.replace(/^(\s*#version[^\n]*\n)?/,m=>m+'precision highp float;\n');
 const headers=[],declared=new Set();
 const uniform=(name,type)=>{if(!declared.has(name)&&!new RegExp('\\buniform\\s+\\w+\\s+'+name+'\\b').test(source)){headers.push(`uniform ${type} ${name};`);declared.add(name);}};
 for(const [alias,name,type,expression] of [['iTime','u_time','float','u_time'],['iResolution','u_resolution','vec2','vec3(u_resolution,1.0)'],['iMouse','u_mouse','vec2','vec4(u_mouse,0.0,0.0)'],['iChannel0','u_image','sampler2D','u_image']]){
  if(new RegExp('\\b'+alias+'\\b').test(source)&&!new RegExp('\\buniform\\s+\\w+\\s+'+alias+'\\b').test(source)){uniform(name,type);headers.push(`#define ${alias} ${expression}`);}
 }
 uniform('u_image','sampler2D');uniform('u_imageSize','vec2');
 if(/\bvoid\s+mainImage\s*\(/.test(source)&&!/\bvoid\s+main\s*\(/.test(source)){
  let output='gl_FragColor';
  if(gl2){output=/\bout\s+vec4\s+(\w+)\s*;/.exec(source)?.[1]||'generetiColor';if(output==='generetiColor')headers.push('out vec4 generetiColor;');}
  source+=`\nvoid main(){mainImage(${output},gl_FragCoord.xy);}`;
 }
 return source.replace(/precision\s+(?:lowp|mediump|highp)\s+float\s*;/,m=>m+'\n'+headers.join('\n'));
}
