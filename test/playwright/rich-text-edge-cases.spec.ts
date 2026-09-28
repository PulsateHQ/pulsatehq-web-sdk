import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mockCommonRoutes } from './helpers/mock-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const base = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/feed-text-only.json'), 'utf-8')
);

const withBack = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/feed-notifications.json'), 'utf-8')
);

function feedWith(text: string): unknown {
  const feed = JSON.parse(JSON.stringify(base));
  for (const part of feed.inbox_items[0].front) {
    if (part.type === 'text') part.attrs[0].text = text;
  }
  return feed;
}

async function renderFeed(page: Page, text: string): Promise<void> {
  await mockCommonRoutes(page);
  await page.route('**/api/v1/notification/feed**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(feedWith(text)),
    })
  );
  await page.goto('/test/visual/feed.html');
  await page.waitForSelector('.pws-feedpost', { state: 'visible' });
}

const whiteSpaceOf = (page: Page) =>
  page.locator('.pws-text').first().evaluate((el) => getComputedStyle(el).whiteSpace);

const markerOf = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => getComputedStyle(el).listStyleType);

test.describe('Rich text edge cases', () => {
  test('plain text keeps pre-wrap so author newlines survive', async ({ page }) => {
    await renderFeed(page, 'Line one\nLine two\nLine three');

    expect(await whiteSpaceOf(page)).toBe('pre-wrap');
  });

  test('plain text containing a bare < is not treated as markup', async ({ page }) => {
    await renderFeed(page, 'Rates < 5% this week\nAsk in branch for details');

    expect(
      await whiteSpaceOf(page),
      'a literal < in prose must not switch the block to white-space: normal and collapse newlines'
    ).toBe('pre-wrap');
  });

  test('escaped entities are not treated as markup', async ({ page }) => {
    await renderFeed(page, 'Use &lt;brackets&gt; carefully\nSecond line');

    expect(await whiteSpaceOf(page)).toBe('pre-wrap');
  });

  test('unordered list renders discs', async ({ page }) => {
    await renderFeed(page, '<ul><li>alpha</li><li>beta</li></ul>');

    expect(await markerOf(page, '.pws-text ul')).toBe('disc');
  });

  test('ordered list renders decimals', async ({ page }) => {
    await renderFeed(page, '<ol><li>first</li><li>second</li></ol>');

    expect(await markerOf(page, '.pws-text ol')).toBe('decimal');
  });

  test('nested list still shows markers at the inner level', async ({ page }) => {
    await renderFeed(page, '<ul><li>outer<ul><li>inner</li></ul></li></ul>');

    expect(await markerOf(page, '.pws-text ul ul')).not.toBe('none');
  });

  test('rich text switches to white-space normal', async ({ page }) => {
    await renderFeed(page, '<p>para</p><ul><li>item</li></ul>');

    expect(await whiteSpaceOf(page)).toBe('normal');
  });

  test('empty text does not break rendering', async ({ page }) => {
    await renderFeed(page, '');

    await expect(page.locator('.pws-feedpost')).toBeVisible();
  });

  test('card back list renders markers on the back surface too', async ({ page }) => {
    const feed = JSON.parse(JSON.stringify(withBack));
    for (const part of feed.inbox_items[0].back) {
      if (part.type === 'text') part.attrs[0].text = '<ul><li>back alpha</li><li>back beta</li></ul>';
    }

    await mockCommonRoutes(page);
    await page.route('**/api/v1/notification/feed**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feed),
      })
    );

    await page.goto('/test/visual/feed.html');
    await page.locator('.pws-event[data-destination="card_back"]').first().click();
    await page.waitForSelector('.pws-feed-back', { state: 'visible' });

    expect(await markerOf(page, '.pws-feed-back .pws-text ul')).toBe('disc');
  });
});
