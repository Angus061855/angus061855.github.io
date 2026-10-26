import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { Parser } from '../assets/vendor/budoux/parser.js';
import { model } from '../assets/vendor/budoux/zh-hant.js';
import { renderPage } from './prerender-posts.mjs';
import { segmentText } from './typography-segments.mjs';

test('all content pages load the shared local typography assets', () => {
  const files = execFileSync('git', ['ls-files', '*.html'], { encoding: 'utf8' }).trim().split('\n');
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    if (/http-equiv="refresh"/i.test(html)) continue;
    assert.match(html, /href="\/typography.css\?v=/, file);
    assert.match(html, /defer src="\/typography.js\?v=/, file);
  }
});

test('phrase boundaries never split a dictionary word', () => {
  const text = '很多人只停留在「會不會被欺負」，八大行業新人取花名可以先參考。';
  const words = new Set([...new Intl.Segmenter('zh-Hant', {granularity:'word'}).segment(text)].map(p=>p.index));
  let offset = 0;
  for (const chunk of segmentText(text)) { assert.ok(words.has(offset)); offset += chunk.length; }
  assert.equal(segmentText(text).join(''), text);
});

test('new article output keeps the typography integration', () => {
  const html = renderPage({ slug: 'test', title: '測試', body: '內容', date: '2026-10-27' });
  assert.match(html, /\/typography.css\?v=/);
  assert.match(html, /\/typography.js\?v=/);
});

test('Traditional Chinese segmentation preserves all original characters', () => {
  const parser = new Parser(model);
  for (const text of ['不要讓未來的你 討厭現在的自己', '酒店公關薪資試算工具：輸入上下台時間、節數與扣除項目，', '八大行業新人取花名可以先參考。', 'LINE／IG　10 分鐘一節，NT$ 12,000。']) {
    assert.equal(parser.parse(text).join(''), text);
  }
});
