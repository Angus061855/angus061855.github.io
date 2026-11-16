// 全站靜態品質檢查（不連網）：sitemap 與轉址一致、站內連結不指向轉址或不存在的頁面、主要頁面 metadata 完整。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { POST_REDIRECTS, isRedirectedSlug } from './post-redirects.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const exists = (p) => access(new URL(p, root)).then(() => true, () => false);

const MAIN_PAGES = [
  ['index.html', '/'], ['about.html', '/about'], ['jobs.html', '/jobs'], ['knowledge.html', '/knowledge'],
  ['blog.html', '/blog'], ['contact.html', '/contact'], ['privacy.html', '/privacy'], ['disclaimer.html', '/disclaimer'],
  ['highlights/index.html', '/highlights/'], ['guides/hotel-pr-guide/index.html', '/guides/hotel-pr-guide/'],
  ['guides/hotel-pr-salary/index.html', '/guides/hotel-pr-salary/'], ['guides/hotel-contract/index.html', '/guides/hotel-contract/'],
  ['guides/choose-agent/index.html', '/guides/choose-agent/'], ['guides/is-hotel-work-safe/index.html', '/guides/is-hotel-work-safe/'],
  ['tools/alias-generator/index.html', '/tools/alias-generator/'], ['tools/time-calculator/index.html', '/tools/time-calculator/']
];

test('轉址對照表格式正確，目標都是存在的指南頁', async () => {
  const slugs = Object.keys(POST_REDIRECTS);
  assert.ok(slugs.length >= 45);
  for (const [slug, target] of Object.entries(POST_REDIRECTS)) {
    assert.match(slug, /^post-\d{8}-\d{6}$/);
    assert.match(target, /^\/guides\/[a-z-]+\/$/);
    assert.ok(await exists(`${target.slice(1)}index.html`), `${slug} 指向不存在的 ${target}`);
  }
});

test('sitemap-posts.xml 不含轉址網址，也沒有重複', async () => {
  const xml = await read('sitemap-posts.xml');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length >= 50);
  assert.equal(new Set(locs).size, locs.length);
  const bad = locs.filter((loc) => isRedirectedSlug(loc.split('/post/')[1]));
  assert.deepEqual(bad, []);
});

test('sitemap-static.xml 列出所有主要頁面', async () => {
  const xml = await read('sitemap-static.xml');
  for (const [, path] of MAIN_PAGES) assert.ok(xml.includes(`<loc>https://as-ent-tw.com${path}</loc>`), `缺 ${path}`);
});

test('主要頁面都有唯一 title、description、canonical 與單一 h1', async () => {
  const titles = new Map();
  for (const [file, path] of MAIN_PAGES) {
    const html = await read(file);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
    assert.ok(title, `${file} 缺 title`);
    assert.ok(!titles.has(title), `${file} 與 ${titles.get(title)} title 重複`);
    titles.set(title, file);
    assert.match(html, /<meta name="description" content="[^"]{30,}"/, `${file} 缺 description`);
    assert.ok(html.includes(`<link rel="canonical" href="https://as-ent-tw.com${path}"`), `${file} canonical 不是 ${path}`);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${file} h1 數量不是 1`);
  }
});

test('主要頁面的站內連結不指向轉址文章或不存在的頁面', async () => {
  const problems = [];
  for (const [file] of MAIN_PAGES) {
    const html = await read(file);
    // 排除 <script> 內的樣板字串
    const markup = html.replace(/<script[\s\S]*?<\/script>/g, '');
    for (const [, href] of markup.matchAll(/href="(\/[^"#?]*)/g)) {
      const slug = href.match(/^\/post\/([A-Za-z0-9-]+)$/)?.[1];
      if (slug && isRedirectedSlug(slug)) { problems.push(`${file} → ${href}（已轉址）`); continue; }
      if (slug || /\.(css|js|ico|webp|png|jpe?g|svg|xml|txt|json)$/.test(href)) continue;
      const clean = href.replace(/^\//, '');
      const candidates = clean === '' ? ['index.html'] : [clean, `${clean}.html`, `${clean.replace(/\/$/, '')}/index.html`];
      let found = false;
      for (const c of candidates) if (await exists(c)) { found = true; break; }
      if (!found) problems.push(`${file} → ${href}（找不到檔案）`);
    }
  }
  assert.deepEqual(problems, []);
});

test('結構化資料 JSON-LD 都能解析', async () => {
  for (const [file] of MAIN_PAGES) {
    const html = await read(file);
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      assert.doesNotThrow(() => JSON.parse(json), `${file} JSON-LD 解析失敗`);
    }
  }
});

test('首頁不再殘留追蹤碼佔位字串', async () => {
  const html = await read('index.html');
  assert.ok(!/XXXXXXXXXX|G-XXXXXXXX/.test(html));
});
