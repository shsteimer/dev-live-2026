import { test, expect } from '@playwright/test';

// Requires: aem up + /en/nav. Nav labels are authored, so none are hardcoded.

function nav(page) {
  return page.locator('.header').getByRole('navigation');
}

test.describe('header — desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/en/');
    await page.locator('.header[data-block-status="loaded"]').waitFor();
  });

  test('dropdown toggles aria-expanded and closes on Escape', async ({ page }) => {
    const trigger = nav(page).locator('button[aria-expanded]').filter({ visible: true }).first();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const menu = trigger.locator('xpath=following-sibling::ul');
    await expect(menu.getByRole('link').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('header — mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/en/');
    await page.locator('.header[data-block-status="loaded"]').waitFor({ state: 'attached' });
  });

  test('hamburger opens and closes the menu', async ({ page }) => {
    const toggle = nav(page).getByRole('button', { name: /open navigation/i });
    await expect(nav(page)).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(nav(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(nav(page).getByRole('link').nth(1)).toBeVisible();
    await nav(page).getByRole('button', { name: /close navigation/i }).click();
    await expect(nav(page)).toHaveAttribute('aria-expanded', 'false');
  });
});
