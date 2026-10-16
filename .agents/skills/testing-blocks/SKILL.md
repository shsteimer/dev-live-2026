---
name: testing-blocks
description: Guide for testing code changes in AEM Edge Delivery projects including blocks, scripts, and styles. Use this skill after making code changes and before opening a pull request to validate functionality. Covers unit testing for utilities and logic, browser testing with Playwright, linting, and guidance on what to test and how
license: Apache-2.0
metadata:
  version: "1.0.0"
---

# Testing Blocks

This skill guides you through testing code changes in AEM Edge Delivery Services projects. Testing follows a value-versus-cost philosophy: create and maintain tests when the value they bring exceeds the cost of creation and maintenance.

**CI boundary:** `npm run lint` and `npm test` (unit tests) run in CI on every push. E2E block tests (`npm run test:e2e`) require `aem up` and DA content — they are a local pre-PR gate, not a CI gate.

**CRITICAL: Browser validation is MANDATORY. You cannot complete this skill without providing proof of functional testing in a real browser environment.** (This is the manual/ad-hoc validation in Step 2, required for every block. Whether that validation also becomes a permanent committed Playwright spec is a separate, criteria-based decision — see Step 3.)

## Related Skills

- **content-driven-development**: Test content created during CDD serves as the basis for testing
- **building-blocks**: Invokes this skill during Step 5 for comprehensive testing
- **block-collection-and-party**: May provide reference test patterns from similar blocks

## When to Use This Skill

Use this skill:
- ✅ After implementing or modifying blocks
- ✅ After changes to core scripts (scripts.js, delayed.js, aem.js)
- ✅ After style changes (styles.css, lazy-styles.css)
- ✅ After configuration changes that affect functionality
- ✅ Before opening any pull request with code changes

This skill is typically invoked by the **building-blocks** skill during Step 5 (Test Implementation).

## Testing Workflow

Track your progress:

- [ ] Step 1: Run linting and fix issues
- [ ] Step 2: Perform browser validation (MANDATORY)
- [ ] Step 3: Decide whether to commit a Playwright spec
- [ ] Step 4: Determine if unit tests are needed (optional)
- [ ] Step 5: Run existing tests and verify they pass

## Step 1: Run Linting

**Run linting first to catch code quality issues:**

```bash
npm run lint
```

**If linting fails:**
```bash
npm run lint:fix
```

**Manually fix remaining issues** that auto-fix couldn't handle.

**Success criteria:**
- ✅ Linting passes with no errors
- ✅ Code follows project standards

**Mark complete when:** `npm run lint` passes with no errors

---

## Step 2: Browser Validation (MANDATORY)

**CRITICAL: You must test in a real browser and provide proof.**

### What to Test

Load test content URL(s) in browser and validate:
- ✅ Block/functionality renders correctly
- ✅ Responsive behavior (mobile, tablet, desktop viewports)
- ✅ No console errors
- ✅ Visual appearance matches requirements/acceptance criteria
- ✅ Interactive behavior works (if applicable)
- ✅ All variants render correctly (if applicable)

### How to Test

**Choose the method that makes most sense given your available tools:**

**Option 1: Browser/Playwright MCP (Recommended)**

If you have MCP browser or Playwright tools available, use them directly:
- Navigate to test content URL
- Take accessibility snapshots to inspect rendered content (preferred for interaction)
- Take screenshots at different viewports for visual validation
  - Consider both full-page screenshots and element-specific screenshots of the block being tested
- Interact with elements as needed
- Most efficient for agents with tool access

**Option 2: Playwright automation**

Write one (or more) temporary test scripts to validate functionality with playwright and capture snapshots/screenshots for inspection and validation.

```javascript
// test-my-block.js (temporary - don't commit)
import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate and wait for block
  await page.goto('http://localhost:3000/path/to/test');
  await page.waitForSelector('.my-block');

  // Inspect accessibility tree (useful for validating structure)
  const accessibilityTree = await page.accessibility.snapshot();
  console.log('Accessibility tree:', JSON.stringify(accessibilityTree, null, 2));
  
  // Optionally save to file for easier analysis
  await require('fs').promises.writeFile(
    'accessibility-tree.json',
    JSON.stringify(accessibilityTree, null, 2)
  );

  // Test viewports and take screenshots
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: 'mobile.png', fullPage: true });
  await page.locator('.my-block').screenshot({ path: 'mobile-block.png' });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: 'tablet.png', fullPage: true });
  await page.locator('.my-block').screenshot({ path: 'tablet-block.png' });

  await page.setViewportSize({ width: 1200, height: 800 });
  await page.screenshot({ path: 'desktop.png', fullPage: true });
  await page.locator('.my-block').screenshot({ path: 'desktop-block.png' });

  // Check for console errors
  page.on('console', msg => console.log('Browser:', msg.text()));

  await browser.close();
}

test().catch(console.error);
```

Run: `node test-my-block.js` then delete the script and analyze the resulting artifacts.

**Option 3: Manual browser testing**

Use a standard web browser with dev tools:
1. Navigate to test content: `http://localhost:3000/path/to/test/content`
2. Use browser dev tools responsive mode to test viewports:
   - Mobile: <600px (e.g., 375px)
   - Tablet: 600-900px (e.g., 768px)
   - Desktop: >900px (e.g., 1200px)
3. Check console for errors at each viewport
4. Take screenshots as proof (browser screenshot tool or dev tools)

### Validation Against Acceptance Criteria

**If acceptance criteria provided (from CDD Step 2):**
- Review each criterion
- Test specific scenarios mentioned
- Verify all criteria are met

**If design/mockup screenshots provided:**
- Compare implementation to design
- Verify visual alignment
- Note any intentional deviations

### Proof of Testing

**You must provide:**
- ✅ Screenshots of test content in browser (at least one viewport)
- ✅ Confirmation no console errors
- ✅ Confirmation acceptance criteria met (if provided)

**Success criteria:**
- ✅ All test content loads and renders correctly
- ✅ Responsive behavior validated across viewports
- ✅ No console errors
- ✅ Screenshots captured as proof
- ✅ Acceptance criteria validated (if provided)

**Mark complete when:** Browser testing complete with screenshots as proof

---

## Step 3: Decide Whether to Commit a Playwright Spec

Manual browser validation (Step 2) is mandatory for every block change. Committing a permanent spec to `test/e2e/blocks/{block-name}/{block-name}.spec.js` is a separate decision — it is not automatic just because a block changed.

**Commit a spec when the block has:**
- ✅ Accessibility behavior a sighted click-through is unlikely to catch — focus management, keyboard operability, ARIA state correctness (`aria-pressed`/`aria-expanded`/`aria-current`), live-region announcements
- ✅ Analytics tagging/event firing — invisible on a rendered page, easy to silently break

**Grey area — judgment call, not a default:**
- Functional/interaction assertions (e.g. "clicking next advances the slide"). Step 2's manual click-through already sees this happen visually. Keep one only when it's genuinely valuable and located by role/structure (position, generated attributes) rather than tightly coupled to the block's internal DOM or hardcoded authored copy — don't add one just because the block is interactive.

**Skip the committed spec when:**
- `decorate()` is pure static DOM rearrangement — no ARIA-relevant state, no analytics tagging, no branches worth guarding
- The block's correctness is already fully covered by what a human sees in the Step 2 screenshots
- **Never** commit a spec whose only assertions are visual/geometry (computed CSS, bounding boxes, breakpoint layout) — that's Step 2's job, not Playwright's

This is a judgment call for the author/reviewer, made per block — not a rule to apply mechanically. When in doubt, or if the block is likely to gain interactivity later, err toward committing the spec.

**Why:** E2E specs aren't a CI gate here — they only run pre-PR, locally (see CI boundary above). A spec that just re-asserts static DOM structure, or re-confirms something a screenshot already shows, is the same brittle, no-payoff pattern called out in [references/testing-philosophy.md](references/testing-philosophy.md): maintenance cost with no regression-catching benefit to show for it. (The DA library content it would run against is maintained anyway, for authors — reusing it doesn't add cost, but it also doesn't create a benefit that offsets a low-value spec.) Reserve committed specs for blocks where breaking them would actually be easy and costly to miss — an insurance model, not exhaustive coverage.

**Mark complete when:** Decision made and, if committing, the spec is written using ARIA-role/structure-based locators, with any content-derived expectations read back from the DOM at runtime rather than hardcoded (not DOM classes, not literal authored copy) — see [references/testing-philosophy.md](references/testing-philosophy.md) for the locator rules and the algorithmic-logic-goes-in-a-unit-test guidance.

**Running against a specific target:** `npm run test:e2e` defaults to local `aem up`. Point it at a branch preview, main, or an auth-gated target with `E2E_BASE_URL` (and `E2E_AUTH_HEADER` if needed) — see [references/testing-philosophy.md](references/testing-philosophy.md#running-e2e-against-a-specific-target).

---

## Step 4: Unit Tests for Algorithmic Logic (Optional)

**Scope:** pure/algorithmic logic with real edge cases — a function with a "correct answer" independent of the DOM. The boundary is complexity, not file location:

| Code | Test approach |
|---|---|
| Pure functions with real edge cases (index math, date/range calculations, parsing) — in `scripts/utils/*.js` or exported from a block's own file | `node:test` unit tests |
| DOM-wiring/glue logic (attribute toggles, event binding, node construction) — no algorithm to get wrong; correctness means "renders right in a browser" | Playwright (see Step 3) |

**Why this split:** Playwright against a rendered page answers "does it work for a user?" — the right question for DOM glue, where there's no algorithm to check independent of the browser. But when a block contains real algorithmic logic — arithmetic, boundary conditions, branches with a correct/incorrect answer — a unit test verifies it directly, faster and without flake, and documents the edge cases explicitly.

**Where extracted functions live:** keep them in the block's own file, exported alongside `decorate()` — proximity to the caller matters more than the test boundary. Only move a function to a separate file for a real reason (the block file is already large/complex, or importing it has side effects that fight the test setup) — never just to satisfy a scope rule.

**Extraction is a strong recommendation, not a gate:** raise it in review when a block has non-trivial algorithmic logic, but don't block a PR over it if Playwright coverage is already adequate and the author judges the extraction isn't worth it.

**Write unit tests when:**
- ✅ Pure functions with real edge cases — in `scripts/utils/` or exported from a block file — transformations, calculations, index/date arithmetic, parsing
- ✅ Utility functions used across multiple blocks

**Never write unit tests for:**
- ❌ DOM-wiring/glue logic — event binding, attribute toggles, node construction — use Playwright instead
- ❌ Tests that would need to change every time the block's markup changes — that's the brittleness Playwright's ARIA-based assertions are meant to avoid; don't recreate it in jsdom
- ❌ Coverage for its own sake — 100% coverage is not a goal. Pick the functions where a wrong answer is easy to introduce and hard to catch by looking at a rendered page.

**If unit tests needed:**

```js
// test/scripts/utils/my-utility.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { myUtility } from '../../../scripts/utils/my-utility.js';

describe('myUtility', () => {
  it('transforms input correctly', () => {
    assert.equal(myUtility('input'), 'OUTPUT');
  });
});
```

Run with: `node --test test/scripts/utils/my-utility.test.js`

**For detailed unit testing guidance:** See [references/unit-testing.md](references/unit-testing.md)

**Success criteria:**
- ✅ Unit tests written for algorithmic logic with non-trivial edge cases (in `scripts/utils/` or exported from a block)
- ✅ Tests pass: `npm test`
- ✅ OR determined unit tests not needed

**Mark complete when:** Unit tests written and passing, or determined not needed

---

## Step 5: Run Existing Tests

**Verify your changes don't break existing functionality:**

```bash
npm test
```

**If tests fail:**
1. Read error message carefully
2. Run single test to isolate: `node --test path/to/test.js` (run node directly, not via `npm test` — that script's glob argument isn't overridden by extra args)
3. Fix code or update test if expectations changed
4. Re-run full test suite

**Success criteria:**
- ✅ All existing tests pass
- ✅ No regressions introduced

**Mark complete when:** `npm test` passes with no failures

## Troubleshooting

For detailed troubleshooting guide, see [references/troubleshooting.md](references/troubleshooting.md).

**Common issues:**

### Tests fail
- Read error message carefully
- Run single test: `npm test -- path/to/test.js`
- Fix code or update test

### Linting fails
- Run `npm run lint:fix`
- Manually fix remaining issues

### Browser tests fail
- Verify dev server running: `aem up`
- `npm run test:e2e` auto-refreshes `content/docs` from da.live before running (see `test/support/sync-e2e-content.js`), unless `content/` has uncommitted changes — those are left alone so local WIP library pages aren't clobbered
- `/docs/library/blocks/*` pages have no live/preview fallback (unlike `/footer`, `/nav`) — if the page 404s and a fresh clone doesn't fix it, the content genuinely doesn't exist in DA yet and needs to be authored first, not just cloned
- Verify URL: `http://localhost:3000/docs/library/blocks/{block-name}`
- Add waits: `await page.waitForSelector('.block')`

## Resources

- **Unit Testing:** [references/unit-testing.md](references/unit-testing.md) - Complete guide to writing and maintaining unit tests
- **Troubleshooting:** [references/troubleshooting.md](references/troubleshooting.md) - Solutions to common testing issues
- **Testing Philosophy:** [references/testing-philosophy.md](references/testing-philosophy.md) - Guide on what and how to test

## Integration with Building Blocks Skill

The **building-blocks** skill invokes this skill during Step 5 (Test Implementation).

**Inputs received from building-blocks:**
- Block name being tested
- Test content URL(s) (from CDD Step 4)
- Any variants that need testing
- Screenshots of existing implementation/design/mockup to verify against (if provided)
- Acceptance criteria to verify (from CDD Step 2)

**Expected outputs to return to building-blocks:**
- ✅ Confirmation all testing steps complete
- ✅ Screenshots from browser testing as proof
- ✅ Confirmation linting passes
- ✅ Confirmation tests pass
- ✅ Any issues discovered and resolved
