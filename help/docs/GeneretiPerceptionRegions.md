# perception.regions

A separate editor for named **global normalized bounding boxes**. It runs no
inference. Connect an optional clean source IMAGE to check alignment. Source
opacity is adjustable; zero hides the underlay. Wheel/pinch zooms the editor,
and background/middle drag pans without changing exported coordinates.

**+** arms drawing a box. Drag inside a box to move it; drag a circular corner
to resize. Click its name to select it and double-click the name to rename.
Escape cancels a drag. **×** removes the selected box. Definitions are saved in
the workflow; **↓/↑** export/import JSON.

The region set is `region_stream` (default `stage`). Reference its boxes as
`stage::center` in measures or `__.regions.read('stage::center')` in Livecode.
Coordinates are `[x,y,width,height]`, normalized 0–1, relative to the complete
source image, not the editor zoom/pan. A set has one owner; duplicate names are
rejected. Removing the node removes its global definitions.

Outputs: region definitions DAT and a preview IMAGE. These boxes are spatial
interaction definitions; they do not crop the incoming image. Polygons,
layered regions, exclusion masks and cross-source transforms remain later work.
