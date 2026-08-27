import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mockCommonRoutes } from './helpers/mock-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionResponse = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/inapp-small-notification.json'), 'utf-8')
);

// PUL-2051: Small in-apps are not supported on Web SDK; the dispatcher
// short-circuits before any rendering or stats emission happens. These specs
// lock in that block at both the session-start path and the public
// getInappNotification API.

test.describe('InApp Small - Blocked on Web SDK (PUL-2051)', () => {
  test('does not render any modal when session returns a small in-app', async ({ page }) => {
    await mockCommonRoutes(page, sessionResponse);
    await page.goto('/test/visual/inapp-small.html');

    // Wait long enough for branding fetch + showInapp() to settle.
    // mockCommonRoutes resolves /api/v1/branding immediately, so a short wait
    // for network idle is sufficient.
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.pws-modal')).toHaveCount(0);
    await expect(page.locator('.pws-preview')).toHaveCount(0);
  });

  test('does not emit in_app_delivery or in_app_impression stats for a blocked small in-app', async ({ page }) => {
    const statsKeys: string[] = [];

    await mockCommonRoutes(page, sessionResponse);

    // Register the stats spy AFTER mockCommonRoutes so it takes precedence —
    // Playwright resolves route handlers LIFO, so the last-registered matcher
    // for a URL wins.
    await page.route('**/api/v1/statistics', async (route) => {
      try {
        const body = route.request().postDataJSON();
        if (body && typeof body.key === 'string') {
          statsKeys.push(body.key);
        }
      } catch {
        // ignore — test only cares about well-formed payloads
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/test/visual/inapp-small.html');
    await page.waitForLoadState('networkidle');

    expect(statsKeys).not.toContain('in_app_delivery');
    expect(statsKeys).not.toContain('in_app_impression');
  });

  test('getInappNotification invokes callback with null for a small in-app', async ({ page }) => {
    await mockCommonRoutes(page, sessionResponse);
    await page.goto('/test/visual/inapp-small.html');
    await page.waitForLoadState('networkidle');

    // The harness calls PulsateSDK.getInappNotification(...) before the SDK
    // bundle loads, so the call is queued and replayed after session start.
    await page.waitForFunction(
      () =>
        (window as unknown as { __pwsInappCallbackResult?: unknown })
          .__pwsInappCallbackResult !== undefined
    );

    const result = await page.evaluate(
      () =>
        (window as unknown as { __pwsInappCallbackResult?: unknown })
          .__pwsInappCallbackResult
    );
    expect(result).toBeNull();
  });
});
