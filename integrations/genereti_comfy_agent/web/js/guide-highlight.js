// The halo lives in screen pixels; node corners live in zoomed graph pixels.
export function highlightGeometry(rect,localWidth,localHeight,radii,padding=4){
 const sx=rect.width/(localWidth||rect.width),sy=rect.height/(localHeight||rect.height);
 const corners=radii.map(value=>{const parts=String(value).split(/\s+/).map(parseFloat);return [Math.max(0,(parts[0]||0)*sx)+padding,Math.max(0,(parts[1]??parts[0]??0)*sy)+padding];});
 return {left:rect.left-padding,top:rect.top-padding,width:rect.width+padding*2,height:rect.height+padding*2,radius:corners.map(c=>c[0]+'px').join(' ')+' / '+corners.map(c=>c[1]+'px').join(' ')};
}
