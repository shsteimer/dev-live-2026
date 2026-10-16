# Testing Philosophy

**Core Principles:**

- Create and maintain tests when the value they bring exceeds the cost of creation and maintenance. Other things should and must be tested, but these tests can be temporary and not maintained long term.
- 100% test coverage is not a goal. Test where a wrong answer is easy to introduce and hard to catch by inspection — not every function, and not every block.
- Brittle tests — ones that must be updated every time the code under test changes, without the code actually being wrong — are a net loss. Don't write them.
- This is an insurance model: protect what's valuable and vulnerable, not everything uniformly. A block with no branches and no interactivity carries little risk a test would catch that a screenshot wouldn't.

## Browser Tests

Most of your testing effort should focus on browser testing. This is where you validate that blocks actually work as intended in a real browser environment.

✅ **Always run manual/ad-hoc browser validation for:**
- Every block you create or modify
- Visual layout and responsive behavior across breakpoints
- DOM structure and content transformation
- Interactive features (clicks, hovers, keyboard navigation)
- Accessibility (ARIA labels, focus management, screen reader compatibility)
- Integration between blocks and the page
- Performance (LCP, CLS, visual regressions)

This manual validation is **required before opening any PR** — it catches issues unit tests cannot: rendering bugs, CSS conflicts, responsive breakdowns, accessibility failures, and real user interaction problems.

**Committing a permanent spec is a separate, narrower decision.** Playwright specs committed to `test/e2e/blocks/{block-name}/{block-name}.spec.js` are keeper tests — but they exist to catch what manual eyeballing is unlikely to catch, not to re-confirm what a screenshot already shows.

Commit a spec when the block has:
- **Accessibility behavior a sighted click-through misses** — focus management, keyboard operability, ARIA state correctness (`aria-pressed`, `aria-expanded`, `aria-current`), live-region announcements.
- **Analytics tagging/event firing** — invisible on a rendered page, easy to silently break. Asserting on tracking attributes alone only proves the tagging exists, not that the listener is bound and actually fires — two different failure modes. Where an interaction should fire an event, capture the dispatch (e.g. wrap the analytics function or push target before the interaction) and assert on what fired, in addition to the static attributes.

Functional/interaction assertions (e.g. "clicking next advances the slide") are a **grey area** — a manual click-through in Step 2 already sees this happen. Keep one only when it's genuinely valuable and locates elements by role/name/text, not tightly coupled to the block's internal DOM. Don't add one just because the block is interactive.

**Never assert visual/geometry state in Playwright** — computed CSS values, bounding-box comparisons, breakpoint layout checks. That's what the manual/screenshot validation in Step 2 is for; a passing geometry assertion doesn't mean the layout looks right, and a failing one doesn't tell you what's wrong without a screenshot anyway.

Skip a committed spec entirely when `decorate()` is pure static DOM rearrangement with no ARIA-relevant state and no analytics tagging — the manual validation above already covers that risk. E2E specs run locally pre-PR, not in CI, so an unwarranted spec is pure maintenance cost without a matching safety net.

**Algorithmic logic doesn't belong in Playwright at all.** If a regression would really be caught by checking arithmetic, date/geometry calculations, or index math rather than by watching the page, extract that logic into a pure function and cover it with a unit test instead (see Unit Tests below) — e.g. `carousel.js`'s `resolveSlideIndex`, tested in `test/blocks/carousel/carousel.test.js`. A DOM-inspection assertion for something that's really a math bug is both slower and less precise than a unit test that pins the exact input/output.

When a spec is warranted, test against realistic content — the block library doc content at `docs/library/blocks/{block-name}` — rather than minimal synthetic fixtures. This content is maintained anyway, for authors, as the canonical example of how to author the block; the spec just reuses it, so there's no separate content-authoring burden created by the test. Realistic authoring patterns also catch what actually breaks in production; a synthetic fixture that only exercises the happy path doesn't. Library content can exist without a spec — that's expected for simple blocks that don't warrant one. A spec always requires library content to run against; this is not optional.

**Never add a row to the library page purely to drive a test.** It's author-facing reference content — every row on it should earn its place as a good example of how to author the block, not as test fixture data. If a test genuinely needs an edge-case variant the canonical example wouldn't otherwise show, put it on a separate, non-published page at `docs/testing/blocks/{block-name}` instead (same local-only convention as the library, but never listed in `content/docs/library/blocks.json`).

### Edge cases and error states

Library content is real, but happy-path by design — it's the same content authors use as the canonical example. Playwright specs inherit that: don't reach for synthetic error/edge-case fixtures or browser-level network mocking to cover what the library page doesn't show. Same Core Principles gate applies here as everywhere: only add coverage where a wrong answer is plausible and costly to miss.

- **Malformed/missing input** (empty cell, failed fragment fetch, absent image) — DOM-construction logic with no algorithm-independent-of-the-DOM excuse needed: mock the input directly in a unit test (see `carousel.test.js`'s "does not throw when fragment failed to load"). No browser required.
- **A real edge state's rendering/a11y/analytics** (empty state, single-item state) — still real authored content, not a synthetic fixture, but not a library-page row either (see above): add it to `docs/testing/blocks/{block-name}` and target it from the spec.
- **States that can't be authored at all** (e.g. a real network failure) — still a unit test, mocking at the JS level. Don't reach for `page.route()`-style network mocking in a Playwright spec.

**Locate elements by ARIA role and structure (position, generated attributes) — not by classes a block's own `decorate()` injects, and not by hardcoding specific authored copy.** The one exception is the block's own root class (e.g. `.tabs`, `.carousel`) added by core `aem.js`, not by the block — that's an author-facing contract as stable as the block's file path, so it's fine as the top-level anchor. Everything inside the block should be reachable without knowing its internal DOM *or* its current content: if a block's markup gets refactored, or an author edits a heading, its spec shouldn't need to change.

Same reasoning applies to the initial `beforeEach` wait: use `page.locator('.{block-name}[data-block-status="loaded"]').waitFor()` (`data-block-status` is set by core `aem.js` once `decorate()` finishes) rather than waiting for a piece of the block's own rendered content — that couples the wait to authored copy for no reason, when a framework-level "decoration finished" signal already exists.

- Nothing sourced from DA is safe to hardcode by name — that includes placeholder-driven UI chrome text (e.g. "Previous"/"Next" arrow labels), since placeholders are authored/editable content too, not developer-fixed strings.
- When a test needs to correlate a specific element to its content — "the pin I clicked" to "the heading it revealed" — read the expected value back from the DOM at runtime (e.g. `pin.evaluate((el) => el.getAttribute('aria-label'))`) and assert against that, not a literal string.
- Prefer ARIA role/name alone. When that's not enough to pick out one element, fall back to position (`.nth(n)`), landmark structure (e.g. the Nth button inside a `nav`), or a code-level constant that isn't sourced from placeholders/content (e.g. a fixed attribute value hardcoded in the block's JS) — never the text an element happens to display today. These fallbacks are still tied to the block's DOM shape (reordering or re-nesting breaks them same as a class would) — use them only when needed, not as a default substitute for classes.
- A minimal CSS-selector escape hatch is acceptable only when there's genuinely no role/structure that distinguishes an element — minimize this, don't reach for it by default, and comment why when you do.

### Running e2e against a specific target

`test:e2e` targets local `aem up` (`http://localhost:3000`) by default. To run against a branch preview, main, or an auth-gated target instead:

```bash
E2E_BASE_URL=https://{branch}--{repo}--{owner}.aem.page/ npm run test:e2e
E2E_BASE_URL=https://... E2E_AUTH_HEADER="Bearer <token>" npm run test:e2e
```

Against a remote `E2E_BASE_URL`, the `pretest:e2e` local-content refresh is skipped automatically — a remote target serves its own already-published content.

## Unit Tests

Unit tests live in `test/` and cover pure/algorithmic logic — code with real edge cases and a "correct" answer independent of the DOM (index math, date/range calculations, parsing). The boundary is complexity, not file location:

- Pure functions with real edge cases → `node:test` unit tests, whether in `scripts/utils/*.js` or exported from a block's own file (e.g. `blocks/carousel/carousel.js` exporting `resolveSlideIndex`)
- DOM-wiring/glue logic (attribute toggles, event binding, node construction) → Playwright, since there's no algorithm to get wrong — the question is always "does it render correctly?"

Extracting a pure function out of a block purely to make it unit-testable is a strong recommendation, not a requirement — raise it in review, don't block a PR over it. When extracting, keep the function in the block's own file; only move it to a separate file for a real reason (the block file is already large/complex, or importing it has side effects that fight the test setup), never just to satisfy a test-location rule.

✅ **Write unit tests for:**
- Pure functions with real edge cases — in `scripts/utils/` or exported from a block file — transformations, calculations, index/date arithmetic, parsing
- Utility functions used across multiple blocks

❌ **Don't write unit tests for:**
- DOM-wiring/glue logic (`blocks/**/*.js` event binding, attribute toggles, node construction) — use Playwright
- Tests that would need to change every time the block's markup changes — that's the same brittleness Playwright's ARIA-based assertions exist to avoid
- Coverage for its own sake — see Core Principles above
- CSS-only changes
