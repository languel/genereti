import {build} from 'esbuild';
import {cp,mkdir,rm,readFile} from 'node:fs/promises';
const out='web/vendor/excalidraw';
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
// Excalidraw 0.18.1 has no public desktop-layout override. Adapt its pinned
// breakpoint in our bundle, only for the Comfy drawing host. Canvas geometry
// still uses the real iframe size; other hosts retain normal responsive UI.
const desktopDrawing={name:'desktop-comfy-drawing',setup(builder){
 builder.onLoad({filter:/[\\/]@excalidraw[\\/]excalidraw[\\/]dist[\\/]prod[\\/]index\.js$/},async({path})=>{
  const source=await readFile(path,'utf8');
  const breakpoint='"isMobileBreakpoint",(t,r)=>t<Ch||r<Sh&&t<Ih';
  if(!source.includes(breakpoint))throw new Error('Excalidraw breakpoint changed; review the Comfy desktop-layout adapter.');
  return {contents:source.replace(breakpoint,'"isMobileBreakpoint",(t,r)=>document.body.dataset.host!=="comfy"&&(t<Ch||r<Sh&&t<Ih)'),loader:'js'};
 });
}};
await build({plugins:[desktopDrawing],entryPoints:{editor:'editor/index.jsx'},outdir:out,bundle:true,minify:true,splitting:true,format:'esm',target:'es2022',conditions:['production'],define:{'process.env.NODE_ENV':'"production"'},loader:{'.woff2':'file','.woff':'file','.ttf':'file'},assetNames:'assets/[name]-[hash]',legalComments:'linked'});
await cp('node_modules/@excalidraw/excalidraw/dist/prod/fonts',`${out}/fonts`,{recursive:true});
await cp('editor/LICENSE-EXCALIDRAW.txt',`${out}/LICENSE-EXCALIDRAW.txt`);
console.log('Built local Excalidraw editor and fonts.');
