'use strict';

// blog-note 里的文章用 ../../images/ 引用图片（方便在仓库中直接预览），
// 站点上图片位于 /images/，渲染前统一改写正文和 front-matter。
const IMAGE_PREFIX = /\.\.\/\.\.\/images\//g;
const rewrite = value => value.replace(IMAGE_PREFIX, '/images/');

hexo.extend.filter.register('before_post_render', data => {
  for (const key of Object.keys(data)) {
    const value = data[key];
    let next;
    if (typeof value === 'string') {
      next = rewrite(value);
      if (next === value) continue;
    } else if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
      next = value.map(rewrite);
      if (next.every((v, i) => v === value[i])) continue;
    } else {
      continue;
    }
    // 跳过 path、permalink 等只读的虚拟字段
    const desc = Object.getOwnPropertyDescriptor(data, key);
    if (desc && (desc.writable || desc.set)) data[key] = next;
  }
  return data;
}, 1);
