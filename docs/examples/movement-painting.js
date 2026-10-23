// Dance / movement painting. One Holistic provider feeds the "movement" stream.
// A luminous abstract performance stage made from hand-cut paper shapes,
// cobalt blue and orange light, energetic theatrical composition.
let trail_seconds = 18; /* 0..60 step:0.5 */
let smoothing = 0.45; /* 0..1 step:0.01 */
let brush_size = 6; /* 1..24 step:0.5 */
let energy_gain = 1.2; /* 0..4 step:0.05 */
let pigment = 0.58; /* 0.05..1 step:0.01 */
let motif_density = 0.7; /* 0..2 step:0.05 */
let palette_shift = 0; /* 0..360 step:1 */
let source_opacity = 0.08; /* 0..1 step:0.05 */
let accumulate = false; /* toggle */
let show_landmarks = false; /* toggle */
const pens = [
  {name:'wristL',hue:168,ankle:false}, {name:'wristR',hue:345,ankle:false},
  {name:'ankleL',hue:38,ankle:true}, {name:'ankleR',hue:218,ankle:true},
].map(p=>({...p,point:null,last:null,width:1,travel:0}));
let ink, paper, sourceKey='', lastFrame=null, pulseQueue=[], pulseStrength=0, paletteTurn=0, beat=0;
function setup(){
  createCanvas(windowWidth,windowHeight);colorMode(HSB,360,100,100,1);
  ink=createGraphics(width,height);ink.colorMode(HSB,360,100,100,1);
  paper=createGraphics(width,height);paper.background('#f0e8d6');
  randomSeed(17);paper.noFill();
  for(let i=0;i<900;i++){paper.stroke(70,60,45,random(4,15));paper.strokeWeight(random(.3,1));const x=random(width),y=random(height);paper.line(x,y,x+random(2,16),y+random(-2,2));}
  // Quiet cut-paper cobalt/orange stage behind the dancer's marks.
  paper.noStroke();paper.fill(35,65,125,13);paper.rect(width*.13,height*.1,width*.74,height*.8);
  paper.fill(228,119,47,10);paper.triangle(width*.5,height*.1,width*.87,height*.8,width*.13,height*.8);
  for(const name of ['pinchL.click','pinchR.click','pinchL.tap','pinchR.tap','fingers.cross','mouth.opens','eyeL.blinks','eyeR.blinks','stage.enter'])
    __.events.on(name,event=>{if(event.phase==='entry'||event.phase==='pulse'){pulseQueue.push({name});if(pulseQueue.length>32)pulseQueue.shift();}});
}
function clearPainting(){ink?.clear();for(const pen of pens)pen.point=pen.last=null;pulseQueue=[];}
function mark(hue,alpha=1){return [(hue+palette_shift+paletteTurn+720)%360,70,68,alpha];}
function rosette(x,y,r,hue,petals){
  ink.push();ink.translate(x,y);ink.noFill();ink.stroke(...mark(hue,pigment*.6));ink.strokeWeight(.8);
  for(let i=0;i<petals;i++){ink.push();ink.rotate(i*TWO_PI/petals);ink.bezier(0,0,r*.6,-r*.5,r*1.3,r*.4,0,0);ink.pop();}
  ink.noStroke();ink.fill(...mark(hue,pigment*.8));ink.circle(0,0,3);ink.pop();
}
function draw(){
  const record=__.streams.read('movement',500),f=record?.features;
  const key=JSON.stringify([record?.source?.id,record?.source?.revision,record?.source?.width,record?.source?.height]);
  const timestamp=record?.source?.frame_timestamp_ms;
  if(record&&(key!==sourceKey||Number.isFinite(timestamp)&&timestamp<lastFrame)){for(const pen of pens)pen.point=pen.last=null;pulseQueue=[];sourceKey=key;}
  if(Number.isFinite(timestamp))lastFrame=timestamp;
  const live=!!record&&!record.held,dt=Math.min(.1,Math.max(.001,deltaTime/1000));
  const iw=inputImage?.width||record?.source?.width||width,ih=inputImage?.height||record?.source?.height||height;
  const fit=Math.min(width/iw,height/ih),fw=iw*fit,fh=ih*fit,ox=(width-fw)/2,oy=(height-fh)/2;
  const locate=name=>f?.[name+'.valid']&&Number.isFinite(f[name+'.x'])&&Number.isFinite(f[name+'.y'])?{x:f[name+'.x'],y:f[name+'.y']}:null;
  const at=p=>({x:ox+p.x*fw,y:oy+p.y*fh});
  const torso=locate('torso'),face=locate('faceCenter');
  const spread=f?.['reach.valid']?f['reach.distance']:0;
  const mouth=f?.['mouth.valid']?Math.min(1,f['mouth.aperture']):0;
  const touchHeld=!!f?.['pinchL.active']||!!f?.['pinchR.active'];
  const calibratedLook=!!f?.['lookTarget.valid']&&!!f?.['lookTarget.inside'];
  const gaze=f?.['gaze.valid']?Math.max(-1,Math.min(1,f['gaze.x'])):0;
  if(live){
    beat+=dt;pulseStrength*=Math.exp(-dt*2.5);
    if(!accumulate){if(trail_seconds<=0)ink.clear();else{const c=ink.drawingContext;c.save();c.globalCompositeOperation='destination-out';c.fillStyle=`rgba(0,0,0,${1-Math.exp(-dt/trail_seconds)})`;c.fillRect(0,0,width,height);c.restore();}}
    while(pulseQueue.length){const pulse=pulseQueue.shift();pulseStrength=1;
      const which=pulse.name.startsWith('pinchL')?locate('wristL'):pulse.name.startsWith('pinchR')?locate('wristR'):pulse.name.startsWith('eye')||pulse.name.startsWith('mouth')?face:torso;
      if(pulse.name.endsWith('.click')||pulse.name==='fingers.cross')paletteTurn=(paletteTurn+29)%360;
      if(which){const p=at(which);if(pulse.name.endsWith('.tap')){ink.noStroke();ink.fill(...mark(38,pigment));ink.circle(p.x,p.y,8);continue;}const petals=pulse.name==='fingers.cross'?12:pulse.name.includes('pinch')?8:5;rosette(p.x,p.y,12+spread*20+mouth*12,38+paletteTurn,petals);}
    }
  }
  const blend=smoothing<=0?1:1-Math.exp(-dt/(.015+.75*smoothing*smoothing));
  for(const pen of pens){const target=locate(pen.name),side=pen.name.endsWith('L')?'handL':'handR';
    if(!target){pen.point=pen.last=null;continue;}
    const jump=pen.point&&Math.hypot(target.x-pen.point.x,target.y-pen.point.y)>.28;
    if(!pen.point||jump){pen.point={...target};pen.last=null;}
    else if(live){pen.point.x+=(target.x-pen.point.x)*blend;pen.point.y+=(target.y-pen.point.y)*blend;}
    const p=at(pen.point),previous=pen.last;
    if(live&&previous){const dx=p.x-previous.x,dy=p.y-previous.y,d=Math.hypot(dx,dy),speed=d/Math.max(1,fh)/dt;
      const fingers=f?.[side+'.valid']?f[side+'.count']:2;
      const fist=!!f?.[side+'.valid']&&!!f[side+'.fist'];
      const regionBias=f?.['zoneL.inside']?18:f?.['zoneR.inside']?-18:0;
      const hue=pen.hue+fingers*4+gaze*15+regionBias;
      const nextWidth=Math.min(brush_size*5,brush_size*(.55+Math.min(3,speed*energy_gain*3))*(1+mouth*.7+pulseStrength*.5+(touchHeld?.25:0)));
      if(d>.1&&(!fist||pen.ankle)){
        const nx=-dy/d,ny=dx/d;
        if(pen.ankle){pen.travel+=d;if(pen.travel>brush_size*1.2){pen.travel=0;ink.noStroke();ink.fill(...mark(hue,pigment));ink.circle(p.x,p.y,nextWidth*.8);ink.stroke(...mark(hue,.3));ink.strokeWeight(.7);ink.line(previous.x,previous.y,p.x,p.y);}}
        else{ink.noStroke();ink.fill(...mark(hue,pigment*.32));ink.beginShape();ink.vertex(previous.x+nx*pen.width,previous.y+ny*pen.width);ink.vertex(p.x+nx*nextWidth,p.y+ny*nextWidth);ink.vertex(p.x-nx*nextWidth,p.y-ny*nextWidth);ink.vertex(previous.x-nx*pen.width,previous.y-ny*pen.width);ink.endShape(CLOSE);
          ink.stroke(...mark(hue,pigment*.8));ink.strokeWeight(Math.max(.6,brush_size*.18));ink.line(previous.x,previous.y,p.x,p.y);
          ink.stroke(...mark(hue+20,pigment*.3));ink.strokeWeight(.65);ink.line(previous.x+nx*pen.width,previous.y+ny*pen.width,p.x+nx*nextWidth,p.y+ny*nextWidth);
        }
        if(motif_density>0&&f?.[side+'.open']&&frameCount%Math.max(4,Math.round(25/motif_density))===0)rosette(p.x,p.y,Math.min(24,nextWidth*1.5),hue,Math.max(3,fingers+2));
      }
      pen.width=nextWidth;
    }
    if(live)pen.last=p;
  }
  if(live&&torso&&motif_density>0){const p=at(torso),r=(12+Math.min(1,spread)*36)*(1+mouth*.5+(calibratedLook?.2:0));
    if(frameCount%Math.max(4,Math.round(12/motif_density))===0){ink.noFill();ink.stroke(...mark(218+gaze*12,.07*pigment));ink.strokeWeight(.7);ink.ellipse(p.x,p.y,r*2,r*(.7+mouth));
      // Torso acts as a moving loom, weaving fine spokes to the two wrists.
      for(const name of ['wristL','wristR']){const q=locate(name);if(q){const v=at(q);ink.stroke(...mark(name.endsWith('L')?168:345,.045*pigment));ink.line(p.x,p.y,v.x,v.y);}}
    }
  }
  // Thumbs change the current palette gently rather than fabricating hand data.
  if(live&&f?.['handL.thumbs_up'])paletteTurn=(paletteTurn+dt*12)%360;
  if(live&&f?.['handR.thumbs_down'])paletteTurn=(paletteTurn-dt*12+360)%360;
  image(paper,0,0);
  if(inputImage&&source_opacity>0){tint(0,0,100,source_opacity);image(inputImage,ox,oy,fw,fh);noTint();}
  image(ink,0,0);
  if(show_landmarks){for(const pen of pens)if(pen.point){const p=at(pen.point);stroke(...mark(pen.hue,.9));strokeWeight(1);fill(...mark(pen.hue,.9));circle(p.x,p.y,5);noStroke();fill(0,0,20,.9);textSize(11);text(pen.name,p.x+6,p.y-6);}const box=__.regions.read('stage::center');if(box){noFill();stroke(0,0,30,.25);strokeWeight(1);rect(ox+box[0]*fw,oy+box[1]*fh,box[2]*fw,box[3]*fh);}}
  if(!record){noStroke();fill(0,0,30,.8);textSize(14);text('Start the film and Holistic provider · waiting for movement measures',24,height-24);}
}
function keyPressed(){if(key==='r'||key==='R')clearPainting();}
