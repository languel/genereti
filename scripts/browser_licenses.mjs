// Inventory the packages esbuild actually includes; do not infer from top-level deps.
import {readFile,readdir,mkdir,writeFile,copyFile} from 'node:fs/promises';
import {dirname,resolve,relative,join} from 'node:path';
export async function recordBrowserLicenses(metas,group){
 const roots=new Set();
 for(const meta of metas)for(const input of Object.keys(meta.inputs)){
  if(!input.includes('node_modules/'))continue;
  let dir=dirname(resolve(input));
  while(dir!==dirname(dir)){
   try{const p=JSON.parse(await readFile(join(dir,'package.json'),'utf8'));if(p.name){roots.add(dir);break;}}catch{}
   dir=dirname(dir);
  }
 }
 const dest=resolve('licensing/browser',group);await mkdir(dest,{recursive:true});const records=[];
 for(const root of [...roots].sort()){
  const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
  if(!pkg.name)throw Error('Missing package identity: '+root);
  const license=pkg.license||pkg.licenses||(pkg.name==='khroma'?'MIT':null);
  if(!license)throw Error('Missing package license: '+pkg.name);
  // Strudel and other strong copyleft runtimes must not silently reenter the core.
  if(/AGPL|(^|[^L])GPL/i.test(JSON.stringify(license)))throw Error('Strong copyleft dependency in default bundle: '+pkg.name);
  const id=pkg.name.replaceAll('/','-')+'-'+pkg.version;
  const notices=[];
  for(const entry of await readdir(root,{withFileTypes:true})){
   if(entry.isFile()&&/^(licen[cs]e|copying|notice|copyright)([.-]|$)/i.test(entry.name)){
    await mkdir(join(dest,id),{recursive:true});await copyFile(join(root,entry.name),join(dest,id,entry.name));notices.push(relative(process.cwd(),join(dest,id,entry.name)));
   }
  }
  if(!notices.length&&pkg.name==='@excalidraw/excalidraw'){await mkdir(join(dest,id),{recursive:true});await copyFile('editor/LICENSE-EXCALIDRAW.txt',join(dest,id,'LICENSE'));notices.push(relative(process.cwd(),join(dest,id,'LICENSE')));}
  if(!notices.length){const extra=pkg.name.startsWith('@radix-ui/')?'radix':pkg.name==='fastdom'?'fastdom':pkg.name==='react-remove-scroll-bar'?'react-remove-scroll-bar':null;if(extra){await mkdir(join(dest,id),{recursive:true});await copyFile('licensing/upstream/'+extra+'-LICENSE',join(dest,id,'LICENSE'));notices.push(relative(process.cwd(),join(dest,id,'LICENSE')));}}
  if(!notices.length)throw Error('Missing license text: '+pkg.name);
  records.push({name:pkg.name,version:pkg.version,license,notices,repository:pkg.repository||null});
 }
 records.sort((a,b)=>a.name.localeCompare(b.name));
 await writeFile(join(dest,'inventory.json'),JSON.stringify(records,null,2)+'\n');
 console.log(group+': '+records.length+' bundled package licenses recorded.');
}
