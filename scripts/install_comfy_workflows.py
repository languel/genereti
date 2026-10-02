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


def install(examples, workflows):
    examples, workflows = Path(examples), Path(workflows)
    destination = workflows / 'Genereti'
    destination.mkdir(parents=True, exist_ok=True)
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
        print(f'Archived root copy: {path.name}')

    # Keep the user's existing folder as canonical. Root copies installed by an
    # older installer are redundant even when the folder copy was later edited.
    for legacy in sorted(workflows.glob('Genereti-*.json')):
        if not legacy.is_file():
            continue
        target, example = destination / legacy.name, examples / legacy.name
        if not target.exists():
            shutil.move(str(legacy), str(target))
            print(f'Moved into Genereti: {legacy.name}')
        elif same(legacy, target) or same(legacy, example):
            backup(legacy)
        else:
            # Two independently edited versions: retain both, with clear names.
            sibling = destination / (legacy.stem + ' (from root).json')
            if sibling.exists() and not same(legacy, sibling):
                sibling = destination / (legacy.stem + f' (from root {digest(legacy)[:8]}).json')
            if sibling.exists() and same(legacy, sibling):
                backup(legacy)
            elif sibling.exists():
                raise FileExistsError(f'Cannot preserve root copy without overwriting: {sibling}')
            else:
                shutil.move(str(legacy), str(sibling))
                print(f'Preserved separate root edit: {sibling.name}')

    for example in sorted(examples.glob('Genereti-*.json')):
        target = destination / example.name
        unchanged = target.is_file() and manifest.get(example.name) == digest(target)
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
        manifest[example.name] = digest(target)
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
