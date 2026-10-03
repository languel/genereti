"""Build the local AppKit companion into the user's cache, never the repository."""
import hashlib
from pathlib import Path
import plistlib
import subprocess
import sys


def build():
    source = Path(__file__).with_name('Output.swift')
    digest = hashlib.sha256(source.read_bytes()).hexdigest()[:16]
    root = Path.home() / 'Library/Caches/Genereti/desktop-output' / digest
    bundle = root / 'Genereti Output.app'
    binary = bundle / 'Contents/MacOS/GeneretiOutput'
    if binary.is_file():
        return binary
    binary.parent.mkdir(parents=True, exist_ok=True)
    temporary = binary.with_suffix('.building')
    subprocess.run(['/usr/bin/xcrun', 'swiftc', '-O', str(source), '-o', str(temporary)],
                   check=True, capture_output=True, timeout=120)
    info = {'CFBundleExecutable': 'GeneretiOutput', 'CFBundleIdentifier': 'local.genereti.output',
            'CFBundleName': 'Genereti Output', 'CFBundlePackageType': 'APPL',
            'NSHighResolutionCapable': True, 'LSMinimumSystemVersion': '14.0',
            'NSAppTransportSecurity': {'NSAllowsLocalNetworking': True}}
    (bundle / 'Contents/Info.plist').write_bytes(plistlib.dumps(info))
    temporary.replace(binary)
    return binary

if __name__ == '__main__':
    binary = build()
    if len(sys.argv) == 2:
        subprocess.Popen([str(binary), sys.argv[1]])
    print(binary)
