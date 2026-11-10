# Blog

1. 打开项目
2. 同步 submodule
> blog-note 是私有仓库，不过你可以自行更换

```bash
git submodule update
cd blog-note
git pull
cd ..
```

3. 安装依赖：输入

```bash
npm install
```

4. 修改后编译
   `source/_posts`、`source/images` 是指向 `blog-note/articles`、`blog-note/images` 的符号链接，
   图片路径 `../../images/` 会在渲染时由 `scripts/blog-note-images.js` 改写为 `/images/`，无需拷贝文件

```bash
hexo g
```

5. 本地服务器（用于调试）

```bash
hexo s
```

### 参考

[Git Action](https://juejin.cn/post/7006186847458033672)
