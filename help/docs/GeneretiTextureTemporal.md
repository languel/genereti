# Temporal cleanup quick reference

Live normalized averaging for shimmer reduction, separate from top.feedback.

- **strength:** previous-frame contribution; default zero disables history. Start around 0.3. Strong blending can lag subtle motion.
- **change_threshold:** reject pixels that change. Start at 0.12; lower values reduce ghosting.
- **↺:** clear history and seed with the current image.

History advances only on new source frame dispatches. Pixel rejection,
neighborhood clamping and a sparse broad scene-cut probe reduce ghosts; this
is not motion-compensated reconstruction. Rewire, source loss, dimensions,
settings changes and seek reset history. Held frames do not accumulate blending.
Queue returns the current IMAGE without history. No models or saved history.
