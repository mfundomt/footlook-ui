// Production web server for footlook.co.za on Azure App Service (replaces `pm2 serve --spa`).
//
// - Sends footlook.co.za to www.footlook.co.za with a 301, so search engines index one address.
// - Serves the Angular build from the folder this file sits in, falling back to the app shell
//   for client-side routes.
// - Hashed build files are cached for a year; HTML is always revalidated.
//
// Uses only Node built-ins so the deploy zip needs no node_modules.
// Azure startup command: node /home/site/wwwroot/server.js

'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8080;
const CANONICAL_HOST = 'www.footlook.co.za';
const REDIRECT_HOSTS = new Set(['footlook.co.za']);

// Angular's static prerender writes index.csr.html for routes it did not prerender; a plain
// client-side build only has index.html.
const APP_SHELL = ['index.csr.html', 'index.html']
  .map((name) => path.join(ROOT, name))
  .find((file) => fs.existsSync(file));

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// Files the build names with a content hash, e.g. main-BUOUR7RD.js, chunk-DvqViFNz.js.
const HASHED_FILE = /-[A-Za-z0-9_]{8}\.(js|mjs|css)$/;

// Never served, even though they live in wwwroot.
const PRIVATE_FILES = new Set([path.join(ROOT, 'server.js')]);

function send(res, status, headers, body) {
  res.writeHead(status, { 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(body);
}

function sendFile(req, res, file, stat) {
  const ext = path.extname(file).toLowerCase();
  const cacheControl =
    ext === '.html' ? 'no-cache' : HASHED_FILE.test(file) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600';

  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': cacheControl,
    'Last-Modified': stat.mtime.toUTCString(),
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file)
    .on('error', () => res.destroy())
    .pipe(res);
}

/** Returns the file and its stats if `file` is a readable regular file inside ROOT. */
function statFile(file) {
  if (!file.startsWith(ROOT + path.sep) || PRIVATE_FILES.has(file)) return null;
  try {
    const stat = fs.statSync(file);
    return stat.isFile() ? { file, stat } : null;
  } catch {
    return null;
  }
}

/** Maps a URL path to a build file: the file itself, a prerendered <path>/index.html, or nothing. */
function resolve(urlPath) {
  const file = path.join(ROOT, path.normalize(urlPath));
  return statFile(file) ?? statFile(path.join(file, 'index.html'));
}

const server = http.createServer((req, res) => {
  const host = (req.headers.host ?? '').toLowerCase().replace(/:\d+$/, '');
  if (REDIRECT_HOSTS.has(host)) {
    return send(res, 301, { Location: `https://${CANONICAL_HOST}${req.url}`, 'Cache-Control': 'public, max-age=86400' });
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' }, 'Method Not Allowed');
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    return send(res, 400, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Bad Request');
  }

  const found = resolve(urlPath);
  if (found) return sendFile(req, res, found.file, found.stat);

  // A path with a file extension is a missing asset, not an app route.
  if (path.extname(urlPath) || !APP_SHELL) {
    return send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not Found');
  }
  sendFile(req, res, APP_SHELL, fs.statSync(APP_SHELL));
});

server.listen(PORT, () => console.log(`FootLook web server listening on port ${PORT}`));
