# perception.measures

Reads an existing global provider stream; it starts no camera and runs no model.
The map/viewer is the same as perception.features. Select points/groups, then
**+** saves them as a named locator. A locator is the centroid of its available
points; `min_points` can require enough members before it is valid. Measures
refer to `$locatorName` or directly to stable point IDs. Use **◎** beside A/B/C/D
to bind the current map selection to that endpoint. Select a measure type and
**⊕** to add it. The live preview annotates point/centroid positions, distances,
segment pairs and boxes so bindings can be checked against the image. Presets add hand, face, crossing and pinch definitions.

Outputs are numeric CHOP measures, observations DAT and landmark IMAGE. The
`selection_stream` field names the global output (default `measures`). Its name
must differ from the input. Scripts read it with:

```js
const f = __.streams.read('measures')?.features;
const x = f?.['nose.x'];
__.events.on('pinch.click', event => { /* one pulse per completed pinch */ });
const box = __.regions.read('stage::center');
```

Point and centroid x/y use normalized image coordinates, origin top-left.
Distance corrects for source aspect ratio and uses **image-height units**: a
full horizontal span is width/height, not always 1. Crossing tests two finite
2D segments including contact/collinear overlap; it does not imply 3D touch.
Inside/outside references normalized boxes from perception.regions as
`set::box`, or an inline `[x,y,width,height]` box.

Hand counting/open/fist/thumbs-up/down use joint angles and palm distances.
Mouth and eye openness use aperture/width ratios, independently per eye.
These are lightweight 2D heuristics, not learned gesture labels. Thresholds
need adjustment for the camera, person, rotation and occlusion. Missing or
low-confidence landmarks produce `.valid = 0`, with unavailable values absent.
Do not interpret missing data as a closed eye, fist or zero distance.

Gaze estimates iris position within each eye. It is not a true gaze ray or
screen point. `gaze_target` remains invalid until an explicit empirical
`calibration` range is supplied in JSON (`x_min`, `x_max`, `y_min`, `y_max`). This
simple mapping assumes a stable camera/head position. A guided calibration and
head-compensated gaze model are not implemented. See the [MediaPipe Iris
limitations](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/iris.md).

Event rules use the same deterministic step schema as perception.events, but
watch the named measures rather than opaque raw paths. **⚑** adds a threshold
rule. Edit threshold, hold, timeout and cooldown in its card; **+** adds sequence
steps. `{}` opens the CodeMirror JSON editor; **ϟ** or Cmd/Ctrl+Enter applies it.
The visual editor and JSON use the same saved document; JSON is data, not eval.
**↓/↑** export/import portable definitions and locator selections.

A contact envelope watches a distance with separate close/open thresholds.
After the close hold it emits `name.down` (entry). Separation emits `name.up`
(exit), and short contacts emit `name.click` / `name.tap` (pulse) within their
respective duration limits. Cooldown prevents immediate retriggering. Paused
or repeated frames cannot advance holds. Loss/source changes cancel pending
contacts without generating a false release or click. Rich region layers,
area relations and interaction graphs can build on this schema later.
