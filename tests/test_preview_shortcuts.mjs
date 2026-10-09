import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function fixture(){
 const app={graph:{},canvas:{selected_nodes:{}}},listeners={},calls=[],bindings=new Map(),commands=new Map();
 app.registerExtension=extension=>{for(const c of extension.commands)commands.set(c.id,c.function);for(const b of extension.keybindings)bindings.set(`${b.combo.key.toUpperCase()}:false:${Boolean(b.combo.alt)}:${Boolean(b.combo.shift)}`,b);};
 app.extensionManager={_p:{_s:new Map([['keybinding',{getKeybinding:key=>bindings.get(key.serialize())}]])},command:{execute:id=>{commands.get(id)?.();return Promise.resolve();}}};
 const context=vm.createContext({app,console,document:{getElementById:()=>null},moveActiveView:()=>false,window:{addEventListener:(name,fn)=>listeners[name]=fn}});
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_stream/web/js/keybinding-router.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export function','function'),context);
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_stream/web/js/preview-shortcuts.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export function','function'),context);
 const node={graph:app.graph},other={graph:app.graph};app.canvas.selected_nodes={1:node};
 const controls={toggleBackdrop:()=>calls.push('backdrop'),toggleOverlay:()=>calls.push('overlay'),isHovered:()=>false};
 const unregister=context.registerPreviewShortcuts(node,controls);
 const key=(code,options={})=>{const event={code,key:code.slice(3).toLowerCase(),preventDefault(){this.defaultPrevented=true;},stopPropagation(){},stopImmediatePropagation(){},...options};listeners.keydown(event);return event;};
 return {app,context,node,other,controls,unregister,key,calls,listeners};
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
 hover=false;f.app.canvas.selected_nodes={1:f.node,2:f.other};f.key('KeyD');assert.deepEqual(f.calls,['hovered']);
 f.app.canvas.selected_nodes={1:f.node};f.unregister();f.key('KeyD');assert.deepEqual(f.calls,['hovered']);
});

test('Alt-F fills selected output, prioritizes hover and Escape restores filled overlay',()=>{
 const f=fixture();let filled=false;f.controls.toggleFill=()=>{filled=!filled;f.calls.push('fill');};f.controls.isFilled=()=>filled;
 f.key('KeyF',{altKey:true,key:'ƒ'});assert.equal(filled,true);f.key('Escape',{key:'Escape'});assert.equal(filled,false);
 let otherFilled=false;f.context.registerPreviewShortcuts(f.other,{isHovered:()=>true,toggleFill:()=>{otherFilled=!otherFilled;f.calls.push('hover fill');},isFilled:()=>otherFilled});
 f.key('KeyF',{altKey:true});assert.equal(otherFilled,true);f.key('Escape',{key:'Escape'});assert.equal(otherFilled,false);assert.deepEqual(f.calls,['fill','fill','hover fill','hover fill']);
});

test('Alt-O selects output-only nodes and leaves text editing and click-through distinct',()=>{
 const f=fixture();f.controls.toggleOutputOnly=()=>f.calls.push('output');f.controls.toggleClickThrough=()=>f.calls.push('through');
 f.key('KeyO',{altKey:true});f.key('KeyC',{altKey:true,shiftKey:true});
 f.key('KeyO',{altKey:true,target:{isContentEditable:true}});
 f.context.registerPreviewShortcuts(f.other,{isOutputHovered:()=>true,toggleOutputOnly:()=>f.calls.push('hover output')});
 f.key('KeyO',{altKey:true});assert.deepEqual(f.calls,['output','through','hover output']);
});

test('Alt-W carries the latest viewport cursor location to the selected overlay',()=>{
 const f=fixture();let options;f.controls.toggleOverlay=value=>options=value;
 f.listeners.pointermove({clientX:140,clientY:230});f.key('KeyW',{altKey:true});
 assert.equal(options.position.x,140);assert.equal(options.position.y,230);
});

test('native remapping and removal replace the original default',()=>{
 const f=fixture(),store=f.app.extensionManager._p._s.get('keybinding');
 store.getKeybinding=combo=>combo.serialize()==='B:false:false:false'?{commandId:'Genereti.Backdrop'}:undefined;
 f.key('KeyD');assert.deepEqual(f.calls,[]);f.key('KeyB');assert.deepEqual(f.calls,['backdrop']);
 store.getKeybinding=()=>undefined;f.key('KeyB');assert.deepEqual(f.calls,['backdrop']);
});
test('blank-canvas Pin binding toggles parameters, selected items keep native Pin',()=>{
 const f=fixture(),store=f.app.extensionManager._p._s.get('keybinding');let executed=[];
 store.getKeybinding=()=>({commandId:'Comfy.Canvas.ToggleSelected.Pin',targetElementId:'graph-canvas-container'});
 vm.runInContext("document.getElementById=()=>({contains:()=>true})",f.context);
 f.app.extensionManager.command.execute=id=>{executed.push(id);return Promise.resolve();};
 f.key('KeyP');assert.deepEqual(executed,[]);
 f.app.canvas.selected_nodes={};f.key('KeyP');assert.deepEqual(executed,['Genereti.TogglePropertiesPanel']);
 f.app.canvas.selectedItems=new Set([{}]);f.key('KeyP');assert.equal(executed.length,1);
 f.app.canvas.selectedItems.clear();f.key('KeyP',{target:{isContentEditable:true}});assert.equal(executed.length,1);
});
test('dialogs and another native command on the same key take priority',()=>{
 const f=fixture(),store=f.app.extensionManager._p._s.get('keybinding');
 f.key('KeyW',{altKey:true,target:{closest:()=>true}});assert.deepEqual(f.calls,[]);
 store.getKeybinding=()=>({commandId:'Other.Extension'});f.key('KeyW',{altKey:true,key:'∑'});assert.deepEqual(f.calls,[]);
});

test('performance view opens all registered visual nodes together and restores them',()=>{
 const f=fixture();f.node.properties={genereti_output_only:true};f.other.properties={genereti_output_only:false};
 f.controls.toggleOutputOnly=()=>{f.node.properties.genereti_output_only=!f.node.properties.genereti_output_only;f.calls.push('first');};
 f.context.registerPreviewShortcuts(f.other,{toggleOutputOnly:()=>{f.other.properties.genereti_output_only=!f.other.properties.genereti_output_only;f.calls.push('second');}});
 f.key('KeyV',{altKey:true,shiftKey:true,key:'◊'});assert.deepEqual(f.calls,['second']);assert.equal(f.other.properties.genereti_output_only,true);
 f.key('KeyO',{altKey:true,shiftKey:true,key:'Ø'});assert.deepEqual(f.calls,['second','first','second']);assert.equal(f.node.properties.genereti_output_only,false);assert.equal(f.other.properties.genereti_output_only,false);
 f.key('KeyV',{altKey:true,shiftKey:true,target:{isContentEditable:true}});assert.equal(f.calls.length,3);
});

test('Alt-O prefers an unselected node anywhere under the pointer',()=>{
 const f=fixture();f.node.id=1;f.other.id=2;
 f.controls.toggleOutputOnly=()=>f.calls.push('selected');
 f.context.registerPreviewShortcuts(f.other,{toggleOutputOnly:()=>f.calls.push('hovered')});
 f.context.document.elementFromPoint=()=>({closest:()=>({dataset:{nodeId:'2'}})});
 f.listeners.pointermove({clientX:300,clientY:200});f.key('KeyO',{altKey:true});assert.deepEqual(f.calls,['hovered']);
 f.context.document.elementFromPoint=()=>({closest:()=>null});f.key('KeyO',{altKey:true});assert.deepEqual(f.calls,['hovered','selected']);
});
