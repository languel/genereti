import test from 'node:test';
import assert from 'node:assert/strict';
import {noise,noiseExpression} from '../integrations/genereti_comfy_texture/web/noise.js';
import {parseExpression,evaluateExpression,expressionWGSL} from '../integrations/genereti_comfy_texture/web/expression.js';
for(const kind of ['perlin','simplex','value'])for(let n=1;n<=4;n++)test(`${kind} ${n}D is deterministic, bounded, continuous and nonconstant`,()=>{
 const points=Array.from({length:40},(_,i)=>Array.from({length:n},(_,j)=>i*.19+j*.37-2.1));
 const values=points.map(p=>noise(kind,...p));assert.ok(Math.max(...values)-Math.min(...values)>.1);
 for(const p of points){const v=noise(kind,...p);assert.equal(v,noise(kind,...p));assert.ok(v>=-1&&v<=1);assert.ok(Math.abs(v-noise(kind,...p.map(x=>x+1e-5)))<.001);}
 const coords=points[3];const ast=parseExpression(`${kind}(${coords.join(',')})`);assert.equal(evaluateExpression(ast,{}),noise(kind,...coords));assert.match(expressionWGSL(ast),/gn_noise/);
});
test('noise alias, coordinate arity and octave expression',()=>{
 assert.equal(evaluateExpression(parseExpression('noise(.2,.4,.6)'),{}),noise('perlin',.2,.4,.6));
 for(const s of ['noise()','noise(1,2,3,4,5)'])assert.throws(()=>parseExpression(s));
 const source=noiseExpression({algorithm:'simplex',dimensions:4,scale:8,seed:12,z:.5,speed:.2,octaves:6,lacunarity:2,gain:.5,color:'RGB'});
 assert.ok(source.length<2048);assert.ok(Number.isFinite(evaluateExpression(parseExpression(source),{x:.2,y:.4,t:1,c:2})));
});
