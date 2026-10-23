import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('scripts/sync-post-sitemap.mjs', root), 'utf8');

async function simulateSitemap(status = 200, sourceFails = false) {
  const writes = [];
  let articleAttempts = 0;
  const entries = Array.from({ length: 51 }, (_, index) =>
    `<url><loc>https://as-ent-tw.com/post/test-${index}</loc><lastmod>2026-10-01</lastmod></url>`
  ).join('');
  const context = vm.createContext({
    URL, AbortSignal,
    console: { log() {}, warn() {} },
    setTimeout: (callback) => callback(),
    writeFile: async (...args) => writes.push(args),
    fetch: async (url, options) => {
      assert.ok(options.signal, 'Every network request has a timeout');
      if (sourceFails) throw new Error('offline');
      const isSource = String(url).endsWith('/sitemap.xml');
      let code = 200;
      if (!isSource && String(url).endsWith('/test-0')) {
        code = Array.isArray(status)
          ? status[Math.min(articleAttempts, status.length - 1)]
          : status;
        articleAttempts += 1;
      }
      if (code === 0) throw new Error('network error');
      return { ok: code === 200, status: code, text: async () => entries,
        body: { cancel: async () => {} } };
    }
  });
  const code = source.replace("import { writeFile } from 'node:fs/promises';", '')
    .replace('import.meta.url', JSON.stringify(new URL('scripts/sync-post-sitemap.mjs', root).href));
  let error;
  try { await new vm.Script(`(async () => { ${code} })()`).runInContext(context); }
  catch (caught) { error = caught; }
  return { writes, error };
}

test('valid sitemap writes all verified entries', async () => {
  const { writes, error } = await simulateSitemap();
  assert.equal(error, undefined);
  assert.equal(writes.length, 1);
  assert.equal((writes[0][1].match(/<url>/g) || []).length, 51);
});

for (const status of [0, 302, 304, 307, 403, 404, 408, 429, 500, 503]) {
  test(`preserves sitemap on uncertain HTTP ${status}`, async () => {
    const { writes, error } = await simulateSitemap(status);
    assert.match(error.message, /preserving the existing sitemap/);
    assert.equal(writes.length, 0);
  });
}

for (const status of [301, 308, 410]) {
  test(`excludes confirmed redirect or removal HTTP ${status}`, async () => {
    const { writes, error } = await simulateSitemap(status);
    assert.equal(error, undefined);
    assert.equal((writes[0][1].match(/<url>/g) || []).length, 50);
  });
}

test('retains an article that recovers from transient 404 and 500 responses', async () => {
  const { writes, error } = await simulateSitemap([404, 500, 200]);
  assert.equal(error, undefined);
  assert.equal(writes.length, 1);
  assert.equal((writes[0][1].match(/<url>/g) || []).length, 51);
  assert.ok(writes[0][1].includes('/post/test-0</loc>'));
});

test('source failure never overwrites sitemap', async () => {
  const { writes, error } = await simulateSitemap(200, true);
  assert.match(error.message, /Unable to fetch/);
  assert.equal(writes.length, 0);
});

test('guide resolves author and publisher within the same graph', async () => {
  const html = await readFile(new URL('guides/hotel-pr-guide/index.html', root), 'utf8');
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const article = graph.find(node => node['@type'] === 'Article');
  for (const field of ['author', 'publisher']) {
    const entity = graph.find(node => node['@id'] === article[field]['@id']);
    assert.ok(entity?.name && entity?.url);
  }
});

test('empty post shell and legacy slug URLs leave the noindex shell', async () => {
  const html = await readFile(new URL('post.html', root), 'utf8');
  const start = html.indexOf('function legacyShellDecision');
  const end = html.indexOf('(function () {', start);
  const context = vm.createContext({ URLSearchParams, encodeURIComponent });
  vm.runInContext(html.slice(start, end), context);
  const { legacyShellDecision, legacyShellAfterLookup } = context;
  const plain = (value) => JSON.parse(JSON.stringify(value));
  assert.deepEqual(plain(legacyShellDecision('/post', '')), { canonical: 'https://as-ent-tw.com/blog', replace: '/blog' });
  assert.deepEqual(plain(legacyShellDecision('/post.html', '')), { canonical: 'https://as-ent-tw.com/blog', replace: '/blog' });
  assert.deepEqual(plain(legacyShellDecision('/post/', '?slug=')), { canonical: 'https://as-ent-tw.com/blog', replace: '/blog' });
  const dated = legacyShellDecision('/post.html', '?slug=post-20260424-110057');
  assert.equal(dated.canonical, 'https://as-ent-tw.com/post/post-20260424-110057');
  assert.equal(dated.replace, null);
  assert.deepEqual(plain(legacyShellAfterLookup(dated, true)), {
    canonical: 'https://as-ent-tw.com/post/post-20260424-110057',
    replace: '/post/post-20260424-110057'
  });
  assert.deepEqual(plain(legacyShellAfterLookup(legacyShellDecision('/post.html', '?slug=post-20260423-131611'), false)), {
    canonical: 'https://as-ent-tw.com/blog',
    replace: '/blog'
  });
  assert.equal(legacyShellDecision('/post.html', '?slug=20260424-110057').pathUrl, '/post/post-20260424-110057');
  assert.equal(legacyShellAfterLookup(legacyShellDecision('/post.html', '?slug=post-1'), null).replace, '/post/post-1');
  assert.equal(legacyShellDecision('/post.html', '?slug=../admin').replace, '/blog');
  assert.equal(legacyShellDecision('/post/post-1', ''), null);
  assert.match(html, /<link rel="canonical" href="https:\/\/as-ent-tw.com\/blog"\/>/);
  assert.match(html, /location\.replace\(decision\.replace\)/);
  assert.match(html, /function canonicalPostExists\(pathUrl\)/);
  assert.match(html, /method: 'HEAD', redirect: 'manual'/);
  assert.match(html, /await canonicalPostExists\(shell\.pathUrl\)/);
});

test('brand noindex page canonical points at itself', async () => {
  const html = await readFile(new URL('brand/index.html', root), 'utf8');
  assert.match(html, /<meta name="robots" content="noindex, follow" \/>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/as-ent-tw.com\/brand\/" \/>/);
  assert.equal(html.includes('<link rel="canonical" href="https://as-ent-tw.com/contact" />'), false);
});

test('privacy email stays readable and is excluded from Cloudflare rewriting', async () => {
  const html = await readFile(new URL('privacy.html', root), 'utf8');
  assert.match(html, /<!--email_off--><a href="mailto:angus061855@gmail.com">angus061855@gmail.com<\/a><!--email_on-->/);
  assert.equal(html.includes('/cdn-cgi/l/email-protection'), false);
});

test('blog contains crawlable article links without JavaScript', async () => {
  const html = await readFile(new URL('blog.html', root), 'utf8');
  const initial = html.split('id="blog-grid">')[1].split('<button class="blog-load-more"')[0];
  for (const path of ['/guides/hotel-pr-guide/', '/post/post-20260831-183650', '/post/post-20260611-154415']) {
    assert.ok(initial.includes(`href="${path}"`));
  }
  assert.ok(!initial.includes('載入中'));
});
