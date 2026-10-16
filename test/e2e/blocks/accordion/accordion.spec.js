import { test, expect } from '@playwright/test';

// Requires: aem up + /docs/library/blocks/accordion. Native <details>/<summary>.

test.describe('accordion block', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/library/blocks/accordion');
    await page.locator('.accordion[data-block-status="loaded"]').waitFor();
  });

  test('items start collapsed and toggle by click and keyboard', async ({ page }) => {
    const block = page.locator('.accordion').first();
    const items = block.locator('details');
    expect(await items.count()).toBeGreaterThan(1);
    await expect(block.locator('details[open]')).toHaveCount(0);

    const first = items.first();
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
    await expect(items.nth(1)).not.toHaveAttribute('open', '');

    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(first).not.toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(first).toHaveAttribute('open', '');
  });
});
