# perception.features

Read a named global stream and visualize its landmarks in the source's normalized
image coordinates. Click a point to select it; Shift-click adds/removes points.
The dropdown adds a point or a scalar feature such as a face blendshape.
The `features` field also accepts space-separated point prefixes or exact paths.
Low-confidence points are unavailable, never replaced with zero.

The first selected point becomes `pointer.x`, `pointer.y` and `pointer.confidence`
in the named `selection_stream` (default `selected`). The stream contains all
selected numeric paths, preserves source geometry/timestamps, and becomes
unavailable when its running input is stale. A deliberately paused source holds its last features. Names must be unique, different
from the input stream, and may not form a cycle with another selector.

Outputs: selected CHOP channels, observations DAT, and landmark IMAGE. The preview
has source aspect ratio and a simple pose skeleton. Point names appear on hover;
selected points keep their feature color and gain a thin ring of the same color.
Unselected points are smaller. Edges are faint thin gray until selected, when
they become thicker and more opaque. Selection is saved in the workflow. This node starts
no camera and loads no model. Pause suspends its selection stream only.

Use `perception.read` or Livecode `__.streams.read('selected')` downstream.
The optional Perception 01–03 demos show visualization, continuous strokes and
an event-gated brush. The hand detection index is not a persistent identity;
separate identity tracking is a future feature.

Open ◉ for the shared anatomical map: semantic groups, searchable individual
vertices, and named selection sets. Group selectors expand before confidence
filtering and pointer assignment. For example, `@face.left_eye` selects its
full contour while `hands.left.index_tip` selects one subject-side fingertip.
Sets are saved with the workflow and can be exported/imported as JSON.

The grid glyph toggles the coordinate grid and saves its state in the workflow.
A deliberately paused media source retains its last observations and selected
features. The readout says “held frame”; timestamps stay unchanged. A stale
running source still expires, and held observations do not advance timed events.

The combined Holistic map places detailed hands at the wrists and separates the
face contours. Choose a focused Face/Pose/hand view when needed. Click a colored
dot to toggle a vertex, or a contour stroke to toggle a semantic region. Text
buttons and saved sets use the same selection. Wheel/pinch zooms; drag background
or middle-drag pans. Fit resets, and Focus selection frames selected landmarks.
The live viewer has Regions/Vertices picking and its own navigation; exported
IMAGE size and normalized coordinates are unchanged by the view transform.

The selected-only glyph hides other detections while retaining the full input
stream. Live navigation redraws vector landmarks to keep deep zoom crisp.

Connect the optional `image` input to the original source or the provider’s clean
`image` output to
cross-check alignment. Use the provider’s `overlay` output only when you
intentionally want its diagnostic marks under the selected features. The image glyph toggles the source underlay and the
adjacent slider controls opacity (50% initially). The source follows landmark
zoom/pan; the exported landmark IMAGE and selected data remain unchanged.
Live sources retain their last paused frame; queued source previews also work.

Brows match their eye colors; detailed hands use related teal and pink colors.
The branching hand glyph shows coarse Pose finger landmarks, off by default,
in the schematic map and live viewer. In the combined map, enabling them moves
the detailed hands upright beside the ears, separate from the blue T-pose hands.
Turning them off reattaches the detailed wrists. Tracked coordinates stay unchanged.
Two-finger scrolling over a map zooms that map; over the feature list it scrolls
the list. Neither gesture reaches the graph canvas, even at a list boundary.

Choose **Face mesh · static** in the map dropdown for a front-facing reference
with all 478 selectable face points and no connecting lines. It uses MediaPipe's
canonical face geometry (the iris reference points are authored from the eye
bounds). It shares IDs, text region toggles and named sets with the stylized
face, which remains the default. No running stream or model is needed.
Left/right labels and colors use the model's perspective: its left eye and
hand appear on your right in the combined map, with matching pose wrists.

The `#` glyph toggles point IDs, off by default. Face IDs show only the vertex
number; named landmarks show initials, such as `LRT` for left ring tip. Labels
also appear in the live Features viewer. Zoom in when the face labels are dense.

The upper live preview uses small points without selection rings so dense face
and hand detections remain legible. Its point-size dropdown offers Fine, Small
(default), Medium and Large. This setting affects only the live preview; the
selection map below keeps its larger points and colored selection rings.

Both the anatomical map and upper live viewer support box and paint selection.
The selection-gesture dropdown defaults to point/region selection. Ctrl-drag
selects a box; Option/Alt-drag paints with a circular brush. You can also choose
Box or Paint in the dropdown and drag without holding a modifier. Shift adds
to the current selection; otherwise a completed box/paint gesture replaces it.
A dashed box or brush cursor previews the affected points. Release commits once;
Escape cancels. Ordinary background and middle-drag navigation remains available
in the default mode, and middle-drag also pans in Box/Paint modes. Coordinates
and IMAGE size are unaffected.
