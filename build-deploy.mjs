// Đóng gói các trang (viết dạng fragment cho artifact) thành thư mục tĩnh deploy lên Cloudflare Pages.
// Chạy: node build-deploy.mjs  →  ra thư mục deploy/
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'deploy');

const PAGES = [
  { src: 'banh-chung.html', dest: 'index.html' },
];

const FAVICON = "data:image/svg+xml," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path d='M16 30V14' stroke='%232f7a45' stroke-width='3' stroke-linecap='round'/><path d='M16 18C8 18 5 12 6 6c7 0 10 5 10 12Z' fill='%235bab62'/><path d='M16 15c0-7 4-11 10-11 1 6-3 11-10 11Z' fill='%234f9d58'/></svg>"
).replace(/%2523/g, '%23');

function wrap(fragment) {
  // Phần trước </style> đầu tiên là <title>, <meta>, <link>, <style>: đưa vào <head>.
  const cut = fragment.indexOf('</style>') + '</style>'.length;
  const head = fragment.slice(0, cut).replace(/<meta name="claude:viewport-fit-sides"[^>]*>\s*/, '');
  const body = fragment.slice(cut);
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="${FAVICON}">
${head}
<style>body{margin:0}[hidden]{display:none!important}img{max-width:100%}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
</head>
<body>
${body.trim()}
</body>
</html>
`;
}

rmSync(out, { recursive: true, force: true });
for (const p of PAGES) {
  const dest = join(out, p.dest);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, wrap(readFileSync(join(root, p.src), 'utf8')));
  console.log('✓', p.dest);
}
writeFileSync(join(out, '_headers'), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Cache-Control: public, max-age=300
`);
console.log('✓ _headers');
