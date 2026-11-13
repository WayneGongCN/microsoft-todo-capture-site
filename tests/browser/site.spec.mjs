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

const installDestinations = [
  'https://chromewebstore.google.com/detail/to-do-capture/ffpljgmbiankjaokoefefmkoghcgoodn',
  'https://microsoftedge.microsoft.com/addons/detail/to-do-capture/mhfmejfcbgojopoeakmglpgmlokpdjjg',
  'https://github.com/WayneGongCN/microsoft-todo-browser-ext/releases/latest',
];
const installEvents = ['install_chrome_click', 'install_edge_click', 'install_manual_click'];

for (const [path, language, installLabels] of [
  ['/', 'en', ['Install from the Chrome Web Store', 'Install from Microsoft Edge Add-ons', 'Download for manual installation']],
  ['/zh/', 'zh', ['从 Chrome 应用商店安装', '从 Edge 应用商店安装', '下载手动安装']],
]) {
  test(`${path} presents three capture methods and three accessible installation links`, async ({ page }) => {
    await page.goto(path);
    const main = page.getByRole('main');
    for (const [index, label] of installLabels.entries()) {
      const link = main.getByRole('link', { name: label, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', installDestinations[index]);
    }
    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveCount(3);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
  });

  test(`${path} tracks each installation destination by default`, async ({ page }) => {
    await productionFixture(page);
    for (const destination of installDestinations) {
      await page.route(destination, route => route.fulfill({ status: 204 }));
    }
    await page.goto(`${site.origin}${path}?token=private#example`);
    for (const label of installLabels) {
      await page.getByRole('link', { name: label, exact: true }).click();
    }
    const events = await page.evaluate(() => window.dataLayer.map(entry => Array.from(entry)));
    expect(events.filter(entry => entry[0] === 'event' && entry[1].startsWith('install_'))).toEqual(
      installEvents.map(name => ['event', name, { cta_location: 'hero', site_language: language, page_type: 'home', page_location: `${site.origin}${path}` }]),
    );

    await page.locator('[data-analytics-preferences]').click();
    await page.locator('[data-consent-deny]').click();
    await page.getByRole('link', { name: installLabels[0], exact: true }).click();
    expect(await page.evaluate(() => window.dataLayer.length)).toBe(events.length);
  });
}

test('homepage content is available with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4178/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Save webpages to Microsoft To Do');
  await expect(page.getByRole('main').getByRole('link')).toHaveCount(3);
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

test('analytics defaults to cookieless, sends one pageview and respects the saved setting', async ({ page }) => {
  const requests = await productionFixture(page);
  await page.context().addCookies([{ name: '_ga', value: 'GA1.1.123.456', url: site.origin }]);
  await page.goto(`${site.origin}/?token=private#example`);
  await expect(page.locator('[data-consent]')).toBeHidden();
  await expect.poll(() => requests.length).toBe(1);
  expect((await page.context().cookies()).some(cookie => cookie.name === '_ga')).toBe(false);
  await page.getByRole('link', { name: 'GitHub', exact: true }).click();
  const events = await page.evaluate(() => window.dataLayer.map(entry => Array.from(entry)));
  const pageviews = events.filter(entry => entry[0] === 'event' && entry[1] === 'page_view');
  expect(pageviews).toHaveLength(1);
  expect(pageviews[0][2].page_location).toBe(`${site.origin}/`);
  expect(events.filter(entry => entry[0] === 'consent')).toEqual([
    ['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }],
  ]);
  expect(events.some(entry => entry[1] === 'project_click' && entry[2].cta_location === 'header')).toBe(true);
  expect(JSON.stringify(events)).not.toContain('private');
  await page.getByRole('button', { name: 'Analytics preferences', exact: true }).click();
  await page.getByRole('button', { name: 'Turn off analytics', exact: true }).click();
  expect(await page.evaluate(id => window[`ga-disable-${id}`], site.measurementId)).toBe(true);
  await page.reload();
  expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();
  expect(requests).toHaveLength(1);
  await page.getByRole('button', { name: 'Analytics preferences', exact: true }).click();
  await page.getByRole('button', { name: 'Turn on analytics', exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
});

test('the old production hostname also enables cookieless analytics by default', async ({ page }) => {
  const legacyOrigin = `https://${site.legacyHostname}`;
  const requests = await productionFixture(page, legacyOrigin);
  await page.goto(`${legacyOrigin}/`);
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
