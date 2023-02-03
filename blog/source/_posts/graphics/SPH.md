---
layout: post
# 标题
title: SPH入门  
# 发布时间
date: 2023/2/2 22:16:25  
# 分类
categories: [graphics] 
# 标签
tags:
  - Physics
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

# SPH入门

SPH（Smoothed Particle Hydrodynamics）光滑粒子流体力学

> A mesh-free method for the discretization of functions and partial differential operators

SPH是一种基于拉格朗日视角的算法，是一种空间离散化的算法，常用于连续介质的数值模拟

- 拉格朗日视角：视角随着介质移动而移动（粒子模拟）
- 欧拉视角：视角是固定的，检测穿过视角的介质流速（网格模拟）

![拉格朗日](/images/拉格朗日.png)

### 狄拉克函数

狄拉克$\delta$函数，这是一个广义函数，其在整个定义域中积分值都集中在原点
$$
\delta (\mathbf{r})= \begin{cases}
\infty & |\mathbf{r}|=0 \\\\
0 & otherwise
\end{cases}
$$
该函数仅在积分中有意义，可以通过高斯钟形函数（正态分布）逼近

![高斯钟形](/images/高斯钟形.png)

在物理学中我们常用质点表示物体，但是因此使得密度函数失去了意义（因为质点没有空间），此时密度函数就塌缩成了狄拉克函数

空间中任何标量场函数，都可以用狄拉克函数表示：
$$
A(\mathbf{x})=(A*\delta)(\mathbf{x})=\int A(\mathbf{x}')\delta (\mathbf{x}-\mathbf{x}')dv'
$$

- $dv'$是$\mathbf{x}'$对应的体积积分变量
- $A(\mathbf{x}): \mathbb{R}^d \rightarrow \mathbb{R}$，d是维度，意思就是这是一个空间函数

> $\mathbb{R}$是实数集
>
> $\mathbb{R}^+$是正实数集（不含0）
>
> $\mathbb{R}^d$是d维实数集

### 光滑核函数

我们有了狄拉克函数，想要把连续函数来离散表示

核函数（kernel functions，smoothing kernels）是一种随着距离而衰减的函数，与高斯函数要在整个作用域积分不同，核函数是有最大影响半径的，最大影响半径用$h$表示

<img src="/images/核函数.png" alt="核函数" style="zoom:50%;" />

核函数满足

1. 归一化
2. 狄拉克条件
3. 非负性
4. 对称性
5. 有界性

![核函数性质](/images/核函数性质.png)

一个经典的核函数是三次样条器（cubic spline kernel）

![三次样条器](/images/三次样条器.png)

- 其中$q=\frac{1}{h}||\mathbf{r}||$

### 离散化

> 有个数学大佬告诉我，这里就是“在某个i点处求所有其他j点按核函数加权的平均值，只不过离散化的时候划成了区块赋予了密度和体积”
>
> 换句话说，这其实就是一次卷积（数学家真是不讲人话）

参考上面那张核函数的图，离散化就是对于$i$点，我们求该点附近场密度函数值和核函数（一堆$j$点）的加权平均值

<img src="/images/离散化.png" alt="离散化" style="zoom:50%;" />

在数学上，$\langle A(x)\rangle $表示平均值

### 质量密度估计

粒子不需要携带质量密度函数，对于空间中任意位置的点，都可以通过离散化求出该点密度

对于$\mathbf{x}_i$位置处的点，其密度为：


$$
\rho_{i} =\sum_{j} m_{j}W_{ij}
$$
不过在流体边界，这样求密度会导致数据偏小，需要做边界处理

下图绿色点临域完整，得到正确的密度，而红色点只能得到一个较小的密度

<img src="/images/流体边界.png" alt="流体边界" style="zoom:50%;" />



###  微分算子的离散化

上面我们已经实现场函数的离散化，实现了质量密度估计。但除此之外，还有一些空间微分算子值得离散化
$$
\nabla A_{i}\approx \sum_{j} A_{j}\frac{m_{j}}{\rho_{j} } \nabla W_{ij}
$$


### 符号表

![符号](/images/符号.png)

### 参考

[Physics Simulation in Visual Computing](https://interactivecomputergraphics.github.io/physics-simulation/)

[GAMES201](https://www.bilibili.com/video/BV1ZK411H7Hc)

[MrKill的知乎](https://zhuanlan.zhihu.com/p/426566636)
