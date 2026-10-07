"""Distribution contracts: real archive contents, exclusions and release gates."""
import hashlib
import importlib.util
import json
import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path

from pathspec import GitIgnoreSpec

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('comfy_package_builder', ROOT / 'scripts/build_comfy_package.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class PackageTests(unittest.TestCase):
    def fixture(self, root):
        subprocess.run(['git', 'init', '-q', str(root)], check=True)
        subprocess.run(['git', '-C', str(root), 'config', 'user.email', 'fixture@example.invalid'], check=True)
        subprocess.run(['git', '-C', str(root), 'config', 'user.name', 'Test fixture'], check=True)
        (root / 'distribution').mkdir()
        manifest = {'packs': ['genereti_comfy_test'], 'files': ['__init__.py', 'pyproject.toml', 'LICENSE', 'distribution/manifest.json'], 'directories': ['docs']}
        (root / 'distribution/manifest.json').write_text(json.dumps(manifest))
        (root / '__init__.py').write_text('# fixture\n')
        (root / 'pyproject.toml').write_text('[project]\nname="genereti"\nversion="0.1.0"\nlicense={file="LICENSE"}\n[tool.comfy]\nPublisherId="fixture"\n')
        (root / 'LICENSE').write_text('Synthetic test license fixture')
        (root / 'integrations/genereti_comfy_test').mkdir(parents=True)
        (root / 'integrations/genereti_comfy_test/__init__.py').write_text('# node fixture\n')
        (root / 'docs').mkdir()
        (root / 'docs/lesson.json').write_text('{"steps":[]}')
        subprocess.run(['git', '-C', str(root), 'add', '.'], check=True)
        subprocess.run(['git', '-C', str(root), 'commit', '-qm', 'Fixture'], check=True)

    def test_archive_is_deterministic_and_hashes_match(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); self.fixture(root)
            # An ignored/private local file must never enter a release ZIP.
            (root / 'docs/private.txt').write_text('not tracked')
            (root / 'models').mkdir(); (root / 'models/local.pt').write_bytes(b'private')
            archive = builder.build(root / 'out', root, release=True)
            first = archive.read_bytes()
            builder.build(root / 'out', root, release=True)
            self.assertEqual(first, archive.read_bytes())
            with zipfile.ZipFile(archive) as package:
                self.assertNotIn('genereti/docs/private.txt', package.namelist())
                self.assertNotIn('genereti/models/local.pt', package.namelist())
                info = json.loads(package.read('genereti/DISTRIBUTION.json'))
                self.assertFalse(info['sourceDirty'])
                for name, sha in info['files'].items():
                    self.assertEqual(hashlib.sha256(package.read('genereti/' + name)).hexdigest(), sha)

    def test_tracked_weights_and_symlinks_fail(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); self.fixture(root)
            weight = root / 'integrations/genereti_comfy_test/model.pt'
            weight.write_bytes(b'weights')
            subprocess.run(['git', '-C', str(root), 'add', '.'], check=True)
            with self.assertRaisesRegex(ValueError, 'Forbidden'):
                builder.selected_files(root)
            subprocess.run(['git', '-C', str(root), 'rm', '-f', str(weight)], check=True)
            link = root / 'docs/link'; link.symlink_to(root / 'LICENSE')
            subprocess.run(['git', '-C', str(root), 'add', '.'], check=True)
            with self.assertRaisesRegex(ValueError, 'Unsafe'):
                builder.selected_files(root)

    def test_release_requires_license_publisher_and_committed_sources(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); self.fixture(root)
            (root / 'LICENSE').unlink()
            with self.assertRaisesRegex(ValueError, 'license'):
                builder.validate_release(root)
            (root / 'LICENSE').write_text('Synthetic test license fixture')
            p = root / 'pyproject.toml'
            p.write_text(p.read_text().replace('PublisherId="fixture"', 'PublisherId=""'))
            with self.assertRaisesRegex(ValueError, 'PublisherId'):
                builder.validate_release(root, registry=True)
            with self.assertRaisesRegex(ValueError, 'Commit tracked'):
                builder.build(root / 'out', root, release=True)

    def test_registry_allowlist_matches_student_archive(self):
        selected = set(builder.selected_files(ROOT))
        ignore = GitIgnoreSpec.from_lines((ROOT / '.comfyignore').read_text().splitlines())
        tracked = subprocess.check_output(['git', '-C', str(ROOT), 'ls-files', '-z']).decode().split('\0')
        registry = {name for name in filter(None, tracked) if not ignore.match_file(name)}
        self.assertEqual(selected, registry)
        self.assertIn('licensing/browser/livecode/inventory.json', selected)
        self.assertIn('licensing/source/p5-1.11.11.tar.gz', selected)
        self.assertNotIn('integrations/genereti_comfy_p5/web/lib/@strudel-web-LICENSE', selected)
        self.assertIn('web/vendor/excalidraw/editor.js', selected)
        sources = list((ROOT / 'integrations/comfyui_genereti/workflows').glob('*.json'))
        self.assertTrue(sources)
        templates = {p.name for p in (ROOT / 'example_workflows').glob('*.json')}
        self.assertEqual(templates, {p.name for p in sources})
        for source in sources:
            template = ROOT / 'example_workflows' / source.name
            self.assertIn('example_workflows/' + source.name, selected)
            self.assertEqual(template.read_bytes(), source.read_bytes())
        self.assertNotIn('requirements-macos.txt', selected)


if __name__ == '__main__':
    unittest.main()
