import {app} from '../../scripts/app.js';
import {previewControls} from '/extensions/genereti_comfy_stream/js/preview-controls.js';
import {panelRoot,canvasPoint,canvasWidth,hiDPI,observe,color,alpha,getValue,setValue} from './audio-ui.js';
const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
function points(node){try{const p=JSON.parse(String(getValue(node,'points','[[0,0],[1,1]]')));if(!Array.isArray(p)||p.length<2||p.length>128)throw Error();return p.map(([x,y])=>[clamp(x),clamp(y)]).sort((a,b)=>a[0]-b[0]);}catch{return [[0,0],[1,1]];}}
export function curveValue(p,x){x=clamp(x);if(x<=p[0][0])return p[0][1];for(let i=1;i<p.length;i++)if(x<=p[i][0]){const [x0,y0]=p[i-1],[x1,y1]=p[i],t=x1===x0?1:(x-x0)/(x1-x0);return y0+(y1-y0)*t;}return p.at(-1)[1];}
app.registerExtension({name:'Genereti.Curve',nodeCreated(node){
 if(node.comfyClass!=='GeneretiChopCurve')return;
 const root=panelRoot(),tools=document.createElement('div'),canvas=document.createElement('canvas'),status=document.createElement('div');tools.className='genereti-node-controls';canvas.className='gap-plot';canvas.tabIndex=0;canvas.style.touchAction='none';canvas.title='Click to add a point, drag to edit, right-click to remove';status.className='genereti-status';root.append(tools,canvas,status);
 const hidden=node.widgets?.find(w=>w.name==='points');if(hidden){hidden.hidden=true;hidden.options={...hidden.options,hidden:true};hidden.computeSize=()=>[0,-4];}
 const view=previewControls(root,status,node,()=>{},{interactiveSurface:root,publishOnOpen:false,fitControl:false,fitTarget:null,getRenderSize:()=>({width:320,height:240})});const wrapper=document.createElement('div');wrapper.append(view.actions,root);node.addDOMWidget('curve_editor','GENERETI_CURVE',wrapper,{serialize:false,hideOnZoom:false}).computeSize=w=>[w,240];
 let active=-1,current=0,revision='';const width=()=>Math.max(140,canvasWidth(canvas,300)),height=160;
 const readInput=()=>{const index=node.inputs?.findIndex(i=>i.name==='input'),link=index>=0?node.getInputLink?.(index):null,source=link&&node.graph?.getNodeById(link.origin_id);return clamp(source?._generetiLiveValue?.(link.origin_slot)??getValue(node,'input',0));};
 const draw=()=>{const p=points(node),x=readInput(),w=width(),key=JSON.stringify([p,x,w]);if(key===revision)return;revision=key;current=curveValue(p,x);const g=hiDPI(canvas,w,height),c=color(canvas),pad=8,X=x=>pad+x*(w-2*pad),Y=y=>height-pad-y*(height-2*pad);g.strokeStyle=alpha(c,.2);g.beginPath();g.moveTo(X(x),pad);g.lineTo(X(x),height-pad);g.stroke();g.strokeStyle=c;g.lineWidth=2;g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(X(x),Y(y)):g.moveTo(X(x),Y(y)));g.stroke();for(const [x,y] of p){g.beginPath();g.arc(X(x),Y(y),4,0,2*Math.PI);g.fillStyle=c;g.fill();}status.textContent=`${x.toFixed(2)} → ${current.toFixed(3)}`;};
 const position=e=>{const [x,y]=canvasPoint(canvas,e),w=width(),pad=8;return [clamp((x-pad)/(w-2*pad)),clamp(1-(y-pad)/(height-2*pad))];};
 const nearest=(p,x,y)=>{const w=width();let best=-1,d=100;for(let i=0;i<p.length;i++){const dx=(p[i][0]-x)*(w-16),dy=(p[i][1]-y)*(height-16),v=dx*dx+dy*dy;if(v<d){d=v;best=i;}}return best;};
 const write=p=>{setValue(node,'points',JSON.stringify(p.sort((a,b)=>a[0]-b[0])));revision='';draw();};
 canvas.onpointerdown=e=>{if(e.button!==0)return;e.stopPropagation();const p=points(node),[x,y]=position(e);active=nearest(p,x,y);if(active<0&&p.length<128){p.push([x,y]);p.sort((a,b)=>a[0]-b[0]);active=p.findIndex(q=>q[0]===x&&q[1]===y);write(p);}canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(active<0)return;const p=points(node),[x,y]=position(e);p[active]=[Math.max(active?p[active-1][0]+.00001:0,Math.min(active<p.length-1?p[active+1][0]-.00001:1,x)),y];write(p);};canvas.onpointerup=canvas.onpointercancel=()=>active=-1;
 canvas.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();const p=points(node),[x,y]=position(e),i=nearest(p,x,y);if(i>=0&&p.length>2){p.splice(i,1);write(p);}};
 const state={get(){draw();return {value:current,input:readInput(),points:points(node)};}};node._generetiLiveValue=slot=>{const value=state.get().value;return slot===0?{channels:{value:new Float32Array([value])},sampleRate:25,start:0}:slot===1?value:undefined;};node._generetiChop={get latest(){return node._generetiLiveValue(0);}};
 const timer=setInterval(()=>{if(!node.graph)return;draw();const service=window.generetiPerformance;if(service){service.liveCurves??=new Map();service.liveCurves.set(node,state);}},80);observe(canvas,()=>{revision='';draw();});queueMicrotask(draw);
 const removed=node.onRemoved;node.onRemoved=function(){clearInterval(timer);window.generetiPerformance?.liveCurves?.delete(node);view.close();return removed?.apply(this,arguments);};
}});
