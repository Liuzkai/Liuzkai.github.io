---
title: How to use Unreal Python
date: 2021-01-25 21:00:00 +/-0080
categories: [Unreal, Script]
tags: [Unreal, Python] 
---

# 为什么使用Unreal Python

Unreal的蓝图，作为一种可视化脚本语言，已将非常强大了。它不香吗，为什么还要使用python来做脚本呢？

第一个原因正是蓝图的可视化，在项目进行中工具变得复杂后，反而不易于维护。而以文本形式的python拥有了先天的优势。

第二个原因是python的易扩展性，是蓝图无法比拟。python有丰富的库，同时DCC软件普遍支持Python的API，因此python是CG行业普遍使用的管线语言。

第三个原因是编译问题。虽然蓝图的编译也是非常快的(是的，蓝图也要编译一下)，但随着工程的复杂之后，蓝图启动编辑和编译也会变的越来越慢，而使用python的话，基本上不需要编辑。在工作体验上是非常优雅和愉悦的，你使用过python之后就会不得不深陷其中。

## Python与蓝图异同点

python可以调用所有蓝图可以调用的方法，但是python并不能创建类并在场景中使用，同时python也不能用于运行时。python只能用于editor的功能脚本化，因此建议开启Editor Script Utilities Plugin来扩展python的方法调用。

在C++中给function声明UFUNCTION时，只要设置为蓝图可调用(BlueprintCallable)，此方法python也就可以使用了。

# 环境搭建

首先我们需要开启unreal的python功能，同时生成unreal.py文件方便我们写代码时可以提供自动补全功能。另外介绍以下IDE的环境设置和几种Unreal触发python脚本的方法。

本案例使用的是Unreal 4.26.0版本

## 开启 Unreal Python

在Plugins中查找python，并开启该功能，然后重启Editor

![enable_python_plugin](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Python_enable%202021-01-25_20-33-14.png)

在Editor Settings中开启Python Developer Mode：

![Python Developer Mode](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Python_developerMode.png)

然后重启Editor。此时在Project/Intermediate/PythonStub路径下会生成一个unreal.py文件，该文件主要用于IDE生成自动补全功能的头文件。

## 配置IED环境，实现自动补全

### 配置pycharm

我们将上面得到的unreal.py文件路径添加到python interpreter paths中：

![setting pycharm](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Untitled.png)

由于unreal.py文件过于巨大（23Mb左右），超出了pycharm默认的代码预览缓存。因此我们还需要修改以下默认的扫描缓存阈值，如下图打开Properties：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Untitled%20(1).png)

输入：

```json
idea.max.intellisense.filesize=500000
```

可以修改一个比较大的值，这个值过大会导致占用更多的内存，因此请谨慎调节。

### 配置vscode

如果你使用vscode，只需安装pylance插件，并在setting中将PythonStub文件夹的路径填写到Python:Analysis:Extra Paths一栏中。

## Unreal调用python的方法

### 1 命令行调用

点击~键或在Output Log窗口下，可以切换cmd为python，直接在输入栏中输入python代码回车后即可运行。

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/python_cmd.png)

这个方法适合简单的命令。也可以输入`run C:/path/to/your/file/filename.py` 来运行一整个脚本。

### 2 调用Python脚本命令

在File菜单栏下使用*Execute Python Script* 可以运行py文件：

![](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/python_execute.png)

这个方法适合没有交互，但是复杂命令的脚本。

### 3 在蓝图中调用

在蓝图中，可以创建Execute python command和Execute python script两个节点。分别代表了上面两种调用方法。

![python node](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/python_bp_node.png)

特别说明一下，**Execute Python Script** 节点可以添加输入和输出，只需在代码中使用该输入的名称作为变量即可获得该输出的数据，类似材质里的Custom Node，这样Python和蓝图的交互成为可能。

### 4 在Content中运行

在Editor Setting中，找到Python一栏，勾选上Enable Content Browser Integration。这样就可以在Content中创建python脚本了。但是如果你想编辑该脚本，需要使用IDE打开文件进行编辑。在文件上右键选择run可以运行脚本。

![Content Python File](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/python_content.png)

### 5 在启动编辑器时运行

这Project Settings->Python->Startup Scripts，添加脚本路径，选择触发阶段，在启动编辑时就会自动的运行该脚本。适合一些需要初始化编辑器资源的脚本自动加载运行。

![Startup Scripts](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/Python_Startup_Scripts.png)



随着版本的更迭，或我的疏忽，可能还有其他调用python的方法。当然你也可以在C++层面直接调用python脚本，但是这已经不是我们所关注的部分了。通常结合Editor Utility Widget和python node是一个比较好的方案，也是我常用的方案。下面的例子都是使用该种方法实现。



# 常用的类 

前文中我已经提到，建议大家打开**Editor Script Utilities Plugin**来扩展功能。首先我们创建一个Editor Utility Widget,并在界面中添加一个按钮，并使用python来实现按键功能：

![widget](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/widget_01.png)

运行效果：

![result](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/widget_02.png)

下面的代码粘贴在python Script节点中，并编译蓝图即可。