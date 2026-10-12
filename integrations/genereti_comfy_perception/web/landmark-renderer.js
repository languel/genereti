import {topology,pointIdLabel} from './selection.js';
import {mapColors} from './map-geometry.js';
const leftFace=new Set([...topology.faceGroups['face.left_eye'],...topology.faceGroups['face.left_iris'],...topology.faceGroups['face.left_eyebrow']]),rightFace=new Set([...topology.faceGroups['face.right_eye'],...topology.faceGroups['face.right_iris'],...topology.faceGroups['face.right_eyebrow']]);
const edges=[...topology.poseEdges.map(([a,b])=>['pose.'+topology.poseNames[a],'pose.'+topology.poseNames[b]]),...topology.faceEdges.map(([a,b])=>['face.'+a,'face.'+b]),...['left','right'].flatMap(side=>topology.handEdges.map(([a,b])=>['hands.'+side+'.'+topology.handNames[a],'hands.'+side+'.'+topology.handNames[b]]))];
// Redraw vectors at view scale instead of magnifying a raster preview. Export uses identity view.
export function paintLandmarks(ctx,width,height,points,wanted,grid,view={scale:1,x:0,y:0},underlay=null,opacity=0,showIds=false,pointSize=1.25){
 pointSize=Math.max(.5,Math.min(4,Number(pointSize)||1.25));
 ctx.clearRect(0,0,width,height);ctx.save();ctx.translate(view.x*width,view.y*height);ctx.scale(view.scale,view.scale);ctx.lineWidth=1/view.scale;
 if(underlay&&opacity>0){ctx.globalAlpha=Math.max(0,Math.min(1,opacity));ctx.drawImage(underlay,0,0,width,height);ctx.globalAlpha=1;}
 if(grid){ctx.strokeStyle='rgba(160,160,160,.18)';for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(width*i/4,0);ctx.lineTo(width*i/4,height);ctx.moveTo(0,height*i/4);ctx.lineTo(width,height*i/4);ctx.stroke();}}
 const lookup=new Map(points.map(p=>[p.name,p])),chosen=new Set(wanted);
 for(const [a,b]of edges){const p=lookup.get(a),q=lookup.get(b);if(p&&q){const active=chosen.has(a)&&chosen.has(b);ctx.lineWidth=(active?1.5:.65)/view.scale;ctx.strokeStyle=active?'rgba(255,255,255,.85)':'rgba(180,190,200,.3)';ctx.beginPath();ctx.moveTo(p.x*width,p.y*height);ctx.lineTo(q.x*width,q.y*height);ctx.stroke();}}
 for(const p of points){const selected=chosen.has(p.name);ctx.fillStyle=p.name.startsWith('pose.')?mapColors.pose:p.name.startsWith('hands.left.')?mapColors.left:p.name.startsWith('hands.right.')?mapColors.right:leftFace.has(Number(p.name.slice(5)))?mapColors.leftEye:rightFace.has(Number(p.name.slice(5)))?mapColors.rightEye:mapColors.face;ctx.globalAlpha=selected?1:.55;ctx.beginPath();ctx.arc(p.x*width,p.y*height,(selected?pointSize:pointSize*.7)/view.scale,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;if(showIds){ctx.font=(12/view.scale)+'px monospace';ctx.fillText(pointIdLabel(p.name),p.x*width+9/view.scale,p.y*height-8/view.scale);}}
 ctx.restore();
}
