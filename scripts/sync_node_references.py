"""Expose canonical native-help Markdown through the existing agent web alias."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def sync(root=ROOT, check=False):
    source = root / 'help/docs'
    target = root / 'integrations/genereti_comfy_agent/web/lessons/node-references.json'
    references = {path.stem: path.read_text() for path in sorted(source.glob('*.md'))}
    if not references:
        raise ValueError('No node references found')
    expected = json.dumps(references, ensure_ascii=False, indent=2) + '\n'
    if check:
        if not target.exists() or target.read_text() != expected:
            raise ValueError('Node references are stale. Run python scripts/sync_node_references.py')
    else:
        target.write_text(expected)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    sync(check=parser.parse_args().check)
