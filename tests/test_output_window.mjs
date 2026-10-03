import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function fixture(desktop=false){
 const panels=[],popups=[],draws=[],nativeFrames=[];let nativeOpens=0;
 const element=tag=>({tag,style:{},children:[],attributes:{},append(...items){this.children.push(...items);},replaceChildren(){},addEventListener(){},removeEventListener(){},moveBefore(child){this.children.push(child);child.parentNode=this;},remove(){this.removed=true;},getContext(type,options){this.contextOptions=options;return {clearRect(){},drawImage(image){draws.push(image);}};},setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return this.attributes[k];},removeAttribute(k){delete this.attributes[k];},setPointerCapture(){}});
 const doc=()=>({title:'',documentElement:element('html'),body:element('body'),head:element('head'),removeEventListener(){},createElement(tag){const e=element(tag);if(tag==='iframe')e.contentWindow=target();return e;},addEventListener(){}});
 const target=()=>({document:doc(),Option:class{},addEventListener(){},focus(){},close(){this.closed=true;}});
 const document=doc();document.body.append=e=>panels.push(e);
 const window={open(){const w=target();popups.push(w);return w;},...(desktop?{__comfyDesktop2:{},documentPictureInPicture:{requestWindow:async()=>{throw new Error('Not allowed by this host');}}}:{})};
 const context=vm.createContext({nativeOutput:()=>({open:async()=>{nativeOpens++;return true;},publish:frame=>nativeFrames.push(frame),setFit(){},close(){}}),document,window,navigator:{userAgent:desktop?'Electron':'Chrome'},crypto:{randomUUID:()=> 'test'},performance});
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_stream/web/js/overlay-shell.js',import.meta.url),'utf8').replace('export function','function'),context);
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_stream/web/js/output-window.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export function','function'),context);
 const status={textContent:''};return {shell:(frame,layout,onClose)=>context.overlayShell(frame,layout,onClose),make:(layout)=>context.outputWindow(status,undefined,layout),status,panels,popups,draws,nativeFrames,nativeOpens:()=>nativeOpens};
}

test('separate window and explicit overlay coexist and both draw the current frame',async()=>{
 const f=fixture(),window=f.make(),overlay=f.make();
 assert.equal(await window.open(),true);assert.equal(await overlay.open({overlay:true}),true);
 assert.equal(f.popups.length,1);assert.equal(f.panels.length,1);assert.notEqual(window.window,overlay.window);
 const bitmap={width:32,height:24};window.publish({bitmap});overlay.publish({bitmap});assert.equal(f.draws.length,2);
 overlay.close();assert.equal(f.panels[0].removed,true);assert.equal(Boolean(f.popups[0].closed),false);window.close();assert.equal(f.popups[0].closed,true);
});

test('Desktop uses the native companion while the overlay stays in the host',async()=>{
 const f=fixture(true),window=f.make();assert.equal(await window.open(),true);
 assert.equal(f.nativeOpens(),1);assert.equal(f.panels.length,0);assert.equal(f.popups.length,0);
 const bitmap={width:32,height:24};window.publish({bitmap});assert.equal(f.nativeFrames[0].bitmap,bitmap);
 const overlay=f.make();assert.equal(await overlay.open({overlay:true}),true);assert.equal(f.panels.length,1);assert.equal(f.nativeOpens(),1);overlay.close();window.close();
});

test('Overlay defaults to content-only chrome and exposes a borderless keep-visible toggle',async()=>{
 const f=fixture(),overlay=f.make();await overlay.open({overlay:true});const panel=f.panels[0];
 assert.equal(panel.getAttribute('data-chrome'),'auto');
 const header=panel.children.find(e=>e.className==='output-header');const pin=header.children.find(e=>e.title==='Keep output controls visible'),close=header.children.find(e=>e.title==='Close output');
 assert.equal(close.getAttribute('aria-label'),'Close output');
 pin.onclick();assert.equal(panel.getAttribute('data-chrome'),'visible');assert.equal(pin.getAttribute('aria-pressed'),'true');
 pin.onclick();assert.equal(panel.getAttribute('data-chrome'),'auto');
 assert.match(panel.children[0].textContent,/background:transparent/);
 const frame=panel.children.find(e=>e.tag==='iframe');assert.match(frame.style.cssText,/height:100%/);
 overlay.close();
});

test('Overlay opacity, position lock and click-through leave outside controls recoverable',async()=>{
 const f=fixture(),overlay=f.make();await overlay.open({overlay:true});const panel=f.panels[0];
 const header=panel.children.find(e=>e.className==='output-header'),frame=panel.children.find(e=>e.tag==='iframe');
 const opacity=header.children.find(e=>e.tag==='input');opacity.value='40';opacity.oninput();assert.equal(frame.style.opacity,'0.4');
 const lock=header.children.find(e=>e.title==='Lock output position and size');lock.onclick();assert.equal(lock.getAttribute('aria-pressed'),'true');
 header.onpointerdown({target:header,clientX:0,clientY:0});header.onpointermove({clientX:20,clientY:20});assert.equal(panel.style.left,undefined);
 const through=header.children.find(e=>e.title?.startsWith('Click through'));through.onclick();assert.equal(frame.style.pointerEvents,'none');assert.equal(panel.style.pointerEvents,'none');
 assert.ok(panel.children.filter(e=>e.className==='output-edge').every(e=>e.style.cssText.includes('pointer-events:auto')));
 through.onclick();assert.equal(frame.style.pointerEvents,'auto');overlay.close();
});

test('Output canvas preserves alpha and letterbox space has no opaque backing',async()=>{
 const f=fixture(),overlay=f.make();await overlay.open({overlay:true});const doc=overlay.window.document;
 const canvas=doc.body.children.find(e=>e.tag==='canvas');assert.equal(canvas.contextOptions.alpha,true);
 assert.match(doc.documentElement.style.cssText,/background:transparent/);assert.match(doc.body.style.cssText,/background:transparent/);
 const iframe=f.panels[0].children.find(e=>e.tag==='iframe');assert.match(iframe.style.cssText,/color-scheme:normal/);
 overlay.publish({bitmap:{width:32,height:32}});assert.equal(f.draws.length,1);overlay.close();
});

test('Overlay reuses remembered geometry on reopen',async()=>{
 const f=fixture(),layout={};
 // Construct directly with shared node layout to model recreation by the toggle.
 // The test fixture exposes the same outputWindow factory below.
 const first=f.make(layout);await first.open({overlay:true});const panel=f.panels[0];
 Object.assign(panel,{offsetLeft:123,offsetTop:234,offsetWidth:456,offsetHeight:345});first.close();
 const next=f.make(layout);await next.open({overlay:true});assert.equal(f.panels[1].style.left,'123px');assert.equal(f.panels[1].style.height,'345px');next.close();
});

 test('Interactive overlay moves and restores the same iframe without replacing its runtime',()=>{
 const f=fixture(),moves=[];let closed=0;
 const originalParent={isConnected:true,moveBefore(frame,next){moves.push([frame,next]);frame.parentNode=this;}};
 const next={parentNode:originalParent},runtime={};
 const frame={isConnected:true,parentNode:originalParent,nextSibling:next,contentWindow:runtime,style:{cssText:'height:560px'},addEventListener(){},removeEventListener(){}};
 const shell=f.shell(frame,{},()=>closed++);
 assert.equal(frame.parentNode,shell.element);assert.equal(frame.contentWindow,runtime);
 shell.close();shell.close();assert.equal(closed,1);assert.equal(moves.length,1);assert.equal(moves[0][1],next);
 assert.equal(frame.parentNode,originalParent);assert.equal(frame.style.cssText,'height:560px');assert.equal(frame.contentWindow,runtime);
 });
