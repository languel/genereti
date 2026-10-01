# Editable drawing input

Choose **Input → Shapes · Excalidraw**. The drawing becomes the input to any image-guided Genereti pipeline. The editor is bundled locally; it does not depend on excalidraw.com or a CDN at runtime.

Use the native tools for rectangles, ellipses, diamonds, lines/arrows, freehand paths, text, and image insertion. Select a shape to translate, resize, rotate, change stroke/fill colors and line styles, or reorder it. Native undo/redo and grouping remain available. **S** opens the stroke palette, **G** the fill palette, and **Shift + Alt + D** toggles the editor theme. With an empty selection, palette buttons/shortcuts activate the freehand tool and change colors for the next stroke. With selected elements, they edit those elements. Shortcuts are also forwarded after focus moves to a Genereti button; typing in prompt/text fields retains normal keyboard behavior. The footer also has Stroke, Fill and theme buttons. Editor theme is remembered locally and changes the editing appearance; exported guide colors remain the original scene colors. **Expand editor** gives more room with the generated output beside it; **Close editor** returns to the compact view without rebuilding the editor.

## Fixed artboard

The dashed square represents world coordinates `0,0` to `512,512`. This fixed square is rasterized to a 512 × 512 PNG for the generator; the selected model resolution remains independent (256/384/512 when installed).

- Pan/zoom changes your editing view, not the model's crop or composition.
- **Fit artboard** returns to the square.
- Shapes outside the square are clipped in the generated guide. The editable file retains them.
- Export has no artificial artboard border and uses the drawing's background color.
- Very distant shapes that would require an export canvas over 8192px are reported as an editor error. Move them closer before rendering.

**Update while drawing** is on by default. Changes are rasterized asynchronously with an 33ms throttle, including while the mouse remains pressed during strokes, translations and rotations. Turn it off to hold the guide until pointer release; keyboard/programmatic edits still refresh after a short idle. The generator continuously processes the latest completed guide while Start live is enabled. The last completed guide stays available during editing; each captured generation associates its source pixels with that guide's matching vector snapshot. Model Motion changes latent noise, not the editable shapes.

## Save, restore and share

**Save drawing** downloads a standard `.excalidraw` file with the editable elements and any embedded image files. **Open drawing** loads it. The current drawing also autosaves to this browser's IndexedDB; reloading the page restores it. Autosave is local to the browser/origin, not a project file or cloud backup. If browser storage is unavailable, save a drawing file explicitly.

Genereti's **Save scene** ZIP includes `drawing.excalidraw` alongside source PNG, outcome, guide, and metadata. Open that file in the editor to continue editing. **Save/Copy PNG + metadata** and **Copy scene** embed the completed generation's drawing snapshot under `drawing.scene`, with artboard coordinates and a revision. Imported image files can increase export size. Presets still store model controls, not drawing pixels or a vector scene.

Opening a drawing is different from restoring an entire Genereti performance: it restores shapes, colors and the drawing background, but does not automatically restore prompts, model settings, noise phase or source-reference images from a scene ZIP.

## Bridge for future scene keyframes

The vanilla web app and locally bundled React editor communicate through same-origin messages using `genereti-drawing-v1`. Parent and iframe both check origin and message source. Editable elements are not sent to the generator API; it receives only the raster.

```js
// Returns a copy, so changing it cannot mutate an earlier generation snapshot.
const scene = window.genereti.drawing.getScene();
// Load/update a standard Excalidraw scene; rendering completes asynchronously.
window.genereti.drawing.loadScene(scene);
window.genereti.drawing.fit();
```

Snapshots preserve element IDs, x/y, width/height, angle, point arrays, stroke/fill, ordering and group relationships. A future keyframe layer can match corresponding IDs, interpolate selected geometry/colors and combine that with model settings/noise phase. This milestone does **not** include a timeline, interpolator, automatic correspondence between unrelated drawings, or shape animation. Text changes, image swaps, creation/deletion, arrow bindings and incompatible point counts will need explicit transition policies.

This is a small independent Excalidraw wrapper rather than a copy of Underscores' broader editor integration, so it can become a bridge into Artist–Model Studio or Underscores later.

## Rebuild the local editor

Runtime uses the checked-in assets in `web/vendor/excalidraw/`; students do not need a Node development server. To modify or rebuild:

```sh
npm ci
npm run build:editor
```

Source lives in `editor/`, the parent bridge in `web/drawing-bridge.js`, and the build script in `scripts/build_editor.mjs`. Excalidraw and React versions are pinned in `package.json`/`package-lock.json`. The editor runs separately from the Core ML engine, which still requires Apple silicon macOS.

## Follow the drawing colors

SDXS sketch already receives RGB pixels (use Original RGB input in the mixer), but its learned controller may reinterpret colors. In **Post-processing**, set **Follow input colors** to about 0.7, then increase toward 1 for stronger adherence. **Color spread** controls spatial smoothing of the input chroma map, measured relative to a 512px artboard. Zero keeps sharp color boundaries; 8–24 spreads color from narrow strokes into neighboring areas. Neutral white/gray/black areas are ignored for color following, so unpainted paper no longer removes generated color. Colored marks are propagated locally with normalized weights. This is spatial Lab color transfer after generation, not an added trained SDXS color controller. It preserves generated luminance/texture rather than forcing exact RGB values or intelligently filling a hollow outline. Colored filled shapes provide clearer regional instructions than thin outlines.

The original input supplies colors independently of sketch/Canny/depth inversion. Palette-reference transfer runs first, then input color following, then levels/BCS and upscaling. Both settings are included in presets and exported metadata. Works with every image-input pipeline; text-only generation has no input color source.

**Follow input shading** independently transfers the input's broad light/dark values and retains generated fine luminance detail. Start at 0.2–0.4 with Color / shading spread around 16. Filled gray/color shapes or a shaded image communicate values; hollow outlines do not specify an interior fill. White input areas push toward light, black marks toward dark. Both operations are output treatments, not trained lighting controls; they cannot guarantee semantic shadow directions, object depth or filled interiors. For learned value influence, use Original RGB input in the SDXS mixer and sketch/RGB weight; depth adds an experimental structural cue, not a calibrated light/shadow map.

## Live output directly on the canvas

Enable **Output in canvas** in the editor footer, then **Expand editor**. The generated result renders through a native Excalidraw embeddable element inside a Generated · live frame; the separate output panel is hidden in expanded mode. Both input and output share the editing canvas and its pan/zoom. Use selection to move/resize the output (drag its edge), or move its containing frame. **Fit artboard** fits the default input/output arrangement. Output placement currently lasts for this editor session; the toggle is remembered locally.

The live element uses Excalidraw's custom embeddable renderer, not repeated file imports. Each result replaces the displayed image without accumulating image files or undo entries. Its internal link identifier never loads a remote page. Output elements are excluded from the generator guide and saved drawing input, even if moved over the input square, to prevent accidental feedback. Save PNG / Save scene still exports the actual result through Genereti; opening a drawing in standalone Excalidraw does not recreate the live connection.
