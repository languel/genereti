import {app} from '../../scripts/app.js';
import {wavePoints} from './audio-cable-wave-core.js';
const SETTING='Genereti.Audio.CableWaveforms';let enabled=false,timer,original,wrapped,canvas;
function setEnabled(value){enabled=value===true;if(timer)clearInterval(timer);timer=null;if(!enabled)window.generetiAudioCableWaveforms?.clear();else timer=setInterval(()=>{if(window.generetiAudioCableWaveforms?.active()&&!document.hidden)canvas?.setDirty?.(false,true);},50);canvas?.setDirty?.(true,true);}
function install(){
 canvas=app.canvas;if(!canvas?.renderLink)return;original=canvas.renderLink;
 wrapped=function(ctx,start,end,link,skip,...args){
  const api=window.generetiAudioCableWaveforms,eligible=enabled&&!skip&&link?.type==='GENERETI_AUDIO_BUS'&&api?.active()&&this.linkRenderer?.convertRenderMode?.(this.links_render_mode)==='spline';
  const samples=eligible?api.read(link.origin_id):null;
  if(!samples?.length)return original.call(this,ctx,start,end,link,skip,...args);
  // Let Comfy build its native Path2D, hit targets and reroute geometry, while
  // replacing the visible straight trace with the audio-driven one.
  ctx.save();ctx.globalAlpha=0;let result;try{result=original.call(this,ctx,start,end,link,skip,...args);}finally{ctx.restore();}
  const [,colour,from,to,options]=args,convert=d=>this.linkRenderer.convertDirection(d),points=wavePoints(start,end,from?convert(from):'right',to?convert(to):'left',options,samples);
  ctx.save();ctx.strokeStyle=colour||link.color||'#8bd6ed';ctx.globalAlpha=.95;ctx.lineWidth=2/Math.max(.5,this.ds?.scale??1);ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.restore();return result;
 };canvas.renderLink=wrapped;
}
app.registerExtension({name:'Genereti.AudioCableWaveforms',settings:[{id:SETTING,name:'Audio cable waveforms',category:['Genereti','Audio','Audio cable waveforms'],type:'boolean',defaultValue:false,tooltip:'Show live waveform traces on modular audio cables in spline mode. Adds analyser and canvas work only while enabled.',onChange:setEnabled}],setup(){install();setEnabled(app.ui.settings.getSettingValue(SETTING,false));}});
window.addEventListener('pagehide',()=>{if(timer)clearInterval(timer);if(canvas?.renderLink===wrapped)canvas.renderLink=original;window.generetiAudioCableWaveforms?.clear();});
