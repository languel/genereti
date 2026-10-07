#!/usr/bin/env python3
"""Mirror canonical examples into Comfy's automatically discovered template folder."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def sync(root=ROOT, check=False):
    source = root / 'integrations/comfyui_genereti/workflows'
    target = root / 'example_workflows'
    expected = {path.name: path.read_bytes() for path in source.glob('*.json')}
    if not expected:
        raise ValueError('No source workflows found')
    for payload in expected.values():
        json.loads(payload)
    actual = {path.name: path.read_bytes() for path in target.glob('*.json')}
    if check:
        if actual != expected:
            raise ValueError('Templates are stale. Run python scripts/sync_comfy_templates.py')
        return
    target.mkdir(exist_ok=True)
    for name, payload in expected.items():
        (target / name).write_bytes(payload)
    for name in actual.keys() - expected.keys():
        (target / name).unlink()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    sync(check=parser.parse_args().check)
