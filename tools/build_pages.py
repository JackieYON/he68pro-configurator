#!/usr/bin/env python3
"""Create a profile-free Pages copy from the separately maintained local editor."""
from pathlib import Path
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'he68pro-offline' / 'site'
DEST = ROOT / 'docs'
if DEST.exists():
    raise SystemExit('docs/ already exists; use a new output directory to avoid overwriting edits.')
shutil.copytree(SOURCE, DEST, ignore=shutil.ignore_patterns('saved-profiles'))

for path in DEST.rglob('*'):
    if path.suffix not in {'.js', '.html', '.css'}:
        continue
    text = path.read_text()
    if path.suffix == '.html':
        policy = '<meta http-equiv="Content-Security-Policy" content="connect-src &#39;self&#39;; img-src &#39;self&#39; data: blob:; font-src &#39;self&#39; data:; object-src &#39;none&#39;; base-uri &#39;self&#39;">'
        text = re.sub(r'((?:src|href)=["\x27])/(assets/|vendor-config/|profile-test\.js)', r'\1./\2', text)
        text = text.replace('href="/"', 'href="./"')
        text = text.replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />' + policy + '<script src="./pages-base.js"></script>')
        text = text.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + policy + '<script src="./pages-base.js"></script>')
    if path.suffix == '.js':
        # Absolute asset references, including Worker and WASM URLs.
        text = re.sub(r'''(["'])(/(?:assets|vendor-config|vendor-static)/[^"']*)\1''',
                      lambda m: '(globalThis.__HE68_BASE__+' + json.dumps(m[2][1:]) + ')', text)
        for prefix in ('vendor-config', 'vendor-static'):
            text = text.replace('`/' + prefix, '`${globalThis.__HE68_BASE__}' + prefix)
        text = text.replace('`${location.origin}/langs/${e}`', '`${location.origin}${globalThis.__HE68_BASE__}langs/${e}`')
        text = text.replace('`${location.origin}/${e}`', '`${location.origin}${globalThis.__HE68_BASE__}${e}`')
        text = text.replace('`${location.origin}/${_}`', '`${location.origin}${globalThis.__HE68_BASE__}${_}`')
    if path.name == 'layout-classic-9X_NWcrt.js':
        text = text.replace('import{seedOfflineProfiles}from"../saved-profiles/seed.js";\n', '')
        old = 'const n=await seedOfflineProfiles(e,await et.getItem(`${e}-profile`),et,()=>({profileName:"profile",...Pt(vt(e,{}).value)}));if(n)return n;'
        assert text.count(old) == 1
        text = text.replace(old, 'const n=await et.getItem(`${e}-profile`);if(n)return n;')
        assert text.count('mi=function(e){return"/"+e}') == 1
        text = text.replace('mi=function(e){return"/"+e}', 'mi=function(e){return globalThis.__HE68_BASE__+e}')
        assert text.count('history:Ar("/")') == 1
        # Vue's history implementation supports a hash base. Pages cannot serve
        # arbitrary application routes, so navigation stays after # instead.
        text = text.replace('history:Ar("/")', 'history:Ar(globalThis.__HE68_BASE__+"#")')
    path.write_text(text)

(DEST / 'pages-base.js').write_text('''// Derive the deployment directory; works at / and /any-repository/.
(() => {
  const script = document.currentScript;
  if (!script?.src) throw new Error('Cannot determine configurator base URL');
  globalThis.__HE68_BASE__ = new URL('.', script.src).pathname;
})();
''')
(DEST / '.nojekyll').touch()
print('Created', DEST)
