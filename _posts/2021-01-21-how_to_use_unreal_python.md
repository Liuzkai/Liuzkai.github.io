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

首先我们要做的就是把`unreal`库导入：

```python
# you shall import any you need libraries else,
# but you have to make sure it in the unreal python path
import unreal
```

我们可以把中间结果打印到output log中，便于我们debug。

```python
# Out log in the output log window
unreal.log("Hello World")
unreal.log_warning("I'm yellow！This a waring!")
unreal.log_error("I'm red. I'm wrong!")
```

接下来，我们就可以写我们的业务代码了。

常用的场景和资源管理器中相关的命令都在`unreal.EditorLevelLibrary`和`unreal.EditorUtilityLibrary`两个类中。我们首先从这两个类进行入手：

例如获得选中的物体：

```python
# get selected actors
actors = unreal.EditorLevelLibrary.get_selected_level_actors()
# get selected assets
assets = unreal.EditorUtilityLibrary.get_selected_assets()
```

这两个函数在蓝图中对应的节点是：

![get level actors node](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/get_Level_actors.png)

![get selected asset node](https://raw.githubusercontent.com/Liuzkai/Liuzkai.github.io/master/img/get_selected_assets.png)

这两个节点的Target就是定义的类的位置，同时也是Python的类的名称。当你找不到对应的function时，可以找找蓝图的节点，从而找到灵感。

当然你也可以查找[Unreal Python API Documentation](https://docs.unrealengine.com/en-US/PythonAPI/index.html)。

下面几个例子由浅入深的讲解unreal python的使用方法，并提示Python与蓝图的异同点。

## 找某一类Actor

```python
actors = unreal.EditorLevelLibrary.get_all_level_actors()
# Filter by class
static_mesh_actors = unreal.EditorFilterLibrary.by_class(actors,unreal.StaticMeshActor,unreal.EditorScriptingFilterType.INCLUDE)
```

`unreal.EditorFilterLibrary`类可以将输入的序列根据条件进行分类。

或者：

```python
static_mesh_actor = unreal.GameplayStatics.get_all_actors_of_class(unreal.EditorLevelLibrary.get_editor_world(),unreal.StaticMeshActor)
```



## 从Actor找Asset

```python
# get the first selected actors
actors = unreal.EditorLevelLibrary.get_selected_level_actors()
actor = actors[0] if actors else None
# we check if actor is static mesh or not
if actor and isinstance(actor, unreal.StaticMeshActor):
    # get the static mesh component
    sm_comp = actor.get_component_by_class(unreal.StaticMeshComponent)
    if sm_comp:
        # load the asset!
        sm = unreal.load_asset(sm_comp.static_mesh.get_path_name())
        unreal.log(sm)
```

使用`isinstance()`函数可以判断能否拿到我们需要的对象，同时也可以让IDE提供进一步的自动补全功能。因为我们并不能在IDE中运行脚本让其知道这些变量的真实类型，所以IDE的自动补全功能不能很好的识别变量的类型。而使用`isinstance()`既可以健壮了代码，也为IDE补全功能提供支持，可谓一举两得。（类似蓝图中Cast to某一类节点）

```python
# broswer to the asset position
asset_path = sm_comp.static_mesh.get_path_name()
unreal.EditorAssetLibrary.sync_browser_to_objects([asset_path])
```

使用`sync_browser_to_objects()`可以直接定位到资源的位置，注意函数输入的是列表。

## 从Asset找Actor

pending

## Import

导入的基本方法：

> 创建输入任务，然后运行任务。

Fbx导入有一些参数，需要我们提前设置。而贴图的导入相对简单，没有参数设置。

```python
def fbx_static_mesh_import_data():
    """ static mesh import data """
    _static_mesh_import_data = unreal.FbxStaticMeshImportData()
    _static_mesh_import_data.import_translation = unreal.Vector(0.0, 0.0, 0.0)
    _static_mesh_import_data.import_rotation = unreal.Rotator(0.0, 0.0, 0.0)
    _static_mesh_import_data.import_uniform_scale = 1.0
    _static_mesh_import_data.combine_meshes = True
    _static_mesh_import_data.generate_lightmap_u_vs = True
    _static_mesh_import_data.auto_generate_collision = True
    return _static_mesh_import_data


def fbx_skeletal_mesh_import_data():
    """ skeletal mesh import data """
    _skeletal_mesh_import_data = unreal.FbxSkeletalMeshImportData()
    _skeletal_mesh_import_data.import_translation = unreal.Vector(0.0, 0.0, 0.0)
    _skeletal_mesh_import_data.import_rotation = unreal.Rotator(0.0, 0.0, 0.0)
    _skeletal_mesh_import_data.import_uniform_scale = 1.0
    _skeletal_mesh_import_data.import_morph_targets = True
    _skeletal_mesh_import_data.update_skeleton_reference_pose = False
    return _skeletal_mesh_import_data


def fbx_import_option(static_mesh_import_data = None, skeletal_mesh_import_data = None):
    """ fbx import option """
    _options = unreal.FbxImportUI()
    _options.import_mesh = True
    _options.import_textures = False
    _options.import_materials = False
    _options.import_as_skeletal = False
    _options.static_mesh_import_data = static_mesh_import_data
    _options.skeletal_mesh_import_data = skeletal_mesh_import_data
    return _options


def create_import_task(file_name, destinataion_path, options=None):
    """ the import task for fbx, texture, audio and os on """
    _task = unreal.AssetImportTask()
    _task.automated = True
    _task.destination_path = destinataion_path
    _task.filename = file_name
    _task.replace_existing = True
    _task.save = True
    _task.options = options
    return _task


# target asset
static_mesh_fbx   = 'C:/sm_box.fbx'
skeletal_mesh_fbx = 'C:/sk_character.fbx'
2d_texture        = 'C:/t_checker.tga'

# set the input option for fbx ( texture does not have option )
import_static_mesh_option = fbx_import_option(static_mesh_import_data=fbx_static_mesh_import_data())
import_skeletal_mesh_option = fbx_import_option(skeletal_mesh_import_data=fbx_skeletal_mesh_import_data())

# generate task
import_static_mesh_task = create_import_task(static_mesh_fbx, '/Game/StaticMesh/', import_static_mesh_option)
import_skeletal_mesh_task = create_import_task(static_mesh_fbx, '/Game/SkeletalMesh/', import_skeletal_mesh_option)
import_texture_task = create_import_task(2d_texture, '/Game/Texture/')

total_task = [import_static_mesh_task, import_skeletal_mesh_task, import_texture_task]

# run the task
unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks(total_task)

```



## Export

导出的基本方法：

> 创建输出任务，然后运行任务。

而输出不同类型的资源，需要创建不同的Exporter和设置不同的Export Option（有些类型没有输出选项）。将Exporter和Export Option传入Task，就可以创建对应的输出任务。

### Export Static Mesh As Fbx

```python
def fbx_export_option():
    '''Create the fbx export option'''
    _options = unreal.FbxExportOption()
    _options.ascii = True
    _options.collision = False
    _options.export_local_time = True
    _options.export_morph_targets = False
    _options.export_preview_mesh = False
    _options.fbx_export_compatibility = unreal.FbxExportCompatibility.FBX_2013
    _options.force_front_x_axis = False
    _options.level_of_detail = False
    _options.map_skeletal_motion_to_root = False
    _options.vertex_color = False
    return _options

def create_export_task(exporter, obj, options, file_name):
    '''generated the task by exporter'''
    _task = unreal.AssetExportTask()
    _task.exporter = exporter
    _task.object = obj
    _task.options = options
    _task.automated = True
    _task.replace_identical = True
    _task.write_empty_files = False
    _task.filename = file_name
    return _task

# asset to export
asset = unreal.EditorUtilityLibrary.get_selected_asset_data()[0]
# the path to export
filename = unreal.Paths.project_saved_dir() + 'export/' + asset.get_name() + '.fbx'
# the exporter type
exporter = unreal.StaticMeshExporterFBX()
# create the Task with the options
task = create_export_task(exporter, asset, fbx_export_option(), filename)
# Run Task !
if unreal.Exporter.run_asset_export_task(task):
    unreal.log("export_tasks : success")
else:
    unreal.log("export_tasks : failure")
```

### Export Texture As TGA

```python
...
# the texture exporter !
exporter = unreal.TextureExporterTGA()
# the path to export
filename = unreal.Paths.project_saved_dir() + 'export/' + asset.get_name() + '.tga'
# texture exporter do not need options
task = create_export_task(ex, asset, None, filename)
# Run Task
unreal.Exporter.run_asset_export_task(task)
```

### Export Scene

```python
# EditorLoadingAndSavingUtils Class
unreal.EditorLoadingAndSavingUtils.export_scene(export_selected_actors_only=True)
```

