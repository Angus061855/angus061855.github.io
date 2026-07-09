import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../work-landing.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../work-landing.css', import.meta.url), 'utf8');

assert.match(html, /先匿名了解/);
assert.match(html, /不簽約也不催促/);
assert.match(html, /role-tab/);
assert.match(html, /aria-selected=/);
assert.match(html, /1817663066269089/);
assert.match(html, /data-personal-line/);
assert.match(html, /data-official-instagram/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /\.role-tab/);
assert.doesNotMatch(css, /body\s*\{[^}]*background:\s*(white|#fff)/i);

console.log('work-landing smoke checks passed');
