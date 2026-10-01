import {build} from 'esbuild';
import {cp,mkdir,rm} from 'node:fs/promises';
const out='web/vendor/excalidraw';
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
await build({entryPoints:{editor:'editor/index.jsx'},outdir:out,bundle:true,minify:true,splitting:true,format:'esm',target:'es2022',conditions:['production'],define:{'process.env.NODE_ENV':'"production"'},loader:{'.woff2':'file','.woff':'file','.ttf':'file'},assetNames:'assets/[name]-[hash]',legalComments:'linked'});
await cp('node_modules/@excalidraw/excalidraw/dist/prod/fonts',`${out}/fonts`,{recursive:true});
await cp('editor/LICENSE-EXCALIDRAW.txt',`${out}/LICENSE-EXCALIDRAW.txt`);
console.log('Built local Excalidraw editor and fonts.');
