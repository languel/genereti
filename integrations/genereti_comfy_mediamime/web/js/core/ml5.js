// ml5.js results as perception-v1 features: the fallback to Genereti's own MediaPipe Holistic, and a way to teach the same
// idea in p5.js. ml5's bodyPose (BlazePose names) and handPose give pixel keypoints; the engine reads normalized features.

const handName = n => n.replace('_finger', '');

/** poses: ml5.bodyPose results; hands: ml5.handPose results; width, height: the video's size in pixels. */
export function ml5Features({ poses = [], hands = [], width, height }) {
  const f = {};
  const put = (prefix, k, conf) => {
    f[prefix + '.x'] = k.x / width;
    f[prefix + '.y'] = k.y / height;
    if (Number.isFinite(k.z)) f[prefix + '.z'] = k.z / width;
    const c = k.confidence ?? k.score;
    if (Number.isFinite(c)) f[prefix + '.visibility'] = c;
  };
  const pose = poses[0];
  if (pose) for (const k of pose.keypoints ?? []) if (k.name) put(`pose.${k.name}`, k);
  f['pose.count'] = poses.length;
  // ml5 labels hands by the person's side; the stream's hand indexes are per frame: left first, then right.
  const ordered = [...hands].sort((a, b) => (a.handedness === 'Left' ? 0 : 1) - (b.handedness === 'Left' ? 0 : 1));
  ordered.forEach((hand, i) => { for (const k of hand.keypoints ?? []) if (k.name) put(`hands.${i}.${handName(k.name)}`, k); });
  f['hands.count'] = hands.length;
  return f;
}

/** A perception-v1 result from ml5 output, ready for the engine. */
export function ml5Frame({ poses, hands, width, height }, timestampMs, id = 'ml5') {
  return { version: 1, task: 'ml5', features: ml5Features({ poses, hands, width, height }), source: { id, output_slot: 0, revision: 0, width, height, frame_timestamp_ms: timestampMs } };
}
