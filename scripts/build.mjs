import { mkdir, rm, writeFile, cp, readFile } from 'node:fs/promises';
import { renderHome, renderPrivacy, renderNotFound } from '../src/render.mjs';
import { site } from '../src/config.mjs';
import { createHash } from 'node:crypto';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/zh/privacy', { recursive: true });
await mkdir('dist/privacy', { recursive: true });
await mkdir('dist/assets', { recursive: true });
await cp('public', 'dist', { recursive: true });
const analytics = await readFile('src/assets/analytics.js', 'utf8');
const analyticsName = `analytics-${createHash('sha256').update(analytics).digest('hex').slice(0, 12)}.js`;
const script = (await readFile('src/assets/site.js', 'utf8')).replace('./analytics.js', `./${analyticsName}`);
const scriptName = `site-${createHash('sha256').update(script).digest('hex').slice(0, 12)}.js`;
const style = await readFile('src/assets/site.css', 'utf8');
const styleName = `site-${createHash('sha256').update(style).digest('hex').slice(0, 12)}.css`;
await Promise.all([writeFile(`dist/assets/${analyticsName}`, analytics), writeFile(`dist/assets/${scriptName}`, script), writeFile(`dist/assets/${styleName}`, style)]);

/** 为静态资源加内容指纹，喵~ */
function finalize(html) {
  return html.replace('/assets/site.css', `/assets/${styleName}`).replace('/assets/site.js', `/assets/${scriptName}`);
}

const homepage = finalize(renderHome('en'));
const searchConsoleTag = '<meta name="google-site-verification" content="Zzgl3Cfgek6ttzuqPmvw62FWowAGBetMxpr4dnYwozc">';
const productionHomepage = process.env.SITE_ENV === 'production'
  ? homepage.replace('</head>', `${searchConsoleTag}\n</head>`)
  : homepage;

await Promise.all([
  writeFile('dist/index.html', productionHomepage),
  writeFile('dist/zh/index.html', finalize(renderHome('zh'))),
  writeFile('dist/privacy/index.html', finalize(renderPrivacy('en'))),
  writeFile('dist/zh/privacy/index.html', finalize(renderPrivacy('zh'))),
  writeFile('dist/404.html', finalize(renderNotFound())),
  writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`),
  writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/zh/', '/privacy/', '/zh/privacy/'].map(path => `<url><loc>${site.origin}${path}</loc></url>`).join('')}</urlset>`),
  writeFile('dist/llms.txt', `# To Do Capture\n\nIndependent, open-source extension for Chrome and Edge that captures webpages, selected text and links into Microsoft To Do.\n\n- [Install from the Chrome Web Store](${site.chromeWebStoreUrl})\n- [Install from Microsoft Edge Add-ons](${site.edgeAddonsUrl})\n- [Download for manual installation](${site.releaseUrl})\n- [English homepage](${site.origin}/)\n- [中文首页](${site.origin}/zh/)\n- [Privacy policy](${site.origin}/privacy/)\n- [Extension source](${site.repository})\n- [Website source](${site.websiteRepository})\n`),
]);
console.log('Built 4 static pages, 404, sitemap, robots and assets.');
