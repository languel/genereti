# Contributing and repository layout

- `integrations/`: the supported Comfy node packs; the legacy archive is clearly separated.
- `example_workflows/`: bundled templates shown by Comfy.
- `docs/`: guides and design notes (see the [documentation index](README.md)).
- `editor/` and `web/vendor/`: drawing editor source and its shared browser bundle.
- `scripts/`, `tests/` and `distribution/`: developer build, validation and packaging tools.

Canonical workflow sources remain in `integrations/comfyui_genereti/workflows/`; run
`python scripts/sync_comfy_templates.py` after editing them. Students do not need npm or these build scripts.

## AI inference is moving to GeneretiCore

Heavy model generation, conversion and model catalogs belong in the separate experimental
[GeneretiCore repository](https://github.com/languel/genereticore). It is not yet an installable replacement.
Genereti's current classroom demos use the lightweight performance framework only. See also [models](models.md).

Old standalone apps, inference packs, conversion scripts and model-dependent demos are preserved in
[the migration archive](../integrations/legacy-generator/README.md). They are unsupported here and excluded from
the distributed package.

## Licensing

Original Genereti code is MIT licensed. Dependencies retain their own licenses and notices; see
[licensing](../licensing/README.md). Model weights, secrets and generated captures are not stored in this repository.
