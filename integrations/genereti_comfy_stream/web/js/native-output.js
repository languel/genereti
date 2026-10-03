// macOS companion: latest-only PNG delivery, active only for an open OS window.
export function nativeOutput(status,onStateChange=()=>{}) {
  let token=null,disposed=false,pending=false,active=false,last=0,fit='contain',latest=null,opening=null,fitDirty=false;
  const canvas=document.createElement('canvas');
  async function remove(id){if(id)try{await fetch(`/genereti/native-output/${id}`,{method:'DELETE',keepalive:true});}catch{}}
  const timer=setInterval(async()=>{
    if(!token)return;
    try{const response=await fetch(`/genereti/native-output/${token}/demand`);if(response.status===404){onStateChange(false);token=null;active=false;latest=null;}else if(response.ok)active=(await response.json()).active;}
    catch{active=false;}
  },500);
  async function send(blob){
    if(!token||disposed)return;
    const response=await fetch(`/genereti/native-output/${token}/frame?fit=${fit}`,{method:'POST',headers:{'Content-Type':'image/png'},body:blob});
    if(!response.ok)throw new Error(await response.text());
  }
  async function flushFit(){
    if(!latest||disposed)return;
    if(pending){fitDirty=true;return;}
    pending=true;fitDirty=false;
    try{await send(latest);}catch(error){if(!disposed)status.textContent=`Native output: ${error.message}`;}
    finally{pending=false;if(fitDirty)void flushFit();}
  }
  return {
    async open(){
      if(disposed)return false;
      if(token)return true;
      if(opening)return opening;
      opening=(async()=>{
        try{
          status.textContent='Opening native output window…';
          const response=await fetch('/genereti/native-output/open',{method:'POST'});
          if(!response.ok)throw new Error(await response.text());
          const id=(await response.json()).token;
          if(disposed){await remove(id);return false;}
          token=id;active=true;status.textContent='Native output window · loopback PNG';return true;
        }catch(error){status.textContent=`Native output: ${error.message}${String(error.message).includes('404')?' · restart Comfy to load the Desktop integration':''}`;return false;}
        finally{opening=null;}
      })();return opening;
    },
    publish(frame){
      if(!token||disposed||!active||pending||performance.now()-last<1000/30)return;
      pending=true;last=performance.now();
      // Borrow live bitmaps synchronously, before the source closes them.
      if(frame.bitmap){canvas.width=frame.bitmap.width;canvas.height=frame.bitmap.height;canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);canvas.getContext('2d').drawImage(frame.bitmap,0,0);}
      (async()=>{
        let bitmap;
        try{
          if(!frame.bitmap){bitmap=await createImageBitmap(frame.blob||await(await fetch(frame.src)).blob());canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext('2d').drawImage(bitmap,0,0);}
          latest=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
          if(latest)await send(latest);
        }catch(error){if(!disposed)status.textContent=`Native output: ${error.message}`;}
        finally{bitmap?.close();pending=false;if(fitDirty)void flushFit();}
      })();
    },
    setFit(next){fit=next;void flushFit();},
    close(){disposed=true;clearInterval(timer);const id=token;token=null;active=false;latest=null;void remove(id);},
  };
}
