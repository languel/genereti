import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('workflow_install', Path(__file__).resolve().parents[1] / 'scripts/install_comfy_workflows.py')
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


class WorkflowInstallTests(unittest.TestCase):
    def test_consolidate_keep_edits_and_repeat(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); examples = root / 'examples'; workflows = root / 'user/workflows'
            examples.mkdir(); (workflows / 'Genereti').mkdir(parents=True)
            name = 'Genereti-Test.json'
            (examples / name).write_text('{"version":1}')
            (workflows / name).write_text('{"version":1}')
            edited = workflows / 'Genereti' / name; edited.write_text('{"custom":true}')
            installer.install(examples, workflows)
            self.assertFalse((workflows / name).exists())
            self.assertEqual(json.loads(edited.with_name('ꘇ-Test.json').read_text()), {'custom': True})
            self.assertEqual(len(list((workflows.parent / '.genereti-workflow-backups').rglob(name))), 1)
            installer.install(examples, workflows)
            self.assertEqual(len(list((workflows / 'Genereti').glob('*.json'))), 1)

    def test_independent_edits_survive(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); examples = root / 'examples'; workflows = root / 'user/workflows'
            examples.mkdir(); (workflows / 'Genereti').mkdir(parents=True)
            name = 'Genereti-Test.json'
            (examples / name).write_text('{"version":1}')
            (workflows / name).write_text('{"edit":"root"}')
            (workflows / 'Genereti' / name).write_text('{"edit":"folder"}')
            installer.install(examples, workflows)
            self.assertEqual(json.loads((workflows / 'Genereti' / 'ꘇ-Test (from root).json').read_text()), {'edit': 'root'})
            self.assertEqual(json.loads((workflows / 'Genereti' / 'ꘇ-Test.json').read_text()), {'edit': 'folder'})

    def test_managed_updates_but_not_user_changes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); examples = root / 'examples'; workflows = root / 'user/workflows'
            examples.mkdir(); name = 'Genereti-Test.json'; source = examples / name
            source.write_text('{"version":1}'); destination = installer.install(examples, workflows) / 'ꘇ-Test.json'
            source.write_text('{"version":2}'); installer.install(examples, workflows)
            self.assertEqual(json.loads(destination.read_text()), {'version': 2})
            destination.write_text('{"custom":true}'); source.write_text('{"version":3}'); installer.install(examples, workflows)
            self.assertEqual(json.loads(destination.read_text()), {'custom': True})

    def test_rename_keeps_managed_checksum_for_updates(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); examples = root / 'examples'; workflows = root / 'user/workflows'
            examples.mkdir(); (workflows / 'Genereti').mkdir(parents=True)
            old = workflows / 'Genereti' / 'Genereti-Test.json'; old.write_text('{"version":1}')
            (workflows.parent / '.genereti-workflows.json').write_text(json.dumps({old.name: installer.digest(old)}))
            (examples / 'ꘇ-Test.json').write_text('{"version":2}')
            installer.install(examples, workflows)
            self.assertFalse(old.exists())
            self.assertEqual(json.loads((old.parent / 'ꘇ-Test.json').read_text()), {'version': 2})

    def test_custom_glyph_root_is_not_moved(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); examples = root / 'examples'; workflows = root / 'user/workflows'
            examples.mkdir(); workflows.mkdir(parents=True)
            (examples / 'ꘇ-Test.json').write_text('{"version":1}')
            custom = workflows / 'ꘇ My Sketch.json'; custom.write_text('{"custom":true}')
            destination = installer.install(examples, workflows)
            self.assertEqual(json.loads(custom.read_text()), {'custom': True})
            self.assertFalse((destination / custom.name).exists())

    def test_space_and_lowercase_prefixes_migrate_without_touching_custom_workflows(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); examples = root / 'examples'; workflows = root / 'user/workflows'
            examples.mkdir(); (workflows / 'Genereti').mkdir(parents=True)
            (examples / 'ꘇ-Output-Views.json').write_text('{"version":1}')
            (workflows / 'Genereti' / 'ꘇ Output Views.json').write_text('{"edit":true}')
            (workflows / 'genereti-Output-Views.json').write_text('{"version":1}')
            custom = workflows / 'ꘇ My Private Sketch.json'; custom.write_text('{"private":true}')
            installer.install(examples, workflows)
            self.assertEqual(json.loads((workflows / 'Genereti/ꘇ-Output-Views.json').read_text()), {'edit':True})
            self.assertTrue(custom.exists())
            self.assertFalse((workflows / 'genereti-Output-Views.json').exists())
            installer.install(examples, workflows)
            self.assertEqual(len(list((workflows / 'Genereti').glob('*.json'))),1)
