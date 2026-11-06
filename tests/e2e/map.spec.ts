import { expect, test } from '@playwright/test';
import { countAnimationFrames, framesSoFar, waitForMap, waitUntilIdle } from './helpers';

test.describe('galaxy map', () => {
  test.beforeEach(async ({ page }) => {
    await countAnimationFrames(page);
  });

  test('starts and labels the canvas in each language', async ({ page }) => {
    await page.goto('/tr/');
    const canvas = page.locator('canvas[data-galaxy-map]');
    await waitForMap(page);
    await expect(canvas).toHaveAttribute('aria-label', /interaktif 3B harita/);

    await page.goto('/en/');
    await waitForMap(page);
    await expect(canvas).toHaveAttribute('aria-label', /Interactive 3D map/);
  });

  test('renders something other than the background', async ({ page }) => {
    await page.goto('/en/');
    const canvas = page.locator('canvas[data-galaxy-map]');
    await waitForMap(page);
    await waitUntilIdle(page);

    const screenshot = await canvas.screenshot();
    const brightCenter = await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const scratch = document.createElement('canvas');
      scratch.width = image.width;
      scratch.height = image.height;
      const context = scratch.getContext('2d');
      if (!context) throw new Error('no 2d context');
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(image.width / 2 - 2, image.height / 2 - 2, 4, 4);
      return Math.max(data[0] ?? 0, data[1] ?? 0, data[2] ?? 0);
    }, screenshot.toString('base64'));
    expect(brightCenter).toBeGreaterThan(100);
  });

  test('renders no frames while idle', async ({ page }) => {
    await page.goto('/en/');
    await waitForMap(page);
    await waitUntilIdle(page);

    const before = await framesSoFar(page);
    await page.waitForTimeout(2000);
    expect(await framesSoFar(page)).toBe(before);
  });

  test('renders while dragged, then returns to idle', async ({ page }) => {
    await page.goto('/en/');
    const canvas = page.locator('canvas[data-galaxy-map]');
    await waitForMap(page);
    await waitUntilIdle(page);

    const before = await framesSoFar(page);
    const box = await canvas.boundingBox();
    if (!box) throw new Error('canvas has no size');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 40, { steps: 8 });
    await page.mouse.up();

    await expect.poll(() => framesSoFar(page)).toBeGreaterThan(before);
    await waitUntilIdle(page);
  });

  test('renders no frames when the pointer moves over empty space', async ({ page }) => {
    await page.goto('/en/');
    const canvas = page.locator('canvas[data-galaxy-map]');
    await waitForMap(page);
    await waitUntilIdle(page);

    const box = await canvas.boundingBox();
    if (!box) throw new Error('canvas has no size');
    const before = await framesSoFar(page);
    // The corner of the view holds no world.
    await page.mouse.move(box.x + 5, box.y + 5);
    await page.mouse.move(box.x + 25, box.y + 15, { steps: 5 });
    await page.waitForTimeout(300);
    expect(await framesSoFar(page)).toBe(before);
  });

  test('shows a message when WebGL is unavailable', async ({ page }) => {
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
    await page.goto('/tr/');
    await expect(page.locator('[data-map-fallback]')).toContainText('WebGL');
    await expect(page.locator('canvas[data-galaxy-map]')).toBeHidden();
  });
});
