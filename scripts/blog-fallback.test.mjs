import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildBlock, replaceBlock, existingCards, escapeHtml, START, END, GUIDES } from './sync-blog-fallback.mjs';

const posts = [
  { slug: 'post-20260911-135755', title: '標題 A' },
  { slug: 'post-20260910-154044', title: '含 <tag> & "引號"' },
  { slug: 'bad slug/../x', title: '不合法 slug 要略過' },
  { slug: 'post-20260911-135755', title: '重複要略過' }
];

test('escapeHtml 轉義特殊字元', () => {
  assert.equal(escapeHtml('<a href="x">&\''), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
});

test('區塊含指南、去重、略過不合法 slug，並轉義標題', () => {
  const block = buildBlock(posts);
  // 5 篇指南 + 1 篇有效文章（post-20260911-135755 已整併進指南、正式站 301，不列出）
  assert.equal((block.match(/class="blog-card"/g) || []).length, GUIDES.length + 1);
  assert.ok(block.includes('href="/guides/hotel-pr-guide/"'));
  assert.ok(!block.includes('/post/post-20260911-135755'));
  assert.ok(block.includes('含 &lt;tag&gt; &amp; &quot;引號&quot;'));
  assert.ok(!block.includes('bad slug'));
});

test('API 沒回傳的既有文章連結會保留', () => {
  const first = buildBlock(posts, [{ href: '/post/post-20260611-154415', title: '舊文章' }]);
  const kept = existingCards(first).map((c) => c.href);
  assert.ok(kept.includes('/post/post-20260611-154415'));
  const second = buildBlock(posts.slice(0, 1), existingCards(first));
  assert.ok(second.includes('/post/post-20260910-154044'));
});

test('既有區塊裡的轉址文章在重建時會被移除', () => {
  const block = buildBlock([], [{ href: '/post/post-20260911-135755', title: '已整併' }, { href: '/post/post-20260910-135907', title: '保留' }]);
  assert.ok(!block.includes('/post/post-20260911-135755'));
  assert.ok(block.includes('/post/post-20260910-135907'));
});

test('重跑結果不變，且 blog.html 目前的區塊完整', async () => {
  const html = await readFile(new URL('../blog.html', import.meta.url), 'utf8');
  assert.ok(html.includes(START) && html.includes(END));
  const s = html.indexOf(START), e = html.indexOf(END);
  const cards = existingCards(html.slice(s, e));
  // 2026-11-17 目錄改由 post-index.json 產生，涵蓋 223 篇；低於 200 代表產生流程出錯。
  assert.ok(cards.length >= 200, `blog.html 只有 ${cards.length} 篇靜態連結`);
  const rebuilt = replaceBlock(html, buildBlock(cards.map((c) => ({ slug: c.href.replace('/post/', ''), title: c.title })), cards));
  assert.equal(rebuilt, html);
});

test('buildIndex：以 sitemap 為範圍，API 優先、沿用既有索引、缺的才逐篇查', async () => {
  const { buildIndex } = await import('./sync-blog-fallback.mjs');
  const asked = [];
  const index = await buildIndex({
    apiPosts: [{ slug: 'post-20260910-135907', title: 'API 新標題', date: '2026-09-10', summary: 's' }],
    existing: [{ slug: 'post-20260701-181446', title: '舊索引', date: '2026-07-01', summary: '' }, { slug: 'post-20260910-135907', title: '過時標題', date: '2026-09-10', summary: '' }],
    slugs: ['post-20260910-135907', 'post-20260701-181446', 'post-20260601-155123', 'post-20260602-135508'],
    fetchPost: async (slug) => { asked.push(slug); return slug === 'post-20260601-155123' ? { title: '逐篇查到', date: '2026-06-01T00:00:00Z' } : null; },
    sleep: async () => {}
  });
  assert.deepEqual(asked, ['post-20260601-155123', 'post-20260602-135508']);
  assert.deepEqual(index.map((p) => [p.slug, p.title, p.date]), [
    ['post-20260910-135907', 'API 新標題', '2026-09-10'],
    ['post-20260701-181446', '舊索引', '2026-07-01'],
    ['post-20260601-155123', '逐篇查到', '2026-06-01']
  ]);
});
