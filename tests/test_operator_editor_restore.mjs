import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('operator text restores positional legacy values and saves named text for future widget changes',()=>{
 let extension,doc='default';
 const element=()=>({style:{},append(){},setAttribute(){},addEventListener(){}});
 const context=vm.createContext({app:{registerExtension(e){extension=e;}},ensureControlStyle(){},captureEditorInput(){return ()=>{};},document:{createElement:element},Option:class{},defaultAppearance:{},createEditor(){return {state:{doc:{toString:()=>doc}},replaceDocument(text){doc=text;},destroy(){}};}});
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_p5/web/js/operator-editor.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),context);
 const node={properties:{},widgets:[],addDOMWidget(name,type,surface,options){const w={name,options};Object.defineProperty(w,'value',{get:options.getValue});this.widgets.push(w);return w;}};
 const {widget}=extension.getCustomWidgets().GENERETI_OPERATOR_TEXT(node,'guide',['STRING',{default:'default'}]);
 node.onConfigure({widgets_values:['saved lesson']});assert.equal(widget.value,'saved lesson');assert.equal(doc,'saved lesson');
 const serialized={};node.onSerialize(serialized);assert.equal(serialized.properties.generetiOperatorText.guide,'saved lesson');
 node.onConfigure({properties:{generetiOperatorText:{guide:'named lesson'}},widgets_values:['stale positional lesson']});assert.equal(widget.value,'named lesson');assert.equal(doc,'named lesson');
});

test('lesson editor play and evaluate apply the draft before running, while auto-apply stays silent',()=>{
 let extension,change,evaluate,doc='default',runs=0,seen;
 const elements=[];const element=()=>{const el={style:{},append(){},setAttribute(){},addEventListener(){}};elements.push(el);return el;};
 const context=vm.createContext({app:{registerExtension(e){extension=e;}},ensureControlStyle(){},captureEditorInput(){return ()=>{};},document:{createElement:element},Option:class{},defaultAppearance:{},createEditor(host,text,language,onChange,onEvaluate){change=onChange;evaluate=onEvaluate;return {state:{doc:{toString:()=>doc}},replaceDocument(text){doc=text;},destroy(){}};}});
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_p5/web/js/operator-editor.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),context);
 const node={comfyClass:'GeneretiDatLesson',properties:{},widgets:[],addDOMWidget(name,type,surface,options){const w={name,options};this.widgets.push(w);return w;}};
 const {widget}=extension.getCustomWidgets().GENERETI_OPERATOR_TEXT(node,'guide',['STRING',{default:'default'}]);
 node._generetiOperatorRun=()=>{runs++;seen=widget.options.getValue();};
 change('auto draft');assert.equal(runs,0);assert.equal(widget.options.getValue(),'auto draft');
 const run=elements.find(el=>el.title==='Run authored lesson · Cmd/Ctrl+Enter');run.onclick();assert.equal(runs,1);assert.equal(seen,'auto draft');
 elements.find(el=>el.title==='Apply while typing').onclick();change('held draft');assert.equal(widget.options.getValue(),'auto draft');
 evaluate();assert.equal(runs,2);assert.equal(seen,'held draft');
});
