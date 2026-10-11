# top.switch

Connect IMAGE sources to the growing source sockets (up to 64). The index counts connected sockets in source-number order, starting at 0; empty sockets are skipped. `int` floors the index and passes through one source. `float` blends adjacent sources; 1.25 means 75% source 1 and 25% source 2. Indices clamp at the ends.

Blending uses premultiplied alpha to avoid transparent-color halos. The second image resizes to the first image. Live output stays on the browser GPU and retains only the selected source(s). Queue supports matching image batches or a single second image broadcast across the first batch. A live scalar wire can drive the index.
