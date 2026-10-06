import test from 'node:test';import assert from 'node:assert/strict';
import {highlightGeometry} from '../integrations/genereti_comfy_agent/web/js/guide-highlight.js';
test('halo expands scaled corners by the same screen-space padding as its bounds',()=>{
 for(const zoom of [.5,1,2]){const g=highlightGeometry({left:100,top:50,width:340*zoom,height:600*zoom},340,600,['12px','12px','12px','12px']);assert.equal(g.left,96);assert.equal(g.width,340*zoom+8);assert.equal(g.radius,Array(4).fill(12*zoom+4+'px').join(' ')+' / '+Array(4).fill(12*zoom+4+'px').join(' '));}
});
test('halo preserves asymmetric and elliptical target corners',()=>{const g=highlightGeometry({left:0,top:0,width:200,height:100},100,100,['10px 20px','0px','4px','8px']);assert.equal(g.radius,'24px 4px 12px 20px / 24px 4px 8px 12px');});
