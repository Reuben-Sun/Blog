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

4. 拷贝/移动文件
   通过文件管理器将 /blog-node 下的文件复制到 sources 文件夹，并将 articles 重命名为 _posts

   或者使用下面的指令自动移动
```bash
npm run movefile
```

5. 修改后编译

```bash
hexo g
```

6. 本地服务器（用于调试）

```bash
hexo s
```

