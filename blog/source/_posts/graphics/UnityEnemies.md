---
layout: post
# 标题
title: Probe-based Lighting in Unity Enemies 
# 发布时间
date: 2023/2/10 1:16:25  
# 分类
categories: [graphics] 
# 标签
tags:
  - GI
  - Unity
  - SIGGRAPH
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

[论文地址](http://advances.realtimerendering.com/s2022/SIGGRAPH2022-Advances-Enemies-Ciardi%20et%20al.pdf)

> 感觉原理上就是在Volume GI的基础上，存了遮罩信息用于偏移采样点，使用紧凑哈希提高了空间利用率，感觉手游大世界完全可以上这个

<img src="/images/Enemies.png" alt="Enemies" style="zoom:50%;" />

### 不用Lightmap

- 难以处理复杂的集合体，难以处理LOD
- 烘焙速度慢，严重制约开发效率
- 无法处理动态物体，无法提供统一的光照
- 无法处理人物
- Worse directional quality

### Adaptive Probe Volumes

将空间划分为相同大小的cell，将cell作为分块烘焙、分块加载的最小单位

cell被细分为brick，在几何体密集的地方，brick越细分

<img src="/images/adaptive.png" alt="adaptive" style="zoom:50%;" />

<img src="/images/cell.png" alt="cell" style="zoom:50%;" />

<img src="/images/稀疏网格.png" alt="稀疏网格" style="zoom:67%;" />

#### 细分

> 可以参考Lumen中Build Voxel Faces，本质就是推箱子

细分的原理是使用Raycast判断一个区域有没有物体（命中点），我们使用SDF加速射线检测

<img src="/images/SDF推箱子.png" alt="SDF推箱子" style="zoom:50%;" />

1. 我们将一个cell划分为4x4的brick，这样就有16条起始边界，这些边界构成了一个正方形
2. 每一条边界向内发射一条长度为一的射线（使用SDF加速），若没有命中，则向内移动一格
3. 直到所有边界都命中后，我们得到右图所示的brick

#### 数据结构

感觉很类似与VolumeGI，由索引buffer和3DTexture组成，通过紧凑哈希来降低存储

- An indirection buffer存储了cell信息，cell索引→SH指针
- Spherical Harmonics Pool中存储SH信息，SH指针→SH系数

<img src="/images/IndirectionBuffer.png" alt="IndirectionBuffer" style="zoom:50%;" />

#### 采样

采样流程：World Position → Cell Indirection → Per-Cell Brick Indirection→ Brick UVW →Trilinear Sample SH Data

1. 基于着色点posWS生成cellPos
2. 加载cell信息
3. 找到该着色点位于cell中哪一个brick（brick的最低层级可能是由相机距着色点距离决定的）

```cpp
int localBrickIndex = floor(residualPosWS / (_MinBrickSize * pow(3, minFoundBrickLevel)));	//若minFoundBrickLevel=1，那么cell被细分为3x3个brick
localBrickIndex -= validArea.min;
```

4. 加载brick信息

5. 通过brick信息+offset采样3DTexture



### 接缝

我们根据场景几何体密度构建空间八叉树，对于稀疏空间使用精度更低的高Subdiv Level存储Probe信息，在Level交界处有时会有明显的接缝问题

解决方法：采样时加入抖动

### 黑斑

当我们做Probe摆放时，由于按网格和brick摆放，经常会出现Probe放在墙内的情况，这会导致墙面、地板发黑

Unity的做法是一种辐照度驱动的摆放，通过判断Probe位置处四周backface比例，来判断这个Probe的有效性

<img src="/images/Probe评分.png" alt="Probe评分" style="zoom:50%;" />

对于有效性低/无效的Probe，Unity给出的解决方案就是，**让墙内的Probe变亮**

#### Post-Bake

1. 烘焙后遍历Probe，找到在墙内的无效Probe
2. 搜索其邻居Probe，使用其中**有效**Probe进行加权插值，权重是距离的平方反比
3. 于是墙内的Probe就成功变亮了

<img src="/images/Dilation2.png" alt="Dilation2" style="zoom:67%;" />

#### Pre-Bake

> 参考《The lighting technology of Detroit Become Human》

使用Post-Bake后，确实黑斑少了，但是我们发现墙体出现了漏光，为此我们加入了Virtual Offset（bake阶段的offset），在烘焙时，将Probe移至墙外，最后再将墙外烘焙的信息写入墙内Probe中，于是既没有破坏网格结构，也实现了墙内Probe变亮

<img src="/images/probeoffset.png" alt="probeoffset" style="zoom:50%;" />



### 漏光

> 我感觉防漏光的本质就是让墙体“变厚”，无论是摆放层面上的遮光板，烘焙时期的Virtual Offset，还是是采样层面的偏移

传统的Probe采样，薄墙体由于使用了墙壁另一面的Probe信息发生漏光。为了避免漏光，采样时通常对采样位置进行偏移（Biases）

- Normal Bias，采样点沿着法线方向偏移
  - 这样做实际上让物体沿着法线方向变大了
  - 偏移的过多/过少，都会影响效果
  - 难以调优
- View Bias，采样点朝着相机方向偏移
  - 依赖于相机
  - 难以调优

#### Validity Based Weighting

而Unity使用了Validity Based Weighting技术来减弱漏光，本质还是对采样点进行偏移

原理上是通过标记遮罩得出偏移方向，使得偏移方向基于辐照度，而非模型法线、视线，

- 每一个Probe存储者8bit的遮罩，用于记录其八个方向（2x2x2）的邻居是否有效
- 若某个邻居无效，则推动采样点远离那个邻居（计算偏移的方向和大小）

但我们现在其实只得到了偏移的方向，不知道偏移的距离

#### 遮光板

美术可以手动摆放一个遮光板，使得某些位置上的Probe失效

<img src="/images/遮光板.png" alt="遮光板" style="zoom:50%;" />

这确实让房顶下面不再漏光，但是这让房顶上面的物体过黑了

Unity的做法是对遮光板内Probe的邻居进行判断

- 若邻居Probe都不在室内（Occluding objects），那么不会使用遮光板，使用原本的数据
- 若邻居有在室内的，室内物体用到该Probe时才会变黑

### 场景管理

将球偕信息编码在3DTexture中比较好做Streaming













