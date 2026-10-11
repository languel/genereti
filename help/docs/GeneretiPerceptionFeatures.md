# perception.features

Read a named global stream and visualize its landmarks in the source's normalized
image coordinates. Click a point to select it; Shift-click adds/removes points.
The dropdown adds a point or a scalar feature such as a face blendshape.
The `features` field also accepts space-separated point prefixes or exact paths.
Low-confidence points are unavailable, never replaced with zero.

The first selected point becomes `pointer.x`, `pointer.y` and `pointer.confidence`
in the named `selection_stream` (default `selected`). The stream contains all
selected numeric paths, preserves source geometry/timestamps, and becomes
unavailable when its input is stale or paused. Names must be unique, different
from the input stream, and may not form a cycle with another selector.

Outputs: selected CHOP channels, observations DAT, and landmark IMAGE. The preview
has source aspect ratio and a simple pose skeleton. Point names appear on hover;
selected points are amber. Selection is saved in the workflow. This node starts
no camera and loads no model. Pause suspends its selection stream only.

Use `perception.read` or Livecode `__.streams.read('selected')` downstream.
The optional Perception 01–03 demos show visualization, continuous strokes and
an event-gated brush. The hand detection index is not a persistent identity;
separate identity tracking is a future feature.
