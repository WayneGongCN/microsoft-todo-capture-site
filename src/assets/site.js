import { initAnalytics, track } from './analytics.js';

initAnalytics();
document.querySelectorAll('[data-track]').forEach(link => link.addEventListener('click', () => {
  const type = link.dataset.track;
  track(type, type === 'language_switch' ? { target_language: link.dataset.trackValue } : { cta_location: link.dataset.trackValue });
}));
