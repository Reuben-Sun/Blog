#!/usr/bin/env node
'use strict';

// 构建产物冒烟检查：主题没加载、文章丢失等问题在部署前就失败。
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pub = path.join(root, 'public');
const postsDir = path.join(root, 'source', '_posts');
const errors = [];

function read(rel) {
  const file = path.join(pub, rel);
  if (!fs.existsSync(file)) {
    errors.push(`missing ${rel}`);
    return null;
  }
  return fs.readFileSync(file, 'utf8');
}

function countMarkdown(dir) {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) n += countMarkdown(full);
    else if (entry.name.endsWith('.md')) n += 1;
  }
  return n;
}

const css = read('css/style.css');
if (css !== null && css.length < 10000) errors.push(`css/style.css is only ${css.length} bytes`);

const index = read('index.html');
if (index !== null && !/<link[^>]+css\/style\.css/.test(index)) errors.push('index.html does not reference css/style.css (theme not loaded?)');

let posts = [];
const content = read('content.json');
if (content) posts = JSON.parse(content).posts || [];

const expected = countMarkdown(postsDir);
if (posts.length !== expected) errors.push(`content.json lists ${posts.length} posts, source/_posts has ${expected} .md files`);

for (const post of posts) {
  const rel = path.join(decodeURI(post.path), 'index.html');
  const html = read(rel);
  if (html !== null && !html.includes('id="post"')) errors.push(`${rel} has no post article`);
}

if (errors.length) {
  console.error(`verify-build: ${errors.length} problem(s)`);
  for (const e of errors.slice(0, 50)) console.error(`  - ${e}`);
  if (errors.length > 50) console.error(`  ... and ${errors.length - 50} more`);
  process.exit(1);
}
console.log(`verify-build: ok (${posts.length} posts, style.css ${css.length} bytes)`);
