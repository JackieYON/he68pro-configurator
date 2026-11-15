# HE68 Pro configurator 

The ATOM HE68 by Fantech is a really good and amazing keyboard for a budget, Although the configurator is not unleashed to it's full potential.

This started out because I found out that using FN + CTRL to switch to the F keys is really annoying and time consuming, So I started to patch their configurator to unlock the features, Like the FN Layer.

I don't know if i will be able to unlock more features, But the time will come.

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
