import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { redirectResponse } from '../cloudflare/site-redirects/src/index.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4192);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json', '.xml':'application/xml', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon' };
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const redirect = redirectResponse(new Request(url));
    if (redirect) { res.writeHead(301, { Location: redirect.headers.get('location') }); return res.end(); }
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const base = resolve(root, relative || 'index.html');
    if (!base.startsWith(root) || relative.split('/').some(part => part.startsWith('.'))) {
      res.writeHead(403); return res.end();
    }
    let file = base;
    try { if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html'); }
    catch { if (!extname(file)) file += '.html'; }
    let content, status = 200;
    try { content = await readFile(file); }
    catch { file = resolve(root, '404.html'); content = await readFile(file); status = 404; }
    res.writeHead(status, { 'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control':'no-store' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(400); res.end(); }
}).listen(port, '127.0.0.1', () => console.log(`Local preview: http://127.0.0.1:${port}`));
