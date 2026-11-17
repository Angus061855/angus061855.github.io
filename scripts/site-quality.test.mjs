// 全站靜態品質檢查（不連網）：sitemap 與轉址一致、站內連結不指向轉址或不存在的頁面、主要頁面 metadata 完整。
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
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

// ── 2026-11-17 第二輪：虛構統計、單一事實來源、字型、版面位移、文章索引 ──
const LIVE_PAGES = [...MAIN_PAGES.map(([f]) => f), 'post.html', '404.html', 'work-landing.html', 'landing-b/index.html', 'brand/index.html', 'brand-old/index.html'];

test('不再有公式或寫死的「本週詢問」「瀏覽數」統計', async () => {
  const bad = [];
  for (const f of [...LIVE_PAGES, 'site.js', 'landing-b/landing-b.js']) {
    const t = await read(f);
    for (const re of [/本週已有/, /累計瀏覽/, /次瀏覽/, /calcViews|getBaseViews|getDailyAdd|calcTotalViews|setTotalViews|initWeeklyCount|initTotalViews/, /weeklyBase/]) {
      if (re.test(t)) bad.push(`${f} ${re}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('面試人數靜態起始值全站與 site-config.js 一致', async () => {
  const { readInterviewCount, FACT_FILES, findNumbers } = await import('./sync-site-facts.mjs');
  const count = readInterviewCount();
  const wrong = [];
  for (const f of FACT_FILES) for (const n of findNumbers(await read(f))) if (n.value !== count) wrong.push(`${f}: ${n.value}`);
  assert.deepEqual(wrong, []);
});

test('全站只用一種 Google Fonts 組合，且不阻擋繪製', async () => {
  const urls = new Set();
  for (const f of LIVE_PAGES) {
    const t = await read(f);
    for (const [, u] of t.matchAll(/(https:\/\/fonts\.googleapis\.com\/css2[^"']+)/g)) urls.add(u);
    const blocking = t.replace(/<noscript>[\s\S]*?<\/noscript>/g, '').match(/<link[^>]+href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"[^>]*rel="stylesheet"/);
    assert.equal(blocking, null, `${f} 以 rel=stylesheet 阻擋載入 Google Fonts`);
  }
  assert.equal(urls.size, 1, [...urls].join('\n'));
});

test('背景 canvas 與首屏 hero 不依賴 JS 才定位／顯示（CLS、LCP）', async () => {
  const css = await read('ui-safety.css');
  assert.match(css, /#velvet-bg\s*\{[^}]*position:\s*fixed/);
  assert.match(css, /#hero \.fade-up\s*\{\s*opacity:\s*1/);
});

test('post-index.json 涵蓋 sitemap 文章，部落格目錄列出索引中的全部文章', async () => {
  const index = JSON.parse(await read('post-index.json'));
  const slugs = [...(await read('sitemap-posts.xml')).matchAll(/\/post\/([A-Za-z0-9-]+)<\/loc>/g)].map((m) => m[1]);
  const indexed = new Set(index.map((p) => p.slug));
  // sitemap（台北 03:17）與索引（03:47）由兩個每日流程更新；容許最多 10 篇新文章暫時未進索引，避免空檔期誤報。
  const missing = slugs.filter((s) => !indexed.has(s));
  assert.ok(missing.length <= 10, `索引缺 ${missing.length} 篇：${missing.slice(0, 5).join(', ')}`);
  assert.ok(index.every((p) => p.title && /^\d{4}-\d{2}-\d{2}$/.test(p.date) && !isRedirectedSlug(p.slug)));
  const blog = await read('blog.html');
  const listed = new Set([...blog.matchAll(/href="\/post\/([A-Za-z0-9-]+)"/g)].map((m) => m[1]));
  assert.deepEqual(index.map((p) => p.slug).filter((s) => !listed.has(s)), []);
});

test('安全標頭設定稿可解析，且不含 CSP（全站有 inline script）', async () => {
  const headers = JSON.parse(await read('cloudflare/security-headers/headers.json'));
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.ok(!('Content-Security-Policy' in headers));
  assert.ok(!/includeSubDomains|preload/.test(headers['Strict-Transport-Security']));
});

test('compact hero 外框撐滿寬度，CTA 按鈕與其他頁一致', async () => {
  assert.match(await read('ui-safety.css'), /\.hero\.compact > \.container\s*\{\s*width:\s*100%/);
});

test('服務地區全站一致：台北、新竹、桃園（2026-11-17 業主確認）', async () => {
  const home = await read('index.html'); const llms = await read('llms.txt');
  for (const [, arr] of home.matchAll(/"areaServed": (\[[^\]]*\])/g)) assert.deepEqual(JSON.parse(arr), ['台北市', '新竹市', '桃園市']);
  assert.equal((home.match(/台北、新竹、桃園免費 LINE 諮詢/g) || []).length, 4);
  assert.match(llms, /服務地區：台北、新竹、桃園/);
  assert.ok(!/新北|台中|台南|高雄/.test(home + llms), '首頁或 llms.txt 仍有非服務地區的城市');
});

test('隱私權政策揭露實際使用的追蹤工具', async () => {
  const privacy = await read('privacy.html');
  for (const tool of ['Google Analytics 4', 'Meta Pixel', 'Cloudflare Web Analytics', '_ga', '_fbp']) assert.ok(privacy.includes(tool), `隱私權政策缺 ${tool}`);
  const pixelPages = [];
  for (const [file] of MAIN_PAGES) if ((await read(file)).includes('meta-pixel.js')) pixelPages.push(file);
  assert.ok(pixelPages.length > 0);
});

test('面試人數動畫：使用共用估算公式並尊重減少動態效果', async () => {
  for (const f of ['index.html', 'about.html', 'contact.html']) {
    const t = await read(f);
    assert.match(t, /prefers-reduced-motion: reduce\)'\)\.matches\) \{ el\.textContent = end \+ tail; return; \}/, `${f} 未尊重減少動態效果`);
    assert.match(t, /Math\.min\(1, Math\.max\(0, \(now - start\)/, `${f} 動畫進度未限制在 0–1`);
    assert.match(t, /return window\.AS_SITE_CONFIG\.getInterviewCount\(\)/, `${f} 必須使用共用估算公式`);
  }
  const context = { window: {}, document: { addEventListener() {} } };
  vm.runInNewContext(await read('site-config.js'), context);
  const count = context.window.AS_SITE_CONFIG.getInterviewCount;
  assert.equal(count(new Date('2026-02-28T00:00:00Z')), 3000);
  assert.equal(count(new Date('2026-03-01T00:00:00Z')), 3000);
  assert.equal(count(new Date('2026-03-02T00:00:00Z')), 3004);
  let previous = 3000;
  for (let day = 1; day <= 366; day++) {
    const date = new Date(Date.UTC(2026, 2, 1 + day));
    const value = count(date);
    assert.ok(value - previous >= 1 && value - previous <= 5);
    assert.equal(value, count(new Date(date.getTime() + 86399999)));
    previous = value;
  }
  assert.match(await read('privacy.html'), /不是逐筆登記的實際人數/);
  assert.match(await read('ui-safety.css'), /@supports \(overflow-x: clip\)\s*\{\s*html, body \{ overflow-x: clip; \}/);
});

test('每一頁都有主導覽列（首頁、關於我、職缺介紹、八大知識+、部落格、真實心得、聯絡我）', async () => {
  const pages = [...MAIN_PAGES.map(([f]) => f), '404.html', 'brand/index.html', 'landing-b/index.html', 'work-landing.html', 'post.html'];
  const missing = [];
  for (const f of pages) {
    const t = (await read(f)).replace(/<script[\s\S]*?<\/script>/g, '');
    const nav = t.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/g)?.find((n) => ['關於我', '職缺介紹', '部落格', '聯絡我'].every((x) => n.includes(`>${x}<`)));
    if (!nav) missing.push(f);
  }
  assert.deepEqual(missing, []);
  for (const f of ['tools/alias-generator/index.html', 'tools/time-calculator/index.html', 'work-landing.html']) {
    const t = await read(f);
    assert.ok(t.includes('/site-nav.css') && t.includes('/site-nav.js') && t.includes('真實心得'), `${f} 缺共用導覽列`);
  }
});
