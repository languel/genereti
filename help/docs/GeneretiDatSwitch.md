# dat.switch

Connect DAT sources to the growing source sockets (up to 64). The index counts connected sockets in source-number order, starting at 0; empty sockets are skipped. `int` floors the index and selects one source. `float` blends adjacent sources; 1.25 means 75% source 1 and 25% source 2. Indices clamp at the ends.

For `dat.json`, dictionaries retain their original JSON data. Matching finite numbers blend recursively through dictionary keys and equal-length lists. Strings, booleans, nulls, missing keys and incompatible structures use the nearer source, switching to the second source at 0.5. Numeric-looking JSON strings remain strings. Endpoints preserve the selected DAT exactly.

Ordinary tables blend cells by row/column position: valid numeric or structured JSON cells are decoded before interpolation, and text uses the nearer source. Differing table shapes use the nearer source. A live scalar wire can drive the index. Browser Live and Queue share these rules.
