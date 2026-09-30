// Run as a classic worker, then load the Tasks Vision ESM bundle dynamically.
// MediaPipe's WASM resolver needs importScripts() to load its generated JS glue;
// module workers expose importScripts but throw when it is called, and the
// bundle's fallback (`self.import`) is not a browser API.
let vision;
let tracker;
self.onmessage = async ({data}) => {
  try {
    if (data.type === 'init') {
      vision ||= await import('./vendor/mediapipe/vision_bundle.mjs');
      const files = await vision.FilesetResolver.forVisionTasks(new URL('./vendor/mediapipe/wasm', self.location).href);
      tracker = await vision.PoseLandmarker.createFromOptions(files, {
        baseOptions: {modelAssetPath: new URL('./models/pose_landmarker_lite.task',self.location).href, delegate:'CPU'},
        runningMode:'VIDEO', numPoses:1, minPoseDetectionConfidence:.45, minTrackingConfidence:.45,
      });
      self.postMessage({type:'ready'});
    } else if (data.type === 'frame' && tracker) {
      try {
        const result = tracker.detectForVideo(data.bitmap, data.timestamp);
        self.postMessage({type:'pose', landmarks:result.landmarks[0] || []});
      } finally { data.bitmap.close(); }
    }
  } catch (error) { self.postMessage({type:'error', error:String(error.message || error)}); }
};
