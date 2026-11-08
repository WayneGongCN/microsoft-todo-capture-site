import { initAnalytics, track } from './analytics.js';

initAnalytics();
document.querySelectorAll('[data-track]').forEach(link => link.addEventListener('click', () => {
  const type = link.dataset.track;
  track(type, type === 'language_switch' ? { target_language: link.dataset.trackValue } : { cta_location: link.dataset.trackValue });
}));
document.querySelectorAll('[data-faq]').forEach(details => details.addEventListener('toggle', () => {
  if (details.open) track('faq_expand', { faq_id: details.dataset.faq });
}));

const data = document.getElementById('demo-content');
if (data) {
  const copy = JSON.parse(data.textContent);
  const modes = ['page', 'selection', 'link'];
  let mode = 'page';
  let source = true;
  let completed = false;
  const stage = document.querySelector('.demo-stage');
  const sourceElement = document.querySelector('[data-demo-source]');
  const restore = document.querySelector('[data-demo-restore]');
  const submit = document.querySelector('[data-demo-submit]');
  const result = document.querySelector('[data-demo-result]');
  const reset = document.querySelector('[data-demo-reset-wrap]');

  /** 切换示例内容和反馈，所有数据均为本地演示，喵~ */
  function renderDemo() {
    const index = modes.indexOf(mode);
    document.querySelectorAll('[data-demo-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.demoMode === mode)));
    stage.classList.toggle('is-selection', mode === 'selection');
    stage.classList.toggle('is-link', mode === 'link');
    document.querySelector('[data-demo-title]').textContent = copy.titles[index];
    document.querySelector('[data-demo-source-title]').textContent = copy.sources[index];
    sourceElement.hidden = !source;
    restore.hidden = source;
    submit.hidden = completed;
    result.hidden = !completed;
    reset.hidden = !completed;
  }

  document.querySelectorAll('[data-demo-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.demoMode;
    source = true;
    completed = false;
    renderDemo();
    track('demo_mode_select', { capture_type: mode });
  }));
  document.querySelector('[data-demo-link]').addEventListener('click', event => {
    event.preventDefault();
    mode = 'link'; source = true; completed = false; renderDemo();
    track('demo_mode_select', { capture_type: mode });
  });
  document.querySelector('[data-demo-remove]').addEventListener('click', () => { source = false; renderDemo(); });
  restore.addEventListener('click', () => { source = true; renderDemo(); });
  submit.addEventListener('click', () => {
    completed = true;
    document.querySelector('[data-demo-result-title]').textContent = `${copy.added}「${document.querySelector('[data-demo-list]').value}」`;
    renderDemo();
    track('demo_complete', { capture_type: mode });
    document.querySelector('[data-demo-reset]').focus({ preventScroll: true });
  });
  document.querySelector('[data-demo-reset]').addEventListener('click', () => { completed = false; renderDemo(); submit.focus({ preventScroll: true }); });
}
