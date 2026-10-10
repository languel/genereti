import {app} from '../../../scripts/app.js';
import {subscribeLive,publishLive} from '/extensions/genereti_comfy_p5/js/live-runtime.js';
import {previewState} from '/extensions/genereti_comfy_p5/js/preview-state.js';
import {previewControls} from './preview-controls.js';
import {frameControls,paintImage,observeSurface} from './image-frame.js';
app.registerExtension({name:'Genereti.ImageCompare',nodeCreated(node){
 if(node.comfyClass!=='GeneretiImageCompare')return;
 node.properties??={};let disposed=false;const buffers=[document.createElement('canvas'),document.createElement('canvas')],ready=[false,false],revisions=[0,0],releases=[];
 const layers=[document.createElement('canvas'),document.createElement('canvas')];const root=document.createElement('div');root.style.cssText='display:flex;flex-direction:column;width:100%;gap:4px';const work=document.createElement('canvas'),canvas=document.createElement('canvas');canvas.width=canvas.height=512;canvas.style.cssText='display:block;width:100%;height:auto;aspect-ratio:1';
 const status=document.createElement('span');status.style.fontSize='11px';status.textContent='Connect A and B · Live or Comfy Queue';
 const mode=document.createElement('select');mode.title='Comparison view';mode.setAttribute('aria-label',mode.title);for(const v of ['wipe','side-by-side','difference'])mode.add(new Option(v,v));
 const split=document.createElement('input');split.type='range';split.min=0;split.max=1;split.step=.01;split.title='A/B split';split.setAttribute('aria-label',split.title);split.style.width='100%';
 const visibility=observeSurface(canvas,draw);const output=previewControls(canvas,status,node);const dimensions=frameControls(node,work,draw);const preview=previewState(node,canvas,{resize:draw});
 function draw(){if(disposed||(!(preview.visible&&visibility.visible)&&!output.getViewport())||!ready.some(Boolean))return;const source=buffers[ready[0]?0:1];dimensions.resize(source.width,source.height,output.getViewport());const w=work.width,h=work.height,ctx=work.getContext('2d'),fit=node.properties.genereti_preview_fit||'contain';ctx.clearRect(0,0,w,h);
  for(let i=0;i<2;i++){if(!ready[i])continue;const layer=layers[i],lw=mode.value==='side-by-side'?Math.max(1,Math.floor(w/2)):w;if(layer.width!==lw||layer.height!==h){layer.width=lw;layer.height=h;}paintImage(layer,buffers[i],fit);ctx.save();if(mode.value==='wipe'){const x=Number(split.value)*w;ctx.beginPath();ctx.rect(i?x:0,0,i?w-x:x,h);ctx.clip();}if(mode.value==='difference'&&i)ctx.globalCompositeOperation='difference';ctx.drawImage(layer,mode.value==='side-by-side'?i*w/2:0,0);ctx.restore();}if(preview.visible){if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas.style.aspectRatio=`${w} / ${h}`;}paintImage(canvas,work,'fill');}output.publish({bitmap:work});
 }
 function accept(i,image){const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;if(buffers[i].width!==w||buffers[i].height!==h){buffers[i].width=w;buffers[i].height=h;}buffers[i].getContext('2d').clearRect(0,0,w,h);buffers[i].getContext('2d').drawImage(image,0,0);ready[i]=true;publishLive(node,buffers[i],i);draw();}
 function sync(){mode.value=node.properties.genereti_compare_mode||'wipe';split.value=node.properties.genereti_compare_split??.5;draw();}mode.onchange=()=>{node.properties.genereti_compare_mode=mode.value;draw();};split.oninput=()=>{node.properties.genereti_compare_split=Number(split.value);draw();};sync();
 for(const row of [preview.actions,output.toolbar,dimensions.row])row.style.display='contents';output.actions.append(preview.actions,output.toolbar,dimensions.row);
 output.actions.prepend(preview.minimize);
 root.append(output.actions,mode,canvas,split,status);const widget=node.addDOMWidget('compare','GENERETI_COMPARE',root,{serialize:false});widget.computeSize=width=>[width,preview.minimized?110:(width-24)*canvas.height/canvas.width+140];
 node._generetiLiveSource={retain(){},release(){}};
 node._generetiSetExecutionMode=mode=>{releases.splice(0).forEach(r=>r());if(mode==='Live')for(const [i,inputName] of ['a','b'].entries())releases.push(subscribeLive(node,({bitmap})=>accept(i,bitmap),text=>{status.textContent=text;},{inputName}));};node._generetiSetExecutionMode(node._generetiExecutionMode||'Live');
 const executed=node.onExecuted;node.onExecuted=function(data){executed?.apply(this,arguments);for(const [i,key] of ['genereti_compare_a','genereti_compare_b'].entries()){const src=data?.[key]?.[0];if(!src)continue;const revision=++revisions[i],image=new Image();image.onload=()=>{if(!disposed&&revision===revisions[i])accept(i,image);};image.src=src;}};
 const configured=node.onConfigure;node.onConfigure=function(){const r=configured?.apply(this,arguments);sync();return r;};const removed=node.onRemoved;node.onRemoved=function(){disposed=true;releases.forEach(r=>r());visibility.dispose();output.close();return removed?.apply(this,arguments);};
}});
