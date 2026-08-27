import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mockCommonRoutes } from './helpers/mock-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const feedResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/feed-notifications.json'), 'utf-8')
);

const feedUrlResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/feed-url-button.json'), 'utf-8')
);

const feedDeeplinkResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/feed-deeplink-button.json'), 'utf-8')
);

const feedSinglePostResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/feed-single-post.json'), 'utf-8')
);

const feedRichMediaResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/feed-rich-media.json'), 'utf-8')
);

const feedImageOnlyResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/feed-image-only.json'), 'utf-8')
);

const feedTextOnlyResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/feed-text-only.json'), 'utf-8')
);

const feedHeadlineOnlyResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/feed-headline-only.json'), 'utf-8')
);

const feedTableBackResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/feed-table-back.json'), 'utf-8')
);

const feedBrandedResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/feed-branded.json'), 'utf-8')
);

const emptyFeedResponse = {
  categories: [],
  total_unread: 0,
  inbox_items: [],
};

// Freeze the clock for ALL feed tests so "X days ago" timestamps are deterministic.
// Fixtures use last_interaction_at: 1735689600 (2025-01-01). Freezing to 2026-02-26T12:00:00Z
// produces "421 days ago" / "422 days ago" consistently, preventing baseline drift.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-02-26T12:00:00.000Z'));
});

test.describe('Feed Cards - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);

    await page.route('**/api/v1/notification/feed**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedResponse),
      })
    );

    await page.goto('/test/visual/feed.html');
    await page.waitForSelector('.pws-feedpost', { state: 'visible' });
  });

  test('default state - feed grid with cards', async ({ page }) => {
    await expect(page).toHaveScreenshot('feed-grid-default.png');
  });

  test('hover state - card highlighted', async ({ page }) => {
    await page.locator('.pws-feedpost').first().hover();
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot('feed-card-hover.png');
  });

  test('card back - detail view after clicking View Details', async ({ page }) => {
    await page.locator('.pws-event[data-destination="card_back"]').first().click();
    await page.waitForSelector('.pws-feed-back', { state: 'visible' });
    await expect(page).toHaveScreenshot('feed-card-back.png');
  });
});

test.describe('Feed Empty State - Visual', () => {
  test('empty feed shows placeholder', async ({ page }) => {
    await mockCommonRoutes(page);

    await page.route('**/api/v1/notification/feed**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyFeedResponse),
      })
    );

    await page.goto('/test/visual/feed.html');
    await page.waitForSelector('.pws-empty-feed', { state: 'visible' });
    await expect(page).toHaveScreenshot('feed-empty-state.png');
  });
});

test.describe('Delete Modal - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);

    await page.route('**/api/v1/notification/feed**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedResponse),
      })
    );

    await page.goto('/test/visual/feed.html');
    await page.waitForSelector('.pws-feedpost', { state: 'visible' });
  });

  test('confirmation dialog - delete modal shown', async ({ page }) => {
    await page.locator('.pws-delete').first().click();
    await page.waitForSelector('.pws-delete-modal', { state: 'visible' });
    await expect(page).toHaveScreenshot('feed-delete-confirm.png');
  });

  test('dismissed - delete modal closed after cancel', async ({ page }) => {
    await page.locator('.pws-delete').first().click();
    await page.waitForSelector('.pws-delete-modal', { state: 'visible' });
    await page.locator('.pws-delete-cancel').first().click();
    await page.waitForSelector('.pws-delete-modal', { state: 'detached' });
    await expect(page).toHaveScreenshot('feed-delete-dismissed.png');
  });
});

test.describe('Feed URL Button - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);

    await page.route('**/api/v1/notification/feed**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedUrlResponse),
      })
    );

    await page.goto('/test/visual/feed.html');
    await page.waitForSelector('.pws-feedpost', { state: 'visible' });
  });

  test('feed card with URL button rendered', async ({ page }) => {
    await expect(page).toHaveScreenshot('feed-url-button.png');
  });

  test('URL button has correct href', async ({ page }) => {
    const urlButton = page.locator('.pws-event[data-destination="url"]');
    await expect(urlButton).toHaveAttribute('href', 'https://example.com/promo');
  });
});

test.describe('Feed Deeplink Button - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);

    await page.route('**/api/v1/notification/feed**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedDeeplinkResponse),
      })
    );

    await page.goto('/test/visual/feed.html');
    await page.waitForSelector('.pws-feedpost', { state: 'visible' });
  });

  test('feed card with deeplink button rendered', async ({ page }) => {
    await expect(page).toHaveScreenshot('feed-deeplink-button.png');
  });
});

test.describe('Feed Single Post - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);

    await page.route('**/api/v1/notification/feed**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedSinglePostResponse),
      })
    );

    await page.goto('/test/visual/feed.html');
    await page.waitForSelector('.pws-feedpost', { state: 'visible' });
  });

  test('single feed post layout', async ({ page }) => {
    await expect(page).toHaveScreenshot('feed-single-post.png');
  });

  test('single post card back navigation', async ({ page }) => {
    await page.locator('.pws-event[data-destination="card_back"]').click();
    await page.waitForSelector('.pws-feed-back', { state: 'visible' });
    await expect(page).toHaveScreenshot('feed-single-post-back.png');
  });
});

test.describe('Feed Rich Media - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);

    await page.route('**/api/v1/notification/feed**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedRichMediaResponse),
      })
    );

    await page.goto('/test/visual/feed.html');
    await page.waitForSelector('.pws-feedpost', { state: 'visible' });
  });

  test('feed card with rich media (GIF) rendered', async ({ page }) => {
    await expect(page).toHaveScreenshot('feed-rich-media.png');
  });

  test('rich media card back navigation', async ({ page }) => {
    await page.locator('.pws-event[data-destination="card_back"]').click();
    await page.waitForSelector('.pws-feed-back', { state: 'visible' });
    await expect(page).toHaveScreenshot('feed-rich-media-back.png');
  });
});

test.describe('Feed Image Only - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);

    await page.route('**/api/v1/notification/feed**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedImageOnlyResponse),
      })
    );

    await page.goto('/test/visual/feed.html');
    await page.waitForSelector('.pws-feedpost', { state: 'visible' });
  });

  test('image-only feed card - no headline or text', async ({ page }) => {
    await expect(page).toHaveScreenshot('feed-image-only.png');
  });
});

test.describe('Feed Text Only - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);

    await page.route('**/api/v1/notification/feed**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedTextOnlyResponse),
      })
    );

    await page.goto('/test/visual/feed.html');
    await page.waitForSelector('.pws-feedpost', { state: 'visible' });
  });

  test('text-only feed card - no image', async ({ page }) => {
    await expect(page).toHaveScreenshot('feed-text-only.png');
  });
});

test.describe('Feed Headline Only - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);

    await page.route('**/api/v1/notification/feed**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedHeadlineOnlyResponse),
      })
    );

    await page.goto('/test/visual/feed.html');
    await page.waitForSelector('.pws-feedpost', { state: 'visible' });
  });

  test('headline-only feed card - minimal card', async ({ page }) => {
    await expect(page).toHaveScreenshot('feed-headline-only.png');
  });
});

test.describe('Feed Table Back - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);

    await page.route('**/api/v1/notification/feed**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedTableBackResponse),
      })
    );

    await page.goto('/test/visual/feed.html');
    await page.waitForSelector('.pws-feedpost', { state: 'visible' });
  });

  test('table card back - heading and table rows', async ({ page }) => {
    await page.locator('.pws-event[data-destination="card_back"]').click();
    await page.waitForSelector('.pws-feed-back', { state: 'visible' });
    await expect(page).toHaveScreenshot('feed-table-back.png');
  });

  test('table has correct number of rows', async ({ page }) => {
    await page.locator('.pws-event[data-destination="card_back"]').click();
    await page.waitForSelector('.pws-feed-back', { state: 'visible' });
    const rows = page.locator('.pws-table-row');
    await expect(rows).toHaveCount(3);
  });
});

test.describe('Feed Branded Button - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);

    await page.route('**/api/v1/notification/feed**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedBrandedResponse),
      })
    );

    await page.goto('/test/visual/feed.html');
    await page.waitForSelector('.pws-feedpost', { state: 'visible' });
  });

  test('feed card with branded orange dismiss button', async ({ page }) => {
    await expect(page).toHaveScreenshot('feed-branded-button.png');
  });
});

test.describe('Feed Cards - Narrow Viewport (below 750px breakpoint)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 720, height: 800 });
    await mockCommonRoutes(page);

    await page.route('**/api/v1/notification/feed**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedResponse),
      })
    );

    await page.goto('/test/visual/feed.html');
    await page.waitForSelector('.pws-feedpost', { state: 'visible' });
  });

  test('narrow viewport - full width cards stacked', async ({ page }) => {
    await expect(page).toHaveScreenshot('feed-narrow-grid.png');
  });

  test('narrow viewport card back - detail view', async ({ page }) => {
    await page.locator('.pws-event[data-destination="card_back"]').first().click();
    await page.waitForSelector('.pws-feed-back', { state: 'visible' });
    await expect(page).toHaveScreenshot('feed-narrow-card-back.png');
  });
});
