# Help and reference guidelines

Use these conventions with [the node style guide](node-ui-design.md). The
[GeneretiCore handoff](genereticore-ui-handoff.md) summarizes the shared contract.

## Entry points and panel behavior

- Put `?` at the top-right of the node header, with an 8px right inset so it
  clears the resize handle. Use a 20px button and 12px text glyph. The node title
  already names the node; do not add a second heading to its toolbar.
- Clicking `?` opens that node's Reference. Clicking the same button again closes
  help. A different node's button switches to its reference.
- Reference, Contents, and Assistant share one panel with tabs. Escape inside
  any tab closes the whole panel, including from the assistant composer. Preserve
  documents, drafts, and conversations when closing or switching tabs.
- Offer docking and floating placement. The panel's book/family-symbol glyph is
  distinct from Comfy Help Center and sits immediately above that button.
- Reference opens on Welcome. Auto is an explicit, remembered toggle that follows
  node selection; it does not reopen closed help or switch away from Assistant.

## Reference content

Write native node help in `help/docs/<NodeID>.md`. Explain what the node does,
its inputs/outputs, meaningful controls, one small example, and material limits.
Explain shorthand expression/shader names and units when they appear. Prefer
plain language and working examples over implementation detail.

Provide an honest schema quickref for every installed node without an authored
page. Identify unfinished guides; do not imply they are complete tutorials.
Contents searches nodes, controls, guide text, lessons, and tutorials. Lessons
identify their target nodes and offer current-patch steps or a separate example
workflow. Opening help or an example never queues work or starts devices/audio.

“Ask about this node/guide” attaches the document and applicable node as context
and prepares an assistant draft. The user chooses when to send. Keep reference
context distinct from node, asset, workflow, and template attachments.

Run `python scripts/sync_node_references.py` after changes to native Markdown,
then use `--check` to verify its bundled catalog.

## Assistant presentation

Keep settings under Settings → Genereti → Assistant. Use one footer attachment
picker, a borderless plus glyph, Undo, New Chat (chat-plus), Settings, a model
picker, and a filled circle with an up arrow for Send. New Chat clears conversation,
draft, and context without changing the patch. Stop replaces Send while running.
The model picker uses the configured provider's available models; current model
and model count belong in its hover tip, not a persistent status row.

Use native `title` hover tips and accessible names. Avoid an additional CSS
hover tooltip that duplicates the title or clips at the panel edge. Expose toggle
state with `aria-pressed` and disclosure state with `aria-expanded`. Keep loading
and error feedback useful, while avoiding duplicated Assistant headings and
instructional text that repeats the tabs or controls.
