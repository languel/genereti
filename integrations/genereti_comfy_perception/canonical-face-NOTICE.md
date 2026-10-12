# Canonical face reference geometry

`web/canonical-face-points.json` contains a modified frontal XY projection of
Google MediaPipe's `canonical_face_model.obj`, licensed under Apache-2.0.
Source: https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model.obj
The source content SHA-256 is stored in the JSON metadata.

Changes: removed depth, inverted Y for screen coordinates, rounded coordinates,
and added 10 authored iris reference points from the canonical eye bounds.
These are fixed UI reference coordinates, not inference weights or captured data.
See `LICENSE-canonical-face.txt` for the upstream license.
