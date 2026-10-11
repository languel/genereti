// Classic worker: MediaPipe's WASM glue uses importScripts. Never a module worker.
let task,kind,lastTimestamp=0,lastRevision=-1;
const base='/genereti/perception/assets/';
const poseNames='nose left_eye_inner left_eye left_eye_outer right_eye_inner right_eye right_eye_outer left_ear right_ear mouth_left mouth_right left_shoulder right_shoulder left_elbow right_elbow left_wrist right_wrist left_pinky right_pinky left_index right_index left_thumb right_thumb left_hip right_hip left_knee right_knee left_ankle right_ankle left_heel right_heel left_foot_index right_foot_index'.split(' ');
const handNames='wrist thumb_cmc thumb_mcp thumb_ip thumb_tip index_mcp index_pip index_dip index_tip middle_mcp middle_pip middle_dip middle_tip ring_mcp ring_pip ring_dip ring_tip pinky_mcp pinky_pip pinky_dip pinky_tip'.split(' ');
self.onmessage=async({data:m})=>{
 try{
  if(m.type==='load'){
   task?.close();kind=m.task;const started=performance.now();const mod=await import(base+'vision_bundle.mjs');const files=await mod.FilesetResolver.forVisionTasks(base.slice(0,-1));
   const options={baseOptions:{delegate:'CPU',modelAssetPath:base+({segment:'selfie_segmenter.tflite',pose:'pose.task',hands:'hands.task',face:'face.task'})[kind]},runningMode:'VIDEO'};
   if(kind==='segment')task=await mod.ImageSegmenter.createFromOptions(files,{...options,outputConfidenceMasks:true,outputCategoryMask:false});
   if(kind==='pose')task=await mod.PoseLandmarker.createFromOptions(files,{...options,numPoses:1});
   if(kind==='hands')task=await mod.HandLandmarker.createFromOptions(files,{...options,numHands:2});
   if(kind==='face')task=await mod.FaceLandmarker.createFromOptions(files,{...options,numFaces:1,outputFaceBlendshapes:true});
   self.postMessage({type:'ready',loadMs:performance.now()-started});return;
  }
  if(m.type!=='frame')return;
  if(lastRevision!==m.revision&&kind!=='segment'){await task.setOptions({runningMode:'IMAGE'});await task.setOptions({runningMode:'VIDEO'});}lastRevision=m.revision;
  const start=performance.now(),canvas=new OffscreenCanvas(m.width,m.height),ctx=canvas.getContext('2d');ctx.putImageData(new ImageData(new Uint8ClampedArray(m.rgba),m.width,m.height),0,0);
  const timestamp=lastTimestamp=Math.max(lastTimestamp+0.001,m.timestamp);const features={};let modelMs=0;
  if(kind==='segment'){
   const began=performance.now();task.segmentForVideo(canvas,timestamp,r=>{
    modelMs=performance.now()-began;const masks=r.confidenceMasks;if(!masks?.length)throw Error('No person confidence mask');
    const index=masks.length===1?0:(task.getLabels().findIndex(x=>/person|selfie/i.test(x))>=0?task.getLabels().findIndex(x=>/person|selfie/i.test(x)):1);
    const mask=masks[index],values=mask.getAsFloat32Array(),rgba=new Uint8ClampedArray(values.length*4);let coverage=0,mean=0;
    values.forEach((v,i)=>{rgba[i*4]=rgba[i*4+1]=rgba[i*4+2]=Math.round(v*255);rgba[i*4+3]=255;mean+=v;if(v>=.5)coverage++;});
    features['segment.coverage']=coverage/values.length;features['segment.mean_confidence']=mean/values.length;
    const out=new OffscreenCanvas(mask.width,mask.height);out.getContext('2d').putImageData(new ImageData(rgba,mask.width,mask.height),0,0);ctx.clearRect(0,0,m.width,m.height);ctx.drawImage(out,0,0,m.width,m.height);out.width=out.height=1;
   });
  }else{
   const began=performance.now(),r=task.detectForVideo(canvas,timestamp);modelMs=performance.now()-began;
   const lists=kind==='face'?r.faceLandmarks:r.landmarks;features[kind+'.count']=lists?.length??0;
   (lists??[]).forEach((points,entity)=>points.forEach((p,index)=>{
    const prefix=kind==='pose'?'pose.'+poseNames[index]:kind==='hands'?`hands.${entity}.`+handNames[index]:`face.${index}`;
    for(const key of ['x','y','z','visibility','presence'])if(Number.isFinite(p[key]))features[prefix+'.'+key]=p[key];
    ctx.fillStyle='rgba(80,220,170,0.9)';ctx.fillRect(p.x*m.width-2,p.y*m.height-2,4,4);
   }));
   for(const shape of r.faceBlendshapes?.[0]?.categories??[])features['face.blend.'+shape.categoryName]=shape.score;
   // Hand array indices are per-frame detection indices, not persistent identities.
   for(const [i,h] of (r.handedness??[]).entries()){features[`hands.${i}.handedness_score`]=h[0]?.score??0;features[`hands.${i}.is_left`]=+(h[0]?.categoryName?.toLowerCase()==='left');}
  }
  const bitmap=canvas.transferToImageBitmap();canvas.width=canvas.height=1;
  self.postMessage({type:'result',id:m.id,revision:m.revision,bitmap,features,modelMs,workerMs:performance.now()-start},[bitmap]);
 }catch(error){self.postMessage({type:'error',message:error?.message??String(error)});}
};
