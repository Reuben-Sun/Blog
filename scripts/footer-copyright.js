'use strict';

// 页脚版权行中的 {year} 替换为构建时的年份（构建在 CI 上按 TZ=Asia/Shanghai 运行）
hexo.extend.filter.register('before_generate', function () {
  const footer = this.theme.config.site_footer;
  if (footer && typeof footer.copyright === 'string') {
    footer.copyright = footer.copyright.replace('{year}', String(new Date().getFullYear()));
  }
});
