/*
 * Shared jsdom bootstrap for unit tests. Call setupDom() before importing the module
 * under test — several modules (scripts.js, slideshow.js) read `window`/`window.hlx` at
 * import time, so the globals must already exist when that import runs.
 *
 * suppressLoadPage follows the aem-embed pattern: https://www.aem.live/docs/aem-embed
 * jsdomErrors: 'none' silences jsdom's "not implemented" noise (e.g. anchor navigation)
 * without swallowing real console output from the code under test.
 */
import { JSDOM, VirtualConsole } from 'jsdom';

export default function setupDom() {
  const virtualConsole = new VirtualConsole();
  virtualConsole.forwardTo(console, { jsdomErrors: 'none' });
  const { window } = new JSDOM('<!DOCTYPE html>', { url: 'http://localhost:3000', virtualConsole });
  window.hlx = { suppressLoadPage: true, codeBasePath: '' };
  global.window = window;
  global.document = window.document;
  global.MutationObserver = window.MutationObserver;
  global.DOMParser = window.DOMParser;

  // jsdom has no IntersectionObserver. Covers the observe/unobserve/disconnect calls
  // exercised by analytics.js and slideshow.js; dwell/visibility behavior itself is
  // verified manually in-browser, not here.
  global.IntersectionObserver = class IntersectionObserverStub {
    // explicit ctor matches the real IntersectionObserver's arity — an implicit
    // 0-arg default ctor here reads to CodeQL as a superfluous-arguments mismatch
    // wherever code calls `new IntersectionObserver(callback, options)`.
    // eslint-disable-next-line no-useless-constructor, no-empty-function, no-unused-vars
    constructor(callback, options) {}

    observe() {}

    unobserve() {}

    disconnect() {}
  };

  // jsdom has no matchMedia. Covers the addEventListener/removeEventListener
  // calls exercised by header.js and highlights.js at module scope; the
  // breakpoint-crossing behavior itself is verified via Playwright e2e specs
  // (real browser, real viewport resize), not here.
  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
}
