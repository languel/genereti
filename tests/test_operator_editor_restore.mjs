import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('operator text restores positional legacy values and saves named text for future widget changes',()=>{
 let extension,doc='default';
 const element=()=>({style:{},append(){},setAttribute(){},addEventListener(){}});
 const context=vm.createContext({app:{registerExtension(e){extension=e;}},ensureControlStyle(){},document:{createElement:element},Option:class{},defaultAppearance:{},createEditor(){return {state:{doc:{toString:()=>doc}},replaceDocument(text){doc=text;},destroy(){}};}});
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_p5/web/js/operator-editor.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),context);
 const node={properties:{},widgets:[],addDOMWidget(name,type,surface,options){const w={name,options};Object.defineProperty(w,'value',{get:options.getValue});this.widgets.push(w);return w;}};
 const {widget}=extension.getCustomWidgets().GENERETI_OPERATOR_TEXT(node,'guide',['STRING',{default:'default'}]);
 node.onConfigure({widgets_values:['saved lesson']});assert.equal(widget.value,'saved lesson');assert.equal(doc,'saved lesson');
 const serialized={};node.onSerialize(serialized);assert.equal(serialized.properties.generetiOperatorText.guide,'saved lesson');
 node.onConfigure({properties:{generetiOperatorText:{guide:'named lesson'}},widgets_values:['stale positional lesson']});assert.equal(widget.value,'named lesson');assert.equal(doc,'named lesson');
});
