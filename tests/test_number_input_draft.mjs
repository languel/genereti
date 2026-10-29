import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('empty and out-of-range drafts retain the running value while typing 100',()=>{
 const c=vm.createContext({app:{registerExtension(){} }});
 vm.runInContext(readFileSync('integrations/genereti_comfy_agent/web/js/number-input-draft.js','utf8').replace(/^import .*;\n/,'').replace('export function','function'),c);
 let output=20;
 for(const draft of ['', '1', '10']){if(c.validNumberDraft(draft,20,400))output=Number(draft);assert.equal(output,20);}
 if(c.validNumberDraft('100',20,400))output=100;
 assert.equal(output,100);
 for(const draft of ['-','1e','Infinity',' '])assert.equal(c.validNumberDraft(draft,null,null),false);
 assert.equal(c.validNumberDraft('-0.5',-1,1),true);
});
