// Readable measure annotations in live source coordinates; map geometry stays schematic.
export function paintMeasureOverlay(ctx,w,h,view,doc,result,features,regions){
 if(!result||!doc)return;const scale=view.scale,point=ref=>{const name=ref?.startsWith('$')?'locator.'+ref.slice(1):ref;const f=ref?.startsWith('$')?features:result.features,x=f?.[name+'.x'],y=f?.[name+'.y'];return Number.isFinite(x)&&Number.isFinite(y)?[x*w,y*h]:null;};
 ctx.save();ctx.translate(view.x*w,view.y*h);ctx.scale(scale,scale);ctx.font=`${11/scale}px monospace`;ctx.lineWidth=1/scale;ctx.setLineDash([4/scale,3/scale]);
 const label=(text,x,y)=>{ctx.setLineDash([]);ctx.fillStyle='#111d';const width=ctx.measureText(text).width;ctx.fillRect(x,y-12/scale,width+5/scale,15/scale);ctx.fillStyle='#eee';ctx.fillText(text,x+2/scale,y);ctx.setLineDash([4/scale,3/scale]);};
 const segment=(a,b)=>{if(!a||!b)return;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();};
 for(const m of doc.measures){if(!features[m.name+'.valid'])continue;ctx.strokeStyle='#d7dce3b0';const a=point(m.a),b=point(m.b);
  if(['point','centroid'].includes(m.type)){const x=features[m.name+'.x']*w,y=features[m.name+'.y']*h;ctx.beginPath();ctx.arc(x,y,4/scale,0,Math.PI*2);ctx.stroke();label(m.name,x+7/scale,y-7/scale);}
  if(m.type==='distance'&&a&&b){segment(a,b);label(m.name+' '+features[m.name+'.distance'].toFixed(3),(a[0]+b[0])/2,(a[1]+b[1])/2-6/scale);}
  if(m.type==='crossing'){ctx.strokeStyle=features[m.name+'.crossing']?'#fff':'#8889';segment(a,b);segment(point(m.c),point(m.d));}
  if(m.type==='inside'){const box=m.box??regions(m.region);if(box){ctx.strokeStyle=features[m.name+'.inside']?'#8fc8b4':'#8889';ctx.strokeRect(box[0]*w,box[1]*h,box[2]*w,box[3]*h);label(m.name,box[0]*w,box[1]*h-5/scale);}}
 }ctx.restore();
}
