import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('genereti_about', Path(__file__).resolve().parents[1] / 'integrations/genereti_comfy_p5/about.py')
about = importlib.util.module_from_spec(spec)
spec.loader.exec_module(about)


class AboutTests(unittest.TestCase):
    def test_package_identity_and_published_revision(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'pyproject.toml').write_text('[project]\nversion="0.1.2"\n')
            (root / 'distribution').mkdir()
            stamp = root / 'distribution/build-info.json'
            stamp.write_text('{"sourceRevision":null}')
            self.assertEqual(about.installation_info(root)['kind'], 'package')
            revision = 'a' * 40
            stamp.write_text(json.dumps({'sourceRevision': revision}))
            info = about.installation_info(root)
            self.assertEqual((info['version'], info['kind'], info['revision']), ('0.1.2', 'release', revision))
            (root / 'DISTRIBUTION.json').write_text(json.dumps({'sourceRevision': revision,
                                                              'sourceDirty': True,
                                                              'releaseLicenseChecked': False}))
            info = about.installation_info(root)
            self.assertEqual((info['kind'], info['dirty']), ('preview', True))

    def test_git_checkout_overrides_package_stamp_and_reports_changes(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            def git(*args):
                return subprocess.check_output(['git', '-C', folder, *args]).decode().strip()
            git('init', '-q', '-b', 'dev')
            git('config', 'user.email', 'test@example.invalid')
            git('config', 'user.name', 'Test')
            metadata = root / 'pyproject.toml'
            metadata.write_text('[project]\nversion="0.1.2"\n')
            git('add', '.')
            git('commit', '-qm', 'Fixture')
            info = about.installation_info(root)
            self.assertEqual((info['kind'], info['branch'], info['dirty']), ('checkout', 'dev', False))
            self.assertEqual(info['revision'], git('rev-parse', 'HEAD'))
            metadata.write_text('[project]\nversion="0.1.3"\n')
            self.assertTrue(about.installation_info(root)['dirty'])

    def test_missing_metadata_is_explicit(self):
        with tempfile.TemporaryDirectory() as folder:
            self.assertEqual(about.installation_info(folder)['version'], 'unknown')
