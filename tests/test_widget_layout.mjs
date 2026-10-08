import test from 'node:test';
import assert from 'node:assert/strict';
import {allocatedWidgetHeight,intrinsicRowHeight,previewWidgetHeight} from '../integrations/genereti_comfy_p5/web/js/widget-layout.js';
test('classic editor uses allocated content space including DOM margins',()=>{
 assert.equal(allocatedWidgetHeight({computedHeight:304,margin:10}),284);
 assert.equal(allocatedWidgetHeight({computedHeight:NaN,margin:10}),300);
});
test('transport height does not feed its assigned height back into node sizing',()=>{
 const element={scrollHeight:146,children:[{offsetHeight:30},{offsetHeight:30},{hidden:true,offsetHeight:120}]};
 assert.equal(intrinsicRowHeight(element),40);
 element.scrollHeight=300;assert.equal(intrinsicRowHeight(element),40);
});
test('preview allocation includes controls, aspect ratio and DOM margins',()=>{
 assert.equal(previewWidgetHeight(400,.75),407);
 assert.equal(previewWidgetHeight(10,.75),122);
});
