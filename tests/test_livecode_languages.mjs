import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {markdownWithMath,formula} from '../integrations/genereti_comfy_p5/livecode/math.js';
import {examples} from '../integrations/genereti_comfy_p5/livecode/examples.js';
import {compileTixySource,resolveTixyGrid} from '../integrations/genereti_comfy_p5/livecode/ported/tixyRuntime.js';
import {evaluatePlayCoreSource} from '../integrations/genereti_comfy_p5/livecode/ported/playCoreSource.js';
import {createManimCueController,compileManimSource} from '../integrations/genereti_comfy_p5/livecode/ported/manimSource.js';
import {parseOrcaGrid,runOrcaFrame} from '../integrations/genereti_comfy_p5/livecode/ported/orcaEngine.js';
import {minifySource} from '../integrations/genereti_comfy_p5/livecode/formatter.js';
import {parseParameters} from '../integrations/genereti_comfy_p5/web/js/code-parameters.js';
import {glslSource} from '../integrations/genereti_comfy_p5/livecode/glsl-source.js';

test('every registered language preserves editable starter source',async()=>{
 const languages=JSON.parse(await readFile(new URL('../integrations/genereti_comfy_p5/web/js/livecode-languages.json',import.meta.url)));
 assert.deepEqual([...languages].sort(),Object.keys(examples).sort());
 assert.match(examples.manim,/latex: "e\^\{i\\\\pi\}/);
});
test('math supports inline/display delimiters and leaves code/escaped dollars literal',()=>{
 const html=markdownWithMath('Inline $x^2$ and \\(y\\).\n\n$$\\frac{1}{3}$$\n\n`$literal$`\n\n```js\nconst value = "$literal$";\n```\n\n\\$literal\\$');
 assert.equal((html.match(/class="katex"/g)||[]).length,3);
 assert.match(html,/<code>\$literal\$<\/code>/);
 assert.match(html,/const value = &quot;\$literal\$&quot;/);
 assert.match(html,/<p>\$literal\$<\/p>/);
 assert.match(formula('\\notACommand'),/mathcolor="#cc0000"/);
});
test('Tixy supports expressions, functions, bodies and bounded rectangular grids',()=>{
 for(const source of ['sin(t)+x','(t,i,x,y)=>sin(t)+x','return sin(t)+x;'])assert.equal(compileTixySource(source).evaluate(0,0,2,0,{}),2);
 assert.deepEqual(resolveTixyGrid({gridSize:'20x10',gridWidth:100}),{width:64,height:10});
 assert.equal(compileTixySource('log10(100)+PI').evaluate(0,0,0,0,{}),2+Math.PI);
 assert.throws(()=>compileTixySource('sin('));
});
test('Play Core imports use bundled modules and receive the common bridge',()=>{
 const program=evaluatePlayCoreSource('import {clamp} from "/src/modules/num.js";\nexport function main(coord,context,cursor,buffer,__){return clamp(__.params.amount,0,1)}',{params:{amount:2}});
 assert.equal(program.main({}, {}, {}, [], {params:{amount:2}}),1);
 assert.throws(()=>evaluatePlayCoreSource('import value from "missing";\nexport function main(){}'),/Unsupported Play Core module/);
});
test('Manim cues release on next, auto and disposal',async()=>{
 const cues=createManimCueController({mode:'cue'});let released=false;
 const wait=cues.cue('first').then(()=>released=true);await Promise.resolve();assert.equal(released,false);assert.equal(cues.next(),true);await wait;
 const second=cues.cue('second');cues.setMode('auto');await second;
 cues.setMode('cue');const third=cues.cue('third');cues.dispose();await third;
 const run=compileManimSource('await cue("compiled");__.value = new Circle();',{Circle:class Circle{}});const bridge={};await run({scene:{},bridge,cue:()=>{}});assert.ok(bridge.value);
});
test('Orca executes a clock without modifying authored source',()=>{
 const source='.4C.\n....',grid=parseOrcaGrid(source,{width:0,height:0});assert.equal(grid.width,4);assert.equal(grid.height,2);
 const result=runOrcaFrame(source,{frame:0,width:4,height:2});assert.equal(result.frame,1);assert.notEqual(result.source,source);
});
test('Shadertoy aliases do not duplicate uniforms; WebGL2 mainImage has an output',()=>{
 const fragment=glslSource('precision highp float;\nuniform float u_time;\nvoid mainImage(out vec4 color,in vec2 pos){color=texture2D(iChannel0,pos/iResolution.xy)+iTime;}');
 assert.equal((fragment.match(/uniform float u_time;/g)||[]).length,1);
 assert.equal((fragment.match(/uniform sampler2D u_image;/g)||[]).length,1);
 assert.match(fragment,/mainImage\(gl_FragColor/);
 const gl2=glslSource('#version 300 es\nvoid mainImage(out vec4 color,in vec2 pos){color=vec4(1);}');assert.match(gl2,/out vec4 generetiColor/);assert.match(gl2,/mainImage\(generetiColor/);
});

test('minification preserves functional Comfy parameter metadata',async()=>{
 const source='let influence = .5; /* 0..1 */\nint count = 8; /* 2..40 */\n// @param enabled = true\nfunction draw(){ console.log(influence,count,enabled); }';
 const result=await minifySource(source,'p5');
 assert.deepEqual(parseParameters(result).map(p=>({name:p.name,type:p.type,default:p.default,min:p.min,max:p.max})),parseParameters(source).map(p=>({name:p.name,type:p.type,default:p.default,min:p.min,max:p.max})));
 assert.doesNotMatch(result,/let influence/);
});
