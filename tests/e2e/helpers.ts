import { expect, type Page } from '@playwright/test';

/**
 * Counts every requestAnimationFrame call on the page. That covers all rendering, with no
 * test hook inside the map code. Call before navigating.
 */
export async function countAnimationFrames(page: Page) {
  await page.addInitScript(() => {
    const original = window.requestAnimationFrame.bind(window);
    const counter = { count: 0 };
    Object.assign(window, { __frames: counter });
    window.requestAnimationFrame = (callback) => {
      counter.count += 1;
      return original(callback);
    };
  });
}

export function framesSoFar(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __frames: { count: number } }).__frames.count);
}

/** Resolves once no animation frame has been requested for a full second. */
export async function waitUntilIdle(page: Page) {
  await expect
    .poll(
      async () => {
        const before = await framesSoFar(page);
        await page.waitForTimeout(1000);
        return (await framesSoFar(page)) - before;
      },
      { timeout: 20_000, intervals: [0] },
    )
    .toBe(0);
}

export async function waitForMap(page: Page) {
  await expect(page.locator('canvas[data-galaxy-map]')).toHaveAttribute('data-state', 'ready');
}

/** On phones the list sits behind a button. */
export async function openWorldList(page: Page) {
  const toggle = page.locator('[data-sidebar-toggle]');
  if (await toggle.isVisible()) await toggle.click();
}

export async function chooseWorld(page: Page, slug: string) {
  await openWorldList(page);
  await page.locator(`[data-world-link="${slug}"]`).click();
}
