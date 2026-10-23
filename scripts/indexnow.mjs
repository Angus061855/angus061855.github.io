// 變更進到 main 之後，把有改動的頁面網址（以及 sitemap）提交給 IndexNow。
// 金鑰是公開的：網站根目錄 /<key>.txt 的檔名與內容都是同一組金鑰。
// IndexNow 回傳錯誤或連線失敗時，這個腳本以結束碼 0 離開，不讓 GitHub Actions 失敗。
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HOST = 'as-ent-tw.com';
export const SITE = `https://${HOST}`;
export const SITEMAP_URLS = [
  `${SITE}/sitemap.xml`,
  `${SITE}/sitemap-static.xml`,
  `${SITE}/sitemap-posts.xml`,
];
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KEY_FILE = /^[a-f0-9]{8,128}\.txt$/;

export function findKey(root = ROOT) {
  for (const name of readdirSync(root)) {
    if (!KEY_FILE.test(name)) continue;
    const key = name.slice(0, -4);
    if (readFileSync(join(root, name), 'utf8').trim() === key) return key;
  }
  throw new Error('找不到 IndexNow 金鑰檔（網站根目錄的 <key>.txt）');
}

export function fileToUrl(file) {
  const path = String(file).replaceAll('\\', '/').replace(/^\.\//, '');
  if (!path || path.split('/').some((part) => part.startsWith('.'))) return null;
  if (/^(scripts|cloudflare|docs|node_modules)\//.test(path)) return null;
  if (path === '404.html') return null;
  if (path.endsWith('.html')) {
    if (path === 'index.html') return `${SITE}/`;
    if (path.endsWith('/index.html')) return `${SITE}/${path.slice(0, -'index.html'.length)}`;
    const slug = path.replace(/\.html$/, '');
    if (path.startsWith('post/')) return /^post\/[A-Za-z0-9-]+$/.test(slug) ? `${SITE}/${slug}` : null;
    return `${SITE}/${slug}`;
  }
  if (/^(robots\.txt|llms\.txt|sitemap(?:-[a-z0-9]+)?\.xml)$/.test(path) || KEY_FILE.test(path)) {
    return `${SITE}/${path}`;
  }
  return null;
}

export function unique(urls) {
  return [...new Set(urls.filter(Boolean))];
}

export function urlsFromSitemapXml(xml) {
  return unique([...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((match) => match[1])
    .filter((url) => url === SITE || url === `${SITE}/` || url.startsWith(`${SITE}/`)));
}

export function urlsFromSitemaps(root = ROOT) {
  const urls = [];
  for (const name of ['sitemap-static.xml', 'sitemap-posts.xml']) {
    try {
      urls.push(...urlsFromSitemapXml(readFileSync(join(root, name), 'utf8')));
    } catch {
      /* 缺檔就略過，改送目前讀得到的清單 */
    }
  }
  return unique(urls.filter((url) => !url.endsWith('.xml')));
}

export function changedFiles(before, sha = 'HEAD', root = ROOT) {
  if (!before || /^0+$/.test(before)) return null;
  try {
    const out = execFileSync('git', ['diff', '--name-status', '--diff-filter=ACMR', before, sha], {
      encoding: 'utf8',
      cwd: root,
    });
    const files = [];
    for (const line of out.split('\n')) {
      if (!line.trim()) continue;
      const parts = line.split('\t');
      const status = parts[0];
      const file = status.startsWith('R') || status.startsWith('C') ? parts[2] : parts[1];
      if (file) files.push(file);
    }
    return files;
  } catch (error) {
    console.warn(`無法比較 ${before}..${sha}，改用 sitemap：${error.message}`);
    return null;
  }
}

export function chooseUrls(pageUrls, sitemapUrls) {
  const pages = unique(pageUrls);
  return unique([...SITEMAP_URLS, ...(pages.length ? pages : sitemapUrls)]);
}

export function collectUrls({ before, sha = 'HEAD', root = ROOT } = {}) {
  const files = changedFiles(before, sha, root);
  const pageUrls = files ? files.map(fileToUrl) : [];
  return chooseUrls(pageUrls, urlsFromSitemaps(root));
}

export async function submitIndexNow({ key, urls, fetchImpl = fetch, host = HOST }) {
  const results = [];
  for (let index = 0; index < urls.length; index += 10000) {
    const urlList = urls.slice(index, index + 10000);
    try {
      const response = await fetchImpl('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host,
          key,
          keyLocation: `${SITE}/${key}.txt`,
          urlList,
        }),
      });
      const body = await response.text();
      results.push({
        ok: response.ok || response.status === 202,
        status: response.status,
        body: body.slice(0, 500),
      });
    } catch (error) {
      results.push({ ok: false, status: 0, body: error.message });
    }
  }
  return { ok: results.length > 0 && results.every((item) => item.ok), results };
}

export async function run(env = process.env) {
  const key = findKey();
  const urls = collectUrls({ before: env.INDEXNOW_BEFORE, sha: env.INDEXNOW_SHA || 'HEAD' });
  if (!urls.length) return { ok: true, skipped: true, urls, results: [] };
  const submitted = await submitIndexNow({ key, urls });
  return { ...submitted, urls, key };
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  try {
    const result = await run();
    console.log(JSON.stringify({
      ok: result.ok,
      count: result.urls.length,
      statuses: (result.results || []).map((item) => item.status),
    }));
    if (!result.ok) {
      console.warn('IndexNow 回傳錯誤，這次不讓工作流程失敗。');
      for (const item of result.results || []) console.warn(item.status, item.body);
    }
  } catch (error) {
    console.warn('IndexNow 提交沒有完成，這次不讓工作流程失敗。', error?.message || error);
  }
  process.exit(0);
}
