---
layout: post
# 标题
title: test  
# 发布时间
date: 2023/1/31 10:01:25  
# 分类
categories: [graphics] 
# 标签
tags:
  - C++
# 作者
#author: Reuben
# 缩略图
thumbnail: /images/effectivecxx.png 
# 显示封面
cover: true
# 显示目录
toc: true
# 启用插件
plugins:
  - mathjax
---

Welcome to [Hexo](https://hexo.io/)! This is your very first post. Check [documentation](https://hexo.io/docs/) for more info. If you get any problems when using Hexo, you can find the answer in [troubleshooting](https://hexo.io/docs/troubleshooting.html) or you can ask me on [GitHub](https://github.com/hexojs/hexo/issues).

## Quick Start

$\Delta x$
$$
\lim_{n \rightarrow \infty}s_n=\lim_{n \rightarrow \infty}s_{2n}=s
$$

```cpp
int main(){
	cout << "Hello";
}
```



```csharp
using System;

namespace Test
{
    class MainClass
    {
        public class Adder
        {
            private int c;
            public Adder(int c) { this.c = c; }
            public int Add(int a, int b)
            {
                return a + b + c;
            }
        }

        public static void Main(string[] args)
        {
            Adder adder = new Adder(1);
            Func<int, int, int> method = adder.Add;
            Console.WriteLine(method(2, 3));
        }
    }
}
```

```javascript
"use strict";
const vertex = [-0.5, 0.5, 1, 1, 0.5, -0.5];
const color = [0.8, 0.8, 0.6];
window.onload = initGL;
function initGL() {
    var _a, _b, _c;
    const gl = (_a = document.getElementById("glcanvas")) === null || _a === void 0 ? void 0 : _a.getContext("webgl"), vsSource = (_b = document.getElementById("vertex-shader")) === null || _b === void 0 ? void 0 : _b.textContent, fsSource = (_c = document.getElementById("fragment-shader")) === null || _c === void 0 ? void 0 : _c.textContent;
    if (!gl) {
        alert('Browser does not support webgl.');
        return;
    }
    if (!(vsSource && fsSource)) {
        throw 'No shader found.';
    }
    gl.clearColor(1, 1, 1, 1);
    gl.clearDepth(0);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    gl.useProgram(shaderProgram);
    const programInfo = {
        pos: gl.getAttribLocation(shaderProgram, "pos"),
        color: gl.getUniformLocation(shaderProgram, "color")
    };
    initBuffers(gl);
    gl.vertexAttribPointer(programInfo.pos, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.pos);
    gl.uniform3fv(programInfo.color, color);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

```

```css
* {
  box-sizing: border-box;
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  outline: none;
  margin: 0;
  padding: 0;
}
```

