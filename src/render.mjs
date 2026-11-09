import { site } from './config.mjs';
import { content } from './content.mjs';

/** 将文本安全地放入页面与属性，喵~ */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

/** 输出站点使用的少量矢量图标，避免图标字体与额外网络请求，喵~ */
function icon(name, className = '') {
  const paths = { arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>', check: '<path d="m5 12 4 4L19 6"/>', plus: '<path d="M12 5v14M5 12h14"/>', link: '<path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 10 4-4a4 4 0 0 0-6-6" transform="translate(2 0)"/>', cross: '<path d="m6 6 12 12M6 18 18 6"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z"/>', chevron: '<path d="m7 10 5 5 5-5"/>', page: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>', quote: '<path d="M5 10h5v7H4v-6a6 6 0 0 1 4-6m7 5h5v7h-6v-6a6 6 0 0 1 4-6"/>', github: '<path d="M9 19c-4 1-4-2-6-2m12 4v-4a4 4 0 0 0-1-3c3 0 6-1 6-6 0-1-1-3-1-3 0-1 0-2-1-3-2 0-3 1-3 1a12 12 0 0 0-6 0S8 2 6 2C5 3 5 4 5 5c-1 1-1 2-1 3 0 5 3 6 6 6-1 1-1 2-1 3v4"/>' };
  return `<svg class="icon ${className}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.arrow}</svg>`;
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
    <nav aria-label="${c.lang === 'en' ? 'Main navigation' : '主导航'}"><a class="nav-section" href="${root}#idea">${c.nav[0]}</a><a class="nav-section" href="${root}#questions">${c.nav[2]}</a><a class="language" href="${other}" lang="${c.lang === 'en' ? 'zh-CN' : 'en'}" data-track="language_switch" data-track-value="${c.lang === 'en' ? 'zh' : 'en'}">${icon('globe')}${c.otherLabel}</a><a class="nav-source" href="${site.repository}" data-track="project_click" data-track-value="header">GitHub ${icon('arrow')}</a></nav>
  </header>`;
}

/** 页脚提供项目归属和可随时调整的统计偏好，喵~ */
function footer(c) {
  return `<footer class="site-footer wrap"><div><a class="brand" href="${c.path}">${logo()}<span>To Do Capture</span></a><p>${c.footerText}</p><small>${c.lang === 'en' ? 'Not affiliated with or endorsed by Microsoft.' : '非微软官方项目，与微软无隶属或背书关系。'}</small></div><nav aria-label="${c.lang === 'en' ? 'Footer' : '页脚'}"><a href="${c.lang === 'en' ? '/privacy/' : '/zh/privacy/'}">${c.privacy}</a><button type="button" data-analytics-preferences>${c.analytics}</button><a href="${site.websiteRepository}" data-track="website_source_click" data-track-value="footer">${c.websiteSource} ${icon('arrow')}</a></nav><span class="copyright">© 2026 waynegong</span></footer>
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
    ...(kind === 'home' ? [{ '@type': 'SoftwareApplication', '@id': `${site.origin}/#application`, name: site.name, applicationCategory: 'ProductivityApplication', url: site.origin, description: c.description, creativeWorkStatus: 'In development', isAccessibleForFree: true, license: 'https://opensource.org/license/mit', sameAs: site.repository, author: { '@type': 'Person', name: 'waynegong', url: 'https://github.com/WayneGongCN' } }] : []),
  ] };
  return `<!doctype html>
<html lang="${c.lang}" data-page="${kind}" data-analytics-id="${site.measurementId}" data-analytics-host="${new URL(site.origin).hostname}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="theme-color" content="#f6f5f1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="${kind === 'notfound' ? 'noindex,follow' : 'index,follow,max-image-preview:large'}"><link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${site.origin}${enPath}"><link rel="alternate" hreflang="zh-CN" href="${site.origin}${zhPath}"><link rel="alternate" hreflang="x-default" href="${site.origin}${enPath}">
<meta property="og:type" content="website"><meta property="og:site_name" content="To Do Capture"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:locale" content="${c.lang === 'en' ? 'en_US' : 'zh_CN'}"><meta property="og:locale:alternate" content="${c.lang === 'en' ? 'zh_CN' : 'en_US'}"><meta property="og:image" content="${site.origin}/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="To Do Capture — Less switching. More doing.">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${site.origin}/og.png"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/site.css"><script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script><script type="module" src="/assets/site.js"></script>
</head><body>${header(c, kind === 'privacy')}${body}${footer(c)}</body></html>`;
}

/** 生成明确标注为演示的浏览器和扩展交互场景，喵~ */
function demo(c) {
  return `<section class="demo-section wrap" id="demo" aria-labelledby="demo-heading"><div class="demo-toolbar"><div><span class="eyebrow" id="demo-heading">${c.demoLabel}</span><p>${c.demoHint}</p></div><div class="demo-modes" role="group" aria-label="${c.demoHint}">${c.modes.map((label, i) => `<button type="button" data-demo-mode="${['page', 'selection', 'link'][i]}" aria-pressed="${i === 0}">${icon(['page', 'quote', 'link'][i])}<span>${label}</span></button>`).join('')}</div></div>
  <div class="demo-stage"><div class="browser-window"><div class="browser-chrome"><span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="browser-address">example.com / field-notes</span><span class="mini-logo" aria-hidden="true">${logo()}</span></div><div class="article-preview"><span class="eyebrow">${c.browserEyebrow}</span><h2>${c.browserHeading}</h2><p>${c.browserText}</p><div class="article-quote"><span data-article-quote>${c.quote}</span></div><a class="article-link" href="#demo" data-demo-link>${c.lang === 'en' ? 'Explore the focus guide' : '看看这份专注指南'} ${icon('arrow')}</a><div class="article-lines" aria-hidden="true"><span></span><span></span><span></span></div></div></div>
  <div class="capture-card" aria-label="${c.lang === 'en' ? 'Interactive extension concept' : '扩展交互概念'}"><div class="capture-head">${logo()}<div><strong>${c.cardTitle}</strong><span>${c.cardSubtitle}</span></div><span class="demo-badge">DEMO</span></div><div class="capture-body"><span class="field-label">${c.titleLabel}</span><p class="task-title" data-demo-title>${c.sampleTitles[0]}</p><label class="list-field"><span>${c.listLabel}</span><select data-demo-list>${c.listOptions.map(label => `<option>${label}</option>`).join('')}</select></label><div class="source-chip" data-demo-source>${icon('link')}<div><strong data-demo-source-title>${c.sampleSources[0]}</strong><span>example.com</span></div><button type="button" class="icon-button" data-demo-remove aria-label="${c.remove}">${icon('cross')}</button></div><button class="text-button" type="button" data-demo-restore hidden>${icon('link')}${c.restore}</button><details class="demo-note"><summary>${icon('plus')}${c.details}</summary><p>${c.note}</p></details><div class="demo-result" data-demo-result role="status" aria-live="polite" hidden>${icon('check')}<div><strong data-demo-result-title></strong><p>${c.saveMessage}</p></div></div><button class="button demo-submit" type="button" data-demo-submit>${icon('plus')}<span>${c.add}</span></button><p class="demo-reset" hidden data-demo-reset-wrap><button class="text-button" type="button" data-demo-reset>${c.again} ${icon('arrow')}</button></p></div><div class="capture-footer"><span>person@example.com</span><span>${c.lang === 'en' ? 'Example account' : '示例账号'}</span></div></div></div><p class="demo-disclaimer">${c.demoNote}</p>
  <script type="application/json" id="demo-content">${JSON.stringify({ titles: c.sampleTitles, sources: c.sampleSources, added: c.added }).replace(/</g, '\\u003c')}</script></section>`;
}

/** 构建中英文首页，展示新版定位、示例和真实开发状态，喵~ */
export function renderHome(locale) {
  const c = content[locale];
  const body = `<main id="main"><section class="hero wrap"><div class="hero-copy"><p class="eyebrow">${c.eyebrow}</p><h1>${c.heading}</h1><p class="hero-intro">${c.intro}</p><div class="hero-actions"><a class="button" href="${site.repository}" data-track="project_click" data-track-value="hero">${c.follow}${icon('arrow')}</a><a class="button button-quiet" href="#demo" data-track="demo_open" data-track-value="hero">${c.demoCta}</a></div><ul class="hero-proof">${c.proof.map(label => `<li>${icon('check')}${label}</li>`).join('')}</ul></div><aside class="release-note"><span class="release-dot" aria-hidden="true"></span><strong>${c.status}</strong><p>${c.statusText}</p><a href="${site.repository}" data-track="project_click" data-track-value="release_note">${c.source} ${icon('arrow')}</a></aside></section>
  ${demo(c)}
  <section class="idea-section wrap" id="idea"><div class="section-heading"><div><p class="eyebrow">${c.ideaEyebrow}</p><h2>${c.ideaHeading}</h2></div><p>${c.ideaIntro}</p></div><div class="capture-types">${c.features.map(([number, title, description, note], i) => `<article><div class="feature-icon">${icon(['page', 'quote', 'link'][i])}<span>${number}</span></div><h3>${title}</h3><p>${description}</p><small>${note}</small></article>`).join('')}</div></section>
  <section class="flow-section"><div class="wrap"><p class="eyebrow">${c.flowEyebrow}</p><h2>${c.flowHeading}</h2><ol class="flow-steps">${c.steps.map(([title, description], i) => `<li><span class="step-number">0${i + 1}</span><h3>${title}</h3><p>${description}</p></li>`).join('')}</ol><div class="principles"><h3>${c.principleTitle}</h3><div>${c.principles.map(([title, description]) => `<article><span>${icon('check')}</span><div><h4>${title}</h4><p>${description}</p></div></article>`).join('')}<small>${c.principleNote}</small></div></div></div></section>
  <section class="faq-section wrap" id="questions"><div><p class="eyebrow">${c.faqEyebrow}</p><h2>${c.faqHeading}</h2></div><div class="faq-list">${c.faqs.map(([question, answer], index) => `<details data-faq="question_${index + 1}"><summary>${question}${icon('plus')}</summary><p>${answer}</p></details>`).join('')}</div></section>
  <section class="final-cta wrap"><div><p class="eyebrow">${c.finalEyebrow}</p><h2>${c.finalHeading}</h2><p>${c.finalText}</p></div><a class="button" href="${site.repository}" data-track="project_click" data-track-value="final">${c.follow}${icon('arrow')}</a><div class="final-check" aria-hidden="true">${icon('check')}</div></section></main>`;
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
