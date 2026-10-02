import {build} from 'esbuild';
import {mkdir,copyFile,rm,readdir,readFile,writeFile} from 'node:fs/promises';
const aliases={'@strudel/codemirror':'./integrations/genereti_comfy_p5/livecode/strudel-widgets.js','@strudel/web':'./node_modules/@strudel/web/web.mjs'};
const out='integrations/genereti_comfy_p5/web/lib';await mkdir(out,{recursive:true});
for(const name of ['runtime.js','runtime.js.LEGAL.txt','editor.js','editor.js.LEGAL.txt'])await rm(`${out}/${name}`,{force:true});
await build({entryPoints:['integrations/genereti_comfy_p5/livecode/editor.js'],outfile:`${out}/editor.mjs`,alias:aliases,bundle:true,minify:true,format:'esm',legalComments:'linked',target:'es2022'});
await build({entryPoints:['integrations/genereti_comfy_p5/livecode/runtime.js'],outfile:`${out}/runtime.txt`,alias:aliases,bundle:true,minify:true,format:'iife',legalComments:'linked',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
await build({entryPoints:['integrations/genereti_comfy_p5/livecode/formatter.js'],outfile:`${out}/formatter.mjs`,bundle:true,minify:true,format:'esm',legalComments:'linked',target:'es2022'});
const typeFiles={};
async function collectTypes(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const path=directory+'/'+entry.name;if(entry.isDirectory())await collectTypes(path);else if(entry.name.endsWith('.d.ts')||entry.name==='package.json')typeFiles['/'+path]=await readFile(path,'utf8');}}
for(const dir of ['typescript/lib','@types/p5','@types/three','@types/webxr','@types/stats.js','fflate','meshoptimizer','@tweenjs/tween.js'])await collectTypes('node_modules/'+dir);
await writeFile(`${out}/language-types.json`,JSON.stringify(typeFiles));
await build({entryPoints:['integrations/genereti_comfy_p5/livecode/language-worker.js'],outfile:`${out}/language-worker.mjs`,bundle:true,minify:true,format:'esm',platform:'browser',external:['fs','path','os','crypto','buffer','inspector','perf_hooks','source-map-support'],legalComments:'linked',target:'es2022'});
for(const [pkg,file] of [['typescript','LICENSE.txt'],['@types/p5','LICENSE'],['@types/three','LICENSE'],['@types/webxr','LICENSE'],['@types/stats.js','LICENSE'],['fflate','LICENSE'],['meshoptimizer','LICENSE.md'],['@tweenjs/tween.js','LICENSE'],['prettier','LICENSE'],['terser','LICENSE'],['three','LICENSE'],['@strudel/web','LICENSE'],['@strudel/codemirror','LICENSE'],['html-to-image','LICENSE'],['marked','LICENSE.md'],['dompurify','LICENSE'],['codemirror','LICENSE']])await copyFile(`node_modules/${pkg}/${file}`,`${out}/${pkg.replaceAll('/','-')}-LICENSE`);
