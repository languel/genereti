import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseExpression,evaluateExpression,expressionWGSL} from '../integrations/genereti_comfy_texture/web/expression.js';
import {parseCSV,csv,fromJSON} from '../integrations/genereti_comfy_dat/web/tables.js';
const signalSource=(await readFile(new URL('../integrations/genereti_comfy_chop/web/signals.js',import.meta.url),'utf8')).replace('/extensions/genereti_comfy_texture/expression.js',new URL('../integrations/genereti_comfy_texture/web/expression.js',import.meta.url).href);
const {generate,process,first,patternMatch}=await import('data:text/javascript;base64,'+Buffer.from(signalSource).toString('base64'));
test('arithmetic grammar has precedence, names and bounded functions without code execution',()=>{
 assert.equal(evaluateExpression(parseExpression('-2^2 + clamp(v,0,1)*3'),{v:2}),-1);
 assert.ok(Math.abs(evaluateExpression(parseExpression('sin(t*tau)'),{t:.25})-1)<1e-9);
 for(const source of ['window.alert(1)','__proto__','sin(1,2)','1e999','new Date()','x=1','[1]'])assert.throws(()=>parseExpression(source));
 assert.equal(expressionWGSL(parseExpression('mix(v,1,0.5)')),'mix(v,1.0,0.5)');
});
test('signal time is sampled in seconds and channel indices are independently addressable',()=>{
 const data=generate('Expression',{samples:4,sample_rate:4,channels:2,expression:'sin(t*tau)+c'},0);
 assert.deepEqual([...data.channels.chan0].map(v=>Math.round(v)),[0,1,0,-1]);
 assert.deepEqual([...data.channels.chan1].map(v=>Math.round(v)),[1,2,1,0]);assert.equal(data.sampleRate,4);
});
test('integration and lag continue across blocks and never mutate inputs',()=>{
 const input={channels:{a:new Float32Array([1,1])},sampleRate:2,start:0},memory={};
 assert.deepEqual([...process('Speed',input,{},memory).channels.a],[.5,1]);
 assert.deepEqual([...process('Speed',input,{},memory).channels.a],[1.5,2]);
 const lag={a:0};const out=process('Lag',input,{seconds:1},lag);assert.ok(out.channels.a[0]>0&&out.channels.a[0]<out.channels.a[1]);assert.deepEqual([...input.channels.a],[1,1]);
});
test('merge linearly resamples and preserves channel names; select supports multiple wildcards',()=>{
 const input={channels:{a:new Float32Array([0,0,0])},sampleRate:60,start:0},other={channels:{a:new Float32Array([0,1])},sampleRate:30,start:0};
 assert.deepEqual([...process('Merge',input,{}, {},other).channels.a_],[0,.5,1]);
 assert.equal(patternMatch('ch1.cc7','ch?.cc* pitch'),true);assert.equal(first(process('Select',input,{pattern:'missing'})),0);
});
test('CSV roundtrip preserves delimiters quotes empty cells and newlines',()=>{
 const source='name,value\n"quoted, name","a""b"\n"multiline\ncell",\n';const table=parseCSV(source);
 assert.deepEqual(parseCSV(csv(table)),table);assert.equal(table.rows[2][0],'multiline\ncell');assert.throws(()=>parseCSV('"unfinished'),/quote/i);
 assert.deepEqual(fromJSON('[{"n":1,"x":true},{"n":2,"x":{"a":1}}]').rows,[['n','x'],['1','true'],['2','{"a":1}']]);
});
