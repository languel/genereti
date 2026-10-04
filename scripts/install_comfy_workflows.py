#!/usr/bin/env python3
"""Install examples in one folder, preserving user edits and legacy copies."""
import hashlib
import json
import shutil
import sys
import uuid
from datetime import datetime
from pathlib import Path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def same(left, right):
    if not left.is_file() or not right.is_file():
        return False
    if left.read_bytes() == right.read_bytes():
        return True
    try:
        return json.loads(left.read_text()) == json.loads(right.read_text())
    except (ValueError, UnicodeError):
        return False


def display_name(name):
    for prefix in ('Genereti-', 'genereti-', 'ꘇ '):
        if name.startswith(prefix):
            return 'ꘇ-' + name[len(prefix):].replace(' ', '-')
    return name


def install(examples, workflows):
    examples, workflows = Path(examples), Path(workflows)
    destination = workflows / 'Genereti'
    destination.mkdir(parents=True, exist_ok=True)
    sources = [p for p in examples.glob('*.json') if p.name.startswith(('ꘇ-', 'ꘇ ', 'Genereti-', 'genereti-'))]
    names = {display_name(p.name) for p in sources}
    manifest_path = workflows.parent / '.genereti-workflows.json'
    try:
        manifest = json.loads(manifest_path.read_text())
        if not isinstance(manifest, dict):
            manifest = {}
    except (OSError, ValueError):
        manifest = {}
    archive = workflows.parent / '.genereti-workflow-backups' / (datetime.now().strftime('%Y%m%d-%H%M%S') + '-' + uuid.uuid4().hex[:8])

    def backup(path):
        archive.mkdir(parents=True, exist_ok=True)
        shutil.move(str(path), str(archive / path.name))
        print(f'Archived example copy: {path.name}')

    # Rename installed examples, including customized copies, without replacing
    # their contents. Move the managed checksum with its filename as well.
    for old in sorted(destination.glob('*.json')):
        if display_name(old.name) == old.name or (display_name(old.name) not in names and old.name not in manifest):
            continue
        target = destination / display_name(old.name)
        if target.exists():
            if same(old, target):
                backup(old)
            else:
                sibling = target.with_name(target.stem + f' (previous {digest(old)[:8]}).json')
                if sibling.exists():
                    if not same(old, sibling):
                        raise FileExistsError(sibling)
                    backup(old)
                else:
                    old.rename(sibling)
        else:
            old.rename(target)
            if old.name in manifest:
                manifest[target.name] = manifest[old.name]
        manifest.pop(old.name, None)

    # Keep the user's existing folder as canonical. Root copies installed by an
    # older installer are redundant even when the folder copy was later edited.
    for legacy in sorted(workflows.glob('*.json')):
        if not legacy.is_file():
            continue
        name = display_name(legacy.name)
        if name not in names:
            continue  # A user's own glyph-titled workflow is not an example.
        target, example = destination / name, examples / name
        if not example.exists():
            example = examples / legacy.name
        if not target.exists():
            shutil.move(str(legacy), str(target))
            print(f'Moved into Genereti: {legacy.name}')
        elif same(legacy, target) or same(legacy, example):
            backup(legacy)
        else:
            # Two independently edited versions: retain both, with clear names.
            sibling = destination / (Path(name).stem + ' (from root).json')
            if sibling.exists() and not same(legacy, sibling):
                sibling = destination / (Path(name).stem + f' (from root {digest(legacy)[:8]}).json')
            if sibling.exists() and same(legacy, sibling):
                backup(legacy)
            elif sibling.exists():
                raise FileExistsError(f'Cannot preserve root copy without overwriting: {sibling}')
            else:
                shutil.move(str(legacy), str(sibling))
                print(f'Preserved separate root edit: {sibling.name}')

    for example in sorted(sources):
        name = display_name(example.name)
        target = destination / name
        unchanged = target.is_file() and manifest.get(name) == digest(target)
        if target.exists() and not same(target, example) and not unchanged:
            print(f'Kept customized workflow: Genereti/{target.name}')
            continue
        if not same(target, example):
            if target.exists():
                # Keep the previous managed example when updating it.
                archive.mkdir(parents=True, exist_ok=True)
                shutil.copy2(target, archive / ('previous-' + target.name))
            shutil.copy2(example, target)
            print(f'Installed: Genereti/{target.name}')
        manifest[name] = digest(target)
    # Retire only unchanged managed examples. Custom work remains in place.
    for name, checksum in list(manifest.items()):
        target = destination / name
        if name not in names and target.is_file() and digest(target) == checksum:
            backup(target)
            manifest.pop(name, None)
    temporary = manifest_path.with_suffix('.tmp')
    temporary.write_text(json.dumps(manifest, indent=2) + '\n')
    temporary.replace(manifest_path)
    if archive.exists():
        print(f'Workflow backups: {archive}')
    return destination


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Usage: install_comfy_workflows.py EXAMPLES WORKFLOWS')
    install(*sys.argv[1:])
