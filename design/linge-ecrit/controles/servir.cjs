// Petit serveur statique (gzip) pour mesurer un dossier dist/.
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const [dir, port] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };
http.createServer((q, r) => {
  let f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); return r.end(); }
    const ext = path.extname(f); const h = { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000' };
    if (['.html', '.js', '.css', '.json', '.svg'].includes(ext)) { h['Content-Encoding'] = 'gzip'; d = zlib.gzipSync(d); }
    r.writeHead(200, h); r.end(d);
  });
}).listen(+port, '127.0.0.1');
