import { test, expect } from '@playwright/test';

// Requires: aem up + /docs/library/blocks/tabs. Locates by ARIA role only.

test.describe('tabs block', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/library/blocks/tabs');
    await page.locator('.tabs[data-block-status="loaded"]').waitFor();
  });

  test('exposes a tablist with exactly one selected tab and visible panel', async ({ page }) => {
    const block = page.locator('.tabs').first();
    const tabs = block.getByRole('tablist').getByRole('tab');
    expect(await tabs.count()).toBeGreaterThan(1);
    await expect(block.getByRole('tab', { selected: true })).toHaveCount(1);
    await expect(block.getByRole('tabpanel')).toHaveCount(1);

    const selected = block.getByRole('tab', { selected: true });
    const panelId = await selected.getAttribute('aria-controls');
    await expect(block.getByRole('tabpanel')).toHaveAttribute('id', panelId);
    await expect(block.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', await selected.getAttribute('id'));
  });

  test('click and arrow keys move selection, focus, and roving tabindex', async ({ page }) => {
    const block = page.locator('.tabs').first();
    const tabs = block.getByRole('tab');
    const count = await tabs.count();

    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
    await expect(block.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', await tabs.nth(1).getAttribute('id'));

    await page.keyboard.press('ArrowRight');
    const next = tabs.nth(2 % count);
    await expect(next).toBeFocused();
    await expect(next).toHaveAttribute('aria-selected', 'true');
    await expect(next).toHaveAttribute('tabindex', '0');
    await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');

    await tabs.nth(0).click();
    await page.keyboard.press('ArrowLeft');
    await expect(tabs.nth(count - 1)).toBeFocused();
    await expect(tabs.nth(count - 1)).toHaveAttribute('aria-selected', 'true');
  });
});
