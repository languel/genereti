import { outputWindow } from './output-window.js';
// Same-origin BroadcastChannel works even when a desktop browser opens a
// window but returns no window.opener/WindowProxy.
export function projectorLink(container, pageUrl, status) {
  const output = outputWindow(status);
  const fitSelect=document.createElement('select');fitSelect.title='Projector / output fit';fitSelect.setAttribute('aria-label','Output fit');
  for(const [label,value] of [['Contain','contain'],['Cover','cover'],['Stretch','fill'],['Native pixels','native']])fitSelect.append(new Option(label,value));
  try{fitSelect.value=localStorage.getItem('genereti-output-fit')||'contain';}catch{}
  output.setFit(fitSelect.value);
  fitSelect.onchange=()=>{output.setFit(fitSelect.value);try{localStorage.setItem('genereti-output-fit',fitSelect.value);}catch{}channel.postMessage({type:'fit',fit:fitSelect.value});};
  const outputButton = document.createElement('button');
  outputButton.type = 'button';
  outputButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>';
  outputButton.title = 'Open direct output window · no JPEG or network transport';
  outputButton.setAttribute('aria-label', 'Open output window');
  outputButton.onclick = async () => {await output.open(); if(latest) output.publish(latest);};
  const floatingButton = document.createElement('button');
  floatingButton.type = 'button';
  floatingButton.title = 'Open floating output window · stays above the editor';
  floatingButton.setAttribute('aria-label', 'Open floating output window');
  floatingButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><rect x="11" y="11" width="8" height="7" rx="1"/></svg>';
  floatingButton.onclick = async () => {await output.open({floating:true}); if(latest) output.publish(latest);};
  const outputControls = document.createElement('div');
  outputControls.style.cssText = 'display:flex;gap:4px';
  outputControls.append(outputButton,fitSelect);
  if(window.documentPictureInPicture?.requestWindow) outputControls.append(floatingButton);
  container.append(outputControls);
  const token = crypto.randomUUID();
  const channel = new BroadcastChannel(`genereti-projector-${token}`);
  const url = new URL(pageUrl, location.origin); url.searchParams.set('channel', token);
  let latest = null, popup = null, connected = false, waiting = false, copying = false, disposed = false;
  let revision=0, sentRevision=-1;
  const send = () => {if(connected&&!waiting&&latest&&sentRevision!==revision){waiting=true;sentRevision=revision;channel.postMessage({type:"frame",...latest});}};
  const relayUrl=`/genereti/projector/${token}`;
  let relayActive=false, relayBusy=false, relayLast=0;
  const relayCanvas=document.createElement('canvas');
  const demandTimer=setInterval(async()=>{
    if(disposed)return;
    try {const response=await fetch(`${relayUrl}/demand`,{cache:'no-store'});relayActive=response.ok&&(await response.json()).active;}
    catch {relayActive=false;}
  },1000);
  async function relayFrame(frame){
    // Encode only while a separate projector requests frames. One in flight.
    if(!relayActive||relayBusy||performance.now()-relayLast<1000/30)return;
    relayBusy=true;relayLast=performance.now();
    try {
      let blob;
      if(frame.bitmap){
        if(relayCanvas.width!==frame.bitmap.width||relayCanvas.height!==frame.bitmap.height){relayCanvas.width=frame.bitmap.width;relayCanvas.height=frame.bitmap.height;}
        relayCanvas.getContext('2d').drawImage(frame.bitmap,0,0);
        blob=await new Promise(resolve=>relayCanvas.toBlob(resolve,'image/jpeg',.85));
      } else {
        const image=await createImageBitmap(frame.blob||await(await fetch(frame.src)).blob());
        relayCanvas.width=image.width;relayCanvas.height=image.height;relayCanvas.getContext('2d').drawImage(image,0,0);image.close();
        blob=await new Promise(resolve=>relayCanvas.toBlob(resolve,'image/jpeg',.85));
      }
      if(blob&&!disposed){const response=await fetch(`${relayUrl}/frame`,{method:'POST',headers:{'Content-Type':'image/jpeg'},body:blob});if(!response.ok)status.textContent='Projector relay unavailable · restart Comfy';}
    } catch(error){if(!disposed)status.textContent=`Projector relay: ${error.message}`;}
    finally {relayBusy=false;}
  }
  const link = document.createElement('input');
  link.readOnly = true; link.value = url.href; link.title = 'Projector link · open in another window on this browser';
  link.style.cssText = 'width:100%;font-size:11px;box-sizing:border-box';
  const copy = document.createElement('button');copy.type='button';copy.textContent='Copy projector link';
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(url.href); status.textContent='Projector link copied'; }
    catch { link.focus();link.select();status.textContent='Copy the selected link with Cmd/Ctrl+C'; }
  };
  container.append(copy,link);
  channel.onmessage = event => {
    if (event.data?.type === 'ready') {
      channel.postMessage({type:'fit',fit:fitSelect.value});connected=true;waiting=false;sentRevision=-1;status.textContent='Projector connected';send();
    } else if(event.data?.type==='ack') {waiting=false;send();}
  };
  return {
    open() {
      if (popup && !popup.closed) {popup.focus();return;}
      popup=window.open(url.href,`genereti-projector-${token}`,'popup,width=1280,height=800');
      status.textContent='Waiting for projector · if no window appears, open the link below';
    },
    async publish(frame) {
      if(disposed)return;
      output.publish(frame);
      void relayFrame(frame);
      if(!connected && !frame.src && !frame.blob) return;
      if(frame.bitmap){
        if(copying)return;
        copying=true;
        try {
          const bitmap=await createImageBitmap(frame.bitmap);
          if(disposed){bitmap.close();return;}
          latest?.bitmap?.close();latest={bitmap};revision++;send();
        } finally {copying=false;}
      } else {latest?.bitmap?.close();latest=frame;revision++;send();}
    },
    close() {output.close();disposed=true;clearInterval(demandTimer);channel.close();popup?.close();latest?.bitmap?.close();latest=null;},
  };
}
