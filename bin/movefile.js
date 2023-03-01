const fs = require("fs")
const path = require("path")

const srcArticles = path.resolve(__dirname, '..', 'blog-note', 'articles');
const destArticles = path.resolve(__dirname, '..', 'source', '_posts');

fs.rmSync(destArticles, { recursive: true, force: true });
fs.renameSync(srcArticles, destArticles);

const srcImages = path.resolve(__dirname, '..', 'blog-note', 'images');
const destImages = path.resolve(__dirname, '..', 'source', 'images');

fs.rmSync(destImages, { recursive: true, force: true });
fs.renameSync(srcImages, destImages);