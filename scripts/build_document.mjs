import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {recordBrowserLicenses} from './browser_licenses.mjs';
const mathAssets={name:'local-math-fonts',setup(build){
 build.onResolve({filter:/^genereti:math-css$/},()=>({path:'math-css',namespace:'math'}));
 build.onLoad({filter:/.*/,namespace:'math'},async()=>{
  let css=await readFile('node_modules/katex/dist/katex.min.css','utf8');
  css=css.replace(/,url\(fonts\/[^)]+\.(?:woff|ttf)\) format\("[^"]+"\)/g,'');
  for(const match of [...css.matchAll(/url\((fonts\/[^)]+)\)/g)]){const data=await readFile('node_modules/katex/dist/'+match[1]);css=css.replace(match[0],`url(data:font/woff2;base64,${data.toString('base64')})`);}
  return {contents:`export default ${JSON.stringify(css)}`,loader:'js'};
 });
}};
const result=await build({entryPoints:{document:'integrations/genereti_comfy_p5/livecode/webview-document.js'},outdir:'integrations/genereti_comfy_p5/web/lib/webview',plugins:[mathAssets],bundle:true,splitting:true,minify:true,format:'esm',legalComments:'linked',target:'es2022',metafile:true});
await recordBrowserLicenses([result.metafile],'webview');
