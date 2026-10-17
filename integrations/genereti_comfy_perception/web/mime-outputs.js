// ꘇ mediamime outputs: sends the messages planned by mime-engine.js.
// Events go to window.generetiPerception (Livecode __.events). MIDI notes also become held `noteNN` CHOP channels so
// mod.synth / mod.drumkit play them without MIDI hardware. Web MIDI and WebSocket only open after their Connect
// buttons; OSC uses Genereti's loopback-only UDP bridge (/genereti/chop/osc/send).
import {api} from '../../scripts/api.js';

export class MimeOutputs {
 constructor({onStatus=()=>{},node=null}={}){
  this.onStatus=onStatus;this.node=node;this.midi=null;this.midiPorts=[];this.ws=null;this.held=new Map();this.timers=new Set();
  this.oscPort=9000;this.oscLast=new Map();this.log=[];this.sent={event:0,midi:0,osc:0,ws:0};this.armed={osc:false};
 }
 status(text){this.onStatus(text);}
 async connectMidi(portName=''){
  if(!navigator.requestMIDIAccess)throw Error('Web MIDI unavailable in this browser');
  this.access=await navigator.requestMIDIAccess({sysex:false});
  const all=[...this.access.outputs.values()];
  this.midiPorts=portName?all.filter(p=>p.name===portName||p.id===portName):all;
  if(!this.midiPorts.length)throw Error(all.length?'No MIDI output named '+portName+'. Available: '+all.map(p=>p.name).join(', '):'No MIDI outputs. Enable an IAC bus or connect a device.');
  await Promise.all(this.midiPorts.map(p=>p.open?.()));
  this.midi=true;return this.midiPorts.map(p=>p.name);
 }
 async midiNames(){try{const access=this.access??await navigator.requestMIDIAccess?.({sysex:false});return access?[...access.outputs.values()].map(p=>p.name):[];}catch{return [];}}
 disconnectMidi(){this.allNotesOff();this.midi=null;this.midiPorts=[];}
 connectWs(url){
  this.disconnectWs();const u=new URL(url);if(!['ws:','wss:'].includes(u.protocol))throw Error('Use a ws:// or wss:// URL');
  return new Promise((resolve,reject)=>{const ws=new WebSocket(u.href);const t=setTimeout(()=>{ws.close();reject(Error('WebSocket did not open: '+u.href));},4000);
   ws.onopen=()=>{clearTimeout(t);this.ws=ws;resolve();};ws.onerror=()=>{clearTimeout(t);reject(Error('WebSocket failed: '+u.href));};ws.onclose=()=>{if(this.ws===ws){this.ws=null;this.status('WebSocket closed');}};});
 }
 disconnectWs(){try{this.ws?.close();}catch{}this.ws=null;}
 /** Held notes as CHOP channels `chC.noteN` = velocity: mod.synth / mod.drumkit play channels ending in noteN, and
  * chop.select with `ch10.*` (say) splits drums from a synth. */
 noteChannels(){const out={};for(const [key,h]of this.held)out[key]=h.velocity;return out;}
 send(messages,{stream='mime',producer=null}={}){
  for(const m of messages){
   if(m.delay_ms){const t=setTimeout(()=>{this.timers.delete(t);this.send([{...m,delay_ms:0}],{stream,producer});},m.delay_ms);this.timers.add(t);continue;}
   if(m.kind==='event'){
    const event={...m.payload,name:m.name,phase:m.payload.phase==='cross'?'entry':m.payload.phase,trigger:m.payload.phase,stream,producer_node:producer};
    window.generetiPerception?.events.emit(event);this.sent.event++;
   }else if(m.kind==='midi'){
    const [status,a,b]=m.bytes,type=status&0xF0,key='ch'+((status&0x0F)+1)+'.note'+a;
    if(type===0x90&&b>0)this.held.set(key,{status,note:a,velocity:b/127});else if(type===0x80||(type===0x90&&b===0))this.held.delete(key);
    if(this.midi)for(const p of this.midiPorts){try{p.send(m.bytes);}catch(e){this.status('MIDI: '+e.message);}}
    this.sent.midi++;
   }else if(m.kind==='osc'){
    if(!this.armed.osc)continue;
    // At most ~60 messages per second per address; enter/exit always pass.
    const now=performance.now(),last=this.oscLast.get(m.address)??0;if(now-last<16&&m.values[1]===1)continue;this.oscLast.set(m.address,now);
    api.fetchApi('/genereti/chop/osc/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({port:this.oscPort,address:m.address,values:m.values})}).then(r=>{if(!r.ok)r.text().then(t=>this.status('OSC: '+t));}).catch(e=>this.status('OSC: '+e.message));
    this.sent.osc++;
   }else if(m.kind==='ws'){
    if(this.ws?.readyState===1){this.ws.send(JSON.stringify(m.message));this.sent.ws++;}
   }
   this.log.unshift({t:performance.now(),kind:m.kind,text:m.kind==='event'?m.name+' '+m.payload.phase:m.kind==='midi'?m.bytes.map(b=>b.toString(16).padStart(2,'0')).join(' '):m.kind==='osc'?m.address+' '+m.values.map(v=>+v.toFixed?.(3)||v).join(' '):m.message.address+' '+m.message.phase});
   if(this.log.length>40)this.log.length=40;
  }
 }
 allNotesOff(){for(const h of this.held.values())for(const p of this.midiPorts){try{p.send([0x80|(h.status&0x0F),h.note,0]);}catch{}}this.held.clear();}
 dispose(){for(const t of this.timers)clearTimeout(t);this.timers.clear();this.allNotesOff();this.disconnectWs();this.midi=null;}
}
