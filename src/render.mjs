import { site } from './config.mjs';
import { content } from './content.mjs';

/** 将文本安全地放入页面与属性，喵~ */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

/** 输出站点使用的少量矢量图标，避免图标字体与额外网络请求，喵~ */
function icon(name) {
  const paths = {
    heart: '<path d="M20.8 8.6c0 4.4-8.8 10.7-8.8 10.7S3.2 13 3.2 8.6a4.4 4.4 0 0 1 8.8 0 4.4 4.4 0 0 1 8.8 0Z"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z"/>',
  };
  return `<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

/** 使用独立项目字标，避免让官网看起来由微软运营，喵~ */
function logo() {
  return '<svg class="brand-mark" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#245ce6"/><path d="m8 16 5 5L24 10" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

/** 生成语言页面头部及可访问的导航，喵~ */
function header(c, privacy = false) {
  const root = c.path;
  const other = privacy ? (c.lang === 'en' ? '/zh/privacy/' : '/privacy/') : c.other;
  return `<a class="skip-link" href="#main">${c.lang === 'en' ? 'Skip to content' : '跳到正文'}</a>
  <header class="site-header wrap"><a class="brand" href="${root}" aria-label="To Do Capture home">${logo()}<span>To Do Capture</span></a>
    <nav aria-label="${c.lang === 'en' ? 'Main navigation' : '主导航'}">
      <a class="language" href="${other}" lang="${c.lang === 'en' ? 'zh-CN' : 'en'}" data-track="language_switch" data-track-value="${c.lang === 'en' ? 'zh' : 'en'}">${icon('globe')}${c.otherLabel}</a>
      <a class="nav-source" href="${site.repository}" data-track="project_click" data-track-value="header">GitHub ${icon('arrow')}</a>
      <a class="nav-reward" href="${escapeHtml(site.rewardUrl)}" target="_blank" rel="noreferrer">${icon('heart')}${c.reward}</a>
    </nav>
  </header>`;
}

/** 页脚提供项目归属和可随时调整的统计偏好，喵~ */
function footer(c) {
  return `<footer class="site-footer wrap">
    <div class="site-credit">
      <span>© 2026 waynegong</span>
      <small>${c.lang === 'en' ? 'Not affiliated with or endorsed by Microsoft.' : '非微软官方项目，与微软无隶属或背书关系。'}</small>
    </div>
    <nav aria-label="${c.lang === 'en' ? 'Footer' : '页脚'}"><a href="${c.lang === 'en' ? '/privacy/' : '/zh/privacy/'}">${c.privacy}</a><button type="button" data-analytics-preferences>${c.analytics}</button><a href="${site.websiteRepository}" data-track="website_source_click" data-track-value="footer">${c.websiteSource} ${icon('arrow')}</a></nav>
  </footer>
  <aside class="consent" aria-label="${c.consentAria}" hidden data-consent><div><strong>${c.consentTitle}</strong><p>${c.consentText} <a href="${c.lang === 'en' ? '/privacy/' : '/zh/privacy/'}">${c.privacy}</a></p></div><div class="consent-actions"><button class="button button-small" type="button" data-consent-allow>${c.allow}</button><button class="button button-quiet button-small" type="button" data-consent-deny>${c.deny}</button></div></aside>`;
}

/** 把可索引内容和正确的语言、规范链接放在静态 HTML 中，喵~ */
function document(c, body, kind = 'home') {
  const path = kind === 'notfound' ? '/404.html' : kind === 'privacy' ? (c.lang === 'en' ? '/privacy/' : '/zh/privacy/') : c.path;
  const canonical = site.origin + path;
  const title = kind === 'notfound' ? 'Page not found — To Do Capture' : kind === 'privacy' ? `${c.privacyTitle} — To Do Capture` : c.title;
  const description = kind === 'notfound' ? c.notFoundText : kind === 'privacy' ? c.privacyDescription : c.description;
  const enPath = kind === 'privacy' ? '/privacy/' : '/';
  const zhPath = kind === 'privacy' ? '/zh/privacy/' : '/zh/';
  const structured = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebSite', '@id': `${site.origin}/#website`, name: site.name, url: site.origin, inLanguage: ['en', 'zh-CN'] },
    { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: title, description, inLanguage: c.lang, isPartOf: { '@id': `${site.origin}/#website` } },
    ...(kind === 'home' ? [{ '@type': 'SoftwareApplication', '@id': `${site.origin}/#application`, name: site.name, applicationCategory: 'ProductivityApplication', url: site.origin, description: c.description, installUrl: [site.chromeWebStoreUrl, site.edgeAddonsUrl], isAccessibleForFree: true, license: 'https://opensource.org/license/mit', sameAs: site.repository, author: { '@type': 'Person', name: 'waynegong', url: 'https://github.com/WayneGongCN' } }] : []),
  ] };
  return `<!doctype html>
<html lang="${c.lang}" data-page="${kind}" data-analytics-id="${site.measurementId}" data-analytics-hosts="${new URL(site.origin).hostname},${site.legacyHostname}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="theme-color" content="#f6f5f1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="${kind === 'notfound' ? 'noindex,follow' : 'index,follow,max-image-preview:large'}"><link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${site.origin}${enPath}"><link rel="alternate" hreflang="zh-CN" href="${site.origin}${zhPath}"><link rel="alternate" hreflang="x-default" href="${site.origin}${enPath}">
<meta property="og:type" content="website"><meta property="og:site_name" content="To Do Capture"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:locale" content="${c.lang === 'en' ? 'en_US' : 'zh_CN'}"><meta property="og:locale:alternate" content="${c.lang === 'en' ? 'zh_CN' : 'en_US'}"><meta property="og:image" content="${site.origin}/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="To Do Capture Chrome extension for Microsoft To Do">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${site.origin}/og.png"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/site.css"><script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script><script type="module" src="/assets/site.js"></script>
</head><body>${header(c, kind === 'privacy')}${body}${footer(c)}</body></html>`;
}

/** 在线框浏览器内画出右键菜单和工具栏弹窗，喵~ */
function captureIllustration(kind, copy) {
  const source = {
    page: `<rect x="25" y="40" width="125" height="66" rx="5" stroke="currentColor"/>
      <rect x="34" y="57" width="35" height="35" rx="3" fill="#e6eeff" stroke="none"/>
      <path d="M34 49h70M79 60h60m-60 10h48m-48 10h52m-52 10h36"/>`,
    selection: `<path d="M32 42h98"/>
      <rect x="29" y="47" width="94" height="13" rx="3" fill="#dce7ff" stroke="none"/>
      <path d="M34 53h83" stroke="currentColor"/>`,
    link: `<path d="M32 42h98"/>
      <path d="M33 51h85m-85 5h85" stroke="currentColor"/>`,
  };
  const menu = kind === 'page' ? '' : `<rect x="24" y="61" width="132" height="46" rx="4" fill="#fff" stroke="#8292a3"/>
    <rect x="28" y="78" width="124" height="18" rx="3" fill="#e6eeff" stroke="none"/>
    <path d="M33 101h57"/>
    <text x="33" y="73" fill="#52616e" stroke="none" font-size="9.5">${escapeHtml(copy.menuLabel)}</text>
    <text x="33" y="90" fill="#174abf" stroke="none" font-size="9" font-weight="600">${escapeHtml(copy[kind])}</text>
    <path d="m117 52 13 9-6 1 4 6-3 2-4-6-4 3Z" fill="#fff" stroke="currentColor"/>
    <path d="M159 86h8m-4-4 4 4-4 4" stroke="currentColor"/>`;

  return `<svg class="feature-illustration" viewBox="0 0 300 128" fill="none" stroke="#a8b4bf" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <rect x="12" y="10" width="276" height="108" rx="8" fill="#fff"/>
    <path d="M12 30h276M23 20h1m6 0h1m6 0h1"/>
    <rect x="48" y="16" width="177" height="8" rx="4" fill="#eef1f4" stroke="none"/>
    <rect x="258" y="14" width="14" height="13" rx="3" fill="#e6eeff" stroke="currentColor"/>
    <path d="m261 20 3 3 5-5" stroke="currentColor"/>
    ${source[kind]}
    ${menu}
    <path d="M176 36h83l6-5 6 5h1a5 5 0 0 1 5 5v62a5 5 0 0 1-5 5h-96a5 5 0 0 1-5-5V41a5 5 0 0 1 5-5Z" fill="#fff" stroke="#6780ab"/>
    <rect x="178" y="42" width="10" height="10" rx="2" fill="#e6eeff" stroke="none"/>
    <path d="m180 47 2 2 4-4" stroke="currentColor"/>
    <text x="193" y="50" fill="#202721" stroke="none" font-size="10" font-weight="600">To Do Capture</text>
    <rect x="178" y="57" width="92" height="13" rx="3" fill="#f4f6f8" stroke="none"/>
    <path d="M183 63.5h55"/>
    <rect x="178" y="75" width="92" height="10" rx="2"/>
    <path d="M183 80h30m47-2 2 2 2-2"/>
    <rect x="213" y="90" width="57" height="12" rx="3" fill="#e6eeff" stroke="none"/>
    <text x="241.5" y="99" fill="#174abf" stroke="none" font-size="8.5" font-weight="600" text-anchor="middle">${escapeHtml(copy.addTask)}</text>
  </svg>`;
}

/** 输出中英文首页的安装入口和三种收集方式，喵~ */
export function renderHome(locale) {
  const c = content[locale];
  const body = `<main id="main">
    <section class="hero wrap">
      <h1>${c.heading}</h1>
      <p class="hero-intro">${c.intro}</p>
      <div class="hero-actions">
        <a class="button" href="${site.chromeWebStoreUrl}" data-track="install_chrome_click" data-track-value="hero">${c.installChrome}${icon('arrow')}</a>
        <a class="button button-quiet" href="${site.edgeAddonsUrl}" data-track="install_edge_click" data-track-value="hero">${c.installEdge}${icon('arrow')}</a>
        <a class="button button-quiet" href="${site.releaseUrl}" data-track="install_manual_click" data-track-value="hero">${c.installManual}${icon('arrow')}</a>
      </div>
    </section>
    <section class="capture-types wrap" aria-label="${c.featuresLabel}">
      ${c.features.map(([kind, title, description]) => `<article>
        <h2>${title}</h2>
        <p>${description}</p>
        ${captureIllustration(kind, c.illustration)}
      </article>`).join('')}
    </section>
  </main>`;
  return document(c, body);
}

/** 在同一隐私页公开扩展数据用途、网站统计说明和支持入口，喵~ */
export function renderPrivacy(locale) {
  const c = content[locale];
  const sections = c.privacySections.map(([title, paragraph]) =>
    `<section><h2>${escapeHtml(title)}</h2><p>${escapeHtml(paragraph)}</p></section>`,
  ).join('');
  return document(c, `<main class="privacy-page wrap" id="main">
    <a class="back-link" href="${c.path}">← ${c.back}</a>
    <p class="eyebrow">TO DO CAPTURE / PRIVACY</p>
    <h1>${c.privacyTitle}</h1>
    <p class="privacy-intro">${c.privacyIntro}</p>
    ${sections}
    <section><h2>${c.policyLinks}</h2><ul>
      <li><a href="${site.repository}/issues">${c.extensionSupport}</a></li>
      <li><a href="https://developer.chrome.com/docs/webstore/program-policies/limited-use">Chrome Web Store Limited Use</a></li>
      <li><a href="https://policies.google.com/privacy">Google Privacy Policy</a></li>
      <li><a href="https://vercel.com/legal/privacy-policy">Vercel Privacy Policy</a></li>
      <li><a href="${site.websiteRepository}/issues">${c.websiteSource} / Issues</a></li>
    </ul></section>
  </main>`, 'privacy');
}

/** 让未知路径真实返回找不到页面，同时提供可用的返回入口，喵~ */
export function renderNotFound() {
  return document(content.en, `<main class="not-found wrap" id="main"><p class="eyebrow">404</p><h1>${content.en.notFoundTitle}</h1><p>${content.en.notFoundText}</p><a class="button" href="/">${content.en.back} ${icon('arrow')}</a></main>`, 'notfound');
}
