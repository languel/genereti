// Serve your sketch over localhost. Pause the main Genereti producer before using this.
import {GeneretiClient} from 'http://127.0.0.1:8765/genereti-client.js';
const genereti=new GeneretiClient();
let generated;
// Call from your p5 draw loop with a p5.Graphics input layer.
export async function updateGeneration(inputGraphics) {
  if(genereti.busy)return;
  const frame=await genereti.generate({canvas:inputGraphics.canvas,mode:'sketch',
    prompt:'a colorful ceramic sculpture, studio lighting',seed:42,control_scale:.8});
  if(frame){generated?.close();generated=frame.bitmap;}
}
// Draw using p5's drawingContext.drawImage(generated, 0, 0, width, height).
export function currentGeneratedBitmap(){return generated;}
