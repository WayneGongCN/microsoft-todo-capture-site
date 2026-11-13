import test from 'node:test';
import assert from 'node:assert/strict';
import relay from '../api/extension-analytics.js';

const storeOrigin = 'chrome-extension://ffpljgmbiankjaokoefefmkoghcgoodn';
const edgeOrigin = 'chrome-extension://mhfmejfcbgojopoeakmglpgmlokpdjjg';
const devOrigin = 'chrome-extension://gopiiihaachagcmaijfaphjijefgbgnk';
const event = {
  clientId: '1405143245.715397391',
  sessionId: 1760000000,
  version: '2.0.1',
  event: 'extension_open',
  surface: 'capture',
};

function request(origin, body, method = 'POST') {
  return new Request('https://microsoft-todo-capture-site.vercel.app/api/extension-analytics/', {
    method,
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
  });
}

test('relay accepts the production extension and forwards only approved fields', async t => {
  const previousEnvironment = { VERCEL_ENV: process.env.VERCEL_ENV, GA_EXTENSION_API_SECRET: process.env.GA_EXTENSION_API_SECRET };
  t.after(() => {
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  process.env.VERCEL_ENV = 'production';
  process.env.GA_EXTENSION_API_SECRET = 'test-placeholder';
  const upstream = t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }));

  assert.equal((await relay.fetch(request('https://example.com', event))).status, 403);
  assert.equal((await relay.fetch(request(devOrigin, event))).status, 403);
  const preflight = await relay.fetch(request(storeOrigin, null, 'OPTIONS'));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), storeOrigin);
  assert.equal((await relay.fetch(request(storeOrigin, { ...event, surface: 'https://example.com' }))).status, 400);
  assert.equal((await relay.fetch(request(storeOrigin, { ...event, event: 'page_view' }))).status, 400);
  assert.equal((await relay.fetch(request(storeOrigin, { ...event, sessionId: '1760000000' }))).status, 400);
  assert.equal((await relay.fetch(request(storeOrigin, { ...event, note: 'x'.repeat(1024) }))).status, 413);
  assert.equal(upstream.mock.callCount(), 0);

  const response = await relay.fetch(request(storeOrigin, { ...event, note: 'private', accountId: 'private', source: 'https://example.com' }));
  assert.equal(response.status, 204);
  assert.equal(upstream.mock.callCount(), 1);
  const [url, options] = upstream.mock.calls[0].arguments;
  assert.equal(url.origin + url.pathname, 'https://www.google-analytics.com/mp/collect');
  assert.equal(url.searchParams.get('measurement_id'), 'G-Q2114CB24F');
  assert.deepEqual(JSON.parse(options.body), {
    client_id: event.clientId,
    consent: { ad_user_data: 'DENIED', ad_personalization: 'DENIED' },
    events: [{
      name: 'extension_open',
      params: { session_id: event.sessionId, engagement_time_msec: 1, extension_version: event.version, extension_browser: 'chrome', surface: 'capture' },
    }],
  });

  const edgePreflight = await relay.fetch(request(edgeOrigin, null, 'OPTIONS'));
  assert.equal(edgePreflight.status, 204);
  assert.equal(edgePreflight.headers.get('Access-Control-Allow-Origin'), edgeOrigin);
  const newEvent = { event: 'task_created', version: '2.0.5' };
  for (const [origin, browser] of [[storeOrigin, 'chrome'], [edgeOrigin, 'edge']]) {
    const response = await relay.fetch(request(origin, newEvent));
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
    const body = JSON.parse(upstream.mock.calls.at(-1).arguments[1].body);
    assert.notEqual(body.client_id, event.clientId);
    assert.deepEqual(body.events, [{ name: 'task_created', params: { extension_version: '2.0.5', extension_browser: browser } }]);
  }
  assert.equal((await relay.fetch(request(edgeOrigin, event))).status, 400);

  process.env.VERCEL_ENV = 'preview';
  delete process.env.GA_EXTENSION_API_SECRET;
  assert.equal((await relay.fetch(request(devOrigin, event))).status, 503);
  assert.equal((await relay.fetch(request(storeOrigin, event))).status, 403);
  assert.equal((await relay.fetch(request(edgeOrigin, newEvent))).status, 403);
  assert.equal(upstream.mock.callCount(), 3);
});
