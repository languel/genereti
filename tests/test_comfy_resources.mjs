import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createResources,parseReferences,referenceToken} from '../integrations/genereti_comfy_agent/web/js/resources.js';
import {createWorkspace} from '../integrations/genereti_comfy_agent/web/js/workspace.js';
const template={nodes:[{id:1,type:'LoadImage',properties:{api_key:'secret',note:'use an image'},widgets_values:['old.png']}],links:[],id:'original'};
function fixture(){
 const requests=[];
 const data={
  '/api/assets?limit=100&tags_any=input,output,temp':null,
  '/object_info':{LoadImage:{input:{required:{image:[['portrait.png','folder/my image.png']]}}}},
  '/history?max_items=50':{job:{outputs:{1:{images:[{filename:'result.png',subfolder:'stage',type:'output'}]}}}},
  '/userdata?dir=workflows&recurse=true':['Genereti/Ink.json','other.txt'],
  '/userdata/workflows%2FGenereti%2FInk.json':template,
  '/templates/index.json':[{templates:[{name:'ink_edit',title:'Ink edit',description:'ink wash'}]}],
  '/workflow_templates':{custom_pack:['sketch']},
  '/templates/ink_edit.json':template,
 };
 const resources=createResources({fetcher:async url=>{requests.push(url);assert.ok(url in data,'Unexpected URL '+url);return {ok:data[url]!==null,status:data[url]===null?503:200,json:async()=>structuredClone(data[url])};}});
 return {resources,requests};
}
test('reference grammar supports Unicode, spaces, quoted escapes and deduplication',()=>{
 const token=referenceToken('asset','input/水墨 "wash".png');assert.deepEqual(parseReferences(`take ${token} and ${token} with @template:default/ink_edit #12`),[{kind:'asset',id:'input/水墨 "wash".png'},{kind:'template',id:'default/ink_edit'}]);
});
test('library discovers inputs/recent outputs, folders and custom/core templates',async()=>{
 const {resources}=fixture();const list=await resources.list({limit:100});assert.equal(list.items.length,6);assert.match(list.warnings.join(' '),/loader-listed/);assert.ok(list.items.some(i=>i.id==='output/stage/result.png'));assert.ok(list.items.some(i=>i.id==='custom_pack/sketch'));
 const page=await resources.list({kind:'asset',limit:1});assert.equal(page.items.length,1);assert.equal(page.hasMore,true);assert.equal((await resources.list({kind:'asset',query:'my image'})).items[0].id,'input/folder/my image.png');
});
test('read redacts named credentials and arbitrary paths cannot be fetched',async()=>{
 const {resources,requests}=fixture();const result=await resources.read({kind:'template',id:'default/ink_edit'});assert.equal(result.workflow.nodes[0].properties.api_key,undefined);assert.equal(result.workflow.nodes[0].properties.note,'use an image');
 await assert.rejects(resources.read({kind:'workflow',id:'../../private.json'}),/Unknown/);assert.ok(!requests.some(u=>u.includes('private')));
 assert.equal(await resources.inputFile('input/folder/my image.png'),'folder/my image.png');
});
function workspaceFixture(review){
 const {resources}=fixture();let state={nodes:[],links:[]},loads=[];
 const graph={_nodes:[],serialize:()=>state,getNodeById:()=>null};
 const app={graph,canvas:{},loadGraphData:async(...args)=>{loads.push(args);return true;}};
 return {workspace:createWorkspace(app,{resources,review}),loads,edit:()=>state={nodes:[{id:9}],links:[]}};
}
test('opening a template is reviewed, copies data, does not queue and preserves its ID',async()=>{
 const {workspace,loads}=workspaceFixture(async()=>true);const result=await workspace.call('workflow_open',{kind:'template',id:'default/ink_edit'});assert.equal(result.opened,true);assert.equal(loads.length,1);assert.equal(loads[0][0].id,undefined);assert.match(loads[0][3],/^Assistant copy /);assert.equal(template.id,'original');
});
test('dismissed or stale workflow approval never loads a graph',async()=>{
 const dismissed=workspaceFixture(async()=>false);assert.deepEqual(await dismissed.workspace.call('workflow_open',{kind:'template',id:'default/ink_edit'}),{cancelled:true});assert.equal(dismissed.loads.length,0);
 let approve;const stale=workspaceFixture(()=>new Promise(r=>approve=r));const pending=stale.workspace.call('workflow_open',{kind:'template',id:'default/ink_edit'});while(!approve)await new Promise(r=>setTimeout(r,0));stale.edit();approve(true);await assert.rejects(pending,/changed/);assert.equal(stale.loads.length,0);
});
test('asset binding enforces media loader types and supports guarded undo',async()=>{
 const {resources}=fixture();const widget={name:'image',value:'old.png'},node={id:1,type:'LoadImage',pos:[0,0],widgets:[widget],inputs:[],outputs:[]};const graph={_nodes:[node],getNodeById:()=>node,setDirtyCanvas(){}};
 const app={graph,canvas:{}};const previous=globalThis.fetch;
 globalThis.fetch=async()=>({ok:true,json:async()=>({LoadImage:{input:{required:{image:[['portrait.png']]}}}})});
 try{const workspace=createWorkspace(app,{resources,review:async()=>true});await workspace.call('asset_bind',{asset:'input/portrait.png',id:1,widget:'image'});assert.equal(widget.value,'portrait.png');await workspace.call('workspace_undo');assert.equal(widget.value,'old.png');}
 finally{globalThis.fetch=previous;}
});
test('output binding copies locally without overwrite; remote preview URLs are rejected',async()=>{
 const uploads=[];
 const resources=createResources({fetcher:async(url,options)=>{
  if(url.startsWith('/api/assets?'))return {ok:true,json:async()=>({assets:[{id:'remote',name:'remote.png',tags:['output'],preview_url:'https://example.com/image.png'}]})};
  if(url==='/object_info'||url.startsWith('/history'))return {ok:true,json:async()=>url==='/object_info'?{}:{job:{outputs:{1:{images:[{filename:'frame.png',type:'output'}]}}}}};
  if(url.startsWith('/view?'))return {ok:true,blob:async()=>new Blob(['pixels'],{type:'image/png'})};
  if(url==='/upload/image'){uploads.push(options.body);return {ok:true,json:async()=>({name:'frame_1.png',subfolder:''})};}
  throw Error('Unexpected URL');
 }});
 await resources.list({kind:'asset'});await assert.rejects(resources.inputFile('remote'),/local file/);assert.equal(uploads.length,0);
 assert.equal(await resources.inputFile('output/frame.png'),'frame_1.png');assert.equal(uploads[0].get('overwrite'),'false');
});
