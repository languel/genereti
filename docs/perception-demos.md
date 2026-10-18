# Holistic perception demo series

The baseline is **2D stream → mediapipe.stream (Holistic) → perception.features**.
Load a local film with `+`, press Play, download Holistic once if necessary, then
press Start. Start loads the installed model automatically. Models and media
remain outside Git; camera and screen capture remain explicit browser actions.
The examples sample at 15 fps, limit input to 512 px, and play at half speed.

1. **ꘇ-Perception-01-Streams**: coordinated body, hand and face observations,
   visual region selection, scalar reader and DAT inspection.
2. **ꘇ-Perception-02-Drawing**: four colored pens follow both wrists and ankles over
   the clean source image. Start Livecode explicitly. Adjust `trail_seconds`,
   `smoothing` (0 = direct, 1 = strongest smoothing), `source_opacity`, and
   `stroke_width` in Livecode. R clears trails. Pausing holds the drawing; missing
   joints break their strokes. Source and pens share an aspect-preserving frame.
   The editable sketch is in [examples/perception-drawing.js](examples/perception-drawing.js).
3. **ꘇ-Perception-03-Event-Brushes**: a `pointer.y > 0.5` half-plane rule arms a
   brush after 100 ms. Start Livecode and the event node explicitly. Edit the
   threshold/hold in the event editor. This is a simple example gate.
4. **ꘇ-Perception-04-Nose-Touch**: one Holistic stream compares `pose.nose`
   with `hands.left.index_tip`. The distance rule is an editable starting point,
   not a claim that the supplied film performs a nose touch. Detection quality,
   distance threshold and hold duration need calibration for a live performance.
5. **ꘇ-Perception-05-Region-Study**: face outline, left eyebrow and outer lips;
   the face map is open for comparing semantic groups with individual vertices.

6. **ꘇ-Perception-06-Measures-Regions**: named locators, positions/centroids,
   pinch and crossing, hand/face estimates and a separate editable shared box.
   Use Measures presets or the `{}` JSON editor; inspect its `measures` stream.
7. **ꘇ-Perception-07-Movement-Painting-Lesson**: one Holistic stream becomes ribbons,
   stitched steps and face-driven ornament (guided lesson).
8. **ꘇ-Perception-08-Mediamime-Body-Drum**: the body as a drum, after Laurie Anderson.
   ꘇ mediamime holds seven zones drawn on the homunculus (head, chest, belly, thighs,
   shoulders) that follow the dancer, two stage gates, a floor tripwire and a
   segmentation wing. Strikes play mod.drumkit (MIDI channel 10) and gates mod.synth
   (channel 1) through chop.select; every hit also bursts into particles in Livecode.
   Press ▶ in mediamime (silent until then), Start on the speakers node, and check its meter. MIDI, OSC and WebSocket
   outputs open from mediamime's own buttons. Rebuild with
   `python3 scripts/build_mediamime_demo.py` (needs a running Comfy).

## Navigating selections

In Features, open ◉ for the combined body map or choose Pose, stylized Face,
static Face mesh, Left hand or Right hand. Stream publishes all observations and
has no selection map. Its clean image output is wired to the Features underlay.
Colored dots identify modality/side. Click dots for individual landmarks, click
contour strokes for regions, or use the searchable text toggles. Selection sets
save/recall combinations and export/import portable JSON. The map uses adapted
Threegrease schematic geometry; the optional static face mesh uses a frontal
canonical MediaPipe reference. Neither view changes detection coordinates.

Wheel/pinch zooms, background or middle-drag pans, and Fit resets the view. Focus
selection frames the selected regions. The live feature viewer offers Regions
or Vertices picking, selected-only display, and crisp vector zoom; Shift-click adds/removes selections. Its navigation does
not alter exported IMAGE geometry or normalized feature coordinates. Ctrl-drag selects a box; Option/Alt-drag paints, Shift adds, and Escape cancels.
The mode dropdown defaults to ordinary picking. Optional IDs show numbers or
initials such as LRT. Small preview points are sized independently from the map.
The grid remains toggleable. Paused playback and Hold input retain the last observations;
clearing or disconnecting invalidates them, and held frames do not advance events.

Stable group/point selectors remain the seam for later relation editors: distances,
contact and region area. The existing event editor already supports distances
between point prefixes. New visual relation/area authoring is not implemented here.

## Local early-film test assets

Portable workflows ship empty media URLs. The local preparation script makes
short 15-fps proxies from the user's early-film files in Comfy's input assets,
and writes ready-to-load local workflows under ignored `output/perception-demos`:

```sh
python3 scripts/prepare_perception_demos.py \
  --source-dir "$HOME/Desktop/_tmpassets/earlyfilm" \
  --input-dir "$HOME/ComfyUI-Shared/input"
```

Local recipes use Sandow (streams/regions), discus throwing (drawing), and shot
put (event brushes). Originals are preserved, and neither proxies nor local
workflow URLs are committed. Model detections vary by frame, framing and source
quality; absence of landmarks remains visible. Media rights are not inferred
from filenames. Built-in crop/four-corner framing and the bounded looper can
prepare more useful fixtures and export them outside Git.

The ontology and schematic geometry adapt the user's Underscores and Threegrease
work; MediaMime, Artist–Model Studio and SketchCam informed event/brush routing.

On this machine the prepared variants are also installed in Comfy's workflow
picker under `Genereti`. Save your active workflow and refresh
the frontend before opening the rebuilt examples.
