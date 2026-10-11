# perception.read

Read a globally named MediaPipe stream without adding another inference worker.
Choose a numeric feature such as pose.nose.x, hands.0.index_tip.y,
face.blend.jawOpen, or segment.coverage. CHOP includes value, valid, and age_ms;
Float wires to parameters; DAT contains the complete structured observations.
Missing/stale/paused results produce valid=0 and scalar zero. Check validity.

No camera/model starts from a reader. Global names belong to this browser's
active workflow. Livecode also exposes __.streams.read(name,maxAgeMs).
