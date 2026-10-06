import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function fixture(){
 const classes=new Set(),listeners={},calls=[],ctx={save(){},restore(){},setTransform(){},clearRect(){},drawImage(){calls.push('background');}};
 const canvas={show_info:true,canvas:{width:800,height:600,ownerDocument:{defaultView:{devicePixelRatio:1}}},bgcanvas:{width:800,height:600},ctx,drawConnections(){calls.push('links');},drawGroups(){calls.push('groups');},drawFrontCanvas(){calls.push('nodes');},renderInfo(){calls.push('stats');},setDirty(){}};
 const document={documentElement:{classList:{contains:k=>classes.has(k),remove:k=>classes.delete(k),add:k=>classes.add(k),toggle(k){if(classes.has(k)){classes.delete(k);return false;}classes.add(k);return true;}}},head:{append(){}},body:{append(){}},querySelector(){},getElementById(){},createElement(){return {setAttribute(){},addEventListener(){}};}};
 let extension;const app={canvas,registerExtension:x=>extension=x},window={dispatchEvent(){},addEventListener:(key,fn)=>listeners[key]=fn};
 const context=vm.createContext({app,document,window,Element:class{},MutationObserver:class{observe(){}},Event:class{}});
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_agent/web/js/satori.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),context);extension.setup();
 const key=(code,options={})=>{const binding=extension.keybindings.find(b=>b.combo.key.toUpperCase()===code.slice(3)&&Boolean(b.combo.alt)===Boolean(options.altKey)&&Boolean(b.combo.shift)===Boolean(options.shiftKey));if(binding)extension.commands.find(c=>c.id===binding.commandId).function();};
 return {canvas,classes,calls,key,listeners};
}
test('presentation skips nodes and links but keeps output background and restores graph drawing',()=>{
 const f=fixture();f.key('KeyP',{altKey:true});assert.equal(f.classes.has('genereti-presentation'),true);assert.equal(f.canvas.show_info,false);
 f.canvas.drawFrontCanvas();f.canvas.drawConnections();f.canvas.drawGroups();assert.deepEqual(f.calls,['background']);
 f.key('KeyP',{altKey:true});f.canvas.drawFrontCanvas();f.canvas.drawConnections();assert.deepEqual(f.calls,['background','nodes','links']);assert.equal(f.canvas.show_info,true);
});
test('Satori hides diagnostics with independent stats peek and preserves normal preference',()=>{
 const f=fixture();f.key('KeyZ',{altKey:true,shiftKey:true});assert.equal(f.canvas.show_info,false);f.key('KeyI',{altKey:true,shiftKey:true});assert.equal(f.canvas.show_info,true);
 f.key('KeyZ',{altKey:true,shiftKey:true});f.key('KeyI',{altKey:true,shiftKey:true});assert.equal(f.canvas.show_info,false);f.key('KeyZ',{altKey:true,shiftKey:true});f.key('KeyZ',{altKey:true,shiftKey:true});assert.equal(f.canvas.show_info,false);
});
test('workspace commands have native bindings and scope tooltips',()=>{
 const f=fixture();f.key('KeyP',{altKey:true});assert.equal(f.classes.has('genereti-presentation'),true);
 const source=readFileSync(new URL('../integrations/genereti_comfy_agent/web/js/satori.js',import.meta.url),'utf8');assert.ok(source.includes("tooltip:'Toggle the right properties/parameters panel"));
});
