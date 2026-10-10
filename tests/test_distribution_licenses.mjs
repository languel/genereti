import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
test('public runtime dependency graph excludes embedded AGPL engines',async()=>{
 const lock=JSON.parse(await readFile(new URL('package-lock.json',root)));
 for(const path of Object.keys(lock.packages))assert.doesNotMatch(path,/@strudel\/|\/superdough$/);
 for(const file of ['runtime.js','editor.js'])assert.doesNotMatch(await readFile(new URL('integrations/genereti_comfy_p5/livecode/'+file,root),'utf8'),/from ['"](?:@strudel\/|superdough)/);
});
test('every bundled package carries license text, with no strong copyleft core imports',async()=>{
 for(const group of ['livecode','drawing','timeline','webview']){
  const entries=JSON.parse(await readFile(new URL(`licensing/browser/${group}/inventory.json`,root)));
  assert.ok(entries.length>0);
  for(const item of entries){assert.ok(item.notices.length,item.name);assert.doesNotMatch(JSON.stringify(item.license),/AGPL|(^|[^L])GPL/i);for(const path of item.notices)await access(new URL(path,root));}
 }
});
test('p5 source delivery and separately replaceable runtime match pinned provenance',async()=>{
 const provenance=JSON.parse(await readFile(new URL('licensing/source/provenance.json',root)));
 for(const [path,expected] of Object.entries(provenance.sha256))assert.equal(createHash('sha256').update(await readFile(new URL(path,root))).digest('hex'),expected,path);
 assert.match(await readFile(new URL('licensing/P5-LICENSE.txt',root),'utf8'),/GNU LESSER GENERAL PUBLIC LICENSE/);
});
