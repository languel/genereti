import * as THREE from 'three';
import {initStrudel,hush} from '@strudel/web';
import {evalScope,Pattern,pure,isPattern} from '@strudel/core';
import {Drawer,cleanupDraw} from '@strudel/draw';
import {slider,sliderWithID} from '@strudel/codemirror';
import {createEditor,appearanceValues} from './editor.js';
import {domSurface} from './dom-capture.js';
import {marked} from 'marked';
import DOMPurify from 'dompurify';
import {getAudioContext} from 'superdough';

const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
const send=(type,extra={})=>parent.postMessage({type,...extra},'*',extra.bitmap?[extra.bitmap]:[]);
let appearance={},strudelEditor=null,strudelRoot=null,strudelDrawer=null,strudelCanvas=null,strudelRepl=null,strudelMeta=null,strudelDrawerRunning=false;
let strudelInit=null,newestRevision=0,compileQueue=Promise.resolve();
let render={width:512,height:512},lastSize='';
let active=null,candidate=null,users=false,pending=false,raf=0,startTime=performance.now();
const diagnostic=error=>send('error',{message:String(error?.message||error)});
function dispose(runtime){try{runtime?.dispose?.();}catch(error){diagnostic(error);}}
function activate(runtime){const old=active;active=runtime;candidate=null;document.body.replaceChildren(runtime.canvas);dispose(old);send('ready',{width:runtime.canvas.width,height:runtime.canvas.height});}
window.addEventListener('error',e=>{diagnostic(e.error||e.message);if(candidate){dispose(candidate);candidate=null;}});
window.addEventListener('unhandledrejection',e=>diagnostic(e.reason));
async function compile(mode,source,revision){
 try{
  if(mode==='p5'){
   // Classic p5 code is evaluated before the candidate is instantiated.
   const create=new Function('p',`with(p){${source}\nreturn {setup:typeof setup==='function'?setup:null,draw:typeof draw==='function'?draw:null,keyPressed:typeof keyPressed==='function'?keyPressed:null};}`);
   let instance,setupDone=false,drawDone=false;
   const runtime={canvas:null,dispose(){instance?.remove();}};candidate=runtime;
   instance=new window.p5(p=>{p.pixelDensity(1);p.windowWidth=render.width;p.windowHeight=render.height;const callbacks=create(p);p.setup=()=>{try{callbacks.setup?.();runtime.canvas=p.canvas;setupDone=true;}catch(error){dispose(runtime);candidate=null;diagnostic(error);}};p.draw=()=>{try{callbacks.draw?.();if(setupDone&&!drawDone){drawDone=true;if(!runtime.canvas)throw Error('Sketch must create a canvas');activate(runtime);}}catch(error){p.noLoop();diagnostic(error);if(active!==runtime){dispose(runtime);candidate=null;}}};if(callbacks.keyPressed)p.keyPressed=callbacks.keyPressed;},document.querySelector('#staging'));
  }else if(mode==='glsl'){
   const c=canvas.cloneNode();c.width=render.width;c.height=render.height;const gl=c.getContext('webgl',{preserveDrawingBuffer:true});if(!gl)throw Error('WebGL unavailable');
   const shaders=[];let program;
   try{for(const [type,code] of [[gl.VERTEX_SHADER,'attribute vec2 position;void main(){gl_Position=vec4(position,0,1);}'],[gl.FRAGMENT_SHADER,source]]){const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,code);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));}
    program=gl.createProgram();shaders.forEach(s=>gl.attachShader(program,s));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
   }catch(error){if(program)gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));throw error;}
   shaders.forEach(s=>gl.deleteShader(s));gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
   let mouse=[0,0];c.onpointermove=e=>{const r=c.getBoundingClientRect();mouse=[(e.clientX-r.left)*c.width/r.width,(r.bottom-e.clientY)*c.height/r.height];};
   const runtime={canvas:c,paint(time){gl.viewport(0,0,c.width,c.height);gl.uniform2f(gl.getUniformLocation(program,'u_resolution'),c.width,c.height);gl.uniform1f(gl.getUniformLocation(program,'u_time'),time);gl.uniform2f(gl.getUniformLocation(program,'u_mouse'),...mouse);gl.drawArrays(gl.TRIANGLES,0,6);},dispose(){gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}};runtime.paint(0);activate(runtime);
  }else if(mode==='three'){
   const renderer=new THREE.WebGLRenderer({preserveDrawingBuffer:true,antialias:true});renderer.setSize(render.width,render.height);const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(50,render.width/render.height,.1,100);camera.position.z=4;let callback=()=>{};
   const runtime={canvas:renderer.domElement,paint(time){callback(time);renderer.render(scene,camera);},dispose(){scene.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m?.dispose();});renderer.dispose();renderer.forceContextLoss();}};
   try{new Function('THREE','scene','camera','renderer','tick',source)(THREE,scene,camera,renderer,fn=>callback=fn);runtime.paint(0);activate(runtime);}catch(error){dispose(runtime);throw error;}
  }else if(mode==='html'||mode==='markdown'){
   const root=document.createElement('main');root.style.cssText=`width:${render.width}px;height:${render.height}px;overflow:auto;box-sizing:border-box;position:relative;flex-shrink:0`;
   if(mode==='markdown'){
    const p=appearanceValues(appearance);root.style.cssText+=`;padding:28px;background:${p.background};color:${p.foreground};font:18px/1.6 system-ui;`;
    root.innerHTML=DOMPurify.sanitize(marked.parse(source));
   }else{
    const doc=new DOMParser().parseFromString(source,'text/html');
    // Scripts run only in the isolated preview, never in the Comfy document.
    root.innerHTML=doc.head.innerHTML+doc.body.innerHTML;
   }
   const runtime={root,canvas:null,surface:domSurface(root,render),dispose(){root.remove();}};
   const old=active;active=runtime;document.body.replaceChildren(root);dispose(old);
   for(const script of root.querySelectorAll('script')){const replacement=document.createElement('script');for(const attr of script.attributes)replacement.setAttribute(attr.name,attr.value);replacement.textContent=script.textContent;script.replaceWith(replacement);}
   if(mode==='html'&&getComputedStyle(root).backgroundColor==='rgba(0, 0, 0, 0)')root.style.backgroundColor=getComputedStyle(document.body).backgroundColor;
   fitDom();applyAppearance();runtime.canvas=await runtime.surface(true);send('ready',{source,revision,width:active.canvas.width,height:active.canvas.height});
  }else if(mode==='strudel'){
   if(!strudelInit){
    strudelRoot=document.createElement('main');strudelRoot.style.cssText=`width:${render.width}px;height:${render.height}px;overflow:auto;flex-shrink:0`;
    strudelCanvas=canvas.cloneNode();strudelCanvas.width=render.width;strudelCanvas.height=200;strudelCanvas.id='test-canvas';strudelCanvas.style.cssText=`width:${render.width}px;height:200px`;
    const editorHost=document.createElement('div');strudelRoot.append(editorHost,strudelCanvas);
    strudelEditor=createEditor(editorHost,source,'strudel',code=>send('draft',{source:code}),()=>{const code=strudelEditor.state.doc.toString();newestRevision++;compileQueue=compileQueue.then(()=>compile('strudel',code,newestRevision));},appearance);
    strudelEditor.dom.style.height=Math.max(64,render.height-200)+'px';
    strudelInit=initStrudel({onEvalError:error=>{throw error;},afterEval:({meta})=>{strudelMeta=meta;strudelEditor.setStrudelVisuals(meta);},onToggle:started=>{if(started&&!strudelDrawerRunning&&strudelDrawer){strudelDrawer.start(strudelRepl.scheduler);strudelDrawerRunning=true;}else if(!started){strudelDrawer?.stop();strudelDrawerRunning=false;}}}).then(async repl=>{
     strudelRepl=repl;
     // Preserve raw CSS instead of interpreting it as mini notation (Underscores).
     const markcss=(value,pattern)=>{const control=pure({markcss:String(value??'')});return isPattern(pattern)?pattern.set(control):control;};
     Pattern.prototype.markcss=function(value){return markcss(value,this);};
     await evalScope({slider,sliderWithID,markcss});
     strudelDrawer=new Drawer((haps,time,_,painters)=>{strudelEditor?.setStrudelVisuals(null,haps.filter(h=>h.isActive(time)),time);const ctx=strudelCanvas.getContext('2d');const p=appearanceValues(appearance);ctx.fillStyle=p.background;ctx.fillRect(0,0,strudelCanvas.width,strudelCanvas.height);painters?.forEach(paint=>paint(ctx,time,haps,[-2,2]));},[-2,2]);
     return repl;
    });
   }
   await strudelInit;if(revision!==newestRevision)return;
   // Native REPL compiles labels/all/each before replacing the scheduler pattern.
   await strudelRepl.evaluate(source);if(revision!==newestRevision)return;
   if(strudelEditor.state.doc.toString()!==source)strudelEditor.dispatch({changes:{from:0,to:strudelEditor.state.doc.length,insert:source}});
   if(!strudelDrawerRunning){strudelDrawer.start(strudelRepl.scheduler);strudelDrawerRunning=true;}
   const old=active;active={audio:true,root:strudelRoot,canvas:old?.canvas||canvas.cloneNode(),surface:domSurface(strudelRoot,render),dispose(){strudelDrawer?.stop();strudelDrawerRunning=false;strudelRepl?.stop();try{cleanupDraw(false);}catch{}strudelEditor?.destroy();}};
   document.body.replaceChildren(strudelRoot);fitDom();applyAppearance();if(getAudioContext().state!=='running')document.body.append(audioButton);
   active.canvas=await active.surface(true);send('ready',{source,revision,width:active.canvas.width,height:active.canvas.height});send('audio-state',{state:getAudioContext().state});

  }
 }catch(error){diagnostic(error);}
}

async function tick(now){raf=requestAnimationFrame(tick);try{active?.paint?.((now-startTime)/1000);}catch(error){diagnostic(error);active.paint=null;}
 if(active?.canvas){const size=active.canvas.width+'x'+active.canvas.height;if(size!==lastSize){lastSize=size;send('size',{width:active.canvas.width,height:active.canvas.height});}}
 if(users&&active?.canvas&&!pending){pending=true;try{if(active.surface)active.canvas=await active.surface();const bitmap=await createImageBitmap(active.canvas);send('live-frame',{bitmap});}catch(error){pending=false;diagnostic(error);}}
}
// Transfer ownership rather than cloning every frame.
window.addEventListener('message',async e=>{if(e.source!==parent)return;const d=e.data;
 if(d.type==='compile'){render={width:512,height:512,...d.render};newestRevision=d.revision;compileQueue=compileQueue.then(()=>{if(d.revision===newestRevision)return compile(d.mode,d.source,d.revision);});}
 if(d.type==='live-start')users=true;if(d.type==='live-stop')users=false;if(d.type==='live-ack')pending=false;
 if(d.type==='appearance'){appearance=d.appearance||{};applyAppearance();}
 if(d.type==='capture'){try{if(active.surface)active.canvas=await active.surface(true);send('capture',{data:active.canvas.toDataURL('image/png'),id:d.id});}catch(error){send('capture-error',{message:error.message,id:d.id});}}
 if(d.type==='dispose'){users=false;cancelAnimationFrame(raf);dispose(active);dispose(candidate);active=null;candidate=null;}
 if(d.type==='stop')stopRuntime();
});
const audioButton=document.createElement('button');audioButton.textContent='Enable audio';audioButton.onclick=async()=>{try{await getAudioContext().resume();audioButton.remove();send('audio-state',{state:getAudioContext().state});}catch(error){diagnostic(error);}};
function stopRuntime(){users=false;cancelAnimationFrame(raf);const frozen=document.createElement('canvas');if(active?.canvas){frozen.width=active.canvas.width;frozen.height=active.canvas.height;frozen.getContext('2d').drawImage(active.canvas,0,0);}dispose(active);active={canvas:frozen};strudelInit=null;strudelEditor=null;strudelRoot=null;document.body.replaceChildren(frozen);send('stopped');}
window.addEventListener('keydown',event=>{if(event.isComposing)return;if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();event.stopImmediatePropagation();if(parent!==window)send('request-run');else{const d=window.__GENERETI_STANDALONE__;newestRevision++;raf=requestAnimationFrame(tick);compile(d.mode,d.source,newestRevision);}}else if((event.ctrlKey||event.metaKey)&&(event.key==='.'||event.code==='Period')){event.preventDefault();event.stopImmediatePropagation();stopRuntime();}},true);
function fitDom(){if(active?.root)active.root.style.transform=`scale(${Math.min(1,innerWidth/render.width,innerHeight/render.height)})`;}
window.addEventListener('resize',fitDom);
function applyAppearance(){const p=appearanceValues(appearance);strudelEditor?.setAppearance(appearance);if(strudelRoot){strudelRoot.style.background=p.background;strudelRoot.style.color=p.foreground;}let style=document.getElementById('custom-style');if(!style){style=document.createElement('style');style.id='custom-style';document.head.append(style);}style.textContent=appearance.css||'';}
requestAnimationFrame(tick);send('boot');
if(window.__GENERETI_STANDALONE__){const d=window.__GENERETI_STANDALONE__;appearance=d.appearance||{};render={width:512,height:512,...d.render};newestRevision=1;compile(d.mode,d.source,1);}
