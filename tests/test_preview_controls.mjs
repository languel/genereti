import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('Output glyphs toggle independently, reopen with fit, and reflect external closure',async()=>{
 const viewers=[];let unregistered=false,outputOnlyToggles=0;
 const element=()=>({style:{},children:[],attributes:{},append(...items){this.children.push(...items);},addEventListener(){},setAttribute(k,v){this.attributes[k]=v;}});
 const context=vm.createContext({document:{createElement:element},Option:class{},ensureControlStyle(){},nodeOutputView(){return {close(){},toggle(){outputOnlyToggles++;},dispose(){}};},registerPreviewShortcuts(){return ()=>{unregistered=true;};},outputWindow(status,onState){const v={opens:0,closed:false,published:0,open:async()=>{v.opens++;onState(true);return true;},close(){v.closed=true;onState(false);},setFit(fit){v.fit=fit;},publish(){v.published++;},externalClose(){onState(false);}};viewers.push(v);return v;}});
 context.graphBackdrop=context.outputWindow;
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_stream/web/js/preview-controls.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export function','function'),context);
 const controls=context.previewControls({style:{}},{},{properties:{genereti_preview_fit:'cover'}});
 const [window,overlay]=controls.actions.children;
 await overlay.onclick({shiftKey:true});assert.equal(outputOnlyToggles,1);assert.equal(viewers.length,3);
 await overlay.onclick();assert.equal(overlay.attributes['aria-pressed'],'true');assert.equal(window.attributes['aria-pressed'],'false');
 await overlay.onclick();assert.equal(viewers[1].closed,true);assert.equal(overlay.attributes['aria-pressed'],'false');assert.equal(viewers[3].fit,'cover');
 await overlay.onclick();assert.equal(viewers[3].opens,1);assert.equal(overlay.attributes['aria-pressed'],'true');
 viewers[3].externalClose();assert.equal(overlay.attributes['aria-pressed'],'false');
 await window.onclick();assert.equal(window.attributes['aria-pressed'],'true');assert.equal(overlay.attributes['aria-pressed'],'false');
 controls.close();assert.equal(unregistered,true);assert.equal(window.attributes['aria-pressed'],'false');
});
