import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('iframe freeze retains selected fit and isolates frozen state from the producer',async()=>{
 const element=tag=>({tag,style:{},children:[],attributes:{},append(e){this.children.push(e);},setAttribute(k,v){this.attributes[k]=v;},remove(){this.removed=true;}});
 const frame=element('iframe'),surface=element('div');surface.querySelectorAll=()=>[frame];
 let captures=0,resizes=0;const context=vm.createContext({ensureControlStyle(){},document:{createElement:element}});
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_p5/web/js/preview-state.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export function','function'),context);
 const p=context.previewState({},surface,{capture:async()=>{captures++;return 'data:image/png;base64,test';},getFit:()=> 'cover',resize:()=>resizes++});
 await p.actions.children[1].onclick();assert.equal(p.frozen,true);assert.equal(p.visible,false);
 const layer=surface.children[0],image=layer.children[0];assert.equal(image.style.objectFit,'cover');assert.equal(frame.style.pointerEvents,'none');
 p.setFit('native');assert.equal(image.style.objectFit,'none');
 await p.actions.children[1].onclick();assert.equal(p.frozen,false);assert.equal(layer.removed,true);assert.equal(captures,1);assert.equal(resizes,2);
});
