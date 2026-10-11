# 2D stream

Load a local image, GIF or video, or connect an IMAGE stream. Local media stays
local. Press ▶ to play files; camera capture remains a separate explicit action.

The frame editor toolbar below the preview begins with the framing menu, which chooses **4 corners**, **Crop frame**, or **Output**.
The amber quad and blue rectangular output crop stay visible together while
editing. Only the active outline has draggable handles; drag inside it to move
the whole shape. Switching editors preserves both operations. **Output** shows
the final image without handles and does not change downstream output.

**Framed output** is the default: the output crop samples the distorted image
and fills the selected output resolution. Initially it fits an inner rectangle
inside the quad while preserving the source aspect ratio. Drag the blue crop
to choose a different area; ▧ restores automatic fitting. **Full quad** retains
the full transformed canvas, including transparent areas. A manual crop extending
outside the quad also retains transparency in those areas.

**Source region** optionally selects an input crop before distortion; its editor
shows the original source. All three settings work together and save with the
workflow. The rotate glyph turns the image clockwise 90° and swaps source-matched output dimensions; ⊞ resets all framing. Framing applies to live input and loop playback before tracking. This GPU transform requires WebGL2.

The same node includes a testing looper:

- ▣ captures one still; ● records incoming frames for the chosen 1–10 seconds.
- ↻ plays or pauses the captured frames instead of the incoming stream.
- ⇥ returns to live input; ×↻ clears the captured loop.
- ↓ exports a PNG still or silent browser-encoded video.
- +▣ saves the still/video to local Comfy Assets under `genereti-loops/`.

Capture runs at up to 15 fps, longest edge 640 pixels, with a limit of 150 frames
or 32 MB of PNG data. Loops retain source frames; playback and export apply the current framing.
Changing framing while a loop plays updates its output immediately. PNG stills retain alpha; video alpha depends on the browser encoder.
Audio is not captured. Loop frames are temporary and disappear on reload;
export or save to Assets to retain them, then load the saved media for another test.
Source files and captures are not part of the repository.

While editing, pinch to zoom (touchscreen or trackpad), scroll to pan, or drag
empty space. Alt-drag / middle-drag pans even over the image or an outline.
Use − / + to zoom and ⤢ (or double-click) to fit all handles, including corners
outside the source image. The editor opens with a margin around the image.
Zoom/pan are temporary viewing controls: they do not change crop/quad settings,
output pixels, resolution, captures or the Comfy canvas zoom. Output view ignores
editor navigation and shows the configured result.

Crop aspect constraints: Free, Source, 1:1, 4:3, 3:2, 16:9, and 9:16.
They constrain the editable crop rectangle; source/output resolution remains controlled by the stream settings.
Horizontal and vertical flip glyphs mirror the image without changing the quad.

In 4 corners mode, hover just outside a corner to reveal its rotation ring, then drag
to rotate the whole quad around its center. Drag the filled circular handle to reshape it.
Exports freeze the current framing at export start.

Hold Ctrl while dragging a crop-frame corner to snap to a quad corner, or a quad
corner to snap to a crop-frame corner (within 12 displayed pixels). A snapped
corner has a white outline. Exact snapping takes precedence over the aspect constraint.
The presets menu recalls named editor states; the save glyph adds or updates a
named preset, and the trash glyph removes the selected preset. Presets include
crop, quad, orientation, flip, output mode, constraints, edit mode, and view; they
travel with the workflow and do not include media or loop recordings.
