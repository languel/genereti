// Classic worker: MediaPipe WASM glue uses importScripts. Never a module worker.
let tasks=[],kinds=[],lastTimestamp=0,lastRevision=-1,selection;
const base='/genereti/perception/assets/';
const modelFile={holistic:'holistic.task',pose:'pose.task',hands:'hands.task',face:'face.task',segment:'selfie_segmenter.tflite',multiclass:'selfie_multiclass.tflite'};
self.onmessage=async({data:m})=>{
 try{
  if(m.type==='load'){
   for(const t of tasks)t.close();tasks=[];kinds=m.tasks??[m.task];lastRevision=-1;lastTimestamp=0;
   selection=await import('./selection.js?v=4');kinds=selection.taskSelection(kinds.join(' '));
   const started=performance.now(),mod=await import(base+'vision_bundle.mjs'),files=await mod.FilesetResolver.forVisionTasks(base.slice(0,-1));
   for(const kind of kinds){
    const options={baseOptions:{delegate:'CPU',modelAssetPath:base+modelFile[kind]},runningMode:'VIDEO'};
    if(['segment','multiclass'].includes(kind))tasks.push(await mod.ImageSegmenter.createFromOptions(files,{...options,outputConfidenceMasks:true,outputCategoryMask:false}));
    if(kind==='holistic')tasks.push(await mod.HolisticLandmarker.createFromOptions(files,{...options,outputFaceBlendshapes:true,outputPoseSegmentationMasks:false}));
    if(kind==='pose')tasks.push(await mod.PoseLandmarker.createFromOptions(files,{...options,numPoses:1}));
    if(kind==='hands')tasks.push(await mod.HandLandmarker.createFromOptions(files,{...options,numHands:2}));
    if(kind==='face')tasks.push(await mod.FaceLandmarker.createFromOptions(files,{...options,numFaces:1,outputFaceBlendshapes:true}));
   }
   self.postMessage({type:'ready',loadMs:performance.now()-started,tasks:kinds});return;
  }
  if(m.type!=='frame')return;
  if(lastRevision!==m.revision)for(let i=0;i<tasks.length;i++)if(!['segment','multiclass'].includes(kinds[i])){await tasks[i].setOptions({runningMode:'IMAGE'});await tasks[i].setOptions({runningMode:'VIDEO'});}
  lastRevision=m.revision;const start=performance.now(),canvas=new OffscreenCanvas(m.width,m.height),ctx=canvas.getContext('2d');
  ctx.putImageData(new ImageData(new Uint8ClampedArray(m.rgba),m.width,m.height),0,0);
  // Every detector reads the same untouched frame. Paint overlays afterwards.
  const timestamp=lastTimestamp=Math.max(lastTimestamp+.001,m.timestamp),all=[],taskMs={};let cutout;
  for(let i=0;i<tasks.length;i++){
   const task=tasks[i],kind=kinds[i],began=performance.now();
   if(['segment','multiclass'].includes(kind)){
    task.segmentForVideo(canvas,timestamp,r=>{
     const masks=r.confidenceMasks;if(!masks?.length)throw Error('No confidence masks');
     const labels=selection.segmentLabels[kind],selected=m.regions?.length?m.regions:['person'];
     const indices=[...new Set(selected.flatMap(name=>name==='person'?kind==='multiclass'?[1,2,3,4,5]:[1]:[labels.indexOf(name)]).filter(n=>n>=0&&n<labels.length))];
     if(!indices.length)throw Error('Choose categories supported by this segmentation model');
     const values=masks.map(mask=>mask.getAsFloat32Array()),count=values[0].length,rgba=new Uint8ClampedArray(count*4),features={};let coverage=0,mean=0;
     for(let j=0;j<labels.length;j++){const valuesForLabel=kind==='segment'&&masks.length===1?(j===1?values[0]:null):values[j];let n=0;if(valuesForLabel)for(const v of valuesForLabel)n+=v;else if(kind==='segment'&&j===0)for(const v of values[0])n+=1-v;features['segment.'+labels[j]+'.mean_confidence']=n/count;}
     for(let p=0;p<count;p++){let v=0;for(const j of indices)v+=kind==='segment'&&masks.length===1?(j===0?1-values[0][p]:values[0][p]):values[j][p];v=Math.min(1,v);const a=selection.segmentAlpha(v,m);rgba[p*4]=rgba[p*4+1]=rgba[p*4+2]=Math.round(a*255);rgba[p*4+3]=255;mean+=v;if(a>=.5)coverage++;}
     features['segment.coverage']=coverage/count;features['segment.mean_confidence']=mean/count;all.push({features});
     const mask=new OffscreenCanvas(masks[0].width,masks[0].height);mask.getContext('2d').putImageData(new ImageData(rgba,mask.width,mask.height),0,0);
     const alpha=new OffscreenCanvas(m.width,m.height),ac=alpha.getContext('2d');ac.drawImage(mask,0,0,m.width,m.height);const pixels=ac.getImageData(0,0,m.width,m.height);for(let p=0;p<pixels.data.length;p+=4)pixels.data[p+3]=pixels.data[p];ac.putImageData(pixels,0,0);
     const cc=new OffscreenCanvas(m.width,m.height),cx=cc.getContext('2d');cx.drawImage(canvas,0,0);cx.globalCompositeOperation='destination-in';cx.drawImage(alpha,0,0);cutout=cc.transferToImageBitmap();cc.width=cc.height=alpha.width=alpha.height=1;
     ctx.clearRect(0,0,m.width,m.height);ctx.drawImage(mask,0,0,m.width,m.height);mask.width=mask.height=1;
    });
   }else if(kind==='holistic')task.detectForVideo(canvas,timestamp,r=>all.push({features:selection.holisticFeatures(r)}));
   else all.push({features:selection.landmarkFeatures(kind,task.detectForVideo(canvas,timestamp))});
   taskMs[kind]=performance.now()-began;
  }
  const features=selection.combineFeatures(all),bitmap=canvas.transferToImageBitmap();canvas.width=canvas.height=1;
  self.postMessage({type:'result',id:m.id,revision:m.revision,bitmap,cutout,features,tasks:kinds,modelMs:Object.values(taskMs).reduce((a,b)=>a+b,0),taskMs,workerMs:performance.now()-start},cutout?[bitmap,cutout]:[bitmap]);
 }catch(error){self.postMessage({type:'error',message:error?.message??String(error)});}
};
