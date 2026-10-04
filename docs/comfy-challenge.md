# Comfy developer challenge checkpoint

The [official challenge announcement](https://blog.comfy.org/p/open-call-comfy-dev-platform-challenge)
states an October 5–19, 2026 event, with submission closing October 19 at 9am PT.
It requires a Comfy Developer Platform / ComfyCloud integration **or the local
Comfy SDK**, an openly licensed runnable repository, and a demonstration video.
Check the current official rules before submitting.

Genereti's browser live runtime and custom-node packs provide a local creative
pipeline, but custom nodes alone do not establish the required SDK integration.
A useful next addition is a local Comfy SDK client that runs the saved queued
workflow and retrieves its result, alongside the live browser workflow. Do not
claim SDK integration until that path is implemented and verified.

The repository currently has no project-wide code license. Select one compatible
with the bundled AGPL Strudel/Underscores portions and preserve dependency
notices before describing the entire project as open source or submitting it.
Model weights remain separate, ignored and governed by their respective licenses.

Candidate demo: livecode/Processing-style source → GPU Feedback → Blur → Corner
Pin → Composite → transparent overlay or filled presentation view. Show the
normal queued IMAGE path and the SDK client too. Avoid model or device setup in
the basic reproducibility walkthrough; add the Apple-silicon Core ML generator
as an optional, accurately labeled extension.

No submission or publication is performed by this checkpoint.
