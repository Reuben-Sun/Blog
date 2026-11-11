'use strict';

// 文章「更新于」取 blog-note 中该文件最后一次提交的时间，而不是文件修改时间：
// CI 每次全新检出，mtime 都是构建时刻。
// - front-matter 里写了 updated 的，以 front-matter 为准
// - .updated-ignore-revs 中列出的提交（批量、机械性修改）不计入
// - 没有可用提交（例如本地新建、尚未提交）时保留 Hexo 默认值（mtime）
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const frontMatter = require('hexo-front-matter');

const noteDir = path.join(hexo.base_dir, 'blog-note');
const postsDir = path.join(hexo.source_dir, '_posts') + path.sep;
let lastCommit = null;

function git(args) {
  return execFileSync('git', ['-C', noteDir, '-c', 'core.quotepath=false', ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function loadIgnored() {
  const file = path.join(hexo.base_dir, '.updated-ignore-revs');
  if (!fs.existsSync(file)) return new Set();
  return new Set(fs.readFileSync(file, 'utf8').split('\n')
    .map(line => line.replace(/#.*/, '').trim())
    .filter(Boolean));
}

function buildIndex() {
  const index = new Map();
  try {
    if (git(['rev-parse', '--is-shallow-repository']).trim() === 'true') {
      hexo.log.warn('git-updated: blog-note is a shallow clone, falling back to file mtime for "updated"');
      return index;
    }
    const ignored = loadIgnored();
    // --no-renames：不做改名检测，避免在 blob:none 的部分克隆里按需下载文件内容
    const out = git(['log', '--no-renames', '--format=%x00%H %cI', '--name-only', '--', 'articles']);
    for (const block of out.split('\0').slice(1)) {
      const [header, ...files] = block.split('\n');
      const [sha, date] = header.split(' ');
      if (ignored.has(sha)) continue;
      for (const f of files) {
        if (f && !index.has(f)) index.set(f, date);
      }
    }
  } catch (err) {
    hexo.log.warn('git-updated: failed to read blog-note history, falling back to file mtime:', err.message);
  }
  return index;
}

hexo.extend.filter.register('before_post_render', data => {
  if (data.layout !== 'post' || !data.full_source || !data.full_source.startsWith(postsDir)) return data;
  if (frontMatter.parse(data.raw || '').updated) return data;
  if (!lastCommit) lastCommit = buildIndex();
  const rel = 'articles/' + data.full_source.slice(postsDir.length).split(path.sep).join('/');
  const date = lastCommit.get(rel);
  // 提交早于 front-matter 的发布时间时（先提交、后定发布日期），以发布时间为准
  if (date) data.updated = moment.max(moment(date), moment(data.date));
  return data;
}, 5);
