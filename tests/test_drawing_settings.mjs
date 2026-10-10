import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('../integrations/genereti_comfy_drawing/web/js/render-settings.js',import.meta.url),'utf8')).replace(/^import .*;\n/,"const SETTINGS_GLYPH='';\n");
const {renderSettings}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
class Element {
 constructor(){this.children=[];this.listeners={};this.value='';}
 append(...children){this.children.push(...children);}
 add(child){this.append(child);}
 setAttribute(name,value){this[name]=value;}
 addEventListener(type,fn){this.listeners[type]=fn;}
 blur(){document.activeElement=null;this.listeners.blur?.();}
}
globalThis.document={activeElement:null,createElement:()=>new Element()};
globalThis.Option=class extends Element {constructor(label,value){super();this.value=value;}};
test('live drawing updates preserve focused dimension drafts until commit',()=>{
 let committed;
 const settings=renderSettings(value=>committed=value);
 const panel=settings.element.children[1];
 const width=panel.children[2].children[0],height=panel.children[3].children[0];
 document.activeElement=width;width.value='7';
 settings.setValue({width:512,height:640});
 assert.equal(width.value,'7');assert.equal(height.value,640);
 width.value='768';width.onchange();width.blur();
 assert.equal(committed.width,768);assert.equal(width.value,768);
 document.activeElement=height;height.value='';
 settings.setValue({width:768,height:640});assert.equal(height.value,'');
 height.value='256';height.listeners.keydown({key:'Enter',stopPropagation(){}});
 assert.equal(committed.height,256);assert.equal(height.value,256);
});
