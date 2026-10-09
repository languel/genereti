import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNodeReference,buildReferenceIndex,searchReferences} from '../integrations/genereti_comfy_agent/web/js/reference-index.js';
const node={name:'GeneretiExample',display_name:'ꘇ Example',description:'A numeric control',category:'Genereti/chop',input:{required:{gain:['FLOAT',{default:1,min:0,max:4,tooltip:'Amplitude | range'}]},optional:{image:['IMAGE',{}]},hidden:{secret:['STRING',{}]}},output:['FLOAT'],output_name:['value']};
test('fallback quickrefs expose installed controls, not hidden internal fields',()=>{
 const text=buildNodeReference(node);assert.match(text,/Detailed usage guide|detailed usage guide/);assert.match(text,/`gain`/);assert.match(text,/Range 0…4/);assert.match(text,/Amplitude \\\| range/);assert.match(text,/Optional/);assert.match(text,/`value`/);assert.ok(!text.includes('secret'));
});
test('authored references take precedence and every Genereti node gets an entry',()=>{
 const items=buildReferenceIndex([node,{name:'GeneretiOther'}, {name:'LoadImage'}],{Welcome:'Welcome',GeneretiExample:'Authored guide'},[]);
 assert.equal(items.length,3);assert.equal(items[1].markdown,'Authored guide');assert.match(items[2].markdown,/GeneretiOther/);
});
test('reference search includes controls, lesson text and semantic node targets',()=>{
 const guides=[{id:'gesture',title:'Record motion',summary:'A control tutorial',steps:[{title:'Move',text:'Capture XY',target:{nodeType:'GeneretiChopGesture'},actions:[{kind:'set-widget'}]}]},{id:'intro',title:'Introduction',steps:[{title:'Learn',text:'Try a signal'}]}];
 const items=buildReferenceIndex([node],{Welcome:'Welcome'},guides);
 assert.equal(searchReferences(items,'gain','node')[0].id,node.name);
 assert.equal(searchReferences(items,'capture xy','tutorial')[0].id,'gesture');
 assert.equal(searchReferences(items,'GeneretiChopGesture')[0].id,'gesture');
 assert.equal(searchReferences(items,'','lesson')[0].id,'intro');
 assert.equal(searchReferences(items,'does not exist').length,0);
});
