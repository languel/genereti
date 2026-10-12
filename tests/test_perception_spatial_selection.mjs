import test from 'node:test';
import assert from 'node:assert/strict';
import {boxHits,paintHits} from '../integrations/genereti_comfy_perception/web/spatial-selection.js';
const points=[{id:'a',x:10,y:10},{id:'b',x:20,y:20},{id:'c',x:30,y:10},{id:'d',x:50,y:40}];
test('box selection includes boundaries and works in either drag direction',()=>{
 const expected=['a','b','c'];for(const [a,b]of [[{x:10,y:10},{x:30,y:20}],[{x:30,y:20},{x:10,y:10}]])assert.deepEqual(boxHits(points,a,b).map(p=>p.id),expected);
});
test('paint stroke catches points between widely spaced pointer samples',()=>{
 assert.deepEqual(paintHits(points,{x:0,y:10},{x:40,y:10},3).map(p=>p.id),['a','c']);
 assert.deepEqual(paintHits(points,{x:20,y:20},{x:20,y:20},1).map(p=>p.id),['b']);
 assert.deepEqual(paintHits(points,{x:0,y:10},{x:40,y:10},10).map(p=>p.id),['a','b','c']);
});
