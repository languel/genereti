// HyperFrames-compatible finite HTML clock. Shared params/images live in __;
// this document owns its timeline rather than a nested, uncapturable iframe.
export function compositionClock(bridge){
 let time=0,playing=true,last=null,disposed=false;
 const duration=()=>Math.max(.01,Math.min(3600,Number(bridge.params.duration)||30));
 const publish=()=>{document.documentElement.style.setProperty('--hf-time',String(time));document.documentElement.style.setProperty('--hf-progress',String(time/duration()));window.dispatchEvent(new CustomEvent('hyperframes-time',{detail:{time,duration:duration()}}));};
 const api=window.__hyperframes={get duration(){return duration()},get time(){return time},get playing(){return playing},data:Object.create(null),
  play(){if(time>=duration())time=0;playing=true;last=null;},pause(){playing=false;last=null;},seek(value){time=Math.max(0,Math.min(duration(),Number(value)||0));publish();},
  setRuntimeData(channel,payload){api.data[channel]=payload;window.dispatchEvent(new CustomEvent('hyperframes-runtime-data',{detail:{channel,payload}}));},clearRuntimeData(channel){delete api.data[channel];}
 };
 window.__player={getDuration:duration,play:api.play,pause:api.pause,seek:api.seek,time:()=>time,duration};
 return {paint(now){if(disposed)return;if(playing&&last!==null)time=Math.min(duration(),time+Math.max(0,now-last));last=now;if(time>=duration()){if(bridge.params.loop!==false)time=0;else playing=false;}publish();},dispose(){disposed=true;playing=false;delete window.__hyperframes;delete window.__player;}};
}
