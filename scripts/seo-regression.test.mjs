import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const scriptSource = await readFile(new URL('scripts/sync-post-sitemap.mjs', root), 'utf8');

function entries(count, lastmod = '2026-10-01') {
  return Array.from({ length: count }, (_, index) => ({
    loc: `https://as-ent-tw.com/post/test-${index}`,
    lastmod
  }));
}

function xmlFor(list) {
  return list.map((entry) => `<url><loc>${entry.loc}</loc><lastmod>${entry.lastmod}</lastmod></url>`).join('');
}

async function simulateSitemap({
  status = 200,
  sourceFails = false,
  existingXml,
  existingErrorCode,
  entryCount = 51,
  sourceXml,
  failAll = false
} = {}) {
  const writes = [];
  const warnings = [];
  const logs = [];
  const delays = [];
  const fetches = [];
  let articleAttempts = 0;
  const generatedXml = sourceXml ?? xmlFor(entries(entryCount));
  const context = vm.createContext({
    URL, AbortSignal,
    console: {
      log(message) { logs.push(String(message)); },
      warn(message) { warnings.push(String(message)); }
    },
    setTimeout: (callback, ms) => {
      delays.push(ms);
      callback();
    },
    readFile: async () => {
      if (existingErrorCode) {
        const error = new Error('unable to read sitemap');
        error.code = existingErrorCode;
        throw error;
      }
      if (existingXml === undefined) {
        const error = new Error('missing sitemap');
        error.code = 'ENOENT';
        throw error;
      }
      return existingXml;
    },
    writeFile: async (...args) => writes.push(args),
    fetch: async (url, options) => {
      assert.ok(options.signal, 'Every network request has a timeout');
      fetches.push(String(url));
      if (sourceFails) throw new Error('offline');
      const isSource = String(url).endsWith('/sitemap.xml');
      if (isSource) {
        assert.match(options.headers.Accept, /xml/);
        return {
          ok: true,
          status: 200,
          text: async () => generatedXml,
          body: { cancel: async () => {} }
        };
      }

      assert.equal(options.redirect, 'manual');
      let code = 200;
      if (failAll || String(url).endsWith('/test-0')) {
        code = Array.isArray(status)
          ? status[Math.min(articleAttempts, status.length - 1)]
          : status;
        articleAttempts += 1;
      }
      if (code === 0) throw new Error('network error');
      return {
        ok: code === 200,
        status: code,
        text: async () => generatedXml,
        body: { cancel: async () => {} }
      };
    }
  });
  const code = scriptSource
    .replace("import { readFile, writeFile } from 'node:fs/promises';", '')
    .replace('import.meta.url', JSON.stringify(new URL('scripts/sync-post-sitemap.mjs', root).href));
  let error;
  try { await new vm.Script(`(async () => { ${code} })()`).runInContext(context); }
  catch (caught) { error = caught; }
  return { writes, error, warnings, logs, delays, fetches };
}

test('valid sitemap writes all verified entries', async () => {
  const { writes, error, delays } = await simulateSitemap();
  assert.equal(error, undefined);
  assert.equal(writes.length, 1);
  assert.equal((writes[0][1].match(/<url>/g) || []).length, 51);
  assert.equal(delays.length, 50);
  assert.ok(delays.every((delay) => delay === 400));
});

test('retries a transient article failure with 1s, 3s, and 9s backoff', async () => {
  const { writes, error, delays } = await simulateSitemap({ status: [404, 500, 503, 200] });
  assert.equal(error, undefined);
  assert.equal(writes.length, 1);
  assert.ok(writes[0][1].includes('/post/test-0</loc>'));
  assert.deepEqual(delays.slice(0, 3), [1000, 3000, 9000]);
  assert.ok(delays.slice(3).every((delay) => delay === 400));
});

test('does not rewrite or live-check when source and sitemap already match', async () => {
  const body = xmlFor([...entries(51)].reverse());
  const { writes, error, fetches, delays, logs } = await simulateSitemap({
    existingXml: body,
    status: 404,
    failAll: true
  });
  assert.equal(error, undefined);
  assert.equal(writes.length, 0);
  assert.equal(delays.length, 0);
  assert.deepEqual(fetches, ['https://polished-truth-9fc2.angus061855.workers.dev/sitemap.xml']);
  assert.match(logs.join('\n'), /already matches source \(51 URLs\)/);
});

test('checked-in sitemap is treated as already published when source matches it', async () => {
  const xml = await readFile(new URL('../sitemap-posts.xml', import.meta.url), 'utf8');
  const { writes, error, fetches, logs } = await simulateSitemap({
    sourceXml: xml,
    existingXml: xml,
    status: 404,
    failAll: true
  });
  assert.equal(error, undefined);
  assert.equal(writes.length, 0);
  assert.equal(fetches.filter((url) => url.includes('/post/')).length, 0);
  assert.match(logs.join('\n'), /already matches source \(([1-9]\d*) URLs\)/);
});

test('only live-checks a URL whose lastmod changed', async () => {
  const current = entries(51);
  const previous = current.map((entry, index) => (
    index === 0 ? { ...entry, lastmod: '2026-09-01' } : entry
  ));
  const { writes, error, fetches } = await simulateSitemap({
    existingXml: xmlFor(previous)
  });
  assert.equal(error, undefined);
  assert.deepEqual(
    fetches.filter((url) => url.includes('/post/')),
    ['https://as-ent-tw.com/post/test-0']
  );
  assert.equal(writes.length, 1);
  assert.equal(writes[0][1].includes('2026-09-01'), false);
  assert.ok(writes[0][1].includes('/post/test-0</loc>'));
});

test('adds a new URL only after it returns 200', async () => {
  const { writes, error, fetches } = await simulateSitemap({
    existingXml: xmlFor(entries(51).slice(1))
  });
  assert.equal(error, undefined);
  assert.deepEqual(
    fetches.filter((url) => url.includes('/post/')),
    ['https://as-ent-tw.com/post/test-0']
  );
  assert.equal((writes[0][1].match(/<url>/g) || []).length, 51);
});

for (const status of [0, 302, 304, 307, 403, 404, 408, 429, 500, 503]) {
  test(`warns and omits a new article on uncertain HTTP ${status}`, async () => {
    const { writes, error, warnings } = await simulateSitemap({ status });
    const label = status || 'network error';
    assert.equal(error, undefined);
    assert.equal(writes.length, 1);
    assert.equal((writes[0][1].match(/<url>/g) || []).length, 50);
    assert.equal(writes[0][1].includes('/post/test-0</loc>'), false);
    assert.ok(warnings.some((warning) => warning.startsWith('::warning::')
      && warning.includes(`/post/test-0`)
      && warning.includes(`(${label})`)
      && warning.includes('not adding it')));
  });
}

test('keeps the previous entry when a changed URL still fails', async () => {
  const current = entries(51);
  const previous = current.map((entry, index) => (
    index === 0 ? { ...entry, lastmod: '2026-09-01' } : entry
  ));
  const { writes, error, warnings, fetches } = await simulateSitemap({
    existingXml: xmlFor(previous),
    status: 404
  });
  assert.equal(error, undefined);
  assert.equal(writes.length, 0);
  assert.equal(fetches.filter((url) => url.endsWith('/test-0')).length, 4);
  assert.ok(warnings.some((warning) => warning.startsWith('::warning::')
    && warning.includes('keeping the existing sitemap entry')));
});

test('drops an unverifiable new URL without failing or rewriting the rest', async () => {
  const { writes, error, warnings } = await simulateSitemap({
    existingXml: xmlFor(entries(51).slice(1)),
    status: 404
  });
  assert.equal(error, undefined);
  assert.equal(writes.length, 0);
  assert.ok(warnings.some((warning) => warning.includes('not adding it')
    && warning.includes('/post/test-0')));
});

for (const status of [301, 308, 410]) {
  test(`excludes confirmed redirect or removal HTTP ${status}`, async () => {
    const { writes, error, warnings } = await simulateSitemap({ status });
    assert.equal(error, undefined);
    assert.equal((writes[0][1].match(/<url>/g) || []).length, 50);
    assert.equal(writes[0][1].includes('/post/test-0</loc>'), false);
    assert.ok(warnings.some((warning) => warning === `Excluded ${status}: https://as-ent-tw.com/post/test-0`));
  });
}

test('retains an article that recovers from transient 404 and 500 responses', async () => {
  const { writes, error, delays } = await simulateSitemap({ status: [404, 500, 200] });
  assert.equal(error, undefined);
  assert.equal(writes.length, 1);
  assert.equal((writes[0][1].match(/<url>/g) || []).length, 51);
  assert.ok(writes[0][1].includes('/post/test-0</loc>'));
  assert.deepEqual(delays.slice(0, 2), [1000, 3000]);
});

test('source failure never overwrites sitemap', async () => {
  const { writes, error } = await simulateSitemap({ sourceFails: true });
  assert.match(error.message, /Unable to fetch/);
  assert.equal(writes.length, 0);
});

test('source with no post URLs never overwrites sitemap', async () => {
  const { writes, error } = await simulateSitemap({ sourceXml: '<urlset></urlset>' });
  assert.match(error.message, /no same-site post URLs/);
  assert.equal(writes.length, 0);
});

test('refuses to publish fewer than 50 articles', async () => {
  const { writes, error } = await simulateSitemap({ entryCount: 49 });
  assert.match(error.message, /Only 49 article URLs passed verification; refusing to replace sitemap/);
  assert.equal(writes.length, 0);
});

test('still fails when uncertain URLs leave fewer than 50 publishable articles', async () => {
  const { writes, error, warnings } = await simulateSitemap({ status: 404, failAll: true });
  assert.match(error.message, /Only 0 article URLs passed verification; refusing to replace sitemap/);
  assert.equal(writes.length, 0);
  assert.equal(warnings.length, 51);
  assert.ok(warnings.every((warning) => warning.startsWith('::warning::')));
});

test('a matching sitemap below the publish floor is left unchanged', async () => {
  const { writes, error, fetches } = await simulateSitemap({
    entryCount: 40,
    existingXml: xmlFor(entries(40)),
    status: 404,
    failAll: true
  });
  assert.equal(error, undefined);
  assert.equal(writes.length, 0);
  assert.equal(fetches.filter((url) => url.includes('/post/')).length, 0);
});

test('an unreadable existing sitemap fails without writing', async () => {
  const { writes, error } = await simulateSitemap({ existingErrorCode: 'EACCES' });
  assert.match(error.message, /Unable to read existing article sitemap: EACCES/);
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

test('blog contains crawlable article links without JavaScript', async () => {
  const html = await readFile(new URL('blog.html', root), 'utf8');
  const initial = html.split('id="blog-grid">')[1].split('<button class="blog-load-more"')[0];
  for (const path of ['/guides/hotel-pr-guide/', '/post/post-20260831-183650', '/post/post-20260611-154415']) {
    assert.ok(initial.includes(`href="${path}"`));
  }
  assert.ok(!initial.includes('載入中'));
});
