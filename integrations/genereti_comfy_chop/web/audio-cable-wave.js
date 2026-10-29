import {app} from '../../scripts/app.js';
import {wavePoints} from './audio-cable-wave-core.js';
const SETTING='Genereti.Audio.CableWaveforms';let scale=1;const SCALE='Genereti.Audio.CableWaveformScale';let enabled=false,timer,original,wrapped,canvas;
function setEnabled(value){enabled=value===true;if(timer)clearInterval(timer);timer=null;if(!enabled)window.generetiAudioCableWaveforms?.clear();else timer=setInterval(()=>{if(window.generetiAudioCableWaveforms?.active()&&!document.hidden)canvas?.setDirty?.(false,true);},50);canvas?.setDirty?.(true,true);}
function install(){
 canvas=app.canvas;if(!canvas?.renderLink)return;original=canvas.renderLink;
 wrapped=function(ctx,start,end,link,skip,...args){
  const mode=this.linkRenderer?.convertRenderMode?.(this.links_render_mode),api=window.generetiAudioCableWaveforms,eligible=enabled&&!skip&&this.links_render_mode!==-1&&link?.type==='GENERETI_AUDIO_BUS'&&api?.active()&&['spline','straight','linear'].includes(mode);
  const samples=eligible?api.read(link.origin_id):null;
  if(!scale||!samples?.some(sample=>Math.abs(sample)>1e-5)||args[4]?.disabled)return original.call(this,ctx,start,end,link,skip,...args);
  // Let Comfy build its native Path2D, hit targets and reroute geometry, while
  // replacing the visible straight trace with the audio-driven one.
  ctx.save();ctx.globalAlpha=0;let result;try{result=original.call(this,ctx,start,end,link,skip,...args);}finally{ctx.restore();}
  const [,colour,from,to,options]=args,convert=d=>this.linkRenderer.convertDirection(d),fromDirection=from?convert(from):'right',toDirection=to?convert(to):'left';
  const renderer=this.linkRenderer.pathRenderer,nativePoints=mode!=='spline'?renderer?.[mode+'Points']?.({x:start[0],y:start[1]},{x:end[0],y:end[1]},fromDirection,toDirection):null;
  const pathOptions=nativePoints?{...options,polyline:nativePoints.map(p=>[p.x,p.y])}:options,points=wavePoints(start,end,fromDirection,toDirection,pathOptions,samples,14*scale,mode);
  const native=this.buildLinkRenderContext?.(),highlighted=native?.highlightedLinks?.has(link.id)||native?.highlightedLinks?.has(String(link.id));
  ctx.save();ctx.strokeStyle=highlighted?'#FFF':colour||link.color||native?.linkTypeColors?.[link.type]||native?.defaultLinkColor||ctx.strokeStyle;ctx.lineWidth=native?.connectionWidth??this.connections_width??2;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.restore();return result;
 };canvas.renderLink=wrapped;
}
app.registerExtension({name:'Genereti.AudioCableWaveforms',settings:[{id:SCALE,name:'Audio cable waveform scale',category:['Genereti','Audio','Audio cable waveform scale'],type:'slider',defaultValue:1,attrs:{min:0,max:5,step:.1},tooltip:'Visual amplitude of live audio cables. 1 is the normal size; 0 uses native cables. Does not change audio.',onChange:value=>{scale=Math.max(0,Math.min(5,Number(value)||0));canvas?.setDirty?.(true,true);}},{id:SETTING,name:'Audio cable waveforms',category:['Genereti','Audio','Audio cable waveforms'],type:'boolean',defaultValue:false,tooltip:'Show live waveform traces on modular audio cables in spline, straight and linear modes. Adds analyser and canvas work only while enabled.',onChange:setEnabled}],setup(){scale=Math.max(0,Math.min(5,Number(app.ui.settings.getSettingValue(SCALE,1))||0));install();setEnabled(app.ui.settings.getSettingValue(SETTING,false));}});
// Stopping audio must repaint once even though the animation timer is idle.
window.addEventListener('genereti-modular-audio-state',()=>canvas?.setDirty?.(true,true));
window.addEventListener('pagehide',()=>{if(timer)clearInterval(timer);if(canvas?.renderLink===wrapped)canvas.renderLink=original;window.generetiAudioCableWaveforms?.clear();});
