import {performanceBridge} from './performance-bridge.js';
import {resizeP5} from './render-sizing.js';
import {firstPaintFallback} from './first-paint.js';
import {parseParameters,parameterValues,prepareParameterSource} from '../web/js/code-parameters.js';
import * as THREE from 'three';
import {initStrudel,hush} from '@strudel/web';
import {evalScope,Pattern,pure,isPattern} from '@strudel/core';
import {Drawer,cleanupDraw} from '@strudel/draw';
import {slider,sliderWithID} from '@strudel/codemirror';
import {createEditor,appearanceValues} from './editor.js';
import {domSurface} from './dom-capture.js';
import {markdownWithMath,formula,katex,ensureMathStyle,renderHtmlMath} from './math.js';
import mathCss from 'genereti:math-css';
import {tixyRuntime,playcoreRuntime,orcaRuntime} from './grid-runtimes.js';
import {manimRuntime} from './manim-runtime.js';
import {compositionClock} from './composition-clock.js';
import DOMPurify from 'dompurify';
import {glslSource} from './glsl-source.js';
import {getAudioContext} from 'superdough';

const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
const send=(type,extra={})=>parent.postMessage({type,...extra},'*',extra.bitmap?[extra.bitmap]:[]);
let appearance={},strudelEditor=null,strudelRoot=null,strudelDrawer=null,strudelCanvas=null,strudelRepl=null,strudelMeta=null,strudelDrawerRunning=false;
let strudelInit=null,newestRevision=0,compileQueue=Promise.resolve();
let responsiveDisplay=false;
let render={width:512,height:512},lastSize='';
let active=null,candidate=null,users=false,pending=false,raf=0,startTime=performance.now();
// One persistent texture surface; input frames never recompile the sketch.
const inputCanvas=document.createElement('canvas');inputCanvas.width=inputCanvas.height=1;
const bridge=window.__={params:Object.create(null),image:inputCanvas,inputSize:{width:0,height:0},render};
const sharedTime=performanceBridge(bridge,(type,values)=>send(type,values));
window.katex=katex;window.renderMathInElement=renderHtmlMath;ensureMathStyle(mathCss);
let definitions=[],inputVersion=0;
function setParameters(values){Object.assign(bridge.params,parameterValues(definitions,values));active?.changed?.();window.dispatchEvent(new CustomEvent('genereti-parameters',{detail:bridge.params}));}
function configureSource(source,mode,values){definitions=parseParameters(source);bridge.params=parameterValues(definitions,values);bridge.render=render;window.windowWidth=render.width;window.windowHeight=render.height;
 for(const p of definitions)if(!Object.getOwnPropertyDescriptor(window,p.name)||Object.getOwnPropertyDescriptor(window,p.name).configurable)Object.defineProperty(window,p.name,{configurable:true,get:()=>bridge.params[p.name]});
 return prepareParameterSource(source,mode,definitions);
}
function updateInput(bitmap){if(inputCanvas.width!==bitmap.width||inputCanvas.height!==bitmap.height){inputCanvas.width=bitmap.width;inputCanvas.height=bitmap.height;}const ctx=inputCanvas.getContext('2d');ctx.clearRect(0,0,bitmap.width,bitmap.height);ctx.drawImage(bitmap,0,0);bridge.inputSize.width=bitmap.width;bridge.inputSize.height=bitmap.height;inputVersion++;active?.changed?.();window.dispatchEvent(new CustomEvent('genereti-image',{detail:bridge.image}));}
// Offscreen sandbox frames can have their rAF clock throttled. A queued
// handshake must still complete; capture explicitly paints the current surface.
const nextPaint=()=>new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);resolve();};const timer=setTimeout(finish,120);requestAnimationFrame(()=>requestAnimationFrame(finish));});
function interpolate(source){return source.replace(/\{\{\s*(params\.\w+|render\.(?:width|height)|inputSize\.(?:width|height))\s*\}\}/g,(_,path)=>{const [group,key]=path.split('.');return String(bridge[group]?.[key]??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));});}
const diagnostic=error=>send('error',{message:String(error?.message||error)});
function dispose(runtime){try{runtime?.dispose?.();}catch(error){diagnostic(error);}}
function activate(runtime){const old=active;active=runtime;candidate=null;document.body.replaceChildren(runtime.canvas);dispose(old);send('ready',{width:runtime.canvas.width,height:runtime.canvas.height});}
window.addEventListener('error',e=>{diagnostic(e.error||e.message);if(candidate){dispose(candidate);candidate=null;}});
window.addEventListener('unhandledrejection',e=>diagnostic(e.reason));
async function compile(mode,source,revision,values={}){
 const originalSource=source;source=configureSource(source,mode,values);
 try{
  if(mode==='p5'){
   // Classic p5 code is evaluated before the candidate is instantiated.
   const inputCallbacks=['keyPressed','keyReleased','keyTyped','mousePressed','mouseReleased','mouseClicked','doubleClicked','mouseMoved','mouseDragged','mouseWheel','touchStarted','touchMoved','touchEnded'];
   const create=new Function('p',`with(p){${source}\nreturn {setup:typeof setup==='function'?setup:null,draw:typeof draw==='function'?draw:null,${inputCallbacks.map(name=>name+":typeof "+name+"==='function'?"+name+":null").join(',')},windowResized:typeof windowResized==='function'?windowResized:null};}`);
   let instance,setupDone=false,drawDone=false,imageVersion=-1,p5Image,lastDraw=0,cancelFirstPaint=()=>{};


   const runtime={canvas:null,resize(size){resizeP5(instance,size);runtime.canvas=instance.canvas;},sample(){if(instance?.isLooping()&&performance.now()-lastDraw>50)instance.redraw();},changed(){instance?.redraw();},dispose(){cancelFirstPaint();instance?.remove();}};candidate=runtime;
   instance=new window.p5(p=>{p.pixelDensity(1);p.windowWidth=render.width;p.windowHeight=render.height;Object.defineProperty(p,'inputImage',{get(){if(!bridge.inputSize.width)return null;if(imageVersion!==inputVersion){if(!p5Image||p5Image.width!==inputCanvas.width||p5Image.height!==inputCanvas.height)p5Image=p.createImage(inputCanvas.width,inputCanvas.height);p5Image.drawingContext.clearRect(0,0,p5Image.width,p5Image.height);p5Image.drawingContext.drawImage(inputCanvas,0,0);imageVersion=inputVersion;}return p5Image;}});const callbacks=create(p);p._generetiWindowResized=callbacks.windowResized;p.windowResized=()=>{};p.setup=()=>{try{p.windowWidth=render.width;p.windowHeight=render.height;callbacks.setup?.();runtime.canvas=p.canvas;setupDone=true;cancelFirstPaint=firstPaintFallback(()=>p.redraw(),()=>candidate===runtime&&setupDone&&!drawDone);}catch(error){dispose(runtime);candidate=null;diagnostic(error);}};p.draw=()=>{try{callbacks.draw?.();lastDraw=performance.now();if(setupDone&&!drawDone){drawDone=true;cancelFirstPaint();if(!runtime.canvas)throw Error('Sketch must create a canvas');activate(runtime);}}catch(error){p.noLoop();diagnostic(error);if(active!==runtime){dispose(runtime);candidate=null;}}};for(const name of inputCallbacks)if(callbacks[name])p[name]=callbacks[name];},document.querySelector('#staging'));
  }else if(mode==='tixy'||mode==='playcore'||mode==='orca'){
   const runtime=({tixy:tixyRuntime,playcore:playcoreRuntime,orca:orcaRuntime})[mode](source,bridge);runtime.paint(0);activate(runtime);
  }else if(mode==='manim'){
   const runtime=await manimRuntime(source,bridge,send);const old=active;active=runtime;candidate=null;document.body.replaceChildren(runtime.root);dispose(old);fitDom();send('ready',{width:runtime.canvas.width,height:runtime.canvas.height});
  }else if(mode==='glsl'){
   source=glslSource(source);
   const gl2=/^\s*#version\s+300\s+es/.test(source),c=canvas.cloneNode();c.width=render.width;c.height=render.height;const gl=c.getContext(gl2?'webgl2':'webgl',{preserveDrawingBuffer:true,alpha:true});if(!gl)throw Error('WebGL unavailable');
   const shaders=[];let program;
   try{for(const [type,code] of [[gl.VERTEX_SHADER,(gl2?'#version 300 es\nin':'attribute')+' vec2 position;void main(){gl_Position=vec4(position,0,1);}'],[gl.FRAGMENT_SHADER,source]]){const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,code);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));}
    program=gl.createProgram();shaders.forEach(s=>gl.attachShader(program,s));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
   }catch(error){if(program)gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));throw error;}
   shaders.forEach(s=>gl.deleteShader(s));gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
   const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);let textureVersion=-1;
   let mouse=[0,0];c.onpointermove=e=>{const r=c.getBoundingClientRect();mouse=[(e.clientX-r.left)*c.width/r.width,(r.bottom-e.clientY)*c.height/r.height];};
   const runtime={canvas:c,paint(time){gl.viewport(0,0,c.width,c.height);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);if(textureVersion!==inputVersion){gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,inputCanvas);textureVersion=inputVersion;}gl.uniform1i(gl.getUniformLocation(program,'u_image'),0);gl.uniform2f(gl.getUniformLocation(program,'u_imageSize'),bridge.inputSize.width,bridge.inputSize.height);for(const p of definitions)if(p.type!=='string'){const location=gl.getUniformLocation(program,p.name);p.type==='int'||p.type==='boolean'?gl.uniform1i(location,Number(bridge.params[p.name])):gl.uniform1f(location,bridge.params[p.name]);}gl.uniform3f(gl.getUniformLocation(program,'iResolution'),c.width,c.height,1);gl.uniform1f(gl.getUniformLocation(program,'iTime'),time);for(const name of ['Time','Beat','Bar','Bpm','Ticks','Phase','Root','Tuning','Playing','Rate'])gl.uniform1f(gl.getUniformLocation(program,'u_genereti'+name),Number(bridge[name.toLowerCase()]??0));gl.uniform4f(gl.getUniformLocation(program,'iMouse'),...mouse,0,0);gl.uniform1i(gl.getUniformLocation(program,'iChannel0'),0);gl.uniform2f(gl.getUniformLocation(program,'u_resolution'),c.width,c.height);gl.uniform1f(gl.getUniformLocation(program,'u_time'),time);gl.uniform2f(gl.getUniformLocation(program,'u_mouse'),...mouse);gl.drawArrays(gl.TRIANGLES,0,6);},dispose(){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}};runtime.paint(0);activate(runtime);
  }else if(mode==='three'){
   const renderer=new THREE.WebGLRenderer({preserveDrawingBuffer:true,antialias:true});renderer.setSize(render.width,render.height);const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(50,render.width/render.height,.1,100);camera.position.z=4;const inputTexture=new THREE.CanvasTexture(inputCanvas);let textureVersion=-1,textureSize='';let callback=()=>{};
   const runtime={canvas:renderer.domElement,paint(time){if(textureVersion!==inputVersion){const size=inputCanvas.width+'x'+inputCanvas.height;if(size!==textureSize){inputTexture.dispose();inputTexture.source=new THREE.Source(inputCanvas);textureSize=size;}inputTexture.needsUpdate=true;textureVersion=inputVersion;}callback(time);renderer.render(scene,camera);},dispose(){scene.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m?.dispose();});inputTexture.dispose();renderer.dispose();renderer.forceContextLoss();}};
   try{new Function('THREE','scene','camera','renderer','tick','inputTexture',source)(THREE,scene,camera,renderer,fn=>callback=fn,inputTexture);runtime.paint(0);activate(runtime);}catch(error){dispose(runtime);throw error;}
  }else if(['html','markdown','latex','svg','hyperframes'].includes(mode)){
   const root=document.createElement('main');root.style.cssText=`width:${render.width}px;height:${render.height}px;overflow:auto;box-sizing:border-box;position:relative;flex-shrink:0`;
   if(mode==='markdown'){
    const p=appearanceValues(appearance);root.style.cssText+=`;padding:28px;background:${p.background};color:${p.foreground};font:18px/1.6 system-ui;`;
    root.innerHTML=DOMPurify.sanitize(markdownWithMath(interpolate(source)));
   }else if(mode==='latex'){
    root.style.cssText+=`;display:flex;align-items:center;justify-content:center;color:${appearanceValues(appearance).foreground};font-size:24px;`;
    root.innerHTML=formula(interpolate(source));
   }else if(mode==='svg'){
    if(!/^\s*(?:<\?xml[^>]*>\s*)?<svg\b/.test(source))throw Error('SVG source must start with <svg>.');
    root.innerHTML=DOMPurify.sanitize(interpolate(source),{USE_PROFILES:{svg:true,svgFilters:true}});
    const svg=root.querySelector('svg');if(svg){svg.setAttribute('width','100%');svg.setAttribute('height','100%');}
   }else{
    const doc=new DOMParser().parseFromString(interpolate(source),'text/html');
    // Scripts run only in the isolated preview, never in the Comfy document.
    root.innerHTML=doc.head.innerHTML+doc.body.innerHTML;
   }
   let markdownValues='',markdownInput=-1;
   const refreshMarkdown=()=>{const signature=JSON.stringify(bridge.params)+JSON.stringify(bridge.render);if(signature!==markdownValues){root.innerHTML=DOMPurify.sanitize(markdownWithMath(interpolate(source)));markdownValues=signature;markdownInput=-1;for(const img of root.querySelectorAll('img[src="inputImage"]')){const preview=document.createElement('canvas');preview.dataset.generetiImage='';preview.style.maxWidth='100%';preview.setAttribute('aria-label',img.alt||'Input image');img.replaceWith(preview);}}if(markdownInput!==inputVersion){for(const preview of root.querySelectorAll('canvas[data-genereti-image]')){preview.width=inputCanvas.width;preview.height=inputCanvas.height;preview.getContext('2d').drawImage(inputCanvas,0,0);}markdownInput=inputVersion;}};
   const clock=mode==='hyperframes'?compositionClock(bridge):null;
   const runtime={root,canvas:null,surface:domSurface(root,{...render,fontEmbedCSS:mathCss}),paint:mode==='markdown'?refreshMarkdown:clock?.paint,changed:mode==='latex'?()=>{root.innerHTML=formula(interpolate(source));}:mode==='svg'?()=>{const doc=new DOMParser().parseFromString(interpolate(source),'image/svg+xml');const svg=doc.documentElement;svg.setAttribute('width','100%');svg.setAttribute('height','100%');root.innerHTML=DOMPurify.sanitize(svg.outerHTML,{USE_PROFILES:{svg:true,svgFilters:true}});}:undefined,dispose(){clock?.dispose();root.remove();}};
   if(mode==='markdown')refreshMarkdown();
   const old=active;active=runtime;document.body.replaceChildren(root);dispose(old);
   for(const script of root.querySelectorAll('script')){const replacement=document.createElement('script');for(const attr of script.attributes)replacement.setAttribute(attr.name,attr.value);replacement.textContent=script.textContent;script.replaceWith(replacement);}
   if(mode==='html'||mode==='hyperframes'){renderHtmlMath(root);const background=getComputedStyle(document.body).backgroundColor;if(getComputedStyle(root).backgroundColor==='rgba(0, 0, 0, 0)'&&background!=='rgba(0, 0, 0, 0)')root.style.backgroundColor=background;}
   fitDom();applyAppearance();runtime.canvas=await runtime.surface(true);send('ready',{source:originalSource,revision,width:active.canvas.width,height:active.canvas.height});
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
     await evalScope({slider,sliderWithID,markcss,__:bridge,inputImage:inputCanvas});
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
   active.canvas=await active.surface(true);send('ready',{source:originalSource,revision,width:active.canvas.width,height:active.canvas.height});send('audio-state',{state:getAudioContext().state});

  }else throw Error(`Unsupported Livecode language: ${mode}`);
 }catch(error){diagnostic(error);}
}

function tick(now){raf=requestAnimationFrame(tick);void renderFrame(now);}
async function renderFrame(now,clock='raf'){try{active?.sample?.();active?.paint?.(sharedTime.time((now-startTime)/1000));}catch(error){diagnostic(error);active.paint=null;}
 if(active?.canvas){const size=active.canvas.width+'x'+active.canvas.height;if(size!==lastSize){lastSize=size;send('size',{width:active.canvas.width,height:active.canvas.height});}}
 if(users&&active?.canvas&&!pending){pending=true;try{if(active.surface)active.canvas=await active.surface();const bitmap=await createImageBitmap(active.canvas);send('live-frame',{bitmap,clock});}catch(error){pending=false;diagnostic(error);}}
}
// Transfer ownership rather than cloning every frame.
window.addEventListener('message',async e=>{if(e.source!==parent)return;const d=e.data;
 if(d.type==='performance-state')sharedTime.update(d);
 if(d.type==='compile'){render={width:512,height:512,...d.render};newestRevision=d.revision;compileQueue=compileQueue.then(()=>{if(d.revision===newestRevision)return compile(d.mode,d.source,d.revision,d.parameters);});}
 if(d.type==='display-viewport'){responsiveDisplay=!!d.responsive;fitDom();}
 if(d.type==='resize-render'){resizeRender(d.render);}
 if(d.type==='parameters')setParameters(d.parameters);
 // Live input is copied synchronously; acknowledge ownership immediately. Only
 // the queued URL handshake waits for a paint before taking its snapshot.
 if(d.type==='input-frame'){try{updateInput(d.bitmap);send('input-ack',{id:d.id});}catch(error){diagnostic(error);}finally{d.bitmap?.close();}}
 if(d.type==='input-url'){try{if(d.image){const bitmap=await createImageBitmap(await(await fetch(d.image)).blob());updateInput(bitmap);bitmap.close();}else{inputCanvas.width=inputCanvas.height=1;bridge.inputSize.width=bridge.inputSize.height=0;inputVersion++;}await nextPaint();send('input-ack',{id:d.id});}catch(error){send('input-error',{id:d.id,message:error.message});}}
 if(d.type==='live-tick'&&users)void renderFrame(performance.now(),'host');
 if(d.type==='live-start')users=true;if(d.type==='live-stop')users=false;if(d.type==='live-ack')pending=false;
 if(d.type==='appearance'){appearance=d.appearance||{};applyAppearance();}
 if(d.type==='manim-next')active?.next?.();
 if(d.type==='capture'){try{if(!d.live)await nextPaint();active?.sample?.();active?.paint?.(sharedTime.time((performance.now()-startTime)/1000));if(active.surface)active.canvas=await active.surface(true);send('capture',{data:active.canvas.toDataURL('image/png'),id:d.id});}catch(error){send('capture-error',{message:error.message,id:d.id});}}
 if(d.type==='dispose'){users=false;cancelAnimationFrame(raf);dispose(active);dispose(candidate);active=null;candidate=null;}
 if(d.type==='stop')stopRuntime();
});
const audioButton=document.createElement('button');audioButton.textContent='Enable audio';audioButton.onclick=async()=>{try{await getAudioContext().resume();audioButton.remove();send('audio-state',{state:getAudioContext().state});}catch(error){diagnostic(error);}};
function stopRuntime(){users=false;cancelAnimationFrame(raf);const frozen=document.createElement('canvas');if(active?.canvas){frozen.width=active.canvas.width;frozen.height=active.canvas.height;frozen.getContext('2d').drawImage(active.canvas,0,0);}dispose(active);active={canvas:frozen};strudelInit=null;strudelEditor=null;strudelRoot=null;document.body.replaceChildren(frozen);send('stopped');}
window.addEventListener('keydown',event=>{if(event.isComposing)return;if(parent!==window&&!event.repeat&&(event.metaKey||event.ctrlKey)&&!event.altKey&&['BracketLeft','BracketRight'].includes(event.code)&&!event.target?.closest?.('input,textarea,select,[contenteditable],.cm-editor,.monaco-editor')){event.preventDefault();event.stopImmediatePropagation();send('preview-shortcut',{code:event.code,key:event.key,metaKey:event.metaKey,ctrlKey:event.ctrlKey,shiftKey:event.shiftKey});return;}if(parent!==window&&!event.repeat&&!event.ctrlKey&&!event.metaKey&&!event.target?.closest?.('input,textarea,select,[contenteditable],.cm-editor,.monaco-editor')&&event.altKey&&((!event.shiftKey&&event.code==='KeyP')||(event.shiftKey&&['KeyZ','KeyI','KeyO'].includes(event.code)))){send('preview-shortcut',{code:event.code,key:event.key,altKey:event.altKey,shiftKey:event.shiftKey});return;}if(parent!==window&&!event.repeat&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.target?.closest?.('input,textarea,select,[contenteditable],.cm-editor,.monaco-editor')&&((!event.altKey&&event.code==='KeyD')||(event.altKey&&(event.code==='KeyW'||event.code==='KeyF'||event.code==='KeyO'))||(!event.altKey&&event.key==='Escape'))){send('preview-shortcut',{code:event.code,key:event.key,altKey:event.altKey});return;}if(event.altKey&&event.shiftKey&&event.key==='ArrowRight'){event.preventDefault();active?.next?.();return;}if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();event.stopImmediatePropagation();if(parent!==window)send('request-run');else{const d=window.__GENERETI_STANDALONE__;newestRevision++;raf=requestAnimationFrame(tick);compile(d.mode,d.source,newestRevision);}}else if((event.ctrlKey||event.metaKey)&&(event.key==='.'||event.code==='Period')){event.preventDefault();event.stopImmediatePropagation();stopRuntime();}},true);
// Embedded preview pinches belong to Comfy's graph. Ordinary wheel scrolling
// remains available to HTML/Markdown/interactive renderers and standalone exports.
window.addEventListener('wheel',event=>{
 if(parent===window||!(event.ctrlKey||event.metaKey))return;
 event.preventDefault();event.stopImmediatePropagation();
 send('preview-wheel',{deltaX:event.deltaX,deltaY:event.deltaY,deltaMode:event.deltaMode,clientX:event.clientX,clientY:event.clientY,viewportWidth:innerWidth,viewportHeight:innerHeight});
},{capture:true,passive:false});
function fitDom(){if(active?.root){const root=active.root;root.style.transform=responsiveDisplay?'none':`scale(${Math.min(1,innerWidth/render.width,innerHeight/render.height)})`;root.style.width=(responsiveDisplay?innerWidth:render.width)+'px';root.style.height=(responsiveDisplay?innerHeight:render.height)+'px';root.style.overscrollBehavior='contain';}}
function resizeRender(size){render={...render,...size};bridge.render=render;window.windowWidth=render.width;window.windowHeight=render.height;try{active?.resize?.(render);}catch(error){diagnostic(error);}fitDom();}
let standaloneResize;
window.addEventListener('resize',()=>{const d=window.__GENERETI_STANDALONE__;if(d?.render?.sizing==='output'){const size={width:innerWidth,height:innerHeight};if(active?.resize)resizeRender(size);else{clearTimeout(standaloneResize);standaloneResize=setTimeout(()=>{render={...render,...size};compile(d.mode,d.source,++newestRevision,bridge.params);},150);}}else fitDom();});
function applyAppearance(){const p=appearanceValues(appearance);strudelEditor?.setAppearance(appearance);if(strudelRoot){strudelRoot.style.background=p.background;strudelRoot.style.color=p.foreground;}let style=document.getElementById('custom-style');if(!style){style=document.createElement('style');style.id='custom-style';document.head.append(style);}style.textContent=appearance.css||'';}
requestAnimationFrame(tick);send('boot');
if(window.__GENERETI_STANDALONE__){const d=window.__GENERETI_STANDALONE__;appearance=d.appearance||{};render={width:512,height:512,...d.render};if(d.render?.sizing==='output'){render.width=innerWidth;render.height=innerHeight;}newestRevision=1;compile(d.mode,d.source,1,d.parameters);}
