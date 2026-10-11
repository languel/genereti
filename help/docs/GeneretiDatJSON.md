# dat.json

Author JSON or connect a DAT to **input**, or JSON text to **json**. DAT takes
precedence over JSON text; otherwise the editor supplies the source.

The preview's **Filter** searches keys and values, case-insensitively. It filters
the actual DAT and text outputs. An empty filter with no row selection passes
the input through. JSON dictionaries stay dictionaries and arrays stay arrays;
numbers, booleans, nested objects and null retain their types.

Click an entry to select it; Cmd/Ctrl-click adds/removes entries, Shift-click
selects a range. **×** clears selection; **⧉** copies selected preview rows.
Drag across text to select/copy text normally. Entry indices are zero-based in
the original input, before filtering. Indices stay positional as live data changes.
Only the first 256 matching entries are shown; refine the filter for larger data.

**filter** and **selection** are saved STRING parameters and can be connected.
`selection` accepts comma/space-separated original indices; empty selects all
matching entries. Connected controls drive both preview and output, and their
local controls are disabled. Live and Comfy Queue use the same selection rules.
Outputs remain the standard DAT table and CSV text. The editor draft stays intact
while a connected source supplies the data.
