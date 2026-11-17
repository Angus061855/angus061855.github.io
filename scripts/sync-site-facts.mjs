// 把 site-config.js 的 interviewCount 同步到所有靜態頁面（HTML 文字、meta、JSON-LD、llms.txt）。
// 用法：改 site-config.js 的 interviewCount 後執行 `node scripts/sync-site-facts.mjs`；`--check` 只檢查不寫入。
// 調整估算起始值：`node scripts/sync-site-facts.mjs --set 3012`（改寫 site-config.js 並同步全站；此值是公式起點，不是當日累計數字）。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);

export function readInterviewCount() {
  const source = readFileSync(new URL('site-config.js', root), 'utf8');
  const match = source.match(/interviewCount:\s*(\d+)/);
  if (!match) throw new Error('site-config.js 找不到 interviewCount');
  return Number(match[1]);
}

// 會出現面試人數的檔案（post/ 由文章 API 產生，不在此管理）
export const FACT_FILES = [
  'index.html', 'about.html', 'contact.html', 'work-landing.html', 'llms.txt',
  'landing-b/index.html', 'landing-b/landing-b.js', 'brand/index.html',
  'highlights/index.html', 'brand-old/index.html'
];

// 每條規則的第 1 個群組是數字本身。只比對「面試／面談」附近的數字，避免誤改薪資等其他數字。
export const PATTERNS = [
  /data-interview-count[^>]*>(\d{3,5})/dg,
  /(?:面試|面談)(?:人數)?\s*(?:超過|過)?\s*(\d{3,5})/dg,                     // 個人面試3000+、面試超過 3000、面試過 3000
  /超過\s*(\d{3,5})\s*位/dg,                                                // 超過 3000 位
  /(\d{3,5})\s*位(?:以上的?)?(?:女孩|女生)?(?:的)?\s*(?:個人)?面試/dg,        // 3000 位個人面試
  /(?:id="[\w-]*interview[\w-]*"[^>]*>|aria-label="個人面試人數 )(\d{3,5})/dg, // 計數器元素與 aria-label
  /data-final="(\d{3,5})\+"/dg,
  /<strong>(\d{3,5})\+<\/strong><span>個人面(?:試|談)/dg
];

export function findNumbers(text) {
  const found = [];
  for (const pattern of PATTERNS) {
    for (const m of text.matchAll(pattern)) found.push({ value: Number(m[1]), index: m.indices[1][0], length: m[1].length });
  }
  return found;
}

export function rewrite(text, count) {
  const hits = findNumbers(text).sort((a, b) => b.index - a.index);
  const seen = new Set();
  let out = text;
  for (const h of hits) {
    if (seen.has(h.index)) continue;
    seen.add(h.index);
    out = out.slice(0, h.index) + String(count) + out.slice(h.index + h.length);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const setIndex = process.argv.indexOf('--set');
  if (setIndex !== -1) {
    const next = Number(process.argv[setIndex + 1]);
    if (!Number.isInteger(next) || next < 1) throw new Error('--set 後面要接正整數，例如 --set 3012');
    const current = readInterviewCount();
    if (next < current) console.warn(`注意：新數字 ${next} 小於目前的 ${current}`);
    const configUrl = new URL('site-config.js', root);
    writeFileSync(configUrl, readFileSync(configUrl, 'utf8').replace(/interviewCount:\s*\d+/, `interviewCount: ${next}`));
    console.log(`site-config.js interviewCount ${current} → ${next}`);
  }
  const count = readInterviewCount();
  const check = process.argv.includes('--check');
  let mismatched = 0;
  for (const file of FACT_FILES) {
    const url = new URL(file, root);
    const text = readFileSync(url, 'utf8');
    const wrong = findNumbers(text).filter((n) => n.value !== count);
    if (!wrong.length) continue;
    mismatched += wrong.length;
    if (check) console.log(`${file}: ${wrong.map((w) => w.value).join(', ')} ≠ ${count}`);
    else { writeFileSync(url, rewrite(text, count)); console.log(`${file}: 更新 ${wrong.length} 處 → ${count}`); }
  }
  if (check && mismatched) process.exit(1);
  console.log(mismatched ? '完成' : `全站面試人數一致（${count}）`);
}
