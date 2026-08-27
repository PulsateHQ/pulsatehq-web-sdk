import type { Page } from '@playwright/test';

/**
 * Mock common SDK API routes shared by all visual test specs.
 * @param sessionResponse – payload returned by POST /api/v1/session/start
 *   (InApp specs pass the notification fixture; Feed specs pass `{}`)
 */
export async function mockCommonRoutes(
  page: Page,
  sessionResponse: object = {},
) {
  await page.route('**/api/v1/session/start', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sessionResponse),
    })
  );

  await page.route('**/api/v1/branding**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ enabled: false }),
    })
  );

  await page.route('**/api/v1/statistics', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  );

  await page.route('**/api/v1/session/update', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  );

  await page.route('**/api/v1/delete_notification', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  );

  await page.route('**/api/v1/middleware/deeplink', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://example.com/deeplink-resolved' }),
    })
  );

  // Intercept the CSS that DOM.attachStylesheet() loads from API URL.
  // Only intercepts the runtime fetch (contains "undefined" in path), not the
  // harness <link> that loads /dist/web-sdk.css with actual styles.
  await page.route('**/undefined/web-sdk.css', (route) => {
    route.fulfill({ status: 200, contentType: 'text/css', body: '' });
  });
}
