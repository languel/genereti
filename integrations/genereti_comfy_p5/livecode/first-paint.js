// A candidate must paint even when Chromium throttles its offscreen rAF.
// Wait until p5 setup has returned; redraw inside setup is ignored by p5.
export function firstPaintFallback(paint, pending, {schedule=setTimeout,cancel=clearTimeout}={}){
 const timer=schedule(()=>{if(pending())paint();},120);
 return ()=>cancel(timer);
}
