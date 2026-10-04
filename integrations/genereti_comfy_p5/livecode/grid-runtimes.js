import {compileTixySource,resolveTixyGrid} from './ported/tixyRuntime.js';
import {evaluatePlayCoreSource} from './ported/playCoreSource.js';
import {parseOrcaGrid,runOrcaFrame} from './ported/orcaEngine.js';
const bounded=(v,f,min,max)=>Math.max(min,Math.min(max,Number(v)||f));
const metadata=source=>source.replace(/^\s*\/\/\s*@param[^\n]*$/gm,'');
function surface(render){const c=document.createElement('canvas');c.width=render.width;c.height=render.height;return c;}
function pointer(canvas){const p={x:0,y:0,down:false};const update=e=>{const r=canvas.getBoundingClientRect();p.x=(e.clientX-r.left)*canvas.width/r.width;p.y=(e.clientY-r.top)*canvas.height/r.height;};canvas.onpointermove=update;canvas.onpointerdown=e=>{update(e);p.down=true;canvas.setPointerCapture(e.pointerId);};canvas.onpointerup=canvas.onpointercancel=()=>p.down=false;return p;}
export function tixyRuntime(source,bridge){
 const compiled=compileTixySource(metadata(source)),canvas=surface(bridge.render),ctx=canvas.getContext('2d'),p=pointer(canvas);
 bridge.pointer=p;
 return {canvas,paint(time){
  const params=bridge.params,grid=resolveTixyGrid(params),cell=Math.min(canvas.width/grid.width,canvas.height/grid.height),ox=(canvas.width-grid.width*cell)/2,oy=(canvas.height-grid.height*cell)/2;
  ctx.clearRect(0,0,canvas.width,canvas.height);if(params.backgroundColor&&params.backgroundColor!=='transparent'){ctx.fillStyle=params.backgroundColor;ctx.fillRect(0,0,canvas.width,canvas.height);}
  for(let y=0;y<grid.height;y++)for(let x=0;x<grid.width;x++){
   const v=Number(compiled.evaluate(time,x+y*grid.width,x,y,bridge));if(!Number.isFinite(v)||!v)continue;
   ctx.fillStyle=v>0?(params.color1||'#e8e8e8'):(params.color0||'#ff547d');ctx.beginPath();ctx.arc(ox+(x+.5)*cell,oy+(y+.5)*cell,Math.min(1,Math.abs(v))*cell*.45,0,Math.PI*2);ctx.fill();
  }
 },dispose(){canvas.remove();}};
}
export function playcoreRuntime(source,bridge){
 const program=evaluatePlayCoreSource(source,bridge);if(typeof program.main!=='function')throw Error('Play Core needs export function main(coord, context).');
 const canvas=surface(bridge.render),ctx=canvas.getContext('2d'),p=pointer(canvas),previous={...p};
 const settings={fps:30,color:'#e8e8e8',backgroundColor:'transparent',fontFamily:'monospace',fontSize:16,lineHeight:1.2,...program.settings};
 const size=bounded(parseFloat(settings.fontSize),16,4,128),lineHeight=bounded(parseFloat(settings.lineHeight),1.2,.5,3);
 let last=-Infinity,frame=0;program.boot?.(bridge);
 return {canvas,paint(time){
  const fps=bounded(settings.fps,30,1,120);if(time-last<1/fps)return;last=time;
  ctx.font=`${settings.fontWeight||'normal'} ${size}px ${settings.fontFamily}`;ctx.textBaseline='middle';
  const cellWidth=Math.max(1,ctx.measureText('M').width+Number(settings.letterSpacing||0)),cellHeight=size*lineHeight;
  const cols=Math.round(bounded(settings.cols,Math.floor(canvas.width/cellWidth),1,256)),rows=Math.round(bounded(settings.rows,Math.floor(canvas.height/cellHeight),1,256));
  const context={frame:frame++,time:time*1000,cols,rows,width:canvas.width,height:canvas.height,settings,metrics:{cellWidth,cellHeight,aspect:cellWidth/cellHeight},runtime:{fps}};
  const cursor={x:p.x/cellWidth,y:p.y/cellHeight,pressed:p.down,p:{x:previous.x/cellWidth,y:previous.y/cellHeight,pressed:previous.down}},buffer=Array.from({length:cols*rows},()=>({char:' '}));
  program.pre?.(context,cursor,buffer,bridge);
  const event=p.down&&!previous.down?'pointerDown':!p.down&&previous.down?'pointerUp':p.x!==previous.x||p.y!==previous.y?'pointerMove':null;
  if(event)program[event]?.(context,cursor,buffer,bridge);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const index=x+y*cols,value=program.main({x,y,index},context,cursor,buffer,bridge);buffer[index]={...buffer[index],...(value&&typeof value==='object'?value:{char:value})};}
  program.post?.(context,cursor,buffer,bridge);
  ctx.clearRect(0,0,canvas.width,canvas.height);if(settings.backgroundColor!=='transparent'){ctx.fillStyle=settings.backgroundColor;ctx.fillRect(0,0,canvas.width,canvas.height);}
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const v=buffer[x+y*cols];if(v.backgroundColor){ctx.fillStyle=v.backgroundColor;ctx.fillRect(x*cellWidth,y*cellHeight,cellWidth,cellHeight);}ctx.font=`${v.fontWeight||settings.fontWeight||'normal'} ${size}px ${settings.fontFamily}`;ctx.fillStyle=v.color||settings.color;ctx.fillText(String(v.char??' '),x*cellWidth,(y+.5)*cellHeight);}
  Object.assign(previous,p);
 },dispose(){program.dispose?.();canvas.remove();}};
}
export function orcaRuntime(source,bridge){
 const canvas=surface(bridge.render),ctx=canvas.getContext('2d');let text=metadata(source).trim(),grid=parseOrcaGrid(text,{width:0,height:0}),frame=0,last=0;
 bridge.orca={frame:0,events:[]};
 return {canvas,paint(time){
  const interval=60/bounded(bridge.params.bpm,120,20,400)/4;
  if(time-last>=interval){const result=runOrcaFrame(text,{frame,width:grid.width,height:grid.height});text=result.source;frame=result.frame;grid=parseOrcaGrid(text,{width:grid.width,height:grid.height});last=time;bridge.orca.frame=frame;bridge.orca.events=result.events;if(result.events.length)window.dispatchEvent(new CustomEvent('genereti-orca-events',{detail:result.events}));}
  ctx.clearRect(0,0,canvas.width,canvas.height);const size=Math.min(canvas.width/grid.width,canvas.height/grid.height);ctx.font=`${Math.max(4,size*.8)}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
  for(let y=0;y<grid.height;y++)for(let x=0;x<grid.width;x++){const glyph=grid.cells[y][x];ctx.fillStyle=glyph==='.'?'#777':glyph==='*'?'#ff547d':'#e8e8e8';ctx.fillText(glyph,(x+.5)*size,(y+.5)*size);}
 },dispose(){canvas.remove();}};
}
