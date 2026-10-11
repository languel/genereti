# chop.switch

Connect CHOP sources to the growing source sockets (up to 64). The index counts connected sockets in source-number order, starting at 0; empty sockets are skipped. `int` floors the index and passes through one source. `float` blends adjacent sources; 1.25 means 75% source 1 and 25% source 2. Indices clamp at the ends.

Float blending requires matching channel names. The second source is resampled to the first source's sample count; output sample rate and start come from the first source. A live scalar wire can drive the index. Queue and browser Live share the same selection rules.
