# Shared browser perception and events

This implements the first Genereti milestone from
[GeneretiCore's roadmap](../../genereticore/docs/browser-perception-plan.md).
The approach uses Underscores' named semantic streams and Artist–Model Studio's
held, sequential gesture conditions as design references. Their app-specific
code and actions are not dependencies. Larger detection/segmentation providers,
learned gestures, persistent tracking IDs, and palette/prompt actions remain later work.

## Use

Add **ꘇ mediapipe.stream** and connect an updated browser IMAGE source: 2D
Livecode, media stream, or a separately started webcam. A live image preview may
sit between source and provider. Choose a unique global stream name and a task:
pose, hands, face, or segment. One provider owns each name in the active workflow;
all readers share its latest result. At most 16 names can be registered.

Press **↓** to download the selected model and shared runtime, **↑** to load,
then **▶** to start inference. Subscribing never starts camera/screen capture.
**Ⅱ** releases input subscriptions, invalidates observations and holds the last
preview; the loaded model remains available to resume. **×** terminates the
worker and frees its model resources. Removal/page exit does the same. Reset ↺ clears a scene/history revision without starting capture. Changing
task requires another explicit load; changing name stops the old stream.

Optional Apache-2.0 assets are pinned in `assets.json` with exact SHA-256/size.
They stay in Comfy's `models/genereti/browser-perception`, outside the package.
Runtime 0.10.32 includes SIMD and non-SIMD WASM variants (22.65 MB shared).
Including runtime, first download is 28.43 MB pose, 30.47 MB hands, 26.41 MB face,
or 22.90 MB segmentation. Later task downloads reuse verified runtime files.
Downloads use official Google model URLs and versioned npm files on jsDelivr.
No Python MediaPipe package, automatic download, cloud inference, or media upload.
The current explicit backend is **WASM CPU**. GPU execution is not claimed.

## Nodes and scripting

- Landmark provider outputs a clean analyzed IMAGE, structured observations DAT,
  and a separate diagnostic overlay IMAGE. The preview is clean by default;
  its diagnostic toggle does not change either output or filter the global stream.
  Selection belongs in Features. Old provider selection fields are ignored.
- Segments outputs a grayscale mask and the source with that mask applied as alpha
  (cutout). Both retain source geometry; there is no implicit cover crop.
- **perception.read**: name a global stream and feature. CHOP channels include
  `value`, `valid`, `age_ms`; Float can wire into ordinary parameters; DAT carries
  the complete structured result. Missing/stale values have `valid=0` and zero
  scalar. Consumers should check validity, not interpret zero as detection.
- **perception.events**: interactive rule rows with a live feature picker,
  comparator, threshold, hold time, sequence steps, timeout, cooldown, and progress.
  Its ordinary JSON widget is the portable advanced editor. Import/export is
  versioned JSON. Start rule evaluation explicitly with ▶. CHOP has per-rule
  active state, cumulative entry count, and validity; DAT contains the last event
  batch and source association. A named browser event is emitted once on entry
  and once on exit. Consumers must use count or event subscriptions to detect
  fresh events rather than repeatedly treating the held DAT batch as a trigger.

Livecode examples (all runtimes expose `__`):

```js
const frame = __.streams.read('body', 500); // null when unavailable/stale
const x = frame?.features['pose.nose.x'] ?? 0.5;
__.events.on('person.present', e => {
  if (e.phase === 'entry') console.log('entered', e.stream);
}); // returns an unsubscribe function; handlers clear on recompilation
```

Host code can use `window.generetiPerception.streams.list/read/subscribe` and
`events.subscribe`. `__.streams.list()` lists descriptors. Stream state is local
to the active browser workflow, never a headless server or cross-tab broadcast.
Global results are read-only consumer data by convention; they contain no pixels.

Named features: `pose.nose.x`, `pose.left_wrist.y` (official 33 pose names),
`hands.0.index_tip.x`, `hands.1.thumb_tip.y`, `face.1.x` (numeric face vertices),
`face.blend.jawOpen`, `<task>.count`, `segment.coverage`, and
`segment.mean_confidence`. Hand indices are per-frame detections, **not stable
track IDs**. Coordinates are unmirrored normalized image coordinates, x right/y
down. A source that intentionally mirrors pixels must interpret its own image;
MediaPipe hand-classifier handedness scores do not establish body-side identity.

## Portable rule contract

```json
{"version":1,"rules":[{"name":"person.present","steps":[
  {"feature":"segment.coverage","op":">","value":0.15,"hold_ms":300}
],"within_ms":1500,"cooldown_ms":800}]}
```

A step can replace `feature` with
`"distance":["hands.0.thumb_tip","hands.0.index_tip"]`.
The visual feature input accepts `distance:pointA,pointB`. Distance is measured
in image-height units, accounting for non-square aspect. Missing points never
satisfy a condition. Operators: `>`, `<`, `>=`, `<=`. All timing is milliseconds.
Steps proceed in order on fresh source frames. A sequence must finish within
`within_ms`; false conditions interrupt the current hold. Entry fires once,
then the first condition must release before rearming, with cooldown respected.
Stale input/source changes reset progress without generating a synthetic exit.
There is no eval, app command, automatic queue, or assistant action in a rule.

## Lifecycle and budgets

Perception-v1 contains source ID/output slot/revision/frame timestamp, original
width/height, coordinate convention, model/version/backend, completion time,
result age and copy/model/worker/round-trip/cold-load timings. Subscribers reject
old source revisions, paused producers, and results older than their age limit.
Livecode receives semantic snapshots at 10 Hz; its API continues ageing them
between updates. IMAGE is held between inferences; DAT tells which source frame
that slower result belongs to. Decisions use source time rather than repeatedly
advancing a hold over the same frame.

Borrowed source frames are copied synchronously. One worker inference plus one
newest waiting canvas per provider; no FIFO. The maximum source is 1024 px per
side, and oversize input requests an explicit upstream resize. Rate defaults to
15 inferences/s, configurable 1–60, bounded by measured processing time. CPU
workers protect the main rendering thread; processing/copying still has a cost.
No unbounded history is retained by the service or event engine. A worker error
unloads and requires explicit reload; there is no backend fallback.

## Sources and notices

[MediaPipe segmentation Web guide](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter/web_js),
[Pose Web guide](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js),
[Hands Web guide](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js),
[Face Web guide](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js),
[Selfie segmentation model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Selfie%20Segmentation.pdf),
[MediaPipe Apache-2.0 license](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE).
Exact pinned artifacts and download hosts are recorded in the package catalog.

## Verified checkpoint (October 11, 2026)

Chromium on this Mac: actual CPU inference from non-square 640×360 Livecode
streams, direct and through live image preview; person mask, 33-point pose,
two detected hands, face landmarks and blendshapes. Sample warm model times
were about 11 ms segmentation, 19 ms pose, 32 ms hands and 16 ms face (not a
classroom-device benchmark). With segmentation at 15 Hz, a 5-second browser
render sample had median 16.7 ms and p95 17.2 ms frame intervals.

Shared readers, one-entry presence event, Livecode stream/event bridge, camera
remaining inactive on creation, stale-result unit tests, pause/unload and source
revision tests were verified. Physical webcam start/stop still needs a manual
user test; no camera permission was granted during verification. Optional
models/runtime were downloaded to local Comfy cache for tests; no assets were
added to Git. The demo **ꘇ-Optional-MediaPipe-Streams** opens without downloads
or capture; its 2D stage is a placeholder, not an artificial human detection.
Replace that input with live media or rewire the separately started webcam.

## Feature selection and demo series

`perception.features` supplies a clickable landmark map, confidence-filtered
CHOP/DAT outputs and a named selected stream for downstream pens and events.
See [the MediaMime demo series](perception-demos.md) for the three optional
workflows and local-only movie testing. Walking and dancing Muybridge GIFs
were verified locally with pose detection, selection, event brush drawing,
selection restore and pause invalidation. No test media is bundled.

## Stream fixtures and combined rules

The 2D stream owns crop/four-corner framing and bounded still/clip loops.
Loops retain source frames and apply current framing on playback/export before tracking; switching fixtures or framing
invalidates downstream history. Multiple providers can analyze the same input
concurrently. Qualified feature names (`stream::feature`) join fresh results
from matching image geometry with up to 150 ms frame skew; the slower source
time advances gesture holds. Demo 04 provides a configurable nose/finger
proximity rule. Anatomical handedness must still be verified during calibration.

## Combined landmark streams and selection sets

`mediapipe.stream` now supports simultaneous Pose/Hands/Face task toggles.
A single worker evaluates selected detectors on the same untouched frame, then
publishes one coherent result with task timings. This avoids joining unrelated
completion times for interactions such as a finger touching the nose.
Existing single-task workflows remain compatible.

`selection.js` defines portable semantic selectors; `selection-editor.js`
provides schematic body/face/hand maps, fine vertices and named JSON selection
sets. Group topology follows Underscores' landmark ontology; schematic pose and
hand geometry follows Threegrease. The independent region controls follow
Sketchcam's face/body/finger approach. These maps are selection diagrams rather
than synthetic detector output. Live previews always use inferred coordinates.

`mediapipe.segments` separates binary selfie segmentation and the optional
six-category selfie model from landmarks. Category unions, threshold, softness,
inversion, mask and cutout outputs share the bounded worker lifecycle.
The optional multiclass model is pinned by size and SHA-256 in assets.json;
no model weights or user fixtures are tracked. Official category definitions:
https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter

Holistic is the default for new `mediapipe.stream` nodes. It uses the pinned
MediaPipe Tasks Holistic bundle (approximately 13.7 MB), optionally downloaded
and verified outside the repository, and maps coordinated pose, face, and
left/right hand observations into the existing feature ontology. Independent
models remain available for narrower pipelines; installed model changes can
reload and resume without a second transport action. Start loads installed
models automatically, without starting camera or screen capture. Holistic is
a coordinated graph of component models; performance and close-up detection
should be measured rather than assumed to match independent task behavior.

## 0.1.4 interface checkpoint

One provider publishes all active-task detections to a named global stream. Several
Features, read, event and drawing consumers share that result without extra inference.
Separate provider nodes still have separate workers. Features' optional IMAGE input
is a source underlay, not an inference source; connect the clean image output to avoid
doubled landmarks. Its point-size control affects only the live preview.

The Features map also offers a static canonical front-facing 478-point reference
with no connections; the stylized map remains the default. Outline icons, compact
L/R labels, optional numeric/initial IDs, and Ctrl-box/Option-paint selection support
dense picking. Shift adds, Escape cancels, and view transforms never change data.
All package node categories share the Genereti root. Local Holistic workflows migrate
into Workflows → Genereti with conflicts backed up and local media URLs preserved.
