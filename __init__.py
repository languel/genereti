"""Single-folder ComfyUI distribution of the independent Genereti tools."""
import importlib
import json
from pathlib import Path

import folder_paths
import nodes
from comfy_api.latest import ComfyExtension

ROOT = Path(__file__).resolve().parent
PACKS = json.loads((ROOT / 'distribution/manifest.json').read_text())['packs']


def check_legacy_install():
    """Fail before route registration if an older split installation is active."""
    from comfy.cli_args import args
    conflicts = []
    for base in folder_paths.get_folder_paths('custom_nodes'):
        for name in PACKS:
            if args.disable_all_custom_nodes and name not in args.whitelist_custom_nodes:
                continue
            if (Path(base) / name).is_dir():
                conflicts.append(name)
    if conflicts:
        raise RuntimeError(
            'Genereti is already installed as separate packs: '
            + ', '.join(sorted(set(conflicts)))
            + '. Stop Comfy and move these folders/symlinks outside custom_nodes '
            'before enabling the single-folder genereti package. Keep your workflows.'
        )


class GeneretiExtension(ComfyExtension):
    async def on_load(self):
        check_legacy_install()
        self.extensions = []
        for name in PACKS:
            module = importlib.import_module(f'.integrations.{name}', __name__)
            entrypoint = getattr(module, 'comfy_entrypoint', None)
            if entrypoint:
                extension = await entrypoint()
                await extension.on_load()
                self.extensions.append(extension)
            # Existing imports use /extensions/<pack>/... across sibling packs.
            # Keep these aliases instead of changing saved node/browser contracts.
            nodes.EXTENSION_WEB_DIRS[name] = str(ROOT / 'integrations' / name / 'web')

    async def get_node_list(self):
        result = []
        for extension in self.extensions:
            result.extend(await extension.get_node_list())
        ids = [node.GET_SCHEMA().node_id for node in result]
        if len(ids) != len(set(ids)):
            raise RuntimeError('Duplicate Genereti node IDs in distribution')
        return result


async def comfy_entrypoint():
    return GeneretiExtension()
