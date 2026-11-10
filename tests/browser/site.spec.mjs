import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { site } from '../../src/config.mjs';

for (const path of ['/', '/zh/', '/privacy/', '/zh/privacy/']) {
  test(`${path} has no horizontal overflow on a narrow screen`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(path);
    const layout = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
    expect(layout.content).toBeLessThanOrEqual(layout.width);
  });
}

for (const [path, installLabel] of [['/', 'Add to Chrome'], ['/zh/', '添加至 Chrome']]) {
  test(`${path} presents three capture methods and an accessible install link`, async ({ page }) => {
    await page.goto(path);
    const link = page.getByRole('main').getByRole('link', { name: installLabel, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://chromewebstore.google.com/detail/to-do-capture/ffpljgmbiankjaokoefefmkoghcgoodn');
    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveCount(3);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
  });
}

test('homepage content is available with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4178/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Save webpages to Microsoft To Do');
  await expect(page.getByRole('link', { name: 'Add to Chrome' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Save selected text' })).toBeVisible();
  await context.close();
});

test('unknown route returns an actual 404', async ({ page }) => {
  const response = await page.goto('/not-a-real-page/');
  expect(response.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('wandered off');
});

/** 在隔离浏览器中模拟生产主机并拦截 Google 标签，验证隐私而不污染真实统计，喵~ */
async function productionFixture(page, origin = site.origin) {
  const googleRequests = [];
  await page.route('https://github.com/WayneGongCN/microsoft-todo-browser-ext', route => route.fulfill({ status: 204 }));
  await page.route('https://www.googletagmanager.com/**', route => { googleRequests.push(route.request().url()); return route.fulfill({ contentType: 'application/javascript', body: '/* intercepted in browser test */' }); });
  await page.route(`${origin}/**`, async route => {
    const path = new URL(route.request().url()).pathname;
    const file = resolve('dist', `.${path}${path.endsWith('/') ? 'index.html' : ''}`);
    const contentType = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[extname(file)] || 'application/octet-stream';
    await route.fulfill({ contentType, body: await readFile(file) });
  });
  return googleRequests;
}

test('analytics waits for consent, sends one pageview, filters data and stops after withdrawal', async ({ page }) => {
  const requests = await productionFixture(page);
  await page.goto(`${site.origin}/?token=private#example`);
  await expect(page.locator('[data-consent]')).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  await page.getByRole('link', { name: 'GitHub', exact: true }).click();
  const events = await page.evaluate(() => window.dataLayer.map(entry => Array.from(entry)));
  const pageviews = events.filter(entry => entry[0] === 'event' && entry[1] === 'page_view');
  expect(pageviews).toHaveLength(1);
  expect(pageviews[0][2].page_location).toBe(`${site.origin}/`);
  expect(events.find(entry => entry[0] === 'config')[2].cookie_domain).toBe('none');
  expect(events.some(entry => entry[1] === 'project_click' && entry[2].cta_location === 'header')).toBe(true);
  expect(JSON.stringify(events)).not.toContain('private');
  await page.getByRole('button', { name: 'Analytics preferences', exact: true }).click();
  await page.getByRole('button', { name: 'No thanks', exact: true }).click();
  const afterWithdrawal = await page.evaluate(() => window.dataLayer.map(entry => Array.from(entry)));
  expect(afterWithdrawal.at(-1)).toEqual(['consent', 'update', { analytics_storage: 'denied' }]);
  await page.getByRole('link', { name: 'GitHub', exact: true }).click();
  expect(await page.evaluate(() => window.dataLayer.length)).toBe(afterWithdrawal.length);
});

test('the old production hostname still supports consented analytics', async ({ page }) => {
  const legacyOrigin = `https://${site.legacyHostname}`;
  const requests = await productionFixture(page, legacyOrigin);
  await page.goto(`${legacyOrigin}/`);
  expect(requests).toHaveLength(0);
  await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
});

test('Global Privacy Control blocks a previously granted analytics preference', async ({ page }) => {
  const requests = await productionFixture(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true });
    localStorage.setItem('tdc_analytics_v1', 'granted');
  });
  await page.goto(`${site.origin}/`);
  await page.getByRole('link', { name: 'GitHub', exact: true }).click();
  expect(requests).toHaveLength(0);
});
