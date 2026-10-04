import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function fixture(){
 const app={graph:{},canvas:{selected_nodes:{}}},listeners={},calls=[];
 const context=vm.createContext({app,routeStackShortcut:()=>false,window:{addEventListener:(name,fn)=>listeners[name]=fn}});
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_stream/web/js/preview-shortcuts.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export function','function'),context);
 const node={graph:app.graph},other={graph:app.graph};app.canvas.selected_nodes={1:node};
 const controls={toggleBackdrop:()=>calls.push('backdrop'),toggleOverlay:()=>calls.push('overlay'),isHovered:()=>false};
 const unregister=context.registerPreviewShortcuts(node,controls);
 const key=(code,options={})=>{const event={code,key:code.slice(3).toLowerCase(),preventDefault(){this.defaultPrevented=true;},stopPropagation(){},...options};listeners.keydown(event);return event;};
 return {app,context,node,other,controls,unregister,key,calls};
}
test('selected preview shortcuts use physical keys including Option-W',()=>{
 const f=fixture();f.key('KeyD');f.key('KeyW',{altKey:true,key:'∑'});assert.deepEqual(f.calls,['backdrop','overlay']);
 f.key('KeyD',{altKey:true});f.key('KeyW');f.key('KeyD',{repeat:true});assert.equal(f.calls.length,2);
});
test('typing, composition and modified keys remain untouched',()=>{
 const f=fixture();for(const options of [{target:{isContentEditable:true}},{composedPath:()=>[{matches:()=>true}]},{ctrlKey:true},{metaKey:true},{shiftKey:true},{isComposing:true},{defaultPrevented:true}])assert.ok(!f.key('KeyD',options).defaultPrevented||options.defaultPrevented);
 assert.deepEqual(f.calls,[]);
});
test('hovered overlay takes priority; ambiguous selection and disposed nodes do nothing',()=>{
 const f=fixture();let hover=true;f.context.registerPreviewShortcuts(f.other,{toggleOverlay:()=>f.calls.push('hovered'),isHovered:()=>hover});f.key('KeyW',{altKey:true});assert.deepEqual(f.calls,['hovered']);
 hover=false;f.app.canvas.selected_nodes={1:f.node,2:f.other};assert.equal(f.key('KeyD').defaultPrevented,undefined);
 f.app.canvas.selected_nodes={1:f.node};f.unregister();assert.equal(f.key('KeyD').defaultPrevented,undefined);
});

test('Alt-F fills selected output, prioritizes hover and Escape restores filled overlay',()=>{
 const f=fixture();let filled=false;f.controls.toggleFill=()=>{filled=!filled;f.calls.push('fill');};f.controls.isFilled=()=>filled;
 f.key('KeyF',{altKey:true,key:'ƒ'});assert.equal(filled,true);f.key('Escape',{key:'Escape'});assert.equal(filled,false);
 let otherFilled=false;f.context.registerPreviewShortcuts(f.other,{isHovered:()=>true,toggleFill:()=>{otherFilled=!otherFilled;f.calls.push('hover fill');},isFilled:()=>otherFilled});
 f.key('KeyF',{altKey:true});assert.equal(otherFilled,true);f.key('Escape',{key:'Escape'});assert.equal(otherFilled,false);assert.deepEqual(f.calls,['fill','fill','hover fill','hover fill']);
});

test('Alt-O selects output-only nodes and leaves text editing and click-through distinct',()=>{
 const f=fixture();f.controls.toggleOutputOnly=()=>f.calls.push('output');f.controls.toggleClickThrough=()=>f.calls.push('through');
 f.key('KeyO',{altKey:true});f.key('KeyO',{altKey:true,shiftKey:true});
 f.key('KeyO',{altKey:true,target:{isContentEditable:true}});
 f.context.registerPreviewShortcuts(f.other,{isOutputHovered:()=>true,toggleOutputOnly:()=>f.calls.push('hover output')});
 f.key('KeyO',{altKey:true});assert.deepEqual(f.calls,['output','through','hover output']);
});
