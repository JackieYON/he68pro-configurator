// Derive the deployment directory; works at / and /any-repository/.
(() => {
  const script = document.currentScript;
  if (!script?.src) throw new Error('Cannot determine configurator base URL');
  globalThis.__HE68_BASE__ = new URL('.', script.src).pathname;
})();
