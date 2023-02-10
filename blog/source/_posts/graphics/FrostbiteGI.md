---
layout: post
# 标题
title: Precomputed GI in Frostbite 
# 发布时间
date: 2023/2/10 10:16:25  
# 分类
categories: [graphics] 
# 标签
tags:
  - GI
  - GDC
# 作者
#author: Reuben
# 缩略图
thumbnail: 
# 显示封面
cover: true
# 显示目录
toc: true
# 启用插件
plugins:
  - mathjax
---

# Precomputed GI in Frostbite

GDC2018，寒霜引擎的预烘焙GI

- Path-traced spherical harmonics lightmaps
  - Motivation
  - Diffuse lighting
  - Efficient encoding
  - Approximate specular lighting
- A bag of tricks
  - Hemisphere and texel sampling
  - Rendering convergence detection
  - Dealing with overlapping geometry
  - Ensuring correct bilinear interpolation
  - Efficient lightmap atlas packing























