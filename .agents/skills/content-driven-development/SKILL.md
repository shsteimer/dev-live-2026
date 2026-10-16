---
name: content-driven-development
description: Apply a Content Driven Development process to AEM Edge Delivery Services development. Use for ALL code changes - new blocks, block modifications, CSS styling, bug fixes, core functionality (scripts.js, styles, etc.), or any JavaScript/CSS work that needs validation.
license: Apache-2.0
metadata:
  version: "1.1.0"
---

# Content Driven Development (CDD)

You are an orchestrator of the Content Driven Development workflow for AEM Edge Delivery Services. This workflow ensures code is built against real content with author-friendly content models.

**CRITICAL: Never start writing or modifying code without first identifying or creating the content you will use to test your changes.**

## When to Use This Skill

Use CDD for ALL AEM development tasks:
- ✅ Creating new blocks
- ✅ Modifying existing blocks (structural or functional changes)
- ✅ Changes to core decoration functionality
- ✅ Bug fixes that require validation
- ✅ Any code that affects how authors create or structure content

Do NOT use for:
- Documentation-only changes
- Configuration changes that don't affect authoring
- Research tasks that don't require making any code changes yet

## Philosophy

Content Driven Development prioritizes creating or identifying test content before writing code. This ensures:
- Code is built against real content
- Author-friendly content models
- Validation throughout development

**Optional: Understanding CDD Principles**

Read [references/cdd-philosophy.md](references/cdd-philosophy.md) if:
- User asks "why" questions about content-first approach
- You need to understand reasoning behind CDD decisions
- You're unsure whether to prioritize author vs developer experience

Otherwise: Follow the workflow steps below

## Step 0: Create TodoList

**FIRST STEP:** Use the TodoWrite tool to create a todo list with the following 9 tasks:

1. **Start dev server** (if not running)
   - Success: Dev server running, can access http://localhost:3000

2. **Analyze & plan**
   - Success: Clear understanding documented + acceptance criteria defined

3. **Design content model**
   - Success: Content structure documented and validated

4. **Identify/create test content**
   - Success: Test content accessible covering all scenarios

5. **Implement**
   - Success: Functionality works across all viewports

6. **Lint & test**
   - Success: All checks pass

7. **Write Playwright block tests**
   - Success: Tests written, passing, and staged for commit

8. **Final validation**
   - Success: All acceptance criteria met, everything works

9. **Ship it**
   - Success: PR created with preview link for validation

**Mark todo complete when:** Todo list created with all 8 tasks

---

## Step 1: Start Dev Server

**Check if dev server is running:**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `200` (server running) or connection error (server not running)

**If not running, start it:**

```bash
aem up --no-open --forward-browser-logs
```

**Notes:**
- Run in background if possible (dev server needs to stay running)
- Requires AEM CLI installed globally: `npm install -g @adobe/aem-cli`
- Alternative: `npx -y @adobe/aem-cli up --no-open --forward-browser-logs`

**IMPORTANT:** Check the command output for errors. Common issues:
- Port 3000 already in use
- AEM CLI not installed
- Configuration errors

**After starting, verify it's running:**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `200`

**Success criteria:**
- ✅ Dev server running
- ✅ http://localhost:3000 returns 200
- ✅ No errors in server startup output

**Mark todo complete when:** Dev server confirmed running and accessible

---

## Step 2: Analyze & Plan

**Invoke:** analyze-and-plan skill

**Provide:**
- Task description from user
- Screenshots, design files, or existing URLs to match design from (if available)

**The analyze-and-plan skill will:**
- Guide you through task-specific analysis
- Help define acceptance criteria
- Optionally analyze visual designs/mockups if provided
- Create documented analysis for reference

**Success criteria:**
- ✅ Requirements analyzed
- ✅ Acceptance criteria defined
- ✅ Analysis documented to file for later steps

**Mark todo complete when:** Analysis documented and acceptance criteria defined

---

## Step 3: Design Content Model

**Skip if:** CSS-only changes that don't affect content structure

**Invoke:** content-modeling skill

**Provide:**
- Analysis from Step 2 (content requirements, author inputs)
- Block name and purpose

**The content-modeling skill will:**
- Design table structure (rows, columns, semantic formatting)
- Validate against best practices (4 cells/row, semantic formatting)
- Document content model for authors

**Success criteria:**
- ✅ Content model designed (table structure defined)
- ✅ Validated against best practices
- ✅ Content model documented

**Mark todo complete when:** Content model designed and documented

---

## Step 4: Identify/Create Test Content

**Goal:** End this step with accessible test content URL(s) covering all test scenarios

**Choose the best path based on your situation:**

---

### Option A: User Provided Test URL(s)

**When to use:** User already has content and provided URL(s)

**What to do:**
1. Validate URL loads: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/path`
2. Expected: `200` status
3. Document URL(s)
4. Mark complete

---

### Option B: New Block (No Existing Content)

**When to use:** Building a brand new block that doesn't exist yet

**Default assumption:** The block test content IS the block library page. It lives at `docs/library/blocks/{block-name}` in DA. Only deviate from this if the user explicitly says otherwise.

**What to do:**

1. Clone docs content locally:
   ```bash
   aem content clone --path /docs --force
   ```
   `aem content clone/push` handle IMS login themselves (opening a browser when needed, caching the token at `.hlx/.da-token.json`) — don't fetch a token yourself first. See **da-auth** only if you need to call `admin.da.live` directly, outside the `aem` CLI.

2. Write block content HTML to `content/docs/library/blocks/{block-name}.html`
   - Use the DA content format documented in [references/html-structure.md](references/html-structure.md) — **not** the drafts `.plain.html` format
   - Include one section per variant (default + all variants from content model)
   - Use publicly accessible image URLs (Unsplash: `https://images.unsplash.com/photo-{id}?w=2000`) — not `content.da.live` URLs
   - Write any authoring syntax (icons, section-metadata, page metadata) the way a human author would enter it — see the callout in [references/html-structure.md](references/html-structure.md#da-content-format-for-aem-content-clonepush). Hand-written expanded markup for these gets silently stripped when it's pushed.

3. Add a row to `content/docs/library/blocks.json`:
   ```json
   { "name": "Block Name", "path": "/docs/library/blocks/{block-name}" }
   ```

4. Stage, commit, and push:
   ```bash
   aem content add content/docs/library/blocks/{block-name}.html
   aem content add content/docs/library/blocks.json
   aem content commit -m "add {block-name} block library page"
   aem content push
   ```

5. Verify content is accessible locally:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/docs/library/blocks/{block-name}
   ```
   Expected: `200`

6. If the content uses anything beyond plain rich text (icons, section-metadata, page metadata), verify what actually landed rather than trusting the push output alone — `aem content push` can report success even when DA silently stripped something it didn't recognize:
   - Temporarily move or remove the local file from `content/` (small, reversible — not a broad deletion).
   - Re-request the path at `localhost:3000/{path}` (or `.plain.html`). With no local override, `aem up` falls through to the real, pipeline-processed content from da.live, so you see exactly what preview/live would show.
   - This only works if the page has been **previewed before** at least once. If it hasn't, this won't show anything useful yet — ask the user to preview it (e.g. via Sidekick) rather than triggering a preview yourself through the admin API.
   - Restore the local file afterward if you still need it for local iteration.

---

**Success criteria:**
- ✅ Block content HTML written and pushed to DA
- ✅ Block library index updated (`blocks.json`)
- ✅ URL returns 200 at localhost
- ✅ Anything beyond plain rich text verified against the real pipeline output (or flagged if it couldn't be verified)

**Mark todo complete when:** Content pushed to DA, accessible at localhost, and verified if it uses non-trivial authoring syntax

---

### Option C: Existing Block

**When to use:** Modifying, fixing, or styling an existing block

**What to do:**

**First: Search for existing content**
1. Invoke find-test-content skill
2. Provide: block name, dev server URL (optional, defaults to localhost:3000)

**What find-test-content will do:**
- Search for existing content pages containing the block
- Automatically detect and report all variants found
- Report: URLs with instance counts and variant info

**Then: Assess search results**

**If sufficient content found:**
1. Document URL(s)
2. Validate URLs load: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/path`
3. Expected: `200` status
4. Mark complete

**If no content found OR insufficient coverage:**
1. Create additional test content using approaches from Option B
2. Validate URLs load
3. Mark complete

---

**Success criteria:**
- ✅ Test content accessible at known URL(s)
- ✅ Content covers all test scenarios (variants, edge cases)
- ✅ URLs validated (return 200)

**Mark todo complete when:** Test content identified/created and validated

---

## Step 5: Implement

**Invoke:** building-blocks skill

**Provide:**
- Content model from Step 3 (if applicable)
- Test content URL(s) from Step 4
- Analysis/requirements from Step 2
- Type of changes: new block, existing block modification, CSS-only, etc.

**The building-blocks skill will:**
- Guide implementation approach based on change type
- Handle JavaScript decoration (if needed)
- Handle CSS styling (mobile-first, responsive)
- Ensure iterative testing in browser throughout development

**Success criteria:**
- ✅ Code implementation complete
- ✅ Functionality works across all viewports (mobile, tablet, desktop)
- ✅ No console errors

**Mark todo complete when:** building-blocks skill reports implementation complete and working across viewports

---

## Step 6: Lint & Test

**What to do:**

```bash
npm run lint
```

**If lint errors:**
1. Fix issues (use `npm run lint:fix` for auto-fixable problems)
2. Re-run lint until clean

**Run existing tests:**
```bash
npm test
```

**Note:** Unit tests are optional and only needed for logic-heavy utilities. The testing-blocks skill (invoked by building-blocks in Step 5) handles browser testing. This step catches any remaining lint issues and runs the project's test suite.

**Success criteria:**
- ✅ `npm run lint` passes with no errors
- ✅ `npm test` passes (if tests exist)

**Mark todo complete when:** All lint and test checks pass

---

## Step 7: Write Playwright Block Tests

**When to run:** Always for new blocks. For existing blocks, run when behavior changes.

**Prerequisite:** `aem up` must be running and `content/` must be cloned (both true if you followed Steps 1 and 4).

**Setup — if `playwright.config.js` doesn't exist:**

```js
// playwright.config.js
export default {
  use: { baseURL: 'http://localhost:3000' },
  testDir: 'tests',
};
```

Install Playwright if not already a dev dependency:
```bash
npm install --save-dev @playwright/test
npx playwright install --with-deps chromium
```

**Write the test file at `tests/blocks/{block-name}.spec.js`.**

Test each variant present in the block library page. Use ARIA roles and accessibility tree — not CSS selectors or DOM structure.

**Pattern:**
```js
import { test, expect } from '@playwright/test';

test.describe('{block-name} block', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/library/blocks/{block-name}');
    await page.waitForSelector('.{block-name}');
  });

  test('renders with expected heading and image', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('img').first()).toBeVisible();
    await expect(page.getByRole('img').first()).toHaveAttribute('alt', /.+/);
  });

  test('dark variant applies correct accessible label', async ({ page }) => {
    // Assert on roles, labels, visibility — not on class names or child div counts
  });
});
```

**What to assert:**
- ✅ Key content elements are visible (headings, images, links)
- ✅ Images have non-empty alt text
- ✅ Interactive elements are reachable by role (buttons, links)
- ✅ Keyboard navigation works if applicable (`page.keyboard.press('Tab')`)
- ✅ Each variant renders its distinguishing content

**What NOT to assert:**
- ❌ Specific number of child `<div>`s
- ❌ Internal CSS class names that could change during refactor
- ❌ Exact pixel dimensions or layout positions
- ❌ DOM structure 1:1

**Run the tests:**
```bash
npx playwright test tests/blocks/{block-name}.spec.js
```

All tests must pass before proceeding to Step 8.

**Success criteria:**
- ✅ `tests/blocks/{block-name}.spec.js` written and committed
- ✅ All Playwright tests pass
- ✅ Each variant tested

**Mark todo complete when:** Tests written, passing, and staged for commit

---

## Step 8: Final Validation

**What to do:**

1. **Review acceptance criteria from Step 2**
   - Read the analysis document created in Step 2
   - Check each acceptance criterion is met

2. **Final browser sanity check**
   - Load test content URL(s) in browser
   - Check mobile, tablet, and desktop viewports
   - Verify no console errors
   - Confirm no visual regressions

3. **Verify no regressions**
   - If modifying existing block: test existing variants still work
   - If modifying core functionality: spot-check a few pages

**Success criteria:**
- ✅ All acceptance criteria from Step 2 met
- ✅ Works across all viewports
- ✅ No console errors
- ✅ No regressions on existing functionality

**Mark todo complete when:** All acceptance criteria verified and no regressions found

---

## Step 9: Ship It

**What to do:**

1. **Create feature branch (if not already on one):**
   ```bash
   git checkout -b block-name
   ```

2. **Stage specific files only:**
   ```bash
   git add blocks/{block-name}/{block-name}.js blocks/{block-name}/{block-name}.css
   # Add only files you worked on - NEVER use `git add .`
   ```

3. **Commit with conventional commit format:**
   ```bash
   git commit -m "feat(block-name): add new block"
   ```
   Include relevant details in commit message and agent attribution in footer (agent adds `Co-authored-by: cursor <noreply@cursor.com>`)

4. **Push to feature branch:**
   ```bash
   git push origin HEAD
   ```

5. **Create a draft PR:**
   ```bash
   gh pr create --draft
   ```
   - Always use `--draft` — default per project conventions
   - **REQUIRED:** Include preview link in PR description (used for automated PSI checks)
   - Branch preview URL format: `https://{branch}--{repo}--{owner}.aem.page/{path}`

**PR Description Template:**

Use this template for all PRs, including all relevant preview links and adapting as needed:

```markdown
## Description
Brief description of changes

[If an issue exists]
Fix #<gh-issue-id>

Test URLs:

The block library page is the PSI validation URL for this PR.

- Before: https://main--{repo}--{owner}.aem.page/docs/library/blocks/{block-name}
- After: https://{branch}--{repo}--{owner}.aem.page/docs/library/blocks/{block-name}

[Add additional URLs for other affected pages if applicable]
```

**Success criteria:**
- ✅ Changes committed with proper message format and attribution
- ✅ Pushed to feature branch (not main)
- ✅ PR created with preview link in description

**Mark todo complete when:** PR created and ready for review

---

## Related Skills

- **analyze-and-plan**: Invoked in Step 2 for requirements analysis and acceptance criteria
- **content-modeling**: Invoked in Step 3 for designing content models
- **da-auth**: Not needed for `aem content clone`/`push` — those authenticate themselves. Only invoke da-auth if a step needs to call `admin.da.live` directly.
- **find-test-content**: Invoked in Step 4, Option C for finding existing content
- **building-blocks**: Invoked in Step 5 for implementation
- **testing-blocks**: Invoked by building-blocks for browser testing
- **block-collection-and-party**: Used to find similar blocks and reference implementations

## Anti-Patterns to Avoid

Common mistakes that violate CDD principles:
- ❌ Starting with code before understanding the content model
- ❌ Making assumptions about content structure without seeing real examples
- ❌ Creating developer-friendly but author-hostile content models
- ❌ Skipping content creation "to save time" (costs more time later)

## Resources

- **Philosophy:** [references/cdd-philosophy.md](references/cdd-philosophy.md) - Why content-first matters
- **HTML Structure:** [references/html-structure.md](references/html-structure.md) - Guide for creating local HTML test files
