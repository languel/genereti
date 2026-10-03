import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
test('Backdrop draws in viewport pixels, preserves the previous renderer and closes the previous backdrop',async()=>{
 const changes=[],draws=[];let dirty=0;const previous=()=>false;
 const graph={onRenderBackground:previous,clear_background_color:'#222',setDirty(){dirty++;}};
 const context=vm.createContext({app:{canvas:graph},document:{createElement(){return {width:300,height:150,getContext(){return {clearRect(){},drawImage(){}};}};}}});
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_stream/web/js/graph-backdrop.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export function','function'),context);
 const first=context.graphBackdrop({},v=>changes.push(v));await first.open();first.publish({bitmap:{width:100,height:100}});
 const ctx={save(){},restore(){},setTransform(...args){assert.deepEqual(args,[1,0,0,1,0,0]);},fillRect(){},drawImage(...args){draws.push(args);}};
 graph.onRenderBackground({width:800,height:600},ctx);assert.deepEqual(draws[0].slice(1),[100,0,600,600]);
 const second=context.graphBackdrop({});await second.open();assert.deepEqual(changes,[true,false]);second.close();assert.equal(graph.onRenderBackground,previous);assert.ok(dirty>=4);
});
