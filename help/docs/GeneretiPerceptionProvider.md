# mediapipe.stream

Connect a live IMAGE. New nodes default to **Holistic**, MediaPipe's coordinated
pose, hands and face pipeline. Download ↓ once, then start ▶; Start loads an
installed model automatically. Load ↑ remains available for preloading.
Camera capture is started separately. Pause keeps the last observation held;
unload × frees model memory. WASM CPU only.

The Tracking pipeline dropdown also offers Independent models. In that mode,
toggle Pose, Hands and Face independently. Installed task changes reload and
resume automatically if the stream was running. Every provider publishes all
observations from its active tasks. Selecting landmarks belongs in
**perception.features** and does not reload or repeat inference.
The Holistic model bundle is approximately 13.7 MB and is an optional verified
download outside Git. It combines several component models, not one neural net.
Existing workflows keep their saved task choice.

The preview shows the clean analyzed source frame by default. The landmark
outline glyph toggles diagnostic dots in the preview only. It does not filter
the global stream or change either IMAGE output. There is no provider landmark
selection map; use one or more Features nodes to pick independent subsets of
this provider's named stream without additional inference.

Hands publish both legacy detection-index paths (`hands.0.index_tip`) and
subject-side paths (`hands.left.index_tip`, `hands.right.index_tip`).
Side aliases use the strongest handedness detection each frame, not persistent
person identity. Face vertices remain `face.0` through `face.477`; face
blendshapes retain their scalar paths. Confidence is retained for downstream
feature selection.

Outputs are **image** (clean source frame), **observations** (DAT), and
**overlay** (source frame with diagnostic landmarks). The original IMAGE socket
keeps its index and existing cables, but now carries a clean image so Features
underlays do not contain a second set of dots. Observations also keeps its
original socket index; overlay is appended. DAT includes source timestamp, geometry, revision,
task list and per-task timings. Use perception.read, perception.features,
perception.events or Livecode global streams downstream without repeating
inference. Inputs must be explicitly resized to 2–1024 px per side.

The legacy single-task field and segment workflows still load. For new
segmentation graphs use **mediapipe.segments**, independently of landmarks.
No models ship in the base package.

In Independent mode, use the Pose, Hands and Face toggles to choose tasks. The legacy task
fields remain in saved workflows for compatibility but are hidden from the UI.
The old `features` field is also hidden and ignored: saved provider selections
never restrict data available to downstream consumers. New segmentation graphs
use mediapipe.segments; this change does not add person-mask computation to the
landmark provider. Multiple Features consumers share one provider; separate
provider nodes still run separate inference.
Pausing media or input sampling retains the last observation as a held frame;
unloading models, clearing media, or disconnecting invalidates it.
