#!/usr/bin/env python3
"""Verify repository-prefix assets, JavaScript syntax and private-file exclusions."""
from pathlib import Path
from html.parser import HTMLParser
import re
import subprocess
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[1] / 'docs'
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('src', 'href') and value:
                self.paths.append(value)

for prefix in ('/', '/keyboard-editor/'):
    origin = 'https://example.github.io'
    for html in ROOT.glob('*.html'):
        parser = Links()
        parser.feed(html.read_text())
        for link in parser.paths:
            resolved = urlparse(urljoin(origin + prefix + html.name, link))
            if resolved.netloc != 'example.github.io':
                continue
            assert resolved.path.startswith(prefix), (html, link, prefix)
            relative = resolved.path[len(prefix):] or 'index.html'
            assert (ROOT / relative).exists(), (html, link, relative)

files = list(ROOT.rglob('*.js'))
for path in files:
    subprocess.run(['node', '--check', str(path)], check=True, capture_output=True)
    text = path.read_text()
    assert 'seedOfflineProfiles' not in text
    assert 'he68-profile-before-import' not in text
    for ref in re.findall(r'''(?:from|import\()\s*["'](\.?\.?/[^"']+\.js)["']''', text):
        assert (path.parent / ref).exists(), (path, ref)

for path in ROOT.rglob('*'):
    assert path.suffix.lower() not in ('.exe', '.hex', '.bin')
    assert path.name not in ('original-profiles', 'saved-profiles')
    assert 'Fn-backup' not in path.name

subprocess.run(['node', '--input-type=module', '-e', '''
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const code = fs.readFileSync(process.argv[1], 'utf8');
for (const prefix of ['/', '/keyboard-editor/']) {
  const context = vm.createContext({URL, document: {currentScript: {
    src: 'https://example.github.io' + prefix + 'pages-base.js'
  }}});
  vm.runInContext(code, context);
  assert.equal(context.__HE68_BASE__, prefix);
}
''', str(ROOT / 'pages-base.js')], check=True)
bundle = (ROOT / 'assets/layout-classic-9X_NWcrt.js').read_text()
assert 'history:Ar(globalThis.__HE68_BASE__+"#")' in bundle
assert 'customKeysConfig:{isShowFn:!0}' in bundle
print(f'Passed: {len(files)} JavaScript files; imports; root/project URL assets; base detection; privacy exclusions; routing/Fn patch.')
