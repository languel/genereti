/** Minimal one-frame-at-a-time client. Import from http://127.0.0.1:8765/genereti-client.js. */
export class GeneretiClient {
  constructor(base='http://127.0.0.1:8765') { this.base=base.replace(/\/$/,''); this.busy=false; }
  async generate({canvas, image, ...options}={}) {
    if(this.busy) return null; // Drop inputs while a frame is in flight; never build a queue.
    this.busy=true;
    try {
      const response=await fetch(this.base+'/api/generate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...options,image:canvas?canvas.toDataURL('image/jpeg',.9):image}),
        signal:AbortSignal.timeout(120000),
      });
      if(!response.ok) throw new Error(await response.text());
      const bitmap=await createImageBitmap(await response.blob());
      return {bitmap, inferenceMs:Number(response.headers.get('X-Inference-Ms')),frame:Number(response.headers.get('X-Frame'))};
    } finally { this.busy=false; }
  }
}
