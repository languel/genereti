"""Single-folder ComfyUI distribution of the independent Genereti tools."""
import importlib
import json
import logging
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


def install_bundled_workflows():
    """Install demos for current Comfy profiles without replacing edited copies."""
    from server import PromptServer
    from .scripts.install_comfy_workflows import install

    users = PromptServer.instance.user_manager.users
    for user_id in users:
        # Use Comfy's configured user directory, including Desktop layouts.
        user_root = folder_paths.get_public_user_directory(user_id)
        if user_root is None:
            continue
        try:
            install(ROOT / 'example_workflows', Path(user_root) / 'workflows')
        except (OSError, ValueError) as error:
            # A read-only profile must not prevent the nodes from loading.
            logging.warning('Genereti could not install demos for %s: %s. '
                            'Bundled examples remain available in Templates.', user_id, error)


class GeneretiExtension(ComfyExtension):
    async def on_load(self):
        check_legacy_install()
        install_bundled_workflows()
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
