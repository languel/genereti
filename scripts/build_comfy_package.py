#!/usr/bin/env python3
"""Build a reproducible, tracked-file-only Comfy student ZIP without model files."""
import argparse
import hashlib
import json
import re
import subprocess
import tomllib
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORBIDDEN_PARTS = {'models', 'artifacts', 'training', 'experiments', '.git', '.venv', 'node_modules', '__pycache__'}
FORBIDDEN_SUFFIXES = {'.pyc', '.safetensors', '.ckpt', '.pt', '.pth', '.bin', '.task', '.mlmodel', '.mlpackage', '.mlmodelc', '.mp4', '.mov', '.webm', '.wav', '.aiff', '.log'}


def metadata(root=ROOT):
    return tomllib.loads((root / 'pyproject.toml').read_text())


def selected_files(root=ROOT):
    manifest = json.loads((root / 'distribution/manifest.json').read_text())
    files = set(manifest['files'])
    prefixes = [p.rstrip('/') + '/' for p in manifest['directories']]
    prefixes += [f'integrations/{p}/' for p in manifest['packs']]
    tracked = subprocess.check_output(['git', '-C', str(root), 'ls-files', '-z']).decode().split('\0')
    selected = []
    for name in sorted(filter(None, tracked)):
        path = Path(name)
        if name not in files and not any(name.startswith(prefix) for prefix in prefixes):
            continue
        if FORBIDDEN_PARTS.intersection(path.parts) or path.suffix.lower() in FORBIDDEN_SUFFIXES:
            raise ValueError(f'Forbidden distribution file: {name}')
        if path.is_absolute() or '..' in path.parts or (root / path).is_symlink():
            raise ValueError(f'Unsafe distribution path: {name}')
        selected.append(name)
    required = files - {'LICENSE'}
    missing = required - set(selected)
    if missing:
        raise ValueError('Required files must be Git tracked: ' + ', '.join(sorted(missing)))
    for pack in manifest['packs']:
        if f'integrations/{pack}/__init__.py' not in selected:
            raise ValueError(f'Missing node pack: {pack}')
    for name in selected:
        if name.endswith('.json'):
            json.loads((root / name).read_text())
    return selected


def validate_release(root=ROOT, registry=False):
    data = metadata(root)
    project = data['project']
    if not re.fullmatch(r'\d+\.\d+\.\d+', project['version']):
        raise ValueError('Use an X.Y.Z package version')
    if not project.get('license') or not (root / 'LICENSE').is_file():
        raise ValueError('Choose and commit the project license before releasing')
    if registry and not data['tool']['comfy'].get('PublisherId', '').strip():
        raise ValueError('Set the real Comfy Registry PublisherId before publishing')


def build(destination, root=ROOT, release=False):
    if release:
        validate_release(root)
    data = metadata(root)['project']
    files = selected_files(root)
    version = data['version']
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    archive = destination / f'genereti-{version}.zip'
    revision = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD']).decode().strip()
    dirty = bool(subprocess.check_output(['git', '-C', str(root), 'diff', '--name-only', 'HEAD']).strip())
    if release and dirty:
        raise ValueError('Commit tracked changes before making a release archive')
    records = {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in files}
    info = {'package': data['name'], 'version': version, 'sourceRevision': revision, 'sourceDirty': dirty,
            'sourceURL': f'https://github.com/languel/genereti/tree/{revision}',
            'files': records, 'releaseLicenseChecked': release}
    # A fixed timestamp and permissions make repeated builds byte-identical.
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as output:
        payload = [(name, (root / name).read_bytes()) for name in files]
        payload.append(('DISTRIBUTION.json', (json.dumps(info, ensure_ascii=False, indent=2) + '\n').encode()))
        for name, content in payload:
            item = zipfile.ZipInfo('genereti/' + name, date_time=(2026, 1, 1, 0, 0, 0))
            item.compress_type = zipfile.ZIP_DEFLATED
            item.external_attr = 0o100644 << 16
            output.writestr(item, content, compresslevel=9)
    checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
    archive.with_suffix('.zip.sha256').write_text(f'{checksum}  {archive.name}\n')
    destination.joinpath('DISTRIBUTION.json').write_text(json.dumps(info, ensure_ascii=False, indent=2) + '\n')
    print(f'{archive}: {len(files)} files, {archive.stat().st_size / 1_000_000:.1f} MB; SHA256 {checksum}')
    return archive


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'artifacts/comfy-package')
    parser.add_argument('--release', action='store_true', help='Require a project license')
    parser.add_argument('--check-registry', action='store_true', help='Validate license and publisher, without uploading')
    args = parser.parse_args()
    if args.check_registry:
        validate_release(registry=True)
        print('Registry metadata ready; no upload performed')
    else:
        build(args.output, release=args.release)
