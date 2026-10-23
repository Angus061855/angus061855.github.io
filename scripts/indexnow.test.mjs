import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  HOST, SITE, SITEMAP_URLS, chooseUrls, fileToUrl, findKey, submitIndexNow, urlsFromSitemapXml,
} from './indexnow.mjs';

test('頁面路徑對應到正式網址', () => {
  assert.equal(fileToUrl('index.html'), `${SITE}/`);
  assert.equal(fileToUrl('jobs.html'), `${SITE}/jobs`);
  assert.equal(fileToUrl('highlights/index.html'), `${SITE}/highlights/`);
  assert.equal(fileToUrl('post/post-20261023-120000.html'), `${SITE}/post/post-20261023-120000`);
  assert.equal(fileToUrl('robots.txt'), `${SITE}/robots.txt`);
  assert.equal(fileToUrl('sitemap.xml'), `${SITE}/sitemap.xml`);
  assert.equal(fileToUrl('404.html'), null);
  assert.equal(fileToUrl('site.css'), null);
  assert.equal(fileToUrl('scripts/indexnow.mjs'), null);
});

test('沒有頁面變更時改送 sitemap 網址，而且一律帶上 sitemap', () => {
  const pages = chooseUrls(['https://as-ent-tw.com/jobs'], ['https://as-ent-tw.com/about']);
  assert.deepEqual(pages, [...SITEMAP_URLS, 'https://as-ent-tw.com/jobs']);
  const fallback = chooseUrls([], ['https://as-ent-tw.com/about', 'https://as-ent-tw.com/blog']);
  assert.deepEqual(fallback, [...SITEMAP_URLS, 'https://as-ent-tw.com/about', 'https://as-ent-tw.com/blog']);
});

test('解析 sitemap 的 loc', () => {
  const urls = urlsFromSitemapXml('<url><loc>https://as-ent-tw.com/jobs</loc></url><loc>https://example.com/no</loc>');
  assert.deepEqual(urls, ['https://as-ent-tw.com/jobs']);
});

test('根目錄金鑰檔內容與檔名相同', () => {
  const key = findKey();
  assert.match(key, /^[a-f0-9]{8,128}$/);
  assert.equal(readFileSync(new URL(`../${key}.txt`, import.meta.url), 'utf8').trim(), key);
  assert.equal(fileToUrl(`${key}.txt`), `${SITE}/${key}.txt`);
});

test('IndexNow 回傳錯誤時不丟出例外', async () => {
  const result = await submitIndexNow({
    key: 'abc12345',
    urls: [`${SITE}/`],
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      assert.equal(body.host, HOST);
      assert.equal(body.keyLocation, `${SITE}/abc12345.txt`);
      assert.deepEqual(body.urlList, [`${SITE}/`]);
      return { ok: false, status: 403, text: async () => 'key not found yet' };
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.results[0].status, 403);
});

test('連線失敗時不丟出例外', async () => {
  const result = await submitIndexNow({
    key: 'abc12345',
    urls: [`${SITE}/`],
    fetchImpl: async () => { throw new Error('offline'); },
  });
  assert.equal(result.ok, false);
  assert.equal(result.results[0].status, 0);
  assert.match(result.results[0].body, /offline/);
});
