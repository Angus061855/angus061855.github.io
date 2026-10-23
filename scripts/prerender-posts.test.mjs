import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBody, looksTruncated, renderPage } from './prerender-posts.mjs';

test('markdown 標題與段落', () => {
  const html = renderBody('第一段。\n## 小標\n**重點**說明。');
  assert.match(html, /<p>第一段。<\/p>/);
  assert.match(html, /<h2>小標<\/h2>/);
  assert.match(html, /<strong>重點<\/strong>/);
});

test('HTML 會被跳脫', () => {
  assert.doesNotMatch(renderBody('<script>alert(1)</script>'), /<script>/);
});

test('截斷偵測', () => {
  assert.equal(looksTruncated('但這背後不是沒有'), true);
  assert.equal(looksTruncated('一'.repeat(500) + '。'), false);
  assert.equal(looksTruncated('一'.repeat(500) + '妳是想做兼職還是全職'), true);
});

test('BlogPosting 作者連到 /about 並有 dateModified', () => {
  const page = renderPage({ slug: 'post-1', title: '測試', summary: '摘要', date: '2026-10-01', body: '內容。' });
  const ld = JSON.parse(page.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
  assert.equal(ld.author.url, 'https://as-ent-tw.com/about');
  assert.equal(ld.dateModified, '2026-10-01');
  assert.match(page, /<link rel="canonical" href="https:\/\/as-ent-tw.com\/post\/post-1"\/>/);
});
