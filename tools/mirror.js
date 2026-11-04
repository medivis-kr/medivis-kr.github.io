// Mirror www.medivis.co.kr into a static folder, keeping the same URL paths.
const fs = require('fs'), path = require('path');
const BASE = 'https://www.medivis.co.kr';
const OUT = process.argv[2] || path.join(__dirname, '..', 'docs');
const seen = new Map(); const queue = ['/'];
const isPage = p => !/\.[a-z0-9]{2,5}$/i.test(p.split('?')[0]);
function norm(u) {
  u = u.trim().replace(/#.*$/, '').replace(/&amp;/g, '&');
  const m = u.match(/^https?:\/\/(www\.)?medivis\.co\.kr(\/.*)?$/i); if (m) u = m[2] || '/';
  if (!u.startsWith('/') || u.startsWith('//')) return null;
  if (/\/common\/admin\/(?!js|css|img|images|fonts)/.test(u)) return null;
  if (/inquiry_process|logout|login/.test(u)) return null;
  return isPage(u) ? u.split('?')[0] : u;   // keep query on assets only for fetching
}
function extract(text, isCss, from) {
  const out = [];
  const add = s => { const n = norm(s.startsWith('/') || /^https?:/.test(s) ? s : (isCss ? path.posix.join(path.posix.dirname(from.split('?')[0]), s) : s)); if (n) out.push(n); };
  for (const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) if (!m[1].startsWith('data:')) add(m[1]);
  if (isCss) return out;
  for (const m of text.matchAll(/(?:href|src|data-src|data-bg|poster|content)\s*=\s*["']([^"']+)["']/g)) add(m[1]);
  for (const m of text.matchAll(/location\.(?:href|replace)\s*(?:=|\()\s*["']([^"']+)["']/g)) add(m[1]);
  for (const m of text.matchAll(/["'](\/(?:uploads|common|medivis)\/[^"'\s)]+)["']/g)) add(m[1]);
  for (const m of text.matchAll(/productView\(\s*['"]?([^'",)]+)['"]?\s*,\s*['"]?([^'")]+)['"]?\s*\)/g)) add(`/medivis/product/view/${m[1].trim()}/${m[2].trim()}`);
  for (const m of text.matchAll(/mMove\(\s*['"]([^'"]+)['"]\s*\)/g)) add(`/medivis/product/xray/${m[1]}`);
  return out;
}
function outFile(p) {
  const clean = decodeURIComponent(p.split('?')[0]);
  return isPage(clean) ? path.join(OUT, clean, 'index.html') : path.join(OUT, clean);
}
(async () => {
  while (queue.length) {
    const p = queue.shift(); if (seen.has(p)) continue;
    try {
      const r = await fetch(BASE + p, { redirect: 'follow' });
      seen.set(p, r.status);
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      const f = outFile(p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf);
      const ct = r.headers.get('content-type') || '';
      if (/html|css|javascript/.test(ct)) for (const n of extract(buf.toString('utf8'), /css/.test(ct), p)) if (!seen.has(n)) queue.push(n);
    } catch (e) { seen.set(p, 'ERR ' + e.message); }
  }
  const lines = [...seen].map(([k, v]) => `${v}\t${k}`).sort();
  fs.writeFileSync(path.join(OUT, '..', 'mirror-log.txt'), lines.join('\n'));
  console.log(lines.filter(l => !l.startsWith('200')).join('\n'));
  console.log('total', seen.size, 'pages', [...seen.keys()].filter(isPage).length);
})();
