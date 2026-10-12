import {topology} from './selection.js';
import {pointsFor} from './features.js';
const contour=new Set(Object.values(topology.faceGroups).flat().map(i=>'face.'+i));
// Keep the original worker frame separate from diagnostic marks. Both outputs
// describe the same analyzed frame, never the newer pending input frame.
export function paintProviderImages(clean,overlay,bitmap,features,width,height){
 for(const image of [clean,overlay])if(image.width!==width||image.height!==height){image.width=width;image.height=height;}
 const ctx=clean.getContext('2d');ctx.clearRect(0,0,width,height);ctx.drawImage(bitmap,0,0);
 const paint=overlay.getContext('2d');paint.clearRect(0,0,width,height);paint.drawImage(clean,0,0);
 const sideHands=Object.keys(features).some(k=>/^hands\.(left|right)\./.test(k));
 for(const p of pointsFor({features},.4).filter(p=>(!sideHands||!/^hands\.\d+\./.test(p.name))&&(!p.name.startsWith('face.')||contour.has(p.name)))){
  paint.fillStyle='#72d3c1';paint.beginPath();paint.arc(p.x*width,p.y*height,Math.max(.7,Math.min(1.5,width/512)),0,Math.PI*2);paint.fill();
 }
}
