import {toCanvas} from 'html-to-image';
// Underscores' demand-driven DOM capture: retain the last surface while a
// bounded asynchronous refresh rasterizes CodeMirror marks and inline canvases.
export function domSurface(root,{width=512,height=512,fontEmbedCSS}={}){let cached=null,pending=null,at=0;
 return async function capture(force=false){
  if(!pending&&(force||!cached||performance.now()-at>1000/6)){
   const mathFonts=root.querySelector('.katex')&&fontEmbedCSS;
   pending=toCanvas(root,{width,height,pixelRatio:1,skipFonts:!mathFonts,fontEmbedCSS:mathFonts||undefined,style:{width:width+'px',height:height+'px',transform:'none',position:'relative',margin:'0'},filter:n=>!n.classList?.contains('cm-tooltip')})
    .then(c=>{cached=c;at=performance.now();return c;}).finally(()=>pending=null);
  }
  return force||!cached?await pending:cached;
 };
}
