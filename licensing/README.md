# Licensing of the public Genereti distribution

Genereti-authored code and examples are MIT licensed (root `LICENSE`).
Third-party files retain their own licenses; the root MIT grant does not relicense
them. Recipients may use, modify, redistribute and sell our MIT code, including
in proprietary applications, subject to the MIT notice requirement and the
applicable third-party terms. No restriction to education or noncommercial use
is added. No proprietary fonts or model weights are included in this package.

## Browser dependency inventory

`browser/{livecode,drawing,timeline}/inventory.json` lists the exact packages
used by esbuild, including transitive dependencies and multiple versions.
Full license/NOTICE files are copied beside each inventory. Existing `.LEGAL.txt`
bundle files and copied upstream notices are retained. Builds fail on missing
license texts or newly bundled strong GPL/AGPL dependencies; upgrades require
review rather than silently relabeling a dependency. Build-time-only npm tools
are not implied to be shipped runtime code. DOMPurify is used under its
Apache-2.0 alternative. Font licenses are recorded separately below.

## p5.js: LGPL-2.1 retained

The unchanged p5.js 1.11.11 runtime is separately loaded from
`integrations/genereti_comfy_p5/web/p5.min.js`, rather than merged into our
Livecode bundle. Its SHA256 matches the npm distribution. `P5-LICENSE.txt`
contains its complete LGPL-2.1 terms; `source/p5-1.11.11.tar.gz` contains the
upstream corresponding source, build tasks/configuration and license, shipped
with every Git/ZIP/registry copy. `source/provenance.json` records provenance
and hashes. This is actual source delivery, not just an upstream link or an
expiring promise. The unmodified source includes its own dependency notices.

To modify or replace p5:

1. Extract `source/p5-1.11.11.tar.gz` into a separate development directory.
2. Install the dependencies in the extracted upstream package, and use its
   Grunt `browserify`, `browserify:min` and `uglify` tasks to rebuild. Consult the
   included upstream README/Gruntfile for the complete development environment.
3. Replace `custom_nodes/genereti/integrations/genereti_comfy_p5/web/p5.min.js`
   with your compatible build. Restart Comfy and reload/clear the browser cache.

Genereti imposes no prohibition on modifying the library or reverse engineering
for debugging those modifications. Library modifications remain LGPL, with
change notices and corresponding source; our independent code remains MIT.
A redistribution must retain these materials and update source/hashes for any
changed runtime. The p5 source build was inspected, not rebuilt in this audit.

## Fonts and other upstream materials

Excalidraw's fonts retain their original copyright notices and licenses in
`fonts/`. Comic Shanns is MIT; Assistant, Cascadia, Excalifont, Lilita, Nunito,
Virgil and Xiaolai are OFL-1.1. OFL fonts may be bundled with applications; their
license applies to the font software, not documents/images made with them.
Reserved names and the restriction on selling a font by itself still apply.
The legacy Ascender Liberation binary has been replaced by Liberation 2.1.5,
OFL-1.1, converted to WOFF2 without glyph edits. Original TTF, complete license
and conversion provenance are included in `fonts/liberation-2.1.5/`.
KaTeX math fonts ship under its MIT distribution license.

Underscores/Orca attribution remains in the existing `UNDERSCORES-LICENSE`
and `THIRD-PARTY-NOTICES.md` files. MediaPipe is Apache-2.0; its notice remains
in the separate full-app `web/vendor` directory. Model source/license notes in
`docs/models.md` are separate from this model-free node package.

## Strudel and historical versions

The current default editor/runtime and npm dependency graph contain no Strudel,
superdough or AGPL runtime imports. The legacy `strudel` selector remains so saved
code is editable; execution explains how to run it externally. See
`docs/strudel-external.md`. No optional embedded Strudel addon is shipped or claimed
complete. Any future embedded integration must be distributed under appropriate
AGPL terms, with its own source/build materials; downloading it at runtime is
not treated as a loophole.

Earlier commits contain different dependency combinations, including embedded
AGPL Strudel. The new root MIT license does not override their third-party terms
or retroactively relabel their compiled bundles. Review the specific commit if
redistributing a historical build.
