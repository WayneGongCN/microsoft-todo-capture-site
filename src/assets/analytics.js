const schema = {
  install_chrome_click: { cta_location: ['hero'] },
  install_edge_click: { cta_location: ['hero'] },
  install_manual_click: { cta_location: ['hero'] },
  project_click: { cta_location: ['header'] },
  website_source_click: { cta_location: ['footer'] },
  language_switch: { target_language: ['en', 'zh'] },
};
const preferenceKey = 'tdc_analytics_v1';
let enabled = false;
let permitted = false;
let initialized = false;
let pageViewed = false;
let measurementId = '';

/** 统计网址仅保留规范路径，丢弃可能携带个人数据的查询参数和片段，喵~ */
export function cleanPageLocation(value) {
  const url = new URL(value);
  return url.origin + url.pathname;
}

/** 来源统计只保留来源域名，喵~ */
export function cleanReferrer(value) {
  try { return new URL(value).origin; } catch { return ''; }
}

/** 事件参数采用固定枚举，未知字段和自由输入永远不会上传，喵~ */
export function eventParameters(name, parameters) {
  if (!Object.hasOwn(schema, name)) return null;
  return Object.fromEntries(Object.entries(parameters).filter(([key, value]) => schema[name][key]?.includes(value)));
}

/** 读取本地统计偏好，存储不可用时保持未授权，喵~ */
function readPreference() {
  try { return localStorage.getItem(preferenceKey); } catch { return null; }
}

/** 只在主动同意后初始化 Google 标签，避免未授权的统计请求，喵~ */
function loadAnalytics() {
  if (!enabled || !permitted || navigator.globalPrivacyControl) return;
  window[`ga-disable-${measurementId}`] = false;
  if (!initialized) {
    initialized = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: cleanPageLocation(location.href), page_referrer: cleanReferrer(document.referrer), cookie_domain: 'none', cookie_expires: 60 * 60 * 24 * 180, ...(new URL(location.href).searchParams.get('analytics_debug') === '1' ? { debug_mode: true } : {}) });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(script);
  } else {
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
  }
  if (!pageViewed) {
    pageViewed = true;
    window.gtag('event', 'page_view', { page_title: document.title, page_location: cleanPageLocation(location.href), page_referrer: cleanReferrer(document.referrer), site_language: document.documentElement.lang === 'en' ? 'en' : 'zh', page_type: document.documentElement.dataset.page });
  }
}

/** 撤回统计时禁用后续事件并清理本站 Google Analytics Cookie，喵~ */
function stopAnalytics() {
  window[`ga-disable-${measurementId}`] = true;
  if (initialized) window.gtag('consent', 'update', { analytics_storage: 'denied' });
  for (const entry of document.cookie.split(';')) {
    const key = entry.split('=')[0].trim();
    if (key === '_ga' || key.startsWith('_ga_')) {
      for (const domain of ['', `;domain=${location.hostname}`, `;domain=.${location.hostname}`]) document.cookie = `${key}=;max-age=0;path=/${domain};SameSite=Lax`;
    }
  }
}

/** 保存访客选择，拒绝和 GPC 都不会阻止官网其他功能，喵~ */
function setConsent(allow) {
  permitted = allow && !navigator.globalPrivacyControl;
  try { localStorage.setItem(preferenceKey, permitted ? 'granted' : 'denied'); } catch { /* 偏好无法保存时仍遵守当前页面选择，喵~ */ }
  document.querySelector('[data-consent]').hidden = true;
  if (permitted) loadAnalytics(); else stopAnalytics();
}

/** 初始化生产域名下的可选统计，预览和本地页面默认不产生数据，喵~ */
export function initAnalytics() {
  measurementId = document.documentElement.dataset.analyticsId ?? '';
  const hosts = document.documentElement.dataset.analyticsHosts?.split(',') ?? [];
  enabled = hosts.includes(location.hostname) && /^G-[A-Z0-9]+$/.test(measurementId);
  const banner = document.querySelector('[data-consent]');
  if (!enabled || navigator.globalPrivacyControl) {
    if (enabled) stopAnalytics();
    document.querySelectorAll('[data-analytics-preferences]').forEach(button => { button.hidden = true; });
    return;
  }
  document.querySelector('[data-consent-allow]').addEventListener('click', () => setConsent(true));
  document.querySelector('[data-consent-deny]').addEventListener('click', () => setConsent(false));
  document.querySelectorAll('[data-analytics-preferences]').forEach(button => button.addEventListener('click', () => { banner.hidden = false; banner.querySelector('[data-consent-deny]').focus(); }));
  const preference = readPreference();
  permitted = preference === 'granted';
  banner.hidden = preference === 'granted' || preference === 'denied';
  if (permitted) loadAnalytics();
}

/** 发送经过枚举校验的交互事件，不回放访客同意前发生的行为，喵~ */
export function track(name, parameters = {}) {
  const safe = eventParameters(name, parameters);
  if (!enabled || !permitted || safe === null || navigator.globalPrivacyControl || !window.gtag) return;
  window.gtag('event', name, { ...safe, site_language: document.documentElement.lang === 'en' ? 'en' : 'zh', page_type: document.documentElement.dataset.page, page_location: cleanPageLocation(location.href) });
}
