# Native generator design

Current decision: family-specific generators, with their own model-path dropdowns.
There are no universal native generator, loader, pipeline socket, or settings-only
adapter nodes. SDXS owns text/sketch; SD Turbo owns image/Canny/depth/pose. Future
families get their own generator only when their backend works.

The selected package path owns resolution and baked style. Discovery verifies
companion packages and constrains available modes. Generation controls stay in
the generator. Shared transport, prompt submission, model discovery, model cache and
inference code stay common internally. This keeps the graph small without
copying backend logic or presenting controls that a family cannot use.

The external-server generator is retained for comparison. It does not share the
native family's model selection. Input drawing size, model inference size and
viewer/upscaler output size remain distinct. See
[the native guide](../integrations/genereti_comfy_coreml/README.md) for the examples,
installed capabilities and local setup.
