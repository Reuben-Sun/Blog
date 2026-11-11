'use strict';

// 订阅源只放摘要：正文经过主题懒加载处理（srcset 为占位图）且图片为相对路径，
// 在 RSS 阅读器里显示不全。hexo-generator-feed 摘要取 description → intro →
// excerpt → 截取 HTML；主题不使用 intro，这里用纯文本生成它，避免截断出半个标签。
const { stripHTML } = require('hexo-util');

const LIMIT = 200;

hexo.extend.filter.register('after_post_render', data => {
  if (data.layout !== 'post' || data.intro) return data;
  const text = stripHTML(data.content || '').replace(/\s+/g, ' ').trim();
  const chars = [...text];
  data.intro = chars.length > LIMIT ? `${chars.slice(0, LIMIT).join('')}…` : text;
  return data;
});
