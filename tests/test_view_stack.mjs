import test from 'node:test';
import assert from 'node:assert/strict';
import {registerViewStack,routeStackShortcut} from '../integrations/genereti_comfy_stream/web/js/view-stack.js';
const element=(parent,hover=false)=>({parentElement:parent,style:{zIndex:'7'},hover,addEventListener(){},removeEventListener(){},matches(){return this.hover;}});
test('views reorder one step or to the ends without changing renderer ownership',()=>{
 const parent={},a=element(parent),b=element(parent),c=element(parent);
 const sa=registerViewStack(a),sb=registerViewStack(b),sc=registerViewStack(c);
 const order=()=>[a,b,c].sort((x,y)=>Number(x.style.zIndex)-Number(y.style.zIndex));
 assert.deepEqual(order(),[a,b,c]);sc.move('backward');assert.deepEqual(order(),[a,c,b]);
 sc.move('back');assert.deepEqual(order(),[c,a,b]);sc.move('front');assert.deepEqual(order(),[a,b,c]);
 sa.move('back');assert.deepEqual(order(),[a,b,c]);
 sa.dispose();sb.dispose();sc.dispose();assert.equal(a.style.zIndex,'7');
});
test('Cmd brackets prioritize the hovered view and keep separate DOM contexts independent',()=>{
 const parent={},other={},a=element(parent,true),b=element(parent),node=element(other);
 const sa=registerViewStack(a),sb=registerViewStack(b),sn=registerViewStack(node);
 const key=(code,shiftKey=false)=>{const event={metaKey:true,code,shiftKey,preventDefault(){this.prevented=true},stopPropagation(){}};assert.equal(routeStackShortcut(event),true);assert.equal(event.prevented,true);};
 key('BracketRight',true);assert.ok(Number(a.style.zIndex)>Number(b.style.zIndex));assert.equal(node.style.zIndex,'10000');
 key('BracketLeft',true);assert.ok(Number(a.style.zIndex)<Number(b.style.zIndex));
 assert.equal(routeStackShortcut({metaKey:true,code:'BracketRight',altKey:true}),false);
 sa.dispose();sb.dispose();sn.dispose();assert.equal(routeStackShortcut({metaKey:true,code:'BracketRight'}),false);
});
