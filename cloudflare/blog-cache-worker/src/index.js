const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

const STALE_TTL = 7 * 24 * 3600;

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

async function fetchOriginWithRetry(env, originUrl, accept) {
  let response;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await env.ORIGIN_WORKER.fetch(originUrl, {
        headers: { Accept: accept }
      });
    } catch (error) {
      if (attempt === 1) throw error;
      continue;
    }

    if (response.status < 500 || attempt === 1) return response;
  }
  return response;
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

    const originUrl = new URL(requestUrl.pathname + requestUrl.search, requestUrl.origin);
    const staleKey = new Request(new URL('/__stale__' + requestUrl.pathname + requestUrl.search, requestUrl.origin).toString(), { method: 'GET' });
    let originResponse;
    try {
      originResponse = await fetchOriginWithRetry(
        env,
        originUrl,
        request.headers.get('Accept') || '*/*'
      );
    } catch (error) {
      console.error(JSON.stringify({ event: 'origin_fetch_failed', path: requestUrl.pathname }));
      originResponse = null;
    }

    if (originResponse && originResponse.ok) {
      const response = responseWithHeaders(originResponse, {
        'Cache-Control': `public, max-age=60, s-maxage=${ttl}`,
        'X-AS-Cache': 'MISS'
      });
      // 一份正常快取（ttl）＋ 一份備用快取（7 天），來源失敗時用備用快取頂住
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      ctx.waitUntil(cache.put(staleKey, responseWithHeaders(response.clone(), {
        'Cache-Control': `public, s-maxage=${STALE_TTL}`
      })));
      return response;
    }

    // 來源失敗或回 404/5xx：先用備用快取
    const stale = await cache.match(staleKey);
    if (stale) {
      console.warn(JSON.stringify({ event: 'served_stale', path: requestUrl.pathname, status: originResponse?.status ?? 'error' }));
      return responseWithHeaders(stale, { 'X-AS-Cache': 'STALE', 'Cache-Control': 'public, max-age=60' });
    }

    // 文章 404：只有確定不在文章清單裡才回真正的 404，否則視為暫時錯誤（503）
    if (originResponse && originResponse.status === 404 && requestUrl.pathname.startsWith('/posts/')) {
      const slug = decodeURIComponent(requestUrl.pathname.slice('/posts/'.length));
      const listed = await slugIsListed(env, cache, requestUrl.origin, slug);
      if (listed === false) {
        return Response.json({ error: 'Not found' }, { status: 404, headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=300' } });
      }
    } else if (originResponse && originResponse.status < 500) {
      return responseWithHeaders(originResponse, { 'Cache-Control': 'no-store', 'X-AS-Cache': 'MISS' });
    }

    return Response.json(
      { error: 'Article service temporarily unavailable' },
      { status: 503, headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store', 'Retry-After': '120' } }
    );
  }
};

// 回傳 true（在清單中）、false（確定不在）、null（無法確認）
async function slugIsListed(env, cache, origin, slug) {
  const listKey = new Request(new URL('/posts', origin).toString(), { method: 'GET' });
  const staleListKey = new Request(new URL('/__stale__/posts', origin).toString(), { method: 'GET' });
  let res = (await cache.match(listKey)) || (await cache.match(staleListKey));
  if (!res) {
    try { res = await fetchOriginWithRetry(env, new URL('/posts', origin), 'application/json'); }
    catch { return null; }
  }
  if (!res || !res.ok) return null;
  try {
    const posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) return null;
    return posts.some(p => p && p.slug === slug);
  } catch { return null; }
}
