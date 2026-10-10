import test from 'node:test';
import assert from 'node:assert/strict';
import {imageRect} from '../integrations/genereti_comfy_stream/web/js/image-frame.js';
test('Contain letterboxes and Cover crops around the center without distorting source aspect',()=>{
 assert.deepEqual(imageRect(200,100,100,100,'contain'),[0,25,100,50]);
 assert.deepEqual(imageRect(200,100,100,100,'cover'),[-50,0,200,100]);
 assert.deepEqual(imageRect(100,200,100,100,'cover'),[0,-50,100,200]);
});
test('Stretch changes aspect deliberately while Native retains pixel dimensions',()=>{
 assert.deepEqual(imageRect(200,100,80,60,'fill'),[0,0,80,60]);
 assert.deepEqual(imageRect(200,100,80,60,'native'),[-60,-20,200,100]);
});
