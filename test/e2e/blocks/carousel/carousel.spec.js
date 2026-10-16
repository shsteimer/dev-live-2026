import { test, expect } from '@playwright/test';

// Requires: aem up + /docs/library/blocks/carousel.
// Nav buttons are located by position (prev, ...dots, next); labels are not asserted.

function carousel(page) {
  return page.locator('.carousel').first();
}

test.describe('carousel block', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/library/blocks/carousel');
    await page.locator('.carousel[data-block-status="loaded"]').waitFor();
  });

  test('announces itself as a carousel with labelled slides', async ({ page }) => {
    const block = carousel(page);
    await expect(block).toHaveAttribute('role', 'region');
    await expect(block).toHaveAttribute('aria-roledescription', 'carousel');
    const slides = block.locator('[aria-roledescription="slide"]');
    const count = await slides.count();
    expect(count).toBeGreaterThan(1);
    await expect(block.locator('[aria-roledescription="slide"][aria-hidden="false"]')).toHaveCount(1);
    await expect(block.locator('button[aria-current="true"]')).toHaveCount(1);
  });

  test('hidden slides are out of the tab order from first load', async ({ page }) => {
    const slides = carousel(page).locator('[aria-roledescription="slide"]');
    await expect(slides.nth(1).getByRole('link', { includeHidden: true }).first()).toHaveAttribute('tabindex', '-1');
    await expect(slides.nth(0).getByRole('link').first()).toHaveAttribute('tabindex', '0');
  });

  test('next/prev move the active slide and wrap around', async ({ page }) => {
    const block = carousel(page);
    const slides = block.locator('[aria-roledescription="slide"]');
    const count = await slides.count();
    const buttons = block.getByRole('button');
    const prev = buttons.first();
    const next = buttons.last();
    const dot = (i) => buttons.nth(i + 1);

    await next.click();
    await expect(slides.nth(1)).toHaveAttribute('aria-hidden', 'false');
    await expect(slides.nth(0)).toHaveAttribute('aria-hidden', 'true');
    await expect(slides.nth(0).getByRole('link', { includeHidden: true }).first()).toHaveAttribute('tabindex', '-1');
    await expect(dot(1)).toHaveAttribute('aria-current', 'true');

    await prev.click();
    await prev.click();
    await expect(slides.nth(count - 1)).toHaveAttribute('aria-hidden', 'false');
    await expect(dot(count - 1)).toHaveAttribute('aria-current', 'true');

    await dot(0).click();
    await expect(slides.nth(0)).toHaveAttribute('aria-hidden', 'false');
  });
});
