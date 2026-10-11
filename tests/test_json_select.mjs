import test from 'node:test';
import assert from 'node:assert/strict';
import {fromJSON} from '../integrations/genereti_comfy_dat/web/tables.js';
import {selectJSON,matchingEntries} from '../integrations/genereti_comfy_dat/web/json-select.js';
test('JSON selector passes unchanged inputs, filters dictionary keys/values and preserves types',()=>{const d=fromJSON('{"speed":0.5,"pose":{"x":1},"title":"Blue"}');assert.equal(selectJSON(d),d);assert.deepEqual(selectJSON(d,'BLUE').jsonValue,{title:'Blue'});assert.deepEqual(selectJSON(d,'pose','1').jsonValue,{pose:{x:1}});assert.deepEqual(selectJSON(d,'pose','0').jsonValue,{});});
test('array selection uses original indices through filtering, including falsy values',()=>{const d=fromJSON('[{"name":"red"},{"name":"blue"},{"name":"red"},false,0,null]');assert.deepEqual(matchingEntries(d,'red').map(e=>e.index),[0,2]);assert.deepEqual(selectJSON(d,'red','2').jsonValue,[{name:'red'}]);assert.deepEqual(selectJSON(d,'','3,4,5').jsonValue,[false,0,null]);assert.throws(()=>selectJSON(d,'','-1'),/indices/);});
test('plain DAT rows stay tables with selection and filter',()=>{const d={rows:[['a','1'],['b','2']]};assert.deepEqual(selectJSON(d,'b','1'),{rows:[['b','2']]});assert.deepEqual(selectJSON(d,'missing'),{rows:[]});});
