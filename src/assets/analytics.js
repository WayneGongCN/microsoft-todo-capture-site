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

/** 读取保存的统计偏好，无法读取时停用统计，喵~ */
function readPreference() {
  try { return localStorage.getItem(preferenceKey); } catch { return 'denied'; }
}

/** 用无 Cookie 模式发送站内事件，每次页面加载只发送一次浏览事件，喵~ */
function loadAnalytics() {
  if (!enabled || !permitted || navigator.globalPrivacyControl) return;
  window[`ga-disable-${measurementId}`] = false;
  if (!initialized) {
    initialized = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: cleanPageLocation(location.href), page_referrer: cleanReferrer(document.referrer), ...(new URL(location.href).searchParams.get('analytics_debug') === '1' ? { debug_mode: true } : {}) });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(script);
  }
  if (!pageViewed) {
    pageViewed = true;
    window.gtag('event', 'page_view', { page_title: document.title, page_location: cleanPageLocation(location.href), page_referrer: cleanReferrer(document.referrer), site_language: document.documentElement.lang === 'en' ? 'en' : 'zh', page_type: document.documentElement.dataset.page });
  }
}

/** 清理旧版网站曾写入的 Google Analytics Cookie，喵~ */
function clearAnalyticsCookies() {
  for (const entry of document.cookie.split(';')) {
    const key = entry.split('=')[0].trim();
    if (key === '_ga' || key.startsWith('_ga_')) {
      for (const domain of ['', `;domain=${location.hostname}`, `;domain=.${location.hostname}`]) document.cookie = `${key}=;max-age=0;path=/${domain};SameSite=Lax`;
    }
  }
}

/** 保存统计开关，关闭后停发 Google Analytics 事件，喵~ */
function setPreference(allow) {
  permitted = allow && !navigator.globalPrivacyControl;
  try { localStorage.setItem(preferenceKey, permitted ? 'granted' : 'denied'); } catch { /* 偏好无法保存时仍遵守当前页面选择，喵~ */ }
  document.querySelector('[data-consent]').hidden = true;
  const button = document.querySelector('[data-analytics-preferences]');
  button.setAttribute('aria-expanded', 'false');
  button.focus();
  if (permitted) loadAnalytics(); else window[`ga-disable-${measurementId}`] = true;
}

/** 初始化生产域名下的可选统计，预览和本地页面默认不产生数据，喵~ */
export function initAnalytics() {
  measurementId = document.documentElement.dataset.analyticsId ?? '';
  const hosts = document.documentElement.dataset.analyticsHosts?.split(',') ?? [];
  enabled = hosts.includes(location.hostname) && /^G-[A-Z0-9]+$/.test(measurementId);
  const button = document.querySelector('[data-analytics-preferences]');
  if (enabled) clearAnalyticsCookies();
  if (!enabled || navigator.globalPrivacyControl) {
    if (enabled) window[`ga-disable-${measurementId}`] = true;
    button.hidden = true;
    return;
  }
  const panel = document.querySelector('[data-consent]');
  const allow = panel.querySelector('[data-consent-allow]');
  const deny = panel.querySelector('[data-consent-deny]');
  allow.addEventListener('click', () => setPreference(true));
  deny.addEventListener('click', () => setPreference(false));
  button.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) (permitted ? deny : allow).focus();
  });
  permitted = readPreference() !== 'denied';
  if (permitted) loadAnalytics();
}

/** 发送经过枚举校验的交互事件，关闭期间的操作不会补报，喵~ */
export function track(name, parameters = {}) {
  const safe = eventParameters(name, parameters);
  if (!enabled || !permitted || safe === null || navigator.globalPrivacyControl || !window.gtag) return;
  window.gtag('event', name, { ...safe, site_language: document.documentElement.lang === 'en' ? 'en' : 'zh', page_type: document.documentElement.dataset.page, page_location: cleanPageLocation(location.href) });
}
