const fs = require("fs")
const path = require("path")


fs.renameSync(
    path.resolve(__dirname, '..', 'blog-note', 'articles'),
    path.resolve(__dirname, '..', 'source', '_posts')
);


fs.renameSync(
    path.resolve(__dirname, '..', 'blog-note', 'images'),
    path.resolve(__dirname, '..', 'source', 'images')
);