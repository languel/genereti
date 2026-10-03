import {test} from 'node:test';
import assert from 'node:assert/strict';
import {frameSize,sampleDue} from '../integrations/genereti_comfy_inputs/web/js/capture-frame.js';
test('Camera input keeps aspect ratio, never upscales, and samples at the selected cadence',()=>{
 assert.deepEqual(frameSize(1920,1080,512),[512,288]);
 assert.deepEqual(frameSize(320,240,512),[320,240]);
 assert.deepEqual(frameSize(1920,1080,0),[1920,1080]);
 assert.equal(sampleDue(999,0,1,false,true),false);
 assert.equal(sampleDue(1000,0,1,false,true),true);
 assert.equal(sampleDue(1000,0,0,false,true),false);
 assert.equal(sampleDue(0,0,0,false,false),true);
});
