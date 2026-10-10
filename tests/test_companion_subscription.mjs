import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('Shared subscriptions retain the first synchronous frame, traverse previews, rebind and release',()=>{
 let listener,tick,removed=0,cleared=0,retained=0,released=0,latest=null;
 const bitmap={width:256,height:256};
 const source={id:1,_generetiLiveSource:{retain(){retained++;listener({detail:{nodeId:1,bitmap}});},release(){released++;}}};
 const preview={id:2,comfyClass:'GeneretiLiveImagePreview',inputs:[{name:'image',link:1}]};
 const consumer={id:3,inputs:[{name:'image',link:2}]};
 const graph={links:{1:{origin_id:1,origin_slot:0},2:{origin_id:2,origin_slot:0}},getNodeById(id){return [source,preview,consumer].find(n=>n.id===id);}};
 preview.graph=consumer.graph=graph;
 const context=vm.createContext({app:{graph,registerExtension(){}},window:{addEventListener(_,fn){listener=fn;},removeEventListener(_,fn){assert.equal(fn,listener);removed++;}},setInterval(fn){tick=fn;return 7;},clearInterval(id){assert.equal(id,7);cleared++;}});
 const code=readFileSync(new URL('../integrations/genereti_comfy_p5/web/js/live-runtime.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export ','');
 vm.runInContext(code,context);
 const stop=context.subscribeLive(consumer,frame=>{latest=frame.bitmap;},()=>{latest=null;},{inputName:'image'});
 assert.equal(retained,1);assert.equal(latest,bitmap);
 source._generetiLivePaused=true;tick();assert.equal(released,1);assert.equal(latest,null);
 source._generetiLivePaused=false;tick();assert.equal(retained,2);assert.equal(latest,bitmap);
 stop();assert.equal(released,2);assert.equal(removed,1);assert.equal(cleared,1);
 listener({detail:{nodeId:1,bitmap:{}}});assert.equal(latest,bitmap);
});
