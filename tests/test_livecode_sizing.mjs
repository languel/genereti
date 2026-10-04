import test from 'node:test';
import assert from 'node:assert/strict';
import {resizeP5} from '../integrations/genereti_comfy_p5/livecode/render-sizing.js';
test('responsive p5 preserves existing pixels and does not force a redraw',()=>{
 const calls=[];const old={width:512,height:512};
 globalThis.document={createElement:()=>({getContext:()=>({drawImage:(...args)=>calls.push(['copy',...args])})})};
 const p={canvas:old,resizeCanvas:(...args)=>calls.push(['resize',...args]),drawingContext:{drawImage:(...args)=>calls.push(['restore',...args])}};
 resizeP5(p,{width:1000,height:700});
 assert.equal(p.windowWidth,1000);assert.equal(p.windowHeight,700);
 assert.deepEqual(calls[1],['resize',1000,700,true]);assert.equal(calls[0][1],old);
 assert.deepEqual(calls[2].slice(2),[150,0,700,700]);
});
test('authored windowResized receives new dimensions and controls canvas resizing',()=>{
 const p={canvas:{},_generetiWindowResized(){assert.equal(this.windowWidth,800);assert.equal(this.windowHeight,600);this.called=true;},resizeCanvas(){throw Error('automatic resize should not run');}};
 resizeP5(p,{width:800,height:600});assert.equal(p.called,true);
});
