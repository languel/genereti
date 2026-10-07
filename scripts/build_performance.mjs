import {build as esbuild} from 'esbuild';
import {recordBrowserLicenses} from './browser_licenses.mjs';
const licenseMetas=[];
async function build(options){const result=await esbuild({...options,metafile:true});licenseMetas.push(result.metafile);return result;}
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out='integrations/genereti_comfy_performance/web/lib';await mkdir(out,{recursive:true});
await build({entryPoints:['integrations/genereti_comfy_performance/ui/index.jsx'],outfile:`${out}/timeline.mjs`,bundle:true,minify:true,jsx:'automatic',format:'esm',legalComments:'linked',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
const version=createHash('sha256').update(await readFile(`${out}/timeline.mjs`)).update(await readFile(`${out}/timeline.css`)).digest('hex').slice(0,16);
await writeFile(`${out}/version.json`,JSON.stringify({version}));
const demo=await readFile('integrations/comfyui_genereti/workflows/ꘇ-Performance-Timeline.json');
await writeFile(`${out}/demo.json`,demo);
await writeFile(`${out}/guide.json`,JSON.parse(demo).nodes.find(n=>n.type==='GeneretiDatLesson').widgets_values[0]);
await writeFile(`${out}/React-LICENSE`,await readFile('node_modules/react/LICENSE'));

await recordBrowserLicenses(licenseMetas,'timeline');
