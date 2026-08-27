import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mockCommonRoutes } from './helpers/mock-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/inapp-large-notification.json'), 'utf-8')
);

const imageOnlyResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/inapp-large-image-only.json'), 'utf-8')
);

const textOnlyResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/inapp-large-text-only.json'), 'utf-8')
);

const headlineOnlyResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/inapp-large-headline-only.json'), 'utf-8')
);

const reorderedResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/inapp-large-reordered.json'), 'utf-8')
);

const brandedResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/inapp-large-branded.json'), 'utf-8')
);

const emptyColorsResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/inapp-large-empty-colors.json'), 'utf-8')
);

const brandedPrimaryResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/inapp-large-branded-primary.json'), 'utf-8')
);

const brandedSecondaryResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/inapp-large-branded-secondary.json'), 'utf-8')
);

test.describe('InApp Large Modal - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page, sessionResponse);

    await page.goto('/test/visual/inapp-large.html');
    await page.waitForSelector('.pws-modal', { state: 'visible' });
  });

  test('default state - modal fully rendered', async ({ page }) => {
    await expect(page).toHaveScreenshot('inapp-large-default.png');
  });

  test('dismissed state - modal closed after clicking X', async ({ page }) => {
    await page.locator('.pws-close').click();
    await page.waitForSelector('.pws-modal', { state: 'detached' });
    await expect(page).toHaveScreenshot('inapp-large-dismissed.png');
  });
});

test.describe('InApp Large Modal - Narrow Viewport (below 750px breakpoint)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 720, height: 800 });
    await mockCommonRoutes(page, sessionResponse);
    await page.goto('/test/visual/inapp-large.html');
    await page.waitForSelector('.pws-modal', { state: 'visible' });
  });

  test('narrow viewport - vertical stack (image top, text below)', async ({ page }) => {
    await expect(page).toHaveScreenshot('inapp-large-narrow-default.png');
  });

  test('narrow viewport dismissed - modal closed', async ({ page }) => {
    await page.locator('.pws-close').click();
    await page.waitForSelector('.pws-modal', { state: 'detached' });
    await expect(page).toHaveScreenshot('inapp-large-narrow-dismissed.png');
  });
});

// Regression: .pws-cta-item declared `width: 100%` alongside horizontal padding
// without `box-sizing: border-box`, so under the host page's default content-box
// the button's used width was 100% + padding + border. It bled past the card's
// right edge, covering the bottom rounded corners, and made .pws-preview
// horizontally scrollable (its `overflow-y: auto` forces overflow-x to `auto`),
// which let users pan the modal content out of view.
test.describe('InApp Large Modal - CTA containment on mobile widths', () => {
  for (const width of [360, 393]) {
    test(`CTA button stays inside the card at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await mockCommonRoutes(page, sessionResponse);
      await page.goto('/test/visual/inapp-large.html');
      await page.waitForSelector('.pws-modal', { state: 'visible' });

      const card = await page.locator('.pws-card').boundingBox();
      const cta = await page.locator('.pws-cta-item').first().boundingBox();

      expect(cta!.x).toBeGreaterThanOrEqual(card!.x);
      expect(cta!.x + cta!.width).toBeLessThanOrEqual(card!.x + card!.width);
    });

    test(`modal does not scroll horizontally at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await mockCommonRoutes(page, sessionResponse);
      await page.goto('/test/visual/inapp-large.html');
      await page.waitForSelector('.pws-modal', { state: 'visible' });

      const overflow = await page
        .locator('.pws-preview')
        .evaluate((el) => el.scrollWidth - el.clientWidth);

      expect(overflow).toBe(0);
    });
  }
});

test.describe('InApp Large Modal - Image Only (no headline/text)', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page, imageOnlyResponse);
    await page.goto('/test/visual/inapp-large.html');
    await page.waitForSelector('.pws-modal', { state: 'visible' });
  });

  test('image-only campaign - image fills modal', async ({ page }) => {
    await expect(page).toHaveScreenshot('inapp-large-image-only.png');
  });
});

test.describe('InApp Large Modal - Text Only (no image)', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page, textOnlyResponse);
    await page.goto('/test/visual/inapp-large.html');
    await page.waitForSelector('.pws-modal', { state: 'visible' });
  });

  test('text-only campaign - no image, full-width text', async ({ page }) => {
    await expect(page).toHaveScreenshot('inapp-large-text-only.png');
  });
});

test.describe('InApp Large Modal - Headline Only (minimal)', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page, headlineOnlyResponse);
    await page.goto('/test/visual/inapp-large.html');
    await page.waitForSelector('.pws-modal', { state: 'visible' });
  });

  test('headline-only campaign - minimal content', async ({ page }) => {
    await expect(page).toHaveScreenshot('inapp-large-headline-only.png');
  });
});

test.describe('InApp Large Modal - Reordered Elements', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page, reorderedResponse);
    await page.goto('/test/visual/inapp-large.html');
    await page.waitForSelector('.pws-modal', { state: 'visible' });
  });

  test('reordered elements - text above headline', async ({ page }) => {
    await expect(page).toHaveScreenshot('inapp-large-reordered.png');
  });
});

test.describe('InApp Large Modal - Branded Button Colors', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page, brandedResponse);
    await page.goto('/test/visual/inapp-large.html');
    await page.waitForSelector('.pws-modal', { state: 'visible' });
  });

  test('both buttons with custom branding colors', async ({ page }) => {
    await expect(page).toHaveScreenshot('inapp-large-branded-buttons.png');
  });
});

test.describe('InApp Large Modal - Empty Color Fallback', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page, emptyColorsResponse);
    await page.goto('/test/visual/inapp-large.html');
    await page.waitForSelector('.pws-modal', { state: 'visible' });
  });

  test('empty btn_color/txt_color - CSS class defaults apply', async ({ page }) => {
    await expect(page).toHaveScreenshot('inapp-large-empty-colors.png');
  });
});

test.describe('InApp Large Modal - Branded Primary Only', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page, brandedPrimaryResponse);
    await page.goto('/test/visual/inapp-large.html');
    await page.waitForSelector('.pws-modal', { state: 'visible' });
  });

  test('single branded primary button - pink', async ({ page }) => {
    await expect(page).toHaveScreenshot('inapp-large-branded-primary-only.png');
  });
});

test.describe('InApp Large Modal - Branded Secondary Only', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page, brandedSecondaryResponse);
    await page.goto('/test/visual/inapp-large.html');
    await page.waitForSelector('.pws-modal', { state: 'visible' });
  });

  test('single branded secondary button - green', async ({ page }) => {
    await expect(page).toHaveScreenshot('inapp-large-branded-secondary-only.png');
  });
});

test.describe('InApp Large Modal - Button Assertions', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page, sessionResponse);
    await page.goto('/test/visual/inapp-large.html');
    await page.waitForSelector('.pws-modal', { state: 'visible' });
  });

  test('renders two CTA buttons', async ({ page }) => {
    const buttons = page.locator('.pws-cta-item');
    await expect(buttons).toHaveCount(2);
    await expect(page).toHaveScreenshot('inapp-large-two-buttons.png');
  });

  test('URL button has correct href attribute', async ({ page }) => {
    const urlButton = page.locator('.pws-cta-item[data-destination="url"]');
    await expect(urlButton).toHaveAttribute('href', 'https://example.com/primary');
  });
});
