import {app} from '../../scripts/app.js';
import {api} from '../../scripts/api.js';
import {ensureControlStyle} from '/extensions/genereti_comfy_p5/js/control-style.js';
import {generate,process,first,patternMatch} from './signals.js';
import {noteControl} from './music-signals.js';
const states=new Set();let raf=0;
function values(node){const out=Object.fromEntries((node.widgets??[]).filter(w=>['number','string','boolean'].includes(typeof w.value)).map(w=>[w.name,w.value]));for(let i=0;i<(node.inputs?.length??0);i++){const input=node.inputs[i],link=node.getInputLink?.(i);if(!link||input.type==='GENERETI_CHOP')continue;const source=node.graph?.getNodeById(link.origin_id);const value=source?._generetiLiveValue?.(link.origin_slot)??source?.widgets?.find(w=>w.name==='value')?.value;if(value!==undefined)out[input.widget?.name??input.name]=value;}return out;}
function clock(now){raf=0;const visiting=new Set(),done=new Set();function run(state){if(!state||done.has(state)||state.dead||!state.running)return;if(visiting.has(state))throw Error('CHOP cycles are not supported');visiting.add(state);state.update(now,run);visiting.delete(state);done.add(state);}for(const state of states){try{run(state);}catch(error){state.status.textContent=error.message;visiting.clear();}}if(states.size)raf=requestAnimationFrame(clock);}
async function request(path,body){const response=await api.fetchApi('/genereti/chop/osc/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!response.ok)throw Error(await response.text());return response.json();}
app.registerExtension({name:'Genereti.CHOP',nodeCreated(node){
 if(!node.comfyClass?.startsWith('GeneretiChop'))return;ensureControlStyle();const kind=node.comfyClass.slice(12);
 const surface=document.createElement('div');surface.style.cssText='display:flex;flex-direction:column;gap:4px;width:100%';
 const tools=document.createElement('div');tools.className='genereti-node-controls';const play=document.createElement('button');play.textContent='Ⅱ';play.title='Pause live signals';play.setAttribute('aria-label',play.title);tools.append(play);
 let previewFrozen=false,previewMinimized=false;const disclosure=document.createElement('button');disclosure.textContent='⌄';disclosure.title='Minimize signal preview';disclosure.setAttribute('aria-label',disclosure.title);disclosure.setAttribute('aria-expanded','true');const freeze=document.createElement('button');freeze.textContent='❄';freeze.title='Freeze only this preview · signals keep flowing';freeze.setAttribute('aria-label',freeze.title);freeze.setAttribute('aria-pressed','false');const viewTools=document.createElement('div');viewTools.className='genereti-node-controls';viewTools.append(disclosure,freeze);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;canvas.style.cssText='display:block;width:100%;height:auto';const status=document.createElement('span');status.style.cssText='font:11px monospace;color:var(--fg-color,#eee)';surface.append(tools,viewTools,canvas,status);
 const state={node,kind,status,running:true,memory:{},latest:null,connected:false,deviceChannels:{},dead:false,update(now,run){
  const v=values(node),signature=JSON.stringify(v),link=name=>{const slot=node.inputs?.findIndex(i=>i.name===name),l=slot>=0?node.getInputLink?.(slot):null;const upstream=node.graph?.getNodeById(l?.origin_id);const s=upstream?._generetiChop;run(s);return s?.latest??upstream?._generetiDatSignal?.();};
  const input=link('input'),other=link('other');let data;
  if(kind==='MidiIn'||kind==='OscIn'){
   data={channels:Object.fromEntries(Object.entries(state.deviceChannels).map(([k,x])=>[k,new Float32Array([x])])),sampleRate:60,start:now/1000};
   if(state.deviceRevision===state.lastDeviceRevision&&state.latest)return;state.lastDeviceRevision=state.deviceRevision;
  }else if(input){
   if(input===state.lastInput&&other===state.lastOther&&signature===state.signature)return;
   data=['MidiOut','OscOut'].includes(kind)?input:process(kind,input,v,state.memory,other);
  }else if(['Constant','Oscillator','Noise','Expression'].includes(kind)){
   if(signature!==state.signature)state.nextTime=undefined;
   const t=now/1000;
   if(state.nextTime!==undefined&&t<state.nextTime)return;
   const start=state.nextTime===undefined||t-state.nextTime>.5?t:state.nextTime;state.nextTime=start+Number(v.samples)/Number(v.sample_rate);
   data=generate(kind,v,start+Number(v.time));
  }else{status.textContent='Connect CHOP input';return;}
  state.latest=data;window.dispatchEvent(new CustomEvent('genereti-control-frame',{detail:{nodeId:node.id}}));state.lastInput=input;state.lastOther=other;state.signature=signature;
  if(state.connected)send(data,v,now);
  if(!previewFrozen&&!previewMinimized){const history=state.history??=new Map();for(const [name,samples] of Object.entries(data.channels)){const line=history.get(name)??[];for(const x of samples)line.push(x);if(line.length>256)line.splice(0,line.length-256);history.set(name,line);}for(const name of history.keys())if(!(name in data.channels))history.delete(name);}
  if(!previewFrozen&&!previewMinimized&&now-(state.lastPaint??0)>100){paint(data);state.lastPaint=now;}
 }};
 function paint(data){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,512,96);const fg=getComputedStyle(surface).color||'#ddd';ctx.strokeStyle=fg;ctx.lineWidth=1;let n=0;for(const [name,samples]of Object.entries(data.channels)){const line=state.history?.get(name)??[];ctx.globalAlpha=Math.max(.25,1-n++*.12);ctx.beginPath();line.forEach((x,i)=>{const y=48-Math.max(-1,Math.min(1,x))*40;i?ctx.lineTo(i*512/Math.max(1,line.length-1),y):ctx.moveTo(0,y);});ctx.stroke();}ctx.globalAlpha=1;status.textContent=`${Object.keys(data.channels).length} channels · ${data.sampleRate} Hz · ${first(data).toFixed(3)}${state.connected?' · connected':''}`;}
 let midiAccess,midiPort,oscToken,touchTimer,activeNote=null,sendBusy=false,lastSent='',lastSend=0;
 async function disconnect(){state.connected=false;state.deviceChannels={};state.deviceRevision=(state.deviceRevision??0)+1;clearInterval(touchTimer);if(midiPort){if(activeNote){midiPort.send([0x80|activeNote[0],activeNote[1],0]);activeNote=null;}midiPort.onmidimessage=null;await midiPort.close();midiPort=null;}if(oscToken){const token=oscToken;oscToken=null;await request('stop',{token});}connect?.setAttribute('aria-pressed','false');}
 let connect;
 if(['MidiIn','MidiOut','OscIn','OscOut'].includes(kind)){
  connect=document.createElement('button');connect.textContent='↔';connect.title='Connect / disconnect device · explicit start';connect.setAttribute('aria-label',connect.title);connect.setAttribute('aria-pressed','false');tools.append(connect);
  connect.onclick=async()=>{try{if(state.connected){await disconnect();return;}const v=values(node);
   if(kind.startsWith('Midi')){
    if(!navigator.requestMIDIAccess)throw Error('Web MIDI unavailable in this host · use a Web MIDI capable browser');
    midiAccess=await navigator.requestMIDIAccess({sysex:false});const ports=[...(kind==='MidiIn'?midiAccess.inputs:midiAccess.outputs).values()];midiPort=ports.find(p=>p.id===v.device||p.name===v.device)||(!v.device?ports[0]:null);if(!midiPort)throw Error('No matching MIDI device. Available: '+ports.map(p=>p.name).join(', '));await midiPort.open();
    if(kind==='MidiIn')midiPort.onmidimessage=e=>{const [status,a,b=0]=e.data,v=values(node),channel=(status&15)+1;if(v.channel&&v.channel!==channel)return;const type=status&240;let key,x;if(type===176){key=`ch${channel}.cc${a}`;x=b/127;}else if(type===144||type===128){key=`ch${channel}.note${a}`;x=type===128?0:b/127;}else if(type===224){key=`ch${channel}.pitch`;x=(a+b*128)/16383;}else if(type===208){key=`ch${channel}.pressure`;x=a/127;}else return;state.deviceChannels[key]=x;state.deviceRevision=(state.deviceRevision??0)+1;};
   }else if(kind==='OscIn'){const result=await request('start',{port:v.port,client:api.clientId});oscToken=result.token;touchTimer=setInterval(()=>request('touch',{token:oscToken}).catch(e=>status.textContent=e.message),30000);}
   state.connected=true;lastSent='';connect.setAttribute('aria-pressed','true');status.textContent='Connected';
  }catch(error){status.textContent=error.message;await disconnect().catch(()=>{});}};
 }
 function send(data,v,now){
  if(kind==='MidiOut'&&midiPort){const musical=Boolean(data.channels.note)||Object.keys(data.channels).some(k=>/note\d+$/.test(k)),control=noteControl(data),x=musical&&v.message==='note'?(control.gate?control.velocity:0):Math.max(0,Math.min(1,first(data))),number=musical&&v.message==='note'?Math.round(control.note):Number(v.number),ch=Number(v.channel)-1;let bytes=v.message==='pitch'?[224|ch,Math.round(x*16383)&127,Math.round(x*16383)>>7]:v.message==='note'?[x?144|ch:128|ch,number,Math.round(x*127)]:[176|ch,number,Math.round(x*127)];const key=bytes.join(',');if(key!==lastSent){if(activeNote&&(v.message!=='note'||!x||activeNote[0]!==ch||activeNote[1]!==number)){midiPort.send([0x80|activeNote[0],activeNote[1],0]);activeNote=null;}midiPort.send(bytes);if(v.message==='note'&&x)activeNote=[ch,number];lastSent=key;}}
  if(kind==='OscOut'&&!sendBusy&&now-lastSend>=1000/30){const vals=Object.values(data.channels).slice(0,64).map(a=>a.at(-1)),key=JSON.stringify([v.port,v.address,vals]);if(key===lastSent)return;lastSent=key;lastSend=now;sendBusy=true;request('send',{port:v.port,address:v.address,values:vals}).catch(error=>{status.textContent=error.message;lastSent='';}).finally(()=>sendBusy=false);}
 }
 const onOSC=e=>{if(e.detail.token!==oscToken)return;for(const [name,x]of Object.entries(e.detail.channels))if(patternMatch(name.split(':')[0],values(node).address))state.deviceChannels[name]=x;state.deviceRevision=(state.deviceRevision??0)+1;};api.addEventListener('genereti-osc',onOSC);
 play.onclick=()=>{state.running=!state.running;if(!state.running&&activeNote&&midiPort){midiPort.send([0x80|activeNote[0],activeNote[1],0]);activeNote=null;lastSent='';}play.textContent=state.running?'Ⅱ':'▶';play.setAttribute('aria-pressed',String(!state.running));};
 const reset=document.createElement('button');reset.textContent='↺';reset.title='Reset channel history';reset.setAttribute('aria-label',reset.title);reset.onclick=()=>{state.memory={};state.history?.clear();state.lastInput=null;};if(['Lag','Speed','Slope'].includes(kind))tools.append(reset);
 node.addDOMWidget('signal_preview','GENERETI_CHOP_PREVIEW',surface,{serialize:false,hideOnZoom:false}).computeSize=width=>[width,(previewMinimized?0:Math.max(0,width-24)*96/512)+85];
 disclosure.onclick=()=>{previewMinimized=!previewMinimized;canvas.hidden=previewMinimized;canvas.style.display=previewMinimized?'none':'block';disclosure.textContent=previewMinimized?'›':'⌄';disclosure.setAttribute('aria-expanded',String(!previewMinimized));node.setSize?.(node.computeSize());};freeze.onclick=()=>{previewFrozen=!previewFrozen;freeze.setAttribute('aria-pressed',String(previewFrozen));};
 node._generetiChop=state;node._generetiLiveValue=slot=>slot===1?first(state.latest):undefined;
 states.add(state);if(!raf)raf=requestAnimationFrame(clock);
 const remove=node.onRemoved;node.onRemoved=function(){state.dead=true;states.delete(state);window.removeEventListener('pagehide',onPageHide);api.removeEventListener('genereti-osc',onOSC);disconnect().catch(()=>{});return remove?.apply(this,arguments);};
 const onPageHide=()=>{if(oscToken)fetch('/genereti/chop/osc/stop',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:oscToken}),keepalive:true});};window.addEventListener('pagehide',onPageHide,{once:true});
}});
