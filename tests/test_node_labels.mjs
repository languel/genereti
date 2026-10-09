import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../integrations/genereti_comfy_agent/web/js/node-labels.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export function','function');
const context=vm.createContext({app:{registerExtension(){}}});vm.runInContext(source,context);
test('node labels always have one glyph and one separating space',()=>{
 for(const title of ['ꘇtop.expression','ꘇ ꘇ top.expression','top.expression']){
  assert.equal(context.generetiTitle(title,'GeneretiTextureExpression'),'ꘇ top.expression');
  assert.equal(context.generetiTitle(context.generetiTitle(title,'GeneretiTextureExpression'),'GeneretiTextureExpression'),'ꘇ top.expression');
 }
 for(const id of ['GeneretiSDXSGenerate','GeneretiSDTurboGenerate'])assert.equal(context.generetiTitle('ꘇ ꘅ generator',id),'ꘅ generator');
 assert.equal(context.generetiTitle('ꘇ ꘅ local text','GeneretiCoreText'),'ꘅ local text');
});
