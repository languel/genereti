import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorkspace} from '../integrations/genereti_comfy_agent/web/js/workspace.js';
function fixture(review){
 const auto={name:'auto_update',value:true},code={name:'code',value:'original'},secret={name:'api_key',value:'hidden'};
 const node={id:1,type:'GeneretiLivecode',title:'livecode',pos:[0,0],widgets:[code,auto,secret],inputs:[],outputs:[],_generetiEditorContext:()=>({source:code.value,language:'p5',selection:[{text:'original',from:0,to:8}]})};
 const graph={_nodes:[node],getNodeById:id=>String(id)==='1'?node:null,setDirtyCanvas(){}};
 const app={graph,canvas:{selected_nodes:{1:node}}};return {workspace:createWorkspace(app,{review}),node,code,auto};
}
test('source edits pause auto-update and undo restores values; context excludes credentials',async()=>{
 const {workspace,code,auto}=fixture(async()=>true);const context=await workspace.call('node_read',{id:1});assert.equal(context.widgets.api_key,undefined);assert.equal(context.editor.selection[0].text,'original');
 await workspace.call('node_set',{id:1,widget:'code',value:'new'});assert.equal(code.value,'new');assert.equal(auto.value,false);
 await workspace.call('workspace_undo');assert.equal(code.value,'original');assert.equal(auto.value,true);
});
test('approval cannot overwrite a user edit made while waiting',async()=>{
 let approve;const {workspace,code}=fixture(()=>new Promise(resolve=>approve=resolve));const change=workspace.call('node_set',{id:1,widget:'code',value:'new'});code.value='user edit';approve(true);await assert.rejects(change,/changed while/);assert.equal(code.value,'user edit');
});
test('dismiss and invalid widget types cannot mutate the workspace',async()=>{
 const {workspace,code}=fixture(async()=>false);assert.deepEqual(await workspace.call('node_set',{id:1,widget:'code',value:'new'}),{cancelled:true});assert.equal(code.value,'original');await assert.rejects(workspace.call('node_set',{id:1,widget:'code',value:12}),/Expected string/);await assert.rejects(workspace.call('node_set',{id:1,widget:'api_key',value:'new'}),/not exposed/);
});

test('selection supports modern Comfy selectedItems and excludes non-node items',async()=>{
 const {node}=fixture(async()=>true);const other={id:2,title:'node',pos:[0,0],widgets:[],inputs:[],outputs:[]};const graph={_nodes:[node,other],getNodeById:id=>String(id)==='1'?node:String(id)==='2'?other:null};const app={graph,canvas:{selected_nodes:{1:node},selectedItems:new Set([node,other,{id:'reroute'}])}};const workspace=createWorkspace(app);assert.deepEqual(workspace.snapshot().selected,['1','2']);
});
