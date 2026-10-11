# MediaMime / perception demo series

The reusable chain is **2D stream → mediapipe.stream → perception.features**.
Pick a local movie/GIF with `+`, explicitly press Play, load the pose task with
`↑`, then start inference with `▶`. A source no larger than 1024 px per side is
required. Optional downloads are selected explicitly; models remain in Comfy's
local cache. Nothing starts capture automatically.

1. **ꘇ-Perception-01-Streams**: source, pose overlay, clickable landmark map,
   scalar reader and DAT inspection. Click selects one landmark; Shift-click
   extends the selection. Edit the source/task/feature names for hands or face.
2. **ꘇ-Perception-02-Drawing**: the first selected point drives a canvas cursor
   and pen. Start the Livecode editor explicitly. Select another landmark while
   running to redirect the pen; stale/missing results break the stroke. R clears
   the drawing while its editor has focus.
3. **ꘇ-Perception-03-Event-Brushes**: a `pointer.y > 0.5` region gate holds for
   100 ms before `brush.down` enters. Start Livecode first, then start the event node explicitly.
   Entry arms the brush and changes color; exit stops it. Edit the threshold,
   holds or sequence in the existing event editor. This is a simple half-plane
   region, not a complete MediaMime drawn-region editor.

The selected global stream carries original source coordinates and frame times.
Drawing consumes each source frame once, rejects large jumps, and breaks strokes
on stale data, low confidence, pause or source/geometry changes. It draws onto the
node's canvas; it does not move the OS pointer or dispatch privileged input.

## Local test media

The user's Muybridge files under `~/Desktop/_tmpassets/Muybridge` are local-only
fixtures. The current files are animated GIFs, played through the existing
ImageDecoder path. Select them in the browser; do not copy them into the repository
or encode them into workflows. Demos ship empty media inputs and remain reusable
with another person's movies. Browser-picked files must be selected again after
reload. User media rights/provenance are not inferred from filenames.

## Cross-project design notes

Reviewed the local MediaMime mapping and MediaPipe modules, Underscores' landmark
ontology/gesture tracks, Artist–Model Studio's gesture recognizers, ThreeGrease's
stream pens and landmark pickers, and SketchCam's live ink/routing code.
Their reusable ideas are named features, coordinate adapters, confidence-gated
tracking, enter/exit events, selected landmarks driving pens, and explicit routing
to cursor/brush parameters. This implementation is original; sibling application
source code and licensing obligations are not copied into Genereti.

Further milestones: editable drawn-region triggers like MediaMime, a reusable
brush parameter router, hand identity and calibration, recorded stream replay,
and destination adapters for other applications. The current shared perception-v1
contract and JSON event-rule format are the integration seam.

## 04 — Multiple streams: nose touch

`ꘇ-Perception-04-Nose-Touch.json` fans one 2D source into pose (`body`) and hands
(`hand`) providers. Load and start both tasks explicitly. In the hand feature
viewer select the left index tip, confirming handedness visually; the derived
`finger` stream exposes it as `pointer`. The event compares
`body::pose.nose` with `finger::pointer` and emits `touch.nose` after 150 ms within
0.08 image-height units. This is an editable starting rule, not a guarantee of
anatomical hand identity or detection on historical movies. A live nose-touch
performance still needs calibration and validation.

Every 2D stream now has built-in crop/four-corner framing and a bounded still/clip
looper. Use local test movies, record a segment, replay it while editing selection
or events, and save/export useful fixtures outside Git. See
`help/docs/GeneretiMediaStream.md` for controls and capture limits.
