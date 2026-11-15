# HE68 Pro configurator — GitHub Pages copy

An unofficial, locally patched archive of the Fantech HE68 Pro web configurator.
The publishable site is in **docs/**. The original local editor is unchanged.

## Publish and use

Upload this directory to your own GitHub repository and configure GitHub Pages
to publish the **docs/** directory from your chosen branch. Visit the resulting
HTTPS URL in Brave or another Chromium browser with WebHID support. Connect the
keyboard by USB and authorize it on that site. No local Python server is needed
when using the hosted HTTPS site.

Repository names and custom domains are supported: assets use the deployment
directory, and application navigation uses hash routes such as
`https://USERNAME.github.io/REPOSITORY/#/custom-keys`.

The Fn editor is enabled by default. Fn remapping was confirmed by the owner on
an MK922 with developer-provided firmware 1.16. Other firmware is unverified.
The included experimental profile test produced no observed onboard slot switch
on that build; it is not a working onboard-profile feature.

## Privacy and settings

- Personal profiles, import seeding, Fn-map backups, original exports and firmware
  binaries are excluded from this copy.
- Browser permissions and profile storage are separate from the local editor.
  Authorize the keyboard again and use the editor's export/import controls to
  transfer any profiles you choose. Do not commit personal exports to a public repo.
- Assigning keys writes to the keyboard. The site does not auto-apply a custom
  Fn map or personal preset at startup.
- External API connections, images and fonts are blocked with a CSP. Cloud
  features and online updates are unavailable. Bundled UI translations remain.

## Files and rights

The bundled application is proprietary vendor code and remains the property of
its respective owners. This project is unofficial and makes no claim to that
code's copyright. Confirm redistribution permission before publishing the bundled
site. No license granting rights to vendor code is supplied here.

`tools/build_pages.py` documents the path, routing and privacy changes applied
to the separate local archive. It expects `../he68pro-offline/site` when building
a fresh copy; the generated docs/ directory is standalone for hosting.

For a local preview, serve this repository with `python3 -m http.server 8769`
and open `http://127.0.0.1:8769/docs/`. Direct file:// opening is unsupported.
