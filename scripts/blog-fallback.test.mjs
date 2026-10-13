import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildBlock, replaceBlock, existingCards, escapeHtml, START, END } from './sync-blog-fallback.mjs';

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
  assert.equal((block.match(/class="blog-card"/g) || []).length, 3);
  assert.ok(block.includes('href="/guides/hotel-pr-guide/"'));
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

test('重跑結果不變，且 blog.html 目前的區塊完整', async () => {
  const html = await readFile(new URL('../blog.html', import.meta.url), 'utf8');
  assert.ok(html.includes(START) && html.includes(END));
  const s = html.indexOf(START), e = html.indexOf(END);
  const cards = existingCards(html.slice(s, e));
  assert.ok(cards.length >= 100, `blog.html 只有 ${cards.length} 篇靜態連結`);
  const rebuilt = replaceBlock(html, buildBlock(cards.map((c) => ({ slug: c.href.replace('/post/', ''), title: c.title })), cards));
  assert.equal(rebuilt, html);
});
