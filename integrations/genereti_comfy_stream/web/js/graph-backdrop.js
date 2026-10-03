import { app } from '../../../scripts/app.js';

// Draw in LiteGraph's background pass: fixed to the viewport, behind nodes/links.
let active;
export function graphBackdrop(status,onStateChange=()=>{}) {
  let canvas,context,graphCanvas,previous,hook,opened=false,revision=0,fit='contain';
  const dirty=()=>graphCanvas?.setDirty?.(true,true);
  return {
    async open(){
      if(opened)return true;
      graphCanvas=app.canvas;
      if(!graphCanvas){status.textContent='Backdrop: graph canvas unavailable';return false;}
      active?.close();
      canvas=document.createElement('canvas');context=canvas.getContext('2d');
      previous=graphCanvas.onRenderBackground;
      hook=function(target,ctx){
        const handled=previous?.call(this,target,ctx);
        ctx.save();ctx.setTransform(1,0,0,1,0,0);
        if(!handled){ctx.fillStyle=graphCanvas.clear_background_color||'#111';ctx.fillRect(0,0,target.width,target.height);}
        if(canvas.width&&canvas.height){
          const scale=fit==='cover'?Math.max(target.width/canvas.width,target.height/canvas.height):Math.min(target.width/canvas.width,target.height/canvas.height);
          const w=fit==='fill'?target.width:fit==='native'?canvas.width:canvas.width*scale;
          const h=fit==='fill'?target.height:fit==='native'?canvas.height:canvas.height*scale;
          ctx.drawImage(canvas,(target.width-w)/2,(target.height-h)/2,w,h);
        }
        ctx.restore();return true;
      };
      graphCanvas.onRenderBackground=hook;opened=true;active=this;dirty();onStateChange(true);return true;
    },
    publish(frame){
      if(!opened)return;const current=++revision;
      const draw=bitmap=>{if(canvas.width!==bitmap.width||canvas.height!==bitmap.height){canvas.width=bitmap.width;canvas.height=bitmap.height;}context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0);dirty();};
      if(frame.bitmap){draw(frame.bitmap);return;}
      (async()=>{let bitmap;try{bitmap=await createImageBitmap(frame.blob||await(await fetch(frame.src)).blob());if(opened&&current===revision)draw(bitmap);}catch(error){status.textContent=`Backdrop: ${error.message}`;}finally{bitmap?.close();}})();
    },
    setFit(value){fit=value;dirty();},
    close(){if(!opened)return;opened=false;revision++;if(graphCanvas.onRenderBackground===hook)graphCanvas.onRenderBackground=previous;if(active===this)active=null;canvas=null;context=null;dirty();onStateChange(false);},
  };
}
