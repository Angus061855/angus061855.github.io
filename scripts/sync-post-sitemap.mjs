import { writeFile } from 'node:fs/promises';

const sourceUrl = 'https://polished-truth-9fc2.angus061855.workers.dev/sitemap.xml';
const siteOrigin = 'https://as-ent-tw.com';
const outputPath = new URL('../sitemap-posts.xml', import.meta.url);

let response;
for (let attempt = 0; attempt < 4; attempt += 1) {
  try {
    response = await fetch(sourceUrl, {
      headers: { Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8' }
    });
    if (response.ok) break;
    await response.body?.cancel();
  } catch {
    response = undefined;
  }
  await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
}

if (!response?.ok) {
  throw new Error(`Unable to fetch article sitemap: ${response?.status || 'network error'}`);
}

const source = await response.text();
const entries = [...source.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>[\s\S]*?<\/url>/g)]
  .map(([, loc, lastmod]) => ({ loc: loc.trim(), lastmod: lastmod.trim() }))
  .filter(({ loc }) => loc.startsWith(`${siteOrigin}/post/`));

if (entries.length === 0) {
  throw new Error('Article sitemap returned no same-site post URLs.');
}

const uniqueEntries = [...new Map(entries.map((entry) => [entry.loc, entry])).values()]
  .sort((a, b) => b.lastmod.localeCompare(a.lastmod) || a.loc.localeCompare(b.loc));

let nextIndex = 0;
const verifiedEntries = [];
const invalidEntries = [];

async function verifyEntry() {
  while (nextIndex < uniqueEntries.length) {
    const entry = uniqueEntries[nextIndex];
    nextIndex += 1;

    let status = 0;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const articleResponse = await fetch(entry.loc, {
          headers: { Accept: 'text/html' },
          redirect: 'manual'
        });
        status = articleResponse.status;
        await articleResponse.body?.cancel();
        if (status === 200) break;
      } catch {
        status = 0;
      }

      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }

    if (status === 200) verifiedEntries.push(entry);
    else invalidEntries.push({ ...entry, status });
  }
}

await Promise.all(Array.from({ length: 4 }, verifyEntry));
verifiedEntries.sort((a, b) => b.lastmod.localeCompare(a.lastmod) || a.loc.localeCompare(b.loc));

if (verifiedEntries.length < 50) {
  throw new Error(`Only ${verifiedEntries.length} article URLs passed verification; refusing to replace sitemap.`);
}

const rows = verifiedEntries.map(({ loc, lastmod }) => [
  '  <url>',
  `    <loc>${loc}</loc>`,
  `    <lastmod>${lastmod}</lastmod>`,
  '    <changefreq>monthly</changefreq>',
  '    <priority>0.7</priority>',
  '  </url>'
].join('\n'));

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...rows,
  '</urlset>',
  ''
].join('\n');

await writeFile(outputPath, sitemap, 'utf8');
console.log(`Wrote ${verifiedEntries.length} verified article URLs to sitemap-posts.xml`);
for (const entry of invalidEntries) {
  console.warn(`Excluded ${entry.status || 'network error'}: ${entry.loc}`);
}
