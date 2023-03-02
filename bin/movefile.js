// file copy
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

// image url replace
const replace = require('replace-in-file')

const result = replace.replaceInFileSync({
    files: path.join(destArticles, "**/*.md"),
    from: /\.\.\/\.\.\/images\//g,     // from ../../images/ to /images/
    to: "/images/",
});

console.log(result.filter(it=>it.hasChanged).map(it=>it.file))