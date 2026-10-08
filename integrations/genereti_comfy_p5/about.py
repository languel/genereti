"""Local installation identity; never contacts GitHub or the Registry."""
import json
import re
import subprocess
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REPOSITORY = 'https://github.com/languel/genereti'


def installation_info(root=ROOT):
    root = Path(root).resolve()
    result = {'version': 'unknown', 'repository': REPOSITORY,
              'path': str(root), 'kind': 'package', 'branch': None,
              'revision': None, 'dirty': False, 'upstreamRevision': None}
    try:
        result['version'] = tomllib.loads((root / 'pyproject.toml').read_text())['project']['version']
    except (OSError, ValueError, KeyError):
        pass
    for name in ('DISTRIBUTION.json', 'distribution/build-info.json'):
        try:
            manifest = json.loads((root / name).read_text())
            revision = manifest.get('sourceRevision')
            if not isinstance(revision, str) or not re.fullmatch(r'[0-9a-f]{40}', revision):
                continue
            preview = name == 'DISTRIBUTION.json' and not manifest.get('releaseLicenseChecked')
            result.update(kind='preview' if preview else 'release', revision=revision,
                          dirty=bool(manifest.get('sourceDirty')))
            break
        except (OSError, ValueError, KeyError):
            pass
    # Only inspect this checkout, never an enclosing ComfyUI Git repository.
    if (root / '.git').exists():
        def git(*args):
            return subprocess.check_output(['git', '-C', str(root), *args],
                                           stderr=subprocess.DEVNULL, timeout=2).decode().strip()
        try:
            result.update(kind='checkout', revision=git('rev-parse', 'HEAD'),
                          branch=git('rev-parse', '--abbrev-ref', 'HEAD'),
                          dirty=bool(git('status', '--porcelain')))
            try:
                result['upstreamRevision'] = git('rev-parse', '@{upstream}')
            except subprocess.SubprocessError:
                pass
        except (OSError, subprocess.SubprocessError):
            result['kind'] = 'checkout'
    return result


def register_about_route(routes):
    from aiohttp import web
    # A later checkout/pull must not masquerade as a restarted Python backend.
    loaded_info = installation_info()

    @routes.get('/genereti/about')
    async def about(request):
        current = installation_info()
        result = dict(loaded_info)
        result['dirty'] = loaded_info['dirty'] or current['dirty']
        result['restartRequired'] = (current['revision'], current['version']) != (
            loaded_info['revision'], loaded_info['version'])
        return web.json_response(result,
                                 headers={'Cache-Control': 'no-store'})
