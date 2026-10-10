# Image compare quick reference

Connect IMAGE sources to **a** and **b**. Browser sources update live; Python sources update after Comfy Queue. Choose **wipe**, **side-by-side** or **difference**. The split slider moves the wipe boundary.

The view shares image preview sizing, fit, freeze, minimize and window controls. Width/height can be explicit, match source A (or B while A is absent), or match the active output window. Both sources are fitted to the same comparison surface. Difference uses the fitted images; it is a visual comparison, not a numeric error measurement.

Outputs **a** and **b** preserve their respective inputs, including batches. The comparison display does not replace either output with a composite image. Option/Alt-O shows only the visual surface; D toggles backdrop for the node under the pointer, otherwise the selected node.
