# Using Strudel alongside Genereti

The public MIT distribution no longer embeds Strudel. Existing Livecode Strudel
source remains editable/exportable; pressing Run reports that the engine is not
included instead of erasing the code or quietly activating a network runtime.

Copy your pattern to https://strudel.cc/ and start sound there explicitly.
For local/offline use, follow Strudel's own installation instructions:
https://strudel.cc/technical-manual/project-start/ and its official source repo.
Their runtime and any derivative embedded integration retain AGPL requirements.
A separate AGPL addon may be added later; installing npm packages alone does not
restore the removed integration in this distribution.

Genereti's host-owned time/scale/parameter state (`__`) and modular audio nodes
remain available. The existing `performance-state` and `performance-command` messages are
interoperability seams, not an installed or automatically synchronized Strudel engine.
Future adapters can target independent engines using documented event messages;
review each engine's licensing and interoperability before bundling it. No
Gibber, ChucK or Pd adapter is included yet.

For audio lessons today, use `mod.transport`, sequencers, synth/drum voices,
mixers and analysis nodes. These do not depend on Strudel.
