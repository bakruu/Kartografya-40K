import { expect, test } from '@playwright/test';

test('root redirects to the Turkish site', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/tr\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
});

test('English site is served with the legal disclaimer', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('footer')).toContainText(
    'Not affiliated with or endorsed by Games Workshop',
  );
});
