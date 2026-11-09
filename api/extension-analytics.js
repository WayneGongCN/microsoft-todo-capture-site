const storeOrigin = 'chrome-extension://ffpljgmbiankjaokoefefmkoghcgoodn';
const developmentOrigin = 'chrome-extension://gopiiihaachagcmaijfaphjijefgbgnk';
const measurementId = 'G-Q2114CB24F';
const maxBodyLength = 1024;

/** 只将固定事件和经过验证的统计字段转交给 GA4。 */
function measurementPayload(input) {
  if (
    !input ||
    typeof input.clientId !== 'string' ||
    !/^[1-9]\d{0,9}\.[1-9]\d{0,9}$/.test(input.clientId) ||
    !Number.isSafeInteger(input.sessionId) ||
    input.sessionId <= 0 ||
    typeof input.version !== 'string' ||
    !/^\d{1,5}(\.\d{1,5}){1,3}$/.test(input.version)
  ) return null;

  const { event, surface } = input;
  const params = { session_id: input.sessionId, engagement_time_msec: 1, extension_version: input.version };
  if (event === 'extension_open' && ['popup', 'capture', 'options'].includes(surface)) {
    params.surface = surface;
  } else if (event !== 'task_created') {
    return null;
  }

  return {
    client_id: input.clientId,
    consent: { ad_user_data: 'DENIED', ad_personalization: 'DENIED' },
    events: [{ name: event, params }],
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get('origin');
    const production = process.env.VERCEL_ENV === 'production';
    const expectedOrigin = production ? storeOrigin : developmentOrigin;
    const headers = { 'Cache-Control': 'no-store', Vary: 'Origin' };
    if (origin !== expectedOrigin) return new Response(null, { status: 403, headers });

    headers['Access-Control-Allow-Origin'] = origin;
    if (request.method === 'OPTIONS') {
      headers['Access-Control-Allow-Methods'] = 'POST';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { ...headers, Allow: 'OPTIONS, POST' } });
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json')
      return new Response(null, { status: 415, headers });
    if (Number(request.headers.get('content-length')) > maxBodyLength)
      return new Response(null, { status: 413, headers });

    let payload;
    try {
      const body = await request.text();
      if (body.length > maxBodyLength) return new Response(null, { status: 413, headers });
      payload = measurementPayload(JSON.parse(body));
    } catch {
      return new Response(null, { status: 400, headers });
    }
    if (!payload) return new Response(null, { status: 400, headers });

    const secret = process.env.GA_EXTENSION_API_SECRET;
    if (!secret) return new Response(null, { status: 503, headers });

    const url = new URL('https://www.google-analytics.com/mp/collect');
    url.searchParams.set('measurement_id', measurementId);
    url.searchParams.set('api_secret', secret);
    try {
      const result = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(3500),
      });
      return new Response(null, { status: result.ok ? 204 : 502, headers });
    } catch {
      return new Response(null, { status: 502, headers });
    }
  },
};
