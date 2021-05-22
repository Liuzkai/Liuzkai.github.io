---
title: 如何在Houdini中使用OpenCL
date: 2021-05-22 21:00:00 +/-0080
categories: [Houdini, Script]
tags: [Houdini, OpenCL, ComputeShader] 
---

# 如何在Houdini中使用OpenCL

本文中前六个案例参考[OpenCL | H16.5 Masterclass | SideFX](https://www.sidefx.com/tutorials/houdini-165-masterclass-opencl/)此视频，网页已经提供了文件，可以前去下载。后面的案例和关于workset的认识可能存在纰漏，如读者发现还请批评指正。

关于OpenCL的相关参考可查阅此[文章](https://developer.amd.com/wordpress/media/2012/10/OpenCLTutorial-Chinese.pdf)和此[网站](https://www.khronos.org/registry/OpenCL/sdk/1.2/docs/man/xhtml/)。

# 案例一 Attribute

对模型进行平均平滑

![Houdini_openCL_01.gif](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Houdini_openCL_01.gif)

因为opencl中没法用到vex中的方法，只能处理传进去的数组，因此将需要的数据作为属性保存到顶点中：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_opencl_setAttr.png)

## vex

先用传统的VEX实现该算法：

```glsl
vector avg = 0;

foreach(int npt; i[]@neighbours)
{
    vector pos = point(0, "P", npt);
    avg += pos;
}

avg /= len(i[]@neighbours);

@P = avg;
```

<img src="https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_1.png"  />

使用Complie Block和feedback for loop，进行迭代。我们迭代10000次。

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_2.png)

整体用时21.211s

## opencl

下面我们用OpenCL的方法进行实现：

### 第一步，先绑定参数到opencl中：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_3.png)

配置好设置之后，函数会为每个属性传入2到3个参数。

> 当属性不是数组时，会传入该属性的数组以及数组的长度。
> 如果出入的是一个数组属性时，会传入该属性数组以及其长度，另外还有一个保存每个属性长度的数组。

### 第二步，构建函数：

可以使用Generate Kemel来生成函数声明结构：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_4.png)

```glsl
kernel void kernelName( 
                 int P_length, 
                 global float * P ,
                 int neighbours_length, 
                 global int * neighbours_index, 
                 global int * neighbours 
)
{
    // No writeable attribute provided
    int idx = get_global_id(0);
    if ( idx >= P_length )
        return;
        
    float3 avg = vload3(idx, P);
    int start = neighbours_index[idx];
    int end = neighbours_index[idx+1];
    for( int i = start; i < end; i++)
    {
        int npt = neighbours[i];
        avg += vload3(npt, P);
    }
    avg /= (end - start + 1);
    
    vstore3(avg, idx, P);
}
```

性能： 循环10000次用时0.704s

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_5.png)

### writeBack函数

使用wirteBack函数，保证每次访问的都是迭代次数一致的数据

因为是平行，而且每个单元并不知道其他单元的计算顺序，因此可能会在访问neighbour的位置信息时，有时访问的是上次迭代，有时访问的不是。

writeBack函数时会在主函数之后运行，其运行完后主函数再次运行，以此类推，想乒乓一样。

我们创建一个临时属性来保存中间数据。并用writeBack函数来写回，保持大家读取和写入数据的一致性。

先为每个点创建一个临时属性`v@__scratch;` 并在opencl节点中引入。

然后启动Use Write Back Kemel，并修改代码如下：

```glsl
kernel void kernelName( 
                 int P_length, 
                 global float * P ,
                 int neighbours_length, 
                 global int * neighbours_index, 
                 global int * neighbours ,
                 int __scratch_length, 
                 global float * __scratch 
)
{
    int idx = get_global_id(0);
    if ( idx >= P_length )
        return;
        
    float3 avg = vload3(idx, P);
    int start = neighbours_index[idx];
    int end = neighbours_index[idx+1];
    for( int i = start; i < end; i++)
    {
        int npt = neighbours[i];
        avg += vload3(npt, P);
    }
    avg /= (end - start + 1);
    
    vstore3(avg, idx, __scratch);
}

kernel void writeBack( 
                 int P_length, 
                 global float * P ,
                 int neighbours_length, 
                 global int * neighbours_index, 
                 global int * neighbours ,
                 int __scratch_length, 
                 global float * __scratch 
)
{
    int idx = get_global_id(0);
    if ( idx >= P_length )
        return;
        
    float3 avg = vload3(idx, __scratch);
    
    vstore3(avg, idx, P);
}
```

使用writeBack会降低效率，但是结果会更加准确。

10000次迭代耗时1.671s（关于耗时，只看相对比例即可，绝对时间和硬件相关）

## 总结

第一个例子中，了解到如何将属性传入openCL中，另外了解到openCL的一些基础函数，以及writeBack函数。

# 案例二 Volume

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Houdini_openCL_02.gif)

## 第一步 run over first writeable volume

opencl也可以读入volume数据，设置如下：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_6.png)

这里的"first"指的时在binding一栏中，由上到下，第一个设置为writeable的属性或volume。

## 第二步 bindings

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_7.png)

需设置为volume，默认勾选的时force Alignment，此时不会提供voxel的下标，默认只能读自己的值并写回。函数也只有传入一个数组`global float * height` 。

去掉勾选可以输入以下默认参数

```glsl
kernel void kernelName( 
                 int height_stride_x, 
                 int height_stride_y, 
                 int height_stride_z, 
                 int height_stride_offset, 
                 global float * height 
)
{
    int gidx = get_global_id(0);
    int gidy = get_global_id(1);
    int gidz = get_global_id(2);
    int idx = height_stride_offset + height_stride_x * gidx
                               + height_stride_y * gidy
                               + height_stride_z * gidz;

}
```

另外我们需要volume的分辨率，因此勾上了voxel Resolution， 这样函数就可以使用接口：

```glsl
kernel void kernelName( 
                 int height_stride_x, 
                 int height_stride_y, 
                 int height_stride_z, 
                 int height_stride_offset, 
                 int height_res_x, 
                 int height_res_y, 
                 int height_res_z, 
                 global float * height 
)
```

## 第三步 编写逻辑

```glsl
kernel void kernelName( 
                 int height_stride_x, 
                 int height_stride_y, 
                 int height_stride_z, 
                 int height_stride_offset, 
                 int height_res_x, 
                 int height_res_y, 
                 int height_res_z, 
                 global float * height 
)
{
    int gidx = get_global_id(0);
    int gidy = get_global_id(1);
    int gidz = get_global_id(2);
    int idx = height_stride_offset + height_stride_x * gidx
                               + height_stride_y * gidy
                               + height_stride_z * gidz;
                               
    
    float avg = 0;
    for(int dx = -1; dx <= 1; dx++)
    {
        int x = gidx + dx;
        x = clamp( x, 0, height_res_x);
        for(int dy = -1; dy <= 1; dy++)
        {
            int y = gidy + dy;
            y = clamp( y, 0, height_res_y);
            avg += height[ height_stride_offset + height_stride_x * x
                               + height_stride_y * y
                               + height_stride_z * gidz];
        }
    }
    height[idx] = avg / 9.0;
}
```

这样处理依然会出现不正确的读取，因此可以向上个案例一样，采用writeBack函数进行优化：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_8.png)

```glsl
kernel void kernelName( 
                 int height_stride_x, 
                 int height_stride_y, 
                 int height_stride_z, 
                 int height_stride_offset, 
                 int height_res_x, 
                 int height_res_y, 
                 int height_res_z, 
                 global float * height ,
                 global float * scratch 
                 
)
{
    int gidx = get_global_id(0);
    int gidy = get_global_id(1);
    int gidz = get_global_id(2);
    int idx = height_stride_offset + height_stride_x * gidx
                               + height_stride_y * gidy
                               + height_stride_z * gidz;
                               
    
    float avg = 0;
    for(int dx = -1; dx <= 1; dx++)
    {
        int x = gidx + dx;
        x = clamp( x, 0, height_res_x);
        for(int dy = -1; dy <= 1; dy++)
        {
            int y = gidy + dy;
            y = clamp( y, 0, height_res_y);
            avg += height[ height_stride_offset + height_stride_x * x
                               + height_stride_y * y
                               + height_stride_z * gidz];
        }
    }
    scratch[idx] = avg / 9.0;
}

kernel void writeBack( 
                 int height_stride_x, 
                 int height_stride_y, 
                 int height_stride_z, 
                 int height_stride_offset, 
                 int height_res_x, 
                 int height_res_y, 
                 int height_res_z, 
                 global float * height ,
                 global float * scratch 
                 
)
{
    int gidx = get_global_id(0);
    int gidy = get_global_id(1);
    int gidz = get_global_id(2);
    int idx = height_stride_offset + height_stride_x * gidx
                               + height_stride_y * gidy
                               + height_stride_z * gidz;
                               
    height[idx] = scratch[idx];
}
```

## 第四步 添加可选mask控制

让输入的mask作为处理的遮罩，并且当没有mask输入时，默认全部处理。

可以通过绑定参数时，勾选optional来处理。

当参数勾选为optional后，需要在代码中添加宏来控制代码，此时需要注意，如果你将最后一个参数作为optional，再写宏时，需要将逗号“，”写入宏的范围内。

也可以通过避免将最后一个参数绑定为optional来解决这个问题。

```glsl

kernel void kernelName( 
                 int height_stride_x, 
                 int height_stride_y, 
                 int height_stride_z, 
                 int height_stride_offset, 
                 int height_res_x, 
                 int height_res_y, 
                 int height_res_z, 
                 global float * height ,
                global float * scratch 
#ifdef HAS_mask
                ,
                 global float * mask 
#endif
                 
){
...
}

kernel void writeBack( 
                 int height_stride_x, 
                 int height_stride_y, 
                 int height_stride_z, 
                 int height_stride_offset, 
                 int height_res_x, 
                 int height_res_y, 
                 int height_res_z, 
                 global float * height ,
                 global float * scratch 
#ifdef HAS_mask
                ,
                 global float * mask 
#endif
)
{
    int gidx = get_global_id(0);
    int gidy = get_global_id(1);
    int gidz = get_global_id(2);
    int idx = height_stride_offset + height_stride_x * gidx
                               + height_stride_y * gidy
                               + height_stride_z * gidz;
                            
    if( mask[idx] > 0 )                          
        height[idx] = scratch[idx];
}
```

> 需要再次注意，函数参数的顺序是固定的，不能随便修改，不然脚本将无法对齐上下文。

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_9.png)

## 总结

OpenCL对Volume上下文对接需要注意两个地方，第一就是需要在option中修改run over参数到first writeable volume。第二点就是bind属性的时候，volume可以强制对齐或者自定义。

另外，使用optional参数时，尽量避免将其排列在最后，否则需要在写宏时，将逗号包含进来。

因为脚本嵌套在上下文中，因此函数的输入参数顺序和命名必须严格拷贝生成的结果。

# 案例三 点面属性传递

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Houdini_openCL_03.gif)

opencl只能将值输出给一组数据（一个属性），因此当我们需要将数据从两个属性间来回写入，将需要两个opencl进行串联，通过使用feedback foreach 和complie block节点来进行优化。

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_10.png)

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_11.png)

在参数一栏，设置可读和可写。

```glsl
# Write to prim
kernel void kernelName( 
                 int pointcd_length, 
                 global float * pointcd ,
                 int primcd_length, 
                 global float * primcd ,
                 int points_length, 
                 global int * points_index, 
                  global int * points ,
                 int prims_length, 
                 global int * prims_index, 
                  global int * prims 
)
{
    int idx = get_global_id(0);
    if (idx >= primcd_length)
        return;
    
    float3 total = 0;
    
    int start = points_index[idx];
    int end = points_index[idx+1];
    for( int i = start; i < end; i++ )
    {
        total = max( total, vload3( points[i], pointcd));
    }
    
    vstore3( total, idx, primcd);
}
```

```glsl
# Write to point
kernel void kernelName( 
                 int pointcd_length, 
                 global float * pointcd ,
                 int primcd_length, 
                 global float * primcd ,
                 int points_length, 
                 global int * points_index, 
                  global int * points ,
                 int prims_length, 
                 global int * prims_index, 
                  global int * prims 
)
{
    int idx = get_global_id(0);
    if (idx >= pointcd_length)
        return;
    
    float3 total = 0;
    
    int start = prims_index[idx];
    int end = prims_index[idx+1];
    for( int i = start; i < end; i++ )
    {
        total = max( total, vload3( prims[i], primcd));
    }
    
    vstore3( total, idx, pointcd);
}

```

# 案例四 采样volume

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Houdini_openCL_04.gif)

因为节点只能有一个输入，所以要Volume和Primitive进行merge后在输出给opencl节点。

提供了Volume Transform to Voxel矩阵，可以利用这个矩阵，将世界坐标换算成体素空间。

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_12.png)

```glsl
kernel void kernelName( 
                 int Cd_length, 
                 global float * Cd ,
                 int P_length, 
                 global float * P ,
                 int density_stride_x, 
                 int density_stride_y, 
                 int density_stride_z, 
                 int density_stride_offset, 
                 int density_res_x, 
                 int density_res_y, 
                 int density_res_z, 
                 float16 density_xformtovoxel, 
                 global float * density 
)
{
    int idx = get_global_id(0);
    if (idx >= Cd_length)
        return;
    
    float3 pos = vload3(idx, P);
    float3 col = vload3(idx, Cd);
    float4 voxel_pos = pos.x * density_xformtovoxel.lo.lo 
                     + pos.y * density_xformtovoxel.lo.hi
                     + pos.z * density_xformtovoxel.hi.lo
                     + 1     * density_xformtovoxel.hi.hi;

                     
    int x = clamp((int)floor(voxel_pos.x), 0, density_res_x - 1);
    int y = clamp((int)floor(voxel_pos.y), 0, density_res_y - 1);
    int z = clamp((int)floor(voxel_pos.z), 0, density_res_z - 1);
    
    if( density[ density_stride_offset 
            + density_stride_x * x
            + density_stride_y * y
            + density_stride_z * z ] > 0.05 )
    {
        col.x = 0.0;
        vstore3(col, idx, Cd);
    }
}
```

需要注意的是， 利用视频中的方法计算体素位置，最后采样数会有些偏差，需要将判断改为大于0的数。

应该还有其他利用矩阵的方法，待查证。

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_13.png)

此处已将VDB转换成volume。

# 案例五 workset 01

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Houdini_openCL_05.gif)

我们可以利用Workset属性进行控制迭代的次数。实现类似于while循环，达到优化的目的。

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_14.png)

## 无workset版本

我们将相连点序号和相邻点距离保存成数组：

```glsl
// init Node
i[]@neighbours = neighbours(0,@ptnum);
float @elens[];

foreach(int pt; i[]@neighbours)
{
    vector epos = point(0, "P", pt);
    float elen = distance(@P, epos);
    append(@elens, elen);
    
}

v@dP = 0;
```

然后将模型进行修改，然后利用opencl进行平滑。

导入一下四个参数：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_15.png)

```glsl
kernel void kernelName( 
                 int P_length, 
                 global float * P ,
                 int dP_length, 
                 global float * dP ,
                 int neighbours_length, 
                 global int * neighbours_index, 
                  global int * neighbours ,
                 int elens_length, 
                 global int * elens_index, 
                  global float * elens 
)
{
    int idx = get_global_id(0);
    if (idx >= P_length)
        return;
    
    float3 delta = 0;
    int weight = 0;
    
    int start = neighbours_index[idx];
    int end   = neighbours_index[idx+1];
    float3 pos = vload3(idx, P);
    for( int i = start; i < end; i++)
    {
        float3 npos = vload3(neighbours[i], P);
        float elen = elens[i];
        
        float actuallen = length(pos - npos);
        float displace = elen - actuallen;
        actuallen = max(actuallen, 0.001f);
        
				// 求移动位移，除以actuallen是为了归一化移动方向
        delta += (pos - npos) * displace / actuallen;
        
        weight++;
    }
    
    delta /= weight;
    
    vstore3( delta, idx, dP);
}

kernel void writeBack( 
                 int P_length, 
                 global float * P ,
                 int dP_length, 
                 global float * dP ,
                 int neighbours_length, 
                 global int * neighbours_index, 
                  global int * neighbours ,
                 int elens_length, 
                 global int * elens_index, 
                  global float * elens 
)
{
    int idx = get_global_id(0);
    if (idx >= P_length)
        return;
    
    float3 pos = vload3(idx, P);
    float3 delta = vload3(idx, dP);
    pos += delta;
    vstore3(pos, idx, P);
}
```

## workset版本

先在输入模型的Detail属性中添加两个整数数组属性：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_16.png)

然后修改opencl节点的run over 为 “Detail Attribute of Worksets",

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_17.png)

再然后我们将ws_len作为参数导入opencl

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_18.png)

修改代码如下：

```glsl
kernel void kernelName( 
                 int worksets_begin, 
                 int worksets_length, 
                 int P_length, 
                 global float * P ,
                 int dP_length, 
                 global float * dP ,
                 int neighbours_length, 
                 global int * neighbours_index, 
                  global int * neighbours ,
                 int elens_length, 
                 global int * elens_index, 
                  global float * elens ,
                    int ws_len_length, 
                 global int * ws_len_index, 
                  global int * ws_len
)
{
    int idx = get_global_id(0);
    if (idx >= worksets_length)
        return;
    idx += worksets_begin;
    
    float3 delta = 0;
    int weight = 0;
    
    int start = neighbours_index[idx];
    int end   = neighbours_index[idx+1];
    float3 pos = vload3(idx, P);
    for( int i = start; i < end; i++)
    {
        float3 npos = vload3(neighbours[i], P);
        float elen = elens[i];
        
        float actuallen = length(pos - npos);
        float displace = elen - actuallen;
        actuallen = max(actuallen, 0.001f);
        
        delta += (pos - npos) * displace / actuallen;
        
        weight++;
    }
    
    delta /= weight;
    
    vstore3( delta, idx, dP);
    
    // stop iteration by using workset length
    ws_len[0] = 0; //当我们修改此值，默认值worksets_length也会随之更改。当我们设置为0时，迭代停止
}

kernel void writeBack( 
                 int worksets_begin, 
                 int worksets_length, 
                 int P_length, 
                 global float * P ,
                 int dP_length, 
                 global float * dP ,
                 int neighbours_length, 
                 global int * neighbours_index, 
                  global int * neighbours ,
                 int elens_length, 
                 global int * elens_index, 
                  global float * elens ,
                    int ws_len_length, 
                 global int * ws_len_index, 
                  global int * ws_len)
{
    int idx = get_global_id(0);
    if (idx >= worksets_length)
        return;
    idx += worksets_begin;
    
    
    float3 pos = vload3(idx, P);
    float3 delta = vload3(idx, dP);
    pos += delta;
    vstore3(pos, idx, P);
    
    // if delta is more than my condition, we will overwrite ws_len, 
    // then loop continue. 
    // In other side, we do nothing, and iteration will stop.
    if( length(delta) > 0.01 )
        ws_len[0] = worksets_length;

		// 由于delta大部分都是小于0.01的，因此我们只能先默认停止，在回写函数中，看是否要继续。
}
```

通过`length(delta) > 0.01`  就可以实现了根据条件控制循环。

# 案例六 workset02 优化

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_19.png)

本案例将会使用更为准确的方法，来进行平滑，同时代码也会更加简洁。

本案例通过使用restlength数据，进行优化。因此要在primitive类形数据上进行循环。

同时我们按照四次进行隔行计算数据，如下图：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_20.png)

这样平滑后，我们可以获得更好的效果。当然也会更慢。

先将线段从新排序：

```cpp
int p0 = primpoint(0, @primnum, 0);
int p1 = primpoint(0, @primnum, 1);

int r0 = p0 / 21;
int r1 = p1 / 21;
p0 %= 21;
p1 %= 21;

if ((p0 & 1) != (p1 & 1))
{
    // Joins two colums
    i@pass = 2 + (p0 & 1);
}
else
{
    @pass = r0 & 1;
}
```

然后设置workset以四次进行平滑：

```cpp
int @workset_begin[];
int @workset_len[];

for (int i = 0; i < 4; i++)
{
    append(@workset_begin, 210 * i);
    append(@workset_len, 210);
}
```

opencl代码如下：

```cpp
kernel void kernelName( 
                 int worksets_begin, 
                 int worksets_length,  
                 int P_length, 
                 global float * P ,
                 int restlength_length, 
                 global float * restlength ,
                 int points_length, 
                 global int * points_index, 
                  global int * points
)
{
    int idx = get_global_id(0);
    if (idx >= worksets_length)
        return;
    idx += worksets_begin;

    int p0idx = points[points_index[idx]];
    int p1idx = points[points_index[idx]+1];
    
    float3 p0 = vload3(p0idx, P);
    float3 p1 = vload3(p1idx, P);
    
    float actuallen = length(p0-p1);
    actuallen = max(actuallen, 0.001f);
    float rest = restlength[idx];

    float change = rest - actuallen;
    float3 displace = (p0 - p1) * change / actuallen;
    displace /= 2;
    p0 += displace;
    p1 -= displace;
    
    vstore3(p0, p0idx, P);
    vstore3(p1, p1idx, P);
}
```

# 案例七 workset03 访问其他模型数据

因为opencl只能有一个输入，如果想让模型A访问模型B该如何实现？

我们可以利用workset来实现。

案例如下：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_21.png)

上图中，0，1点需要访问一点范围内的中间直线的数据area，并累加到自己的density参数中。

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Houdini_openCL_07.gif)

我们可以这样设置，将两个模型进行merge。但是要注意的是，先输入0，1号点，再添加直线。

也就是我们需要写入的点在前，需要访问的点在后。

然后设置workset:

```c
i[]@_workset_begin;
i[]@_workset_length;
append(i[]@_workset_begin, 0);
append(i[]@_workset_length, npoints(0));
```

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_22.png)

节点图

设置opencl的参数：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_23.png)

代码如下：

```c
kernel void kernelName( 
 int worksets_begin, 
                 int worksets_length, 
                 int P_length, 
                 global float * P ,
                 int density_length, 
                 global float * density ,
                 int area_length, 
                 global float * area ,
                 int     iteration ,
                 int iter_length, 
                 global int * iter,
                  float  dis )
{
    int idx = get_global_id(0);
    if (idx >= worksets_length)
        return;
    idx += worksets_begin;
    if(iter[idx] >= (P_length - worksets_length))
        return;
        
    
    float3 pos = vload3(idx, P);
    
    int cur_t = (worksets_length + iter[idx]);
    
    float3 tpos = vload3(cur_t , P);
    float l = length(tpos - pos);
    if( l < dis ){

       density[idx] += area[cur_t];
    }
    iter[idx] += 1;
}
```

上图中，设置了一个可写变量iter，作为记录当前循环的次数，每次循环，我们访问直线上的一个点数据P和area。这里的`int cur_t = (worksets_length + iter[idx]);` 就是用来计算当前迭代要访问的点序号。因为将模型AB合并在一起，我们只需要处理前面两个点，后面的点作为可访问参数我们在每次迭代时单独访问。

调节参数dis可以控制计算的范围。

# 关于workset

- [Understanding Kernels, Work-groups and Work-items — TI OpenCL User's Guide](https://www.notion.so/Understanding-Kernels-Work-groups-and-Work-items-TI-OpenCL-User-s-Guide-b5638a655af04514b06bea1e1df2e738)

    在OpenCL：

    1. 用源表示的内核代表1个工作项的计算，
    2. enqueueNDRangeKernel命令中指定的本地大小确定将多少个工作项目分组到一个工作组中，
    3. 在TI DSP设备上，工作组中的工作项通过编译器插入的循环顺序执行，
    4. enqueueNDRangeKernel命令中指定的**全局大小通过将全局大小除以局部大小来确定总共有多少个工作项，以及还有多少个工作组**，
    5. **在TI DSP设备上，工作组以工作池方式在DSP内核之间并发执行，直到完成入队命令的所有工作组为止，**
    6. **可以同时执行的工作组的数量取决于设备中DSP内核的数量**（在OpenCL中，DSP内核是计算单元）。

    下图通过显示两个enqueueNDRangeKernel命令从视觉上总结了上述内容，这两个命令在语义上执行相同的总计算，但是**通过简单地更改局部大小参数，就可以改变内核执行方式的平衡**。在这两种情况下，全局大小均为1024。在情况1中，局部大小为128，这将导致执行分区创建8个工作组，每个工作组将循环访问128个工作项。在情况2中，本地大小更改为256，这将导致4个工作组，每个工作组具有256个工作项。

在OpenCL中，有work-item和work-group的概念，将多个work-item组合成一个group后，会通过一次提交进入堆栈中等待一起处理。可以理解为一个work-group为一个最小并行单元（不知道对不对，懂得大神可以指出）。所有work-item都是并行进行，并执行kernel内核函数。

一次任务，所有的计算单元大小为`global size`，而每个组的大小称为`local  size`。而组数可由  `global size / local  size` 得到。每个work-item有一个global id，也有一个work-group内部的local-id，而work-group也有自己的work-id。可以申请1、2和3维的work-item和work-group。当然这houdini已经帮我们做好了，我们只需要编写每个item中运行的内核函数就行了。

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_opencl_img_26.png)

而在Houdini中，local size默认就是256，所以我们设置的workset其实是global size的大小。相当于我们分了几批group进行渲染。当然workset中数组越多，分的批次越多（之间是串行），速度也就越慢。而每个批次设置的global size越大，则并行的group就越多。记住global size尽可能为2的幂数。

观看下面参数对比：

处理 87780 个数据时：

workset_len ： 128

cook time ： 4.154s    4154 ms

workset_len ：8192

cook time :  73.37ms

**提升 56.7 倍！**

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_24.png)

勾上 **Using Single Workgroup If Possible** 后，houdini会尽可能的优化workgroup的大小。但是也会经常导致报错：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/hou_openCL_img_25.png)

报错后，可以取消该选项。

# 案例八 创建自定义函数

因为没法编辑主程序（host program），houdini已经为我们封装好了，只有两个内核函数可以使用过，一个就是Kernel函数，一个是writeBack函数。

如果我们需要反复用到一段代码，可以创建自定义函数，但是此时不能用 __kernel 或 kernel做为关键字了。而是像正常函数一样直接创建。

```cpp
float myfunc(float a, float b)
{
    return a+b;
}

kernel void kernelName( 
                 int c_length, 
                 global float * c ,
                 float  a ,
                 float  b 
)
{
    int idx = get_global_id(0);
    if (idx >= c_length)
        return;
    c[idx] = myfunc(a, b);
}
```