import { test, expect } from '@playwright/test';

const HARNESSES = ['/test/visual/feed.html', '/test/visual/inapp-large.html'];

for (const harness of HARNESSES) {
  test(`${harness} reproduces the production list reset`, async ({ page }) => {
    await page.goto(harness);

    const listStyleType = await page.evaluate(() => {
      const probe = document.createElement('ul');
      probe.innerHTML = '<li>probe</li>';
      document.body.appendChild(probe);
      const value = getComputedStyle(probe).listStyleType;
      probe.remove();
      return value;
    });

    expect(
      listStyleType,
      'harness must reproduce the host page reset (ol,ul,menu{list-style:none}); ' +
        'without it a list regression test passes on browser defaults while production is broken'
    ).toBe('none');
  });
}
