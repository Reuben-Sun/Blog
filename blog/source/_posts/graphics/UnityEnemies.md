---
layout: post
# 标题
title: Probe-based Lighting in Unity Enemies 
# 发布时间
date: 2023/2/2 22:16:25  
# 分类
categories: [graphics] 
# 标签
tags:
  - GI
  - Unity
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

# Probe-based Lighting in Unity Enemies

2022年SIGGRAPH，Unity发布了一个数字人项目，在头发、眼球、GI方面效果非常好，我们来分析一下他的Probe-based GI

<img src="../../images/Enemies.png" alt="Enemies" style="zoom:50%;" />

### 不用Lightmap

- 难以处理复杂的集合体，难以处理LOD
- 烘焙速度慢，严重制约开发效率
- 无法处理人物（和动态物体）
- Worse directional quality

### Adaptive Probe Volumes

距离几何体越近，摆放越密集

<img src="../../images/adaptive.png" alt="adaptive" style="zoom:50%;" />

<img src="../../images/cell.png" alt="cell" style="zoom:50%;" />

### 数据结构

感觉很类似与VolumeGI，由索引buffer和3DTexture组成，通过紧凑哈希来降低存储

- An indirection buffer存储了cell信息，cell索引→SH指针
- Spherical Harmonics Pool中存储SH信息，SH指针→SH系数

<img src="../../images/IndirectionBuffer.png" alt="IndirectionBuffer" style="zoom:50%;" />

采样流程：World Position → Cell Indirection → Per-Cell Brick Indirection→ Brick UVW →Trilinear Sample SH Data

### 问题

#### level交界处会有明显的接缝

解决方法：采样时加入抖动

#### Probe位于几何体内部

当我们做Probe摆放时，经常会出现Probe放在墙内的情况，这会导致墙面、地板发黑

Unity的做法也是一种辐照度驱动的摆放，遍历Probe，采集该Probe四周的Probe信息，



















