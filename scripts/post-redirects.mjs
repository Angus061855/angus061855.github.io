// 讀取 /post-redirects.js（瀏覽器與 node 共用的單一來源）。
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../post-redirects.js', import.meta.url), 'utf8');
const marker = 'window.AS_POST_REDIRECTS =';
const start = source.indexOf(marker);
if (start === -1) throw new Error('post-redirects.js 找不到 window.AS_POST_REDIRECTS（物件必須是嚴格 JSON）');
const json = source.slice(start + marker.length).trim().replace(/;\s*$/, '');

export const POST_REDIRECTS = Object.freeze(JSON.parse(json));

export function isRedirectedSlug(slug) {
  return Object.prototype.hasOwnProperty.call(POST_REDIRECTS, String(slug));
}
