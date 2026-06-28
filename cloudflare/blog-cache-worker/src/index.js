const ORIGIN = 'https://polished-truth-9fc2.angus061855.workers.dev';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

function cacheTtl(pathname) {
  if (pathname === '/posts') return 300;
  if (pathname === '/sitemap.xml') return 3600;
  if (pathname.startsWith('/posts/')) return 1800;
  return 0;
}

function responseWithHeaders(response, extraHeaders) {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value));
  Object.entries(extraHeaders).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
      return Response.json(
        { error: 'Method not allowed' },
        { status: 405, headers: { ...CORS_HEADERS, Allow: 'GET, OPTIONS' } }
      );
    }

    const requestUrl = new URL(request.url);
    const ttl = cacheTtl(requestUrl.pathname);
    if (!ttl) {
      return Response.json(
        { error: 'Not found' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const cache = caches.default;
    const cacheKey = new Request(requestUrl.toString(), { method: 'GET' });
    const cached = await cache.match(cacheKey);
    if (cached) {
      return responseWithHeaders(cached, { 'X-AS-Cache': 'HIT' });
    }

    const originUrl = new URL(requestUrl.pathname + requestUrl.search, ORIGIN);
    let originResponse;
    try {
      originResponse = await fetch(originUrl, {
        headers: { Accept: request.headers.get('Accept') || '*/*' }
      });
    } catch (error) {
      console.error(JSON.stringify({ event: 'origin_fetch_failed', path: requestUrl.pathname }));
      return Response.json(
        { error: 'Article service temporarily unavailable' },
        { status: 502, headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' } }
      );
    }

    const cacheControl = originResponse.ok
      ? `public, max-age=60, s-maxage=${ttl}`
      : 'no-store';
    const response = responseWithHeaders(originResponse, {
      'Cache-Control': cacheControl,
      'X-AS-Cache': 'MISS'
    });

    if (originResponse.ok) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  }
};
