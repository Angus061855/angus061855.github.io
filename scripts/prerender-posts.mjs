// 文章頁靜態產生：把 Worker 裡的文章預先輸出成 post/<slug>.html，
// GitHub Pages 會以 https://as-ent-tw.com/post/<slug> 提供（不需要 .html）。
// 目的：文章頁不再依賴即時 API，避免 404/500 時好時壞。
// 注意：要讓這些靜態檔生效，Cloudflare 上攔截 /post/* 的 Worker 路由必須移除或改成只做轉址（見 fixes/README）。
// 安全設計：任何一篇抓取失敗都「保留舊檔」，不刪檔；內文疑似被截斷的文章不輸出並列入報告。
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SITE = 'https://as-ent-tw.com';
const APIS = ['https://as-blog-cache.angus061855.workers.dev', 'https://polished-truth-9fc2.angus061855.workers.dev'];
const OUT = new URL(process.env.PRERENDER_OUT || '../post/', import.meta.url);
const LIMIT = Number(process.env.PRERENDER_LIMIT || 0);

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(path) {
  let last;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    for (const base of APIS) {
      try {
        const res = await fetch(base + path, { signal: AbortSignal.timeout(20000), headers: { Accept: 'application/json' } });
        if (res.ok) return await res.json();
        last = new Error(`${base}${path} HTTP ${res.status}`);
      } catch (e) { last = e; }
    }
    await sleep(1500 * (attempt + 1));
  }
  throw last;
}

// 內文是簡易 markdown：## 標題、### 小標、每行一段、**粗體**
export function renderBody(body) {
  const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const out = [];
  let list = [];
  const flush = () => { if (list.length) { out.push('<ul>' + list.map((li) => `<li>${inline(li)}</li>`).join('') + '</ul>'); list = []; } };
  for (const raw of String(body || '').split('\n')) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (/^[-*・]\s+/.test(line)) { list.push(line.replace(/^[-*・]\s+/, '')); continue; }
    flush();
    if (line.startsWith('### ')) out.push(`<h3>${inline(line.slice(4))}</h3>`);
    else if (line.startsWith('## ')) out.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (line.startsWith('# ')) out.push(`<h2>${inline(line.slice(2))}</h2>`);
    else out.push(`<p>${inline(line)}</p>`);
  }
  flush();
  return out.join('\n');
}

// 疑似被截斷：內文太短，或最後一個字不是句尾標點
export function looksTruncated(body) {
  const text = String(body || '').trim();
  if (text.length < 400) return true;
  return !/[。！？!?」』）)…~～.]$/.test(text);
}

export function renderPage(post) {
  const url = `${SITE}/post/${post.slug}`;
  const title = `${post.title}｜AS娛樂 大頭`;
  const desc = String(post.summary || '').slice(0, 120);
  const image = post.cover && /^https:\/\//.test(post.cover) ? post.cover : `${SITE}/og-image.jpg`;
  const modified = post.updated || post.last_edited_time || post.date;
  const ld = [{
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: desc,
    datePublished: post.date, dateModified: modified, inLanguage: 'zh-Hant-TW', image: [image], url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Person', '@id': `${SITE}/#person`, name: '大頭', url: `${SITE}/about` },
    publisher: { '@type': 'Organization', '@id': `${SITE}/#organization`, name: 'AS娛樂', url: `${SITE}/`, logo: { '@type': 'ImageObject', url: `${SITE}/logo.webp` } }
  }, {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首頁', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: '部落格', item: `${SITE}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url }
    ]
  }];
  return `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}"/>
  <meta name="author" content="AS娛樂 大頭"/>
  <link rel="canonical" href="${url}"/>
  <meta property="og:type" content="article"/>
  <meta property="og:site_name" content="AS娛樂"/>
  <meta property="og:locale" content="zh_TW"/>
  <meta property="og:title" content="${esc(title)}"/>
  <meta property="og:description" content="${esc(desc)}"/>
  <meta property="og:url" content="${url}"/>
  <meta property="og:image" content="${esc(image)}"/>
  <meta property="article:published_time" content="${esc(post.date)}"/>
  <meta property="article:modified_time" content="${esc(modified)}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <link rel="icon" href="/logo.webp" type="image/webp"/>
  <link rel="stylesheet" href="/site.css"/>
  <link rel="stylesheet" href="/typography.css?v=20261027-1"/>
  <script defer src="/typography.js?v=20261027-1"></script>
  <style>
    .post-static{max-width:760px;margin:0 auto;padding:96px 22px 64px;line-height:1.9}
    .post-static h1{font-family:'Noto Serif TC',serif;font-size:clamp(1.6rem,4.6vw,2.3rem);line-height:1.4;margin-bottom:12px}
    .post-static h2{font-size:1.3rem;margin:34px 0 10px}.post-static h3{font-size:1.1rem;margin:24px 0 8px}
    .post-static p{margin:0 0 14px}.post-static ul{margin:0 0 14px 1.2em}
    .post-meta{color:#888;font-size:.85rem;margin-bottom:28px}.post-meta a{color:inherit}
    .post-cta{margin-top:40px;padding:20px;border:1px solid rgba(200,169,110,.3);border-radius:8px}
  </style>
  ${ld.map((d) => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`).join('\n  ')}
</head>
<body>
  <main class="post-static">
    <nav aria-label="麵包屑" class="post-meta"><a href="/">首頁</a> › <a href="/blog">部落格</a></nav>
    <article>
      <h1>${esc(post.title)}</h1>
      <p class="post-meta">作者：<a href="/about">大頭・AS娛樂</a>　發布：<time datetime="${esc(post.date)}">${esc(post.date)}</time>${modified && modified !== post.date ? `　更新：<time datetime="${esc(modified)}">${esc(String(modified).slice(0, 10))}</time>` : ''}</p>
      ${renderBody(post.body)}
    </article>
    <aside class="post-cta">
      <p>有問題可以直接加 LINE 問我，問問題不代表你要來做。限年滿 18 歲。</p>
      <p><a href="https://line.me/ti/p/tTUQTPHKrE" rel="noopener noreferrer">LINE 詢問</a>　｜　<a href="/guides/hotel-pr-guide/">酒店公關完整入門指南</a>　｜　<a href="/blog">更多文章</a></p>
      <p style="font-size:.8rem;color:#888">本文為經驗分享，不是法律意見，也不代表收入保證；實際條件以店家說明為準。</p>
    </aside>
  </main>
</body>
</html>
`;
}

async function main() {
  const posts = await getJson('/posts');
  if (!Array.isArray(posts) || posts.length < 20) throw new Error(`文章清單只有 ${posts?.length} 篇，停止（不動既有檔案）`);
  await mkdir(OUT, { recursive: true });
  const report = { written: [], kept: [], truncated: [] };
  for (const item of LIMIT ? posts.slice(0, LIMIT) : posts) {
    if (!item?.slug || !/^[A-Za-z0-9-]+$/.test(item.slug)) continue;
    let post;
    try { post = await getJson(`/posts/${item.slug}`); }
    catch (e) { report.kept.push(`${item.slug}（${e.message}）`); continue; }
    if (looksTruncated(post.body)) { report.truncated.push(`${item.slug} ${item.title}`); continue; }
    await writeFile(new URL(`${item.slug}.html`, OUT), renderPage({ ...item, ...post }), 'utf8');
    report.written.push(item.slug);
    await sleep(400); // 依序抓取，避免來源 API 限流（並行時曾出現 404/500）
  }
  console.log(`已輸出 ${report.written.length} 篇；保留舊檔 ${report.kept.length} 篇；疑似截斷未輸出 ${report.truncated.length} 篇`);
  if (report.kept.length) console.log('保留舊檔：\n' + report.kept.join('\n'));
  if (report.truncated.length) console.log('疑似截斷：\n' + report.truncated.join('\n'));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
