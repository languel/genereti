import {app} from '../../scripts/app.js';
export const SEQUENCER_KINDS=new Set(['Sequence','DrumSequence','Euclidean','CircleSequence','PianoRoll']);
const SETTING='Genereti.Views.SequenceResolution';
export function sequenceViewSize(width,height,resolution=512){const edge=[256,512,1024,2048].includes(Number(resolution))?Number(resolution):512,ratio=edge/Math.max(1,width,height);return [Math.max(1,Math.round(width*ratio)),Math.max(1,Math.round(height*ratio))];}
export function sequenceView(source){
 const canvas=document.createElement('canvas');
 return {canvas,capture(){const [w,h]=sequenceViewSize(source.width,source.height,app.ui.settings.getSettingValue(SETTING));if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);ctx.drawImage(source,0,0,w,h);return canvas;},resolution:()=>app.ui.settings.getSettingValue(SETTING)};
}
app.registerExtension({name:'Genereti.SequenceView',settings:[{id:SETTING,name:'Sequencer view resolution',category:['Genereti','Views','Sequencer resolution'],type:'combo',options:[256,512,1024,2048],defaultValue:512,tooltip:'Longest texture edge for sequence images and backdrops. Keeps the grid/ring aspect ratio. 512 is lighter; 1024 and 2048 provide more detail.'}]});
