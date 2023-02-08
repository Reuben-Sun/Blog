---
layout: post
# 标题
title: Metal：TBDR
# 发布时间
date: 2023/2/8 14:33:25  
# 分类
categories: [graphics] 
# 标签
tags:
  - Metal
  - Deferred Render
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

# Tile Base Deferred Rendering

基于Apple M1和Metal图形库，[项目地址](https://github.com/Reuben-Sun/TinyMetalEngine)

### 移动端GPU渲染架构

![移动端GPU](/images/移动端GPU.png)

- IMR（Immediate Mode Rending），即时模式渲染，按drawcall顺序绘制
- TBR（Tile Base Rendering）
  - 将画面分割为一个个tile，在VS对每一个tile处理，将结果存到On-Chip Memory上
  - FS读信息，渲染每一个tile
  - 当FS将所有的tile渲染完毕后，将完成的frame信息写入System Memory中

TBR相较于IMR能省带宽，而移动端的性能瓶颈在于带宽

值的注意的是，TBR产生带宽优势的核心是片上存储，而非Tile

> 我个人感觉为什么要使用Tile，可能是因为移动端GPU规模太小，难以放下整张RT。毕竟理论上使用一张大RT的采样成本更低，比如将一组TextureArray转化为VSM，能很明显提高滤波速度
>
> 我在实际测试中发现当你隐式使用TBR时也会自动切分Tile，手动指定Tile尺寸反而增大了带宽和GPU时间（我也不清楚为什么，希望有人能给我解释一些）

#### 片上储存

片上存储（on-chip memory），是集成在GPU上的存储空间

GPU中有多种存储数据的结构，访问速度从快到慢排依次是

1. Register Memory（RMEM）
   - 访问极快，不需要消耗时钟周期（除非发生了冲突或者先写后读）
   - 只对负责对其进行读写的线程可见
2. Shared Memory（SMEM）
   - 对处于同一个block所有的线程都是可见的，所以常用与数据交换
3. Constant Memory（CMEM）
   - 用于存储常量数据
4. Texture Memory（TMEM）
   - 用于存储常量数据
5. Local Memory（LMEM）和Global Memory（GMEM）
   - LMEM只是对GMEM的一个抽象，两者存取速度上一样的
   - 只对负责对其进行读写的线程可见
   - 一般用来存储automatic变量
     - automatic变量是一种大尺寸的数据结构/数组
   - 有缓存机制（类比cache）

其中**RMEM与SMEM是集成在GPU芯片上的**，其他的则是存储在显存中的（你可以类比寄存器，cache和内存）

### Single RednerPass

> 类比Vulkan的SubPass

传统的延迟渲染，是一个多Pass渲染。GBufferPass生成MRT，传递给LightingPass着色输出，这个过程中会有大量的贴图IO带宽

<img src="/images/传统延迟.png" alt="传统延迟" style="zoom:50%;" />

TBDR（Tile Base Deferred Rendering）利用了Metal图形库Single RenderPass的特性

- 在一个Single Pass中有多个小Pass，小Pass共享一组片上存储
- 一个Pass运行后，会在片上生成一些临时贴图，其他Pass可以直接访问这些贴图

<img src="/images/MetalTBDR.png" alt="MetalTBDR" style="zoom:50%;" />

> TBDR是Apple芯片的功能，对于安卓GPU
>
> Adreno：frameBuffer fetch deferred，提前绑定（开辟）好MRT，使用时RT不动，Pass动
>
> Mali：pixel loacl storage deferred，将GBuffer存在on-clip mem上，于是就减少了IO消耗

### 实现TBDR	

1. 将GBuffer中Texture存储类型设为memoryless

```diff
albedoTexture = Self.makeTexture(
            size: size,
            pixelFormat: .bgra8Unorm,
            label: "Albedo Texture",
-            storageMode: .private)
+            storageMode: .memoryless)  
```

2. 将贴图存储操作设为dontcare

```diff
func draw(commandBuffer: MTLCommandBuffer, scene: GameScene, uniforms: Uniforms, params: Params) {
        ...
        //将贴图存储操作设为dontCare
        for (index, texture) in textures.enumerated() {
            let attachment =
            descriptor.colorAttachments[RenderTargetAlbedo.index + index]
            attachment?.texture = texture
            attachment?.loadAction = .clear
-            attachment?.storeAction = .store
+            attachment?.storeAction = .dontCare
            attachment?.clearColor =
            MTLClearColor(red: 0.73, green: 0.92, blue: 1, alpha: 1)
        }
        ...
```

3. 停止向LightPass的片元着色器传递贴图信息

```diff
 func drawSunLight(
        renderEncoder: MTLRenderCommandEncoder,
        scene: GameScene,
        params: Params
    ) {
        renderEncoder.pushDebugGroup("Sun Light")
-        renderEncoder.setFragmentTexture(
-            albedoTexture,
-            index: BaseColor.index)
-        renderEncoder.setFragmentTexture(
-            normalTexture,
-            index: NormalTexture.index)
-        renderEncoder.setFragmentTexture(
-            positionTexture,
-            index: NormalTexture.index + 1)
        ...
```

4. 修改LightPass的片元着色器，使其直接接收GBufferOut

```diff
-fragment float4 fragment_deferredSun(VertexOut in [[stage_in]],
+fragment float4 fragment_tiled_deferredSun(VertexOut in [[stage_in]],
        constant Params &params [[buffer(ParamsBuffer)]],
        constant Light *lights [[buffer(LightBuffer)]],
-        texture2d<float> albedoTexture [[texture(BaseColor)]],
-        texture2d<float> normalTexture [[texture(NormalTexture)]],
-        texture2d<float> positionTexture [[texture(NormalTexture + 1)]])
+				GBufferOut gBuffer)
{
    uint2 coord = uint2(in.position.xy);
-    float4 albedo = albedoTexture.read(coord);
+		 float4 albedo = gBuffer.albedo;
-    float3 normal = normalTexture.read(coord).xyz;
+		 float3 normal = gBuffer.normal.xyz;
-    float3 position = positionTexture.read(coord).xyz;
+		 float3 position = gBuffer.position.xyz;
    Material material {
        .baseColor = albedo.xyz,
        .specularColor = float3(0),
        .shininess = 500
    };
    float3 color = phongLighting(normal,
                                 position,
                                 params,
                                 lights,
                                 material);
    color *= albedo.a;
    return float4(color, 1);
}
```

5. 合并渲染命令提交，将drawGBufferRenderPass和drawLightingRenderPass放在同一个commandBuffer中

6. 配置Stencil测试

```diff
+static func buildDepthStencilState() -> MTLDepthStencilState? {
+        let descriptor = MTLDepthStencilDescriptor()
+        descriptor.depthCompareFunction = .less
+        descriptor.isDepthWriteEnabled = true
+        let frontFaceStencil = MTLStencilDescriptor()
+        frontFaceStencil.stencilCompareFunction = .always
+        frontFaceStencil.stencilFailureOperation = .keep
+        frontFaceStencil.depthFailureOperation = .keep
+        frontFaceStencil.depthStencilPassOperation = .incrementClamp
+        descriptor.frontFaceStencil = frontFaceStencil
+        return Renderer.device.makeDepthStencilState(descriptor: descriptor)
+      }
    
    static func buildLightingDepthStencilState() -> MTLDepthStencilState? {
        let descriptor = MTLDepthStencilDescriptor()
        descriptor.isDepthWriteEnabled = false
+        let frontFaceStencil = MTLStencilDescriptor()
+        frontFaceStencil.stencilCompareFunction = .notEqual
+        frontFaceStencil.stencilFailureOperation = .keep
+        frontFaceStencil.depthFailureOperation = .keep
+        frontFaceStencil.depthStencilPassOperation = .keep
+        descriptor.frontFaceStencil = frontFaceStencil
        return Renderer.device.makeDepthStencilState(descriptor: descriptor)
    }
```

```diff
depthTexture = Self.makeTexture(
            size: size,
-            pixelFormat: .depth32Float,
+            pixelFormat: .depth32Float_stencil8,
            label: "Depth Texture",
            storageMode: .memoryless)
```

```diff
-descriptor.depthAttachment.storeAction = .dontCare
+descriptor.depthAttachment.texture = depthTexture
+descriptor.stencilAttachment.texture = depthTexture
```

```diff
static func createGBufferPSO(colorPixelFormat: MTLPixelFormat, tiled: Bool = false) -> MTLRenderPipelineState {
        ...        
        if tiled {
            pipelineDescriptor.colorAttachments[0].pixelFormat = colorPixelFormat
        }
        pipelineDescriptor.setGBufferPixelFormats()
-        pipelineDescriptor.depthAttachmentPixelFormat = .depth32Float
-        if !tiled {
-            pipelineDescriptor.depthAttachmentPixelFormat = .depth32Float_stencil8
-            pipelineDescriptor.stencilAttachmentPixelFormat = .depth32Float_stencil8
-				 }
+        pipelineDescriptor.depthAttachmentPixelFormat = .depth32Float_stencil8
+        pipelineDescriptor.stencilAttachmentPixelFormat = .depth32Float_stencil8
        pipelineDescriptor.vertexDescriptor = MTLVertexDescriptor.defaultLayout
        return createPSO(descriptor: pipelineDescriptor)
    }
```



### 参考

[WWDC 2020](https://developer.apple.com/videos/play/wwdc2020/10632/)

[Metal by Tutorials](https://github.com/kodecocodes/met-materials)
