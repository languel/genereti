import { app } from '../../../scripts/app.js';

// Draw in LiteGraph's background pass: fixed to the viewport, behind nodes/links.
const entries=new Set();let graphCanvas,previous,hook;
const INTERPOLATION='Genereti.Views.BackdropInterpolation';
let interpolation='Smooth';
if(app.registerExtension)app.registerExtension({name:'Genereti.BackdropInterpolation',settings:[{
 id:INTERPOLATION,name:'Backdrop texture interpolation',category:['Genereti','Views','Backdrop interpolation'],type:'combo',options:['Smooth','Pixelated'],defaultValue:'Smooth',
 tooltip:'Pixelated uses nearest-neighbor scaling for crisp low-resolution backdrops. Smooth blends texture pixels. Applies to solo and grid backdrops.',
 onChange:value=>{interpolation=value;app.canvas?.setDirty?.(true,true);},
}],setup(){interpolation=app.ui.settings.getSettingValue(INTERPOLATION)??'Smooth';}});
function installBackdrop(){
 if(hook)return;graphCanvas=app.canvas;previous=graphCanvas.onRenderBackground;
 hook=function(target,ctx){previous?.call(this,target,ctx);ctx.save();ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle=graphCanvas.clear_background_color||'#111';ctx.fillRect(0,0,target.width,target.height);
  const items=[...entries],columns=Math.ceil(Math.sqrt(items.length)),rows=Math.ceil(items.length/Math.max(1,columns));
  items.forEach((entry,i)=>entry.draw(ctx,{x:(i%columns)*target.width/columns,y:Math.floor(i/columns)*target.height/rows,width:target.width/columns,height:target.height/rows}));
  ctx.restore();return true;
 };graphCanvas.onRenderBackground=hook;
}
function removeBackdrop(entry){entries.delete(entry);if(!entries.size&&hook){if(graphCanvas.onRenderBackground===hook)graphCanvas.onRenderBackground=previous;hook=undefined;}}
export function graphBackdrop(status,onStateChange=()=>{}) {
  let canvas,context,opened=false,gridMode=false,revision=0,fit='contain';
  const dirty=()=>graphCanvas?.setDirty?.(true,true);
  return {
    async open({grid=false}={}){
      if(opened&&grid===gridMode&&(grid||entries.size===1))return true;
      graphCanvas=app.canvas;
      if(!graphCanvas){status.textContent='Backdrop: graph canvas unavailable';return false;}
      if(!grid)for(const entry of [...entries])if(entry!==this)entry.close();
      if(!canvas){canvas=document.createElement('canvas');context=canvas.getContext('2d');}
      gridMode=grid;opened=true;entries.add(this);installBackdrop();dirty();onStateChange(true);return true;
    },
    get gridMode(){return gridMode||entries.size>1;},
    draw(ctx,cell){
      if(!canvas?.width||!canvas?.height)return;
      const gap=entries.size>1?4:0,x=cell.x+gap,y=cell.y+gap,width=cell.width-gap*2,height=cell.height-gap*2;
      const scale=fit==='cover'?Math.max(width/canvas.width,height/canvas.height):Math.min(width/canvas.width,height/canvas.height);
      const w=fit==='fill'?width:fit==='native'?canvas.width:canvas.width*scale,h=fit==='fill'?height:fit==='native'?canvas.height:canvas.height*scale;
      ctx.save();ctx.imageSmoothingEnabled=interpolation!=='Pixelated';ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();ctx.drawImage(canvas,x+(width-w)/2,y+(height-h)/2,w,h);ctx.restore();
    },
    publish(frame){
      if(!opened)return;const current=++revision;
      const draw=bitmap=>{if(canvas.width!==bitmap.width||canvas.height!==bitmap.height){canvas.width=bitmap.width;canvas.height=bitmap.height;}context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0);dirty();};
      if(frame.bitmap){draw(frame.bitmap);return;}
      (async()=>{let bitmap;try{bitmap=await createImageBitmap(frame.blob||await(await fetch(frame.src)).blob());if(opened&&current===revision)draw(bitmap);}catch(error){status.textContent=`Backdrop: ${error.message}`;}finally{bitmap?.close();}})();
    },
    getViewport(){if(!opened)return null;const rect=graphCanvas.canvas?.getBoundingClientRect();if(!rect)return null;const columns=Math.ceil(Math.sqrt(entries.size)),rows=Math.ceil(entries.size/columns);return {width:rect.width/columns,height:rect.height/rows};},
    setFit(value){fit=value;dirty();},
    close(){if(!opened)return;opened=false;revision++;removeBackdrop(this);canvas=null;context=null;dirty();onStateChange(false);},
  };
}
