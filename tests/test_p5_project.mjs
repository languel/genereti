import test from 'node:test';
import assert from 'node:assert/strict';
import {projectFiles,p5Assets} from '../integrations/genereti_comfy_p5/web/js/p5-project.js';
import {projectZip} from '../integrations/genereti_comfy_p5/livecode/project-zip.js';
import {unzipSync,strFromU8} from 'fflate';
test('p5 project is conventional, vendored, parameterized and excludes shared runtime',()=>{
 const files=projectFiles({source:'let speed = 1; /* 0..5 */\nfunction setup(){createCanvas(100,100)}',parameters:{speed:3},assets:[{name:'p5.min.js',source:'/* vendored p5 */',licenseText:'LGPL'}]});
 const unpacked=unzipSync(projectZip(files));
 assert.ok(strFromU8(unpacked['index.html']).includes('libraries/p5.min.js'));
 assert.ok(strFromU8(unpacked['sketch.js']).includes('let speed = 3;'));
 assert.equal(strFromU8(unpacked['libraries/p5.min.js.LICENSE']),'LGPL');
 assert.ok(!Object.keys(unpacked).some(p=>p.includes('runtime')));
 assert.ok(files['README.md'].includes('MediaPipe'));
});
test('p5 defaults to 2 with explicit 1 compatibility and brush version validation',()=>{
 assert.equal(p5Assets().version,'2.3.4');
 assert.equal(p5Assets({version:'1.11.11',sound:true}).files.length,2);
 assert.throws(()=>p5Assets({version:'1.11.11',brush:true}),/requires p5 2/);
 assert.equal(p5Assets({sound:true,brush:true}).files.length,3);
});

const {standaloneHTML,standaloneModes}=await import('../integrations/genereti_comfy_p5/web/js/standalone-export.js');
test('direct HTML/SVG preserve authored documents and put bridge before scripts',()=>{
 const html=standaloneHTML({mode:'html',source:'<!doctype html><html><head><title>mine</title></head><body><script>window.answer=__.params.speed</script></body></html>',parameters:{},renderer:'SHARED_RUNTIME'});
 assert.ok(html.indexOf('window.__=')<html.indexOf('window.answer'));
 assert.ok(!html.includes('SHARED_RUNTIME'));
 const svg=standaloneHTML({mode:'svg',source:'<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3"/></svg>'});
 assert.ok(svg.includes('viewBox="0 0 10 10"'));
});
test('renderer exports escape inline script termination and omit unsupported Strudel',()=>{
 const html=standaloneHTML({mode:'glsl',source:'</script><script>bad()</script>',renderer:'// </script>'});
 assert.ok(html.includes('\\u003c/script>'));
 assert.ok(html.includes('<\\/script>'));
 assert.ok(!standaloneModes.includes('strudel'));
 assert.throws(()=>standaloneHTML({mode:'strudel',source:''}),/unavailable/);
});
