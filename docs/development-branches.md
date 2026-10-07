# Maintainer branches

Public **main** tracks **origin/main** and contains the MIT classroom package,
without the embedded Strudel engine. A separate local checkout can keep a full
personal **dev** branch. The maintainer's existing checkout stays on that branch
so Comfy development links continue to work without switching dependencies.

The local full branch has no upstream and a local pre-push hook rejects attempts
to publish `dev` (including `git push --all`). Hooks are local checkout settings,
not installed by cloning this public repository. Do not push personal full
branches or merge their vendor/runtime bundles into main wholesale. Selectively
port independent changes, rebuild and review the dependency inventory instead.

Public distribution work happens in a separate main worktree. Push only main;
the Registry publishing workflow is manual. Creating/storing a GitHub secret
never publishes a package by itself. Student installs use main/GitHub releases.

These branches initially share the pre-license checkpoint. Historical commits
retain their own upstream obligations; the current MIT license does not
retroactively relabel vendor bundles in the private branch or old releases.
