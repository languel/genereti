import {compileManimSource,createManimCueController} from './ported/manimSource.js';
export async function manimRuntime(source,bridge,send){
 const api=window.MANIM;if(!api?.Scene)throw Error('Manim library unavailable. Rebuild Livecode assets.');
 const run=compileManimSource(source,api),root=document.createElement('main');root.style.cssText=`width:${bridge.render.width}px;height:${bridge.render.height}px;position:relative`;
 document.body.append(root);
 const scene=new api.Scene(root,{...bridge.render,backgroundOpacity:0,autoResize:false});
 scene.renderer.getThreeRenderer().setPixelRatio(1);
 const sourceCanvas=root.querySelector('canvas'),canvas=document.createElement('canvas');canvas.width=bridge.render.width;canvas.height=bridge.render.height;
 if(!sourceCanvas){scene.dispose();root.remove();throw Error('Manim did not create a render canvas.');}
 const ctx=canvas.getContext('2d');let disposed=false;
 const controller=createManimCueController({mode:bridge.params.stepThrough?'cue':'auto',onCue:detail=>send('manim-cue',{label:detail.label,pending:controller.mode==='cue'})});
 const cue=async(label,options)=>{controller.setMode(bridge.params.stepThrough?'cue':'auto');const result=await controller.cue(label,options);if(!disposed)send('manim-cue',{pending:false});return result;};
 const runtime={root,canvas,paint(){scene.render();ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(sourceCanvas,0,0,canvas.width,canvas.height);},changed(){controller.setMode(bridge.params.stepThrough?'cue':'auto');},next(){controller.next();},dispose(){disposed=true;controller.dispose();scene.stop();scene.dispose();root.remove();}};
 // The authored async scene continues independently of frame capture. Queue
 // captures the current frame; a pending performance cue never blocks Queue.
 Promise.resolve(run({scene,bridge,cue})).then(()=>{if(!disposed)send('runtime-status',{message:'Manim · scene complete'});}).catch(error=>{if(!disposed)send('error',{message:error.message});});
 runtime.paint();return runtime;
}
