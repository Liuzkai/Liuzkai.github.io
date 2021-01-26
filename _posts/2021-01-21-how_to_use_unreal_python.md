---
title: How to use Unreal Python
date: 2021-01-25 21:00:00 +/-0080
categories: [Unreal, Script]
tags: [Unreal, Python] 
---

# 环境搭建

首先我们需要开启unreal的python功能，同时生成unreal.py文件方便我们些代码时可以提供自动补全功能。另外介绍以下IDE的环境设置和几种Unreal触发python脚本的方法。

本案例使用的是Unreal 4.26.0版本



## 开启 Unreal Python

在Plugins中查找python，并开启该功能，然后重启Editor

![enable_python_plugin](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Python_enable%202021-01-25_20-33-14.png)

在Editor Settings中开启Python Developer Mode：

![Python Developer Mode](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Python_developerMode.png)

然后重启Editor。此时在Project/Intermediate/PythonStub路径下会生成一个unreal.py文件，该文件主要用于IDE生成自动补全功能的头文件。

## 配置Pycharm环境，实现自动补全

我们将上面得到的unreal.py文件路径添加到python interpreter paths中：

![setting pycharm](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Untitled.png)

由于unreal.py文件过于巨大（23Mb左右），超出了pycharm默认的代码预览缓存。因此我们还需要修改以下默认的扫描缓存阈值，如下图打开Properties：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Untitled%20(1).png)

输入：

```json
idea.max.intellisense.filesize=500000
```

可以修改一个比较大的值，这个值过大会导致占用更多的内存，因此请谨慎调节。

## Unreal调用python的方法

### 1 命令行调用

点击~键或在Output Log窗口下，可以切换cmd为python，直接在输入栏中输入python代码回车后即可运行。

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/python_cmd.png)

这个方法适合简单的命令。

### 2 调用Python脚本命令

在File菜单栏下使用Execute Python Script可以运行py文件：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/python_execute.png)

这个方法适合简单交互，但是复杂命令的脚本。

# 与蓝图异同点

python可以调用所有蓝图可以调用的方法，但是python并不能创建类并在场景中使用，同时python也不能用于运行时。python只能用于editor的功能脚本化，因此建议开启Editor Script Utilities Plugin来扩展python的方法调用。

在C++中给function声明UFUNCTION时，只要设置为蓝图可调用(BlueprintCallable)，此方法python也就可以使用了。

python脚本可以不用编译，即使蓝图编译很快，但是在工程量变大后，蓝图的编译也会变得有些缓慢了，对于一些小功能的实现，python即改即用就显得格外高效且可爱。

python作为一个脚本语言，可以非常简单且高效的扩展编辑器的自动化，简直是游戏制作的必备良品。接下来我就用几个案例，深入浅出的带大家了解和使用unreal python。



# 使用案例 

