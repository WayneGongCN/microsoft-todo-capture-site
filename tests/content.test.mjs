import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { content } from '../src/content.mjs';
import { renderHome, renderPrivacy } from '../src/render.mjs';
import { site } from '../src/config.mjs';
import { cleanPageLocation, cleanReferrer, eventParameters } from '../src/assets/analytics.js';

for (const locale of ['en', 'zh']) {
  test(`${locale}: crawlable homepage has canonical, reciprocal languages and store links in its metadata`, () => {
    const html = renderHome(locale);
    assert.equal((html.match(/<h1>/g) ?? []).length, 1);
    assert.ok(html.includes(`<html lang="${content[locale].lang}"`));
    assert.ok(html.includes(`rel="canonical" href="${site.origin}${content[locale].path}"`));
    for (const [language, path] of [['en', '/'], ['zh-CN', '/zh/'], ['x-default', '/']]) assert.ok(html.includes(`hreflang="${language}" href="${site.origin}${path}"`));
    const json = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    const app = json['@graph'].find(item => item['@type'] === 'SoftwareApplication');
    assert.equal(app.softwareVersion, undefined);
    assert.deepEqual(app.installUrl, [site.chromeWebStoreUrl, site.edgeAddonsUrl]);
    assert.equal(app.aggregateRating, undefined);
  });
  test(`${locale}: privacy policy covers the extension and website analytics`, () => {
    const html = renderPrivacy(locale);
    assert.ok(html.includes(content[locale].privacyIntro));
    assert.ok(html.includes(site.measurementId));
    assert.ok(html.includes('Microsoft Graph'));
    assert.ok(html.includes('Limited Use'));
    assert.ok(html.includes(`href="${site.repository}/issues"`));
    assert.equal((html.match(/<h1>/g) ?? []).length, 1);
  });
}

test('analytics strips URL query, fragment and referrer paths', () => {
  assert.equal(cleanPageLocation('https://example.com/zh/?token=secret#private'), 'https://example.com/zh/');
  assert.equal(cleanReferrer('https://example.com/private?email=person@example.com'), 'https://example.com');
  assert.equal(cleanReferrer(''), '');
});

test('analytics accepts predefined events and values only', () => {
  assert.deepEqual(eventParameters('language_switch', { target_language: 'zh', title: 'private', email: 'private@example.com' }), { target_language: 'zh' });
  assert.deepEqual(eventParameters('project_click', { cta_location: 'personal-secret', note: 'private' }), {});
  assert.equal(eventParameters('private_task_created', { title: 'private' }), null);
  assert.equal(eventParameters('__proto__', {}), null);
});

test('sitemap is a production-only list of real translated routes', async () => {
  const xml = await readFile('dist/sitemap.xml', 'utf8');
  assert.equal((xml.match(/<loc>/g) ?? []).length, 4);
  for (const path of ['/', '/zh/', '/privacy/', '/zh/privacy/']) assert.ok(xml.includes(`<loc>${site.origin}${path}</loc>`));
  assert.ok(!(await readFile('dist/robots.txt', 'utf8')).includes('Disallow: /'));
});
