# Unit Testing Guide

Unit tests are keeper tests for logic-heavy code that benefits from automated regression testing. This guide covers when to write unit tests, how to structure them, and best practices for maintainable test suites.

## When to Write Unit Tests

Write unit tests for:
- **Pure functions** - Functions with no side effects that transform inputs to outputs
- **Utility libraries** - Shared helper functions used across blocks
- **Data processors** - Code that parses, transforms, or validates data
- **API integrations** - Functions that interact with external services
- **Complex algorithms** - Business logic, calculations, or conditional flows

Do NOT write unit tests for:
- Block decoration functions (test these in browser)
- DOM manipulation logic (test in browser)
- CSS styles (test in browser)
- Simple getters/setters
- Code that primarily renders UI

## Prerequisites

Tests run with Node.js built-in test runner — no install needed. `npm test` discovers `test/**/*.test.js` automatically.

**Verify test setup works:**

```bash
npm test  # Should run without errors (even with no test files)
```

**Important:** Ensure test files are not served to production by adding them to `.hlxignore`:

```
# .hlxignore
test/
tests/
```

## Writing Unit Tests

### File Location and Naming

Mirror the path/name of the code under test:
- `scripts/utils/my-utility.js` → `test/scripts/utils/my-utility.test.js`
- `blocks/hero/utils.js` → `test/blocks/hero/utils.test.js`

**Naming convention:** `{filename}.test.js`

### Test Structure

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { myUtility } from '../../scripts/utils/my-utility.js';

describe('myUtility', () => {
  it('transforms input correctly', () => {
    assert.deepEqual(myUtility({ foo: 'bar' }), { foo: 'BAR' });
  });

  it('handles edge cases', () => {
    assert.equal(myUtility(null), null);
    assert.deepEqual(myUtility({}), {});
  });
});
```

### Running Tests

```bash
npm test                                    # Run all tests
node --test test/scripts/utils/my-utility.test.js  # Run a single file
```

## What Makes a Good Unit Test

**Good unit tests are:**
- **Fast** - Run in milliseconds
- **Isolated** - Test one function/unit at a time
- **Repeatable** - Same input always produces same output
- **Self-validating** - Pass or fail clearly, no manual inspection
- **Focused** - Test one behavior per test case

## Complete Example

A real utility function and its tests from this project:

```javascript
// scripts/scripts.js
export function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    // ... buttonization logic
  });
}

// test/scripts/scripts.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../support/setup-dom.js';

setupDom(); // must run before importing the module under test — see test/support/setup-dom.js

const { decorateButtons } = await import('../../scripts/scripts.js');

describe('decorateButtons', () => {
  it('wraps a strong link as primary button', () => {
    const main = global.document.createElement('main');
    main.innerHTML = '<p><strong><a href="/page">Learn More</a></strong></p>';
    decorateButtons(main);
    assert.ok(main.querySelector('a').classList.contains('primary'));
  });
});
```

**Why `setupDom()` runs before the import:** `scripts.js` (and anything that imports it, like block files) reads `window`/`window.hlx` at module load time, not at call time — so the jsdom globals must exist before that `import` line runs, which is also why it's a dynamic `await import(...)` rather than a static import at the top of the file. `test/support/setup-dom.js` is the single shared place this bootstrap lives; don't re-inline it per test file.

**Why jsdom is acceptable here:** `decorateButtons` is a pure utility function — it takes DOM input, returns transformed DOM output, has no network calls, no block-specific rendering. The CSS class names it applies (`.primary`, `.secondary`, `.ghost`) ARE its contract. If you rename them, CSS breaks and the test should fail.

**Contrast with block transforms:** `blocks/cards/cards.js` also transforms DOM, but its correctness question is "do cards look right and are they accessible?" — only a Playwright test can answer that.

## Best Practices

1. **Test behavior, not implementation** - Focus on what the function does, not how it does it
2. **Use descriptive test names** - Test names should explain what they're testing
3. **One assertion per test** - Or multiple assertions testing the same behavior
4. **Avoid test interdependence** - Each test should be able to run independently
5. **Keep tests simple** - Tests should be easier to understand than the code they test
6. **Mock external dependencies** - API calls, file system access, etc.
7. **Test edge cases** - Null, undefined, empty strings, boundary values

## Common Patterns

### Testing async functions

```javascript
it('fetches data asynchronously', async () => {
  const result = await fetchData();
  assert.notEqual(result, undefined);
});
```

### Using beforeEach for setup

```javascript
describe('Calculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  it('adds numbers', () => {
    assert.equal(calculator.add(2, 3), 5);
  });
});
```

### Testing error conditions

```javascript
it('throws for invalid input', () => {
  assert.throws(() => validateInput('invalid'), /Invalid input/);
});
```

## Next Steps

Once you've written unit tests:
1. Run during development: `node --test test/scripts/utils/your-test.test.js`
2. Run full suite before commits: `npm test`
3. Keep tests updated as the utility's contract evolves
