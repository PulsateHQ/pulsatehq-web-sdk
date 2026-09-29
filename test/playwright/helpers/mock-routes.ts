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

  // Intercept the CSS that DOM.attachStylesheet() loads from the API URL.
  // apiUrl.ts defaults to https://web.pulsatehq.com, so without this the harness
  // pulls the live production stylesheet and appends it after the local
  // <link href="../../dist/web-sdk.css">, silently overriding every style change
  // under test. Anything but the local dist build is served empty.
  await page.route(/\/web-sdk\.css(\?.*)?$/, (route) => {
    if (route.request().url().includes('/dist/web-sdk.css')) {
      return route.continue();
    }
    return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
  });
}
