import {build as esbuild} from 'esbuild';
import {recordBrowserLicenses} from './browser_licenses.mjs';
const licenseMetas=[];
async function build(options){const result=await esbuild({...options,metafile:true});licenseMetas.push(result.metafile);return result;}
import {createHash} from 'node:crypto';
import {mkdir,copyFile,rm,readdir,readFile,writeFile} from 'node:fs/promises';
const mathAssets={name:'local-math-fonts',setup(build){
 build.onResolve({filter:/^genereti:math-css$/},()=>({path:'math-css',namespace:'math'}));
 build.onLoad({filter:/.*/,namespace:'math'},async()=>{
  let css=await readFile('node_modules/katex/dist/katex.min.css','utf8');
  // Chromium supports WOFF2; inline fonts so opaque sandboxed iframes and DOM
  // snapshots need neither network access nor cross-origin font permissions.
  css=css.replace(/,url\(fonts\/[^)]+\.(?:woff|ttf)\) format\("[^"]+"\)/g,'');
  for(const match of [...css.matchAll(/url\((fonts\/[^)]+)\)/g)]){
   const data=await readFile('node_modules/katex/dist/'+match[1]);
   css=css.replace(match[0],`url(data:font/woff2;base64,${data.toString('base64')})`);
  }
  return {contents:`export default ${JSON.stringify(css)}`,loader:'js'};
 });
}};
const captureDecode={name:'offscreen-dom-capture',setup(build){
 build.onLoad({filter:/html-to-image\/es\/util\.js$/},async({path})=>{
  const source=await readFile(path,'utf8');
  const before='img.decode().then(() => {\n                requestAnimationFrame(() => resolve(img));\n            });';
  if(!source.includes(before))throw Error('html-to-image decode contract changed; update the offscreen capture patch.');
  // A decoded image can already be drawn. A subsequent rAF may never fire in
  // an offscreen sandbox, leaving Queue/candidate compilation stuck forever.
  return {contents:source.replace(before,'img.decode().then(() => resolve(img), reject);'),loader:'js'};
 });
}};
const aliases={};
const out='integrations/genereti_comfy_p5/web/lib';await mkdir(out,{recursive:true});
for(const name of ['runtime.js','runtime.js.LEGAL.txt','editor.js','editor.js.LEGAL.txt'])await rm(`${out}/${name}`,{force:true});
await build({entryPoints:['integrations/genereti_comfy_p5/livecode/editor.js'],outfile:`${out}/editor.mjs`,alias:aliases,bundle:true,minify:true,format:'esm',legalComments:'linked',target:'es2022'});
await build({entryPoints:['integrations/genereti_comfy_p5/livecode/runtime.js'],outfile:`${out}/runtime.txt`,alias:aliases,plugins:[mathAssets,captureDecode],bundle:true,minify:true,format:'iife',legalComments:'linked',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
await build({entryPoints:['integrations/genereti_comfy_p5/livecode/document.js'],outfile:`${out}/document.mjs`,plugins:[mathAssets],bundle:true,minify:true,format:'esm',legalComments:'linked',target:'es2022'});
// Large mathematical animation dependencies are loaded only for Manim nodes.
await build({entryPoints:['integrations/genereti_comfy_p5/livecode/manim-library.js'],outfile:`${out}/manim.txt`,bundle:true,minify:true,format:'iife',legalComments:'linked',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
await copyFile('node_modules/katex/LICENSE',`${out}/katex-LICENSE`);
await copyFile('node_modules/manim-web/LICENSE',`${out}/manim-web-LICENSE`);
for(const [pkg,file] of [['@mathjax/src','LICENSE'],['opentype.js','LICENSE'],['earcut','LICENSE'],['polygon-clipping','LICENSE.md']])await copyFile(`node_modules/${pkg}/${file}`,`${out}/${pkg.replaceAll('/','-')}-LICENSE`);
await copyFile('integrations/genereti_comfy_p5/livecode/UNDERSCORES-LICENSE',`${out}/UNDERSCORES-LICENSE`);
await copyFile('integrations/genereti_comfy_p5/livecode/THIRD-PARTY-NOTICES.md',`${out}/THIRD-PARTY-NOTICES.md`);
await build({entryPoints:['integrations/genereti_comfy_p5/livecode/formatter.js'],outfile:`${out}/formatter.mjs`,bundle:true,minify:true,format:'esm',legalComments:'linked',target:'es2022'});
await build({entryPoints:['integrations/genereti_comfy_p5/livecode/project-zip.js'],outfile:`${out}/project-zip.mjs`,bundle:true,minify:true,format:'esm',legalComments:'linked',target:'es2022'});
for(const [from,to] of [
 ['p5/lib/p5.min.js','p5-2.min.js'],['p5/license.txt','p5-2-LICENSE'],
 ['p5-v1/license.txt','p5-1-LICENSE'],['p5.sound/dist/p5.sound.min.js','p5.sound.min.js'],['p5.sound/LICENSE','p5.sound-LICENSE'],
 ['p5.brush/dist/p5.brush.js','p5.brush.js'],['p5.brush/LICENSE.md','p5.brush-LICENSE']])await copyFile('node_modules/'+from,`${out}/${to}`);
await copyFile('node_modules/p5-v1/lib/p5.min.js','integrations/genereti_comfy_p5/web/p5.min.js');
// Standalone exports bundle only their selected renderer, not the preview host.
for(const mode of ['glsl','three','tixy','playcore','orca','manim','hyperframes']){
 const setup=mode==='glsl'?"import {glslRuntime as engine} from './standalone-glsl.js';const runtime=engine(source,bridge,definitions,inputCanvas);":mode==='three'?"import {threeRuntime as engine} from './standalone-three.js';const runtime=engine(source,bridge,inputCanvas);":mode==='manim'?"import {manimRuntime as engine} from './manim-runtime.js';const runtime=await engine(source,bridge,(type,detail)=>{if(type==='error')console.error(detail.message)});if(bridge.params.stepThrough){const button=document.createElement('button');button.textContent='Next cue';button.onclick=()=>runtime.next();document.body.append(button);}":mode==='hyperframes'?"import {compositionClock} from './composition-clock.js';const root=document.createElement('main');root.innerHTML=source;document.body.append(root);const clock=compositionClock(bridge);for(const script of root.querySelectorAll('script')){const next=document.createElement('script');for(const attr of script.attributes)next.setAttribute(attr.name,attr.value);next.textContent=script.textContent;script.replaceWith(next);}const runtime={root,paint:clock.paint,dispose:clock.dispose};":`import {${mode}Runtime as engine} from './grid-runtimes.js';const runtime=engine(source,bridge);`;
 await build({stdin:{contents:`import {standaloneContext,animate} from './standalone-common.js';${setup.match(/import[^;]+;/g)?.join('')||''}async function start(){const {data,definitions,bridge,inputCanvas,source}=standaloneContext();${setup.replace(/import[^;]+;/g,'')}animate(runtime,bridge);}start();`,resolveDir:'integrations/genereti_comfy_p5/livecode',sourcefile:`export-${mode}.js`},outfile:`${out}/export-${mode}.txt`,bundle:true,minify:true,format:'iife',legalComments:'inline',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
}
const typeFiles={};
async function collectTypes(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const path=directory+'/'+entry.name;if(entry.isDirectory())await collectTypes(path);else if(entry.name.endsWith('.d.ts')||entry.name==='package.json')typeFiles['/'+path]=await readFile(path,'utf8');}}
for(const dir of ['typescript/lib','@types/p5','@types/three','@types/webxr','@types/stats.js','fflate','meshoptimizer','@tweenjs/tween.js'])await collectTypes('node_modules/'+dir);
await writeFile(`${out}/language-types.json`,JSON.stringify(typeFiles));
await build({entryPoints:['integrations/genereti_comfy_p5/livecode/language-worker.js'],outfile:`${out}/language-worker.mjs`,bundle:true,minify:true,format:'esm',platform:'browser',external:['fs','path','os','crypto','buffer','inspector','perf_hooks','source-map-support'],legalComments:'linked',target:'es2022'});
for(const [pkg,file] of [['typescript','LICENSE.txt'],['@types/p5','LICENSE'],['@types/three','LICENSE'],['@types/webxr','LICENSE'],['@types/stats.js','LICENSE'],['fflate','LICENSE'],['meshoptimizer','LICENSE.md'],['@tweenjs/tween.js','LICENSE'],['prettier','LICENSE'],['terser','LICENSE'],['three','LICENSE'],['html-to-image','LICENSE'],['marked','LICENSE.md'],['dompurify','LICENSE'],['codemirror','LICENSE']])await copyFile(`node_modules/${pkg}/${file}`,`${out}/${pkg.replaceAll('/','-')}-LICENSE`);

// Version the large bundles so a running Comfy server's compressed response
// cache cannot keep an old editor/runtime after rebuilding this node pack.
const digest=createHash('sha256');
for(const file of ['editor.mjs','runtime.txt','formatter.mjs','manim.txt'])digest.update(await readFile(`${out}/${file}`));
const version=digest.digest('hex').slice(0,16);
const entry='integrations/genereti_comfy_p5/web/js/livecode.js';
const entrySource=await readFile(entry,'utf8');
await writeFile(entry,entrySource.replace(/editor\.mjs\?v=[^']+/,`editor.mjs?v=${version}`).replace(/const LIBRARY_VERSION='[^']+';/,`const LIBRARY_VERSION='${version}';`));

const operatorEditor="integrations/genereti_comfy_p5/web/js/operator-editor.js";
await writeFile(operatorEditor,(await readFile(operatorEditor,"utf8")).replace(/editor\.mjs\?v=[^']+/,`editor.mjs?v=${version}`));
const webviewEditor='integrations/genereti_comfy_p5/web/js/webview.js';
await writeFile(webviewEditor,(await readFile(webviewEditor,'utf8')).replace(/editor\.mjs\?v=[^']+/,`editor.mjs?v=${version}`));

const editorSettings="integrations/genereti_comfy_p5/web/js/editor-settings.js";
await writeFile(editorSettings,(await readFile(editorSettings,"utf8")).replace(/editor\.mjs\?v=[^']+/,`editor.mjs?v=${version}`));

licenseMetas.push({inputs:Object.fromEntries(['p5/lib/p5.min.js','p5-v1/lib/p5.min.js','p5.sound/dist/p5.sound.min.js','p5.brush/dist/p5.brush.js'].map(path=>['node_modules/'+path,{}]))});
await recordBrowserLicenses(licenseMetas,'livecode');
