import { readFile, writeFile } from 'node:fs/promises';

const sourceUrl = 'https://polished-truth-9fc2.angus061855.workers.dev/sitemap.xml';
const siteOrigin = 'https://as-ent-tw.com';
const outputPath = new URL('../sitemap-posts.xml', import.meta.url);
const articleGapMs = 400;
const retryDelaysMs = [1000, 3000, 9000];
const confirmedRemoval = new Set([301, 308, 410]);
const minimumEntries = 50;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseEntries(xml) {
  return [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>[\s\S]*?<\/url>/g)]
    .map(([, loc, lastmod]) => ({ loc: loc.trim(), lastmod: lastmod.trim() }))
    .filter(({ loc }) => loc.startsWith(`${siteOrigin}/post/`));
}

function dedupeEntries(entries) {
  return [...new Map(entries.map((entry) => [entry.loc, entry])).values()]
    .sort((a, b) => b.lastmod.localeCompare(a.lastmod) || a.loc.localeCompare(b.loc));
}

function serialize(entries) {
  const rows = entries.map(({ loc, lastmod }) => [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    '    <changefreq>monthly</changefreq>',
    '    <priority>0.7</priority>',
    '  </url>'
  ].join('\n'));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...rows,
    '</urlset>',
    ''
  ].join('\n');
}

function sameEntries(left, right) {
  if (left.length !== right.length) return false;
  const lastmodByLoc = new Map(right.map((entry) => [entry.loc, entry.lastmod]));
  return left.every((entry) => lastmodByLoc.get(entry.loc) === entry.lastmod);
}

async function fetchSource() {
  let response;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      response = await fetch(sourceUrl, {
        signal: AbortSignal.timeout(20000),
        headers: { Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8' }
      });
      if (response.ok) break;
      await response.body?.cancel();
    } catch {
      response = undefined;
    }
    await sleep(1000 * (attempt + 1));
  }

  if (!response?.ok) {
    throw new Error(`Unable to fetch article sitemap: ${response?.status || 'network error'}`);
  }

  return response.text();
}

async function readExisting() {
  try {
    return await readFile(outputPath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return '';
    throw new Error(`Unable to read existing article sitemap: ${error?.code || error?.message || 'unknown error'}`);
  }
}

async function verifyUrl(loc) {
  let status = 0;
  for (let attempt = 0; attempt < retryDelaysMs.length + 1; attempt += 1) {
    try {
      const articleResponse = await fetch(loc, {
        signal: AbortSignal.timeout(15000),
        headers: { Accept: 'text/html' },
        redirect: 'manual'
      });
      status = articleResponse.status;
      await articleResponse.body?.cancel();
      if (status === 200) return status;
    } catch {
      status = 0;
    }
    if (attempt < retryDelaysMs.length) await sleep(retryDelaysMs[attempt]);
  }
  return status;
}

await main();

async function main() {
  const source = await fetchSource();
  const uniqueEntries = dedupeEntries(parseEntries(source));
  if (uniqueEntries.length === 0) {
    throw new Error('Article sitemap returned no same-site post URLs.');
  }

  const existingEntries = dedupeEntries(parseEntries(await readExisting()));
  const existingByLoc = new Map(existingEntries.map((entry) => [entry.loc, entry]));

  if (sameEntries(uniqueEntries, existingEntries)) {
    console.log(`Article sitemap already matches source (${uniqueEntries.length} URLs); skipped live checks.`);
    return;
  }

  // Unchanged URLs are already in the published sitemap. Checking every
  // article on each run produced bursts of 404s from the article host and
  // failed the job even when the sitemap was already correct.
  const accepted = [];
  const excluded = [];
  const uncertain = [];
  const needsCheck = [];

  for (const entry of uniqueEntries) {
    const existing = existingByLoc.get(entry.loc);
    if (existing && existing.lastmod === entry.lastmod) accepted.push(entry);
    else needsCheck.push({ entry, existing });
  }

  for (let index = 0; index < needsCheck.length; index += 1) {
    if (index > 0) await sleep(articleGapMs);
    const { entry, existing } = needsCheck[index];
    const status = await verifyUrl(entry.loc);
    if (status === 200) {
      accepted.push(entry);
    } else if (confirmedRemoval.has(status)) {
      excluded.push({ ...entry, status });
    } else if (existing) {
      accepted.push(existing);
      uncertain.push({ loc: entry.loc, status, kept: true });
    } else {
      uncertain.push({ loc: entry.loc, status, kept: false });
    }
  }

  accepted.sort((a, b) => b.lastmod.localeCompare(a.lastmod) || a.loc.localeCompare(b.loc));

  for (const entry of uncertain) {
    const detail = entry.status || 'network error';
    const action = entry.kept
      ? 'keeping the existing sitemap entry'
      : 'not adding it';
    console.warn(`::warning::Unable to verify ${entry.loc} (${detail}); ${action}.`);
  }
  for (const entry of excluded) {
    console.warn(`Excluded ${entry.status}: ${entry.loc}`);
  }

  if (accepted.length < minimumEntries) {
    throw new Error(`Only ${accepted.length} article URLs passed verification; refusing to replace sitemap.`);
  }

  const sitemap = serialize(accepted);
  if (sitemap === serialize(existingEntries)) {
    console.log(`Article sitemap unchanged after checks (${accepted.length} URLs, ${uncertain.length} uncertain).`);
    return;
  }

  await writeFile(outputPath, sitemap, 'utf8');
  console.log(`Wrote ${accepted.length} article URLs to sitemap-posts.xml`);
}
