import { expect, type Page, test } from '@playwright/test';
import {
  chooseWorld,
  countAnimationFrames,
  framesSoFar,
  openWorldList,
  waitForMap,
  waitUntilIdle,
} from './helpers';

const dossier = (page: Page, slug: string) => page.locator(`[data-dossier="${slug}"]`);

async function canvasCenter(page: Page) {
  const box = await page.locator('canvas[data-galaxy-map]').boundingBox();
  if (!box) throw new Error('canvas has no size');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test.describe('world selection', () => {
  test.beforeEach(async ({ page }) => {
    await countAnimationFrames(page);
    await page.goto('/en/');
    await waitForMap(page);
  });

  test('choosing from the list opens the dossier and updates the address', async ({ page }) => {
    await chooseWorld(page, 'cadia');

    await expect(dossier(page, 'cadia')).toBeVisible();
    await expect(dossier(page, 'cadia')).toContainText('Fortress World');
    await expect(dossier(page, 'cadia')).toContainText('Destroyed');
    await expect(dossier(page, 'cadia')).toContainText('Position is an approximate fan estimate');
    await expect(dossier(page, 'terra')).toBeHidden();
    await expect(page).toHaveURL(/\?world=cadia$/);
    await expect(page.locator('[data-map-announcer]')).toHaveText('Cadia selected');
  });

  test('flies to the world, then returns to idle', async ({ page }) => {
    await waitUntilIdle(page);
    const before = await framesSoFar(page);
    await chooseWorld(page, 'macragge');
    await expect.poll(() => framesSoFar(page)).toBeGreaterThan(before + 5);
    await waitUntilIdle(page);
  });

  test('a world at the center of the view can be hovered and clicked', async ({ page }) => {
    await chooseWorld(page, 'cadia');
    await waitUntilIdle(page);
    await page.keyboard.press('Escape');
    await expect(dossier(page, 'cadia')).toBeHidden();

    // The flight left Cadia in the middle of the canvas.
    const center = await canvasCenter(page);
    await page.mouse.move(center.x + 2, center.y + 2);
    await expect(page.locator('[data-map-tooltip]')).toHaveText('Cadia');

    await page.mouse.down();
    await page.mouse.up();
    await expect(dossier(page, 'cadia')).toBeVisible();
    await expect(page).toHaveURL(/\?world=cadia$/);
  });

  test('clicking empty space clears the selection', async ({ page }) => {
    await chooseWorld(page, 'cadia');
    await waitUntilIdle(page);
    const box = await page.locator('canvas[data-galaxy-map]').boundingBox();
    if (!box) throw new Error('canvas has no size');
    await page.mouse.click(box.x + 5, box.y + 5);
    await expect(dossier(page, 'cadia')).toBeHidden();
    await expect(page).toHaveURL(/\/en\/$/);
  });

  test('a drag does not count as a click', async ({ page }) => {
    await chooseWorld(page, 'cadia');
    await waitUntilIdle(page);
    const box = await page.locator('canvas[data-galaxy-map]').boundingBox();
    if (!box) throw new Error('canvas has no size');
    await page.mouse.move(box.x + 5, box.y + 5);
    await page.mouse.down();
    await page.mouse.move(box.x + 60, box.y + 40, { steps: 4 });
    await page.mouse.up();
    await expect(dossier(page, 'cadia')).toBeVisible();
  });

  test('the close button and Escape both close the dossier', async ({ page }) => {
    await chooseWorld(page, 'mars');
    await page.locator('[data-dossier-close]').click();
    await expect(dossier(page, 'mars')).toBeHidden();
    await expect(page).toHaveURL(/\/en\/$/);

    await chooseWorld(page, 'mars');
    await page.keyboard.press('Escape');
    await expect(dossier(page, 'mars')).toBeHidden();
    await expect(page.locator('[data-map-announcer]')).toHaveText('Selection cleared');
  });

  test('back and forward follow the selection', async ({ page }) => {
    await chooseWorld(page, 'baal');
    await expect(dossier(page, 'baal')).toBeVisible();
    await page.goBack();
    await expect(dossier(page, 'baal')).toBeHidden();
    await page.goForward();
    await expect(dossier(page, 'baal')).toBeVisible();
  });

  test('search filters the list', async ({ page }) => {
    await openWorldList(page);
    const search = page.locator('[data-world-search]');
    await search.fill('CAD');
    await expect(page.locator('[data-world-link="cadia"]')).toBeVisible();
    await expect(page.locator('[data-world-link="terra"]')).toBeHidden();
    await expect(page.locator('[data-search-empty]')).toBeHidden();

    await search.fill('no such world');
    await expect(page.locator('[data-world-link="cadia"]')).toBeHidden();
    await expect(page.locator('[data-search-empty]')).toBeVisible();

    await search.fill('');
    await expect(page.locator('[data-world-link="terra"]')).toBeVisible();
  });

  test('the list works by keyboard', async ({ page }) => {
    await openWorldList(page);
    await page.locator('[data-world-link="baal"]').focus();
    await page.keyboard.press('Enter');
    await expect(dossier(page, 'baal')).toBeVisible();
  });
});

test.describe('shareable links', () => {
  test('opening a link shows that world', async ({ page }) => {
    await page.goto('/tr/?world=cadia');
    await expect(dossier(page, 'cadia')).toBeVisible();
    await expect(dossier(page, 'cadia')).toContainText('Kale Dünyası');
    await expect(dossier(page, 'cadia')).toContainText('Yok edildi');
  });

  test('an unknown world is ignored and removed from the address', async ({ page }) => {
    await page.goto('/en/?world=nowhere');
    await expect(page.locator('[data-dossier-panel]')).toBeHidden();
    await expect(page).toHaveURL(/\/en\/$/);
  });

  test('the language link keeps the selected world', async ({ page }) => {
    await page.goto('/en/');
    await waitForMap(page);
    await chooseWorld(page, 'baal');
    await page.locator('[data-lang-switch]').click();
    await expect(page).toHaveURL(/\/tr\/\?world=baal$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
    await expect(dossier(page, 'baal')).toContainText('Bölük Anavatanı');
  });
});

test.describe('dossier panel', () => {
  for (const [width, height] of [
    [375, 812],
    [812, 375],
    [800, 600],
    [1024, 768],
    [1280, 800],
  ] as const) {
    test(`leaves the selected world visible at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/en/?world=cadia');
      await waitForMap(page);

      const center = await canvasCenter(page);
      const panel = await page.locator('[data-dossier-panel]').boundingBox();
      if (!panel) throw new Error('panel has no size');
      const coversCenter =
        center.x >= panel.x &&
        center.x <= panel.x + panel.width &&
        center.y >= panel.y &&
        center.y <= panel.y + panel.height;
      expect(coversCenter).toBe(false);
    });
  }
});

test('worlds stay reachable without WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type.startsWith('webgl')) return null;
      return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto('/en/');
  await expect(page.locator('[data-map-fallback]')).toBeVisible();
  await chooseWorld(page, 'terra');
  await expect(dossier(page, 'terra')).toBeVisible();
  await expect(page).toHaveURL(/\?world=terra$/);
});
