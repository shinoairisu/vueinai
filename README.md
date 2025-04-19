# VueInAi
一个组装好的VUE2，开箱即用的前端开发套件。代替streamlit。
可以直接拷贝给Pywebview/nw.js等项目，在做简单修改后可直接使用。

主要特点：
使用jinjia2，可以以各种方式拼接、挂载静态html。

分段html用于html片段的复用。路由函数用于开发单页面应用，使某些部件可以消失。
# 使用方法

## 启动前端服务器
根据需求修改.env文件中的信息。

``` cmd
git clone https://github.com/shinoairisu/vueinai.git
conda create -n vueinai python=3.10
conda activate vueinai
pip install -r requirements.txt

python server.py --host 0.0.0.0 --port 8988 --debug True
```

## 编辑方式

html请写在src中
js和css请写在`static`目录中
不要修改`lib_`开头的目录

### 模板文件
即src下的所有html文件。
所有以seg_开头的都是html片段，其他的都是正式页面。

文件中使用{@ html.xxx @}来引用html片段。

比如 seg_header.html , 用法就是 {@ html.seg_header @}

{% python语句 %} 可以使用 config.xxx 来引用config.py中的变量。

### fontawesome(TODO...)
[使用方法](https://blog.csdn.net/qq_41061352/article/details/79414167)

### 路由
导入lib_js中的router.js。
使用一个变量纳管所有路由。变量中对应url中的地址。点击会加入浏览器History。
使用其中的router可以进行页面跳转。（使用v-if(暂时)方案）

# 预备包含的工具列表和功能介绍
均在lib_js 和 lib_css文件夹中。
- holder.js
- 

- [状态机]https://github.com/jakesgordon/javascript-state-machine


requirements不仅列出了python包，还列出了重要的功能组件，比如httpx，rich，kombu等。

# 更新列表
2025年4月12日 初始化项目，构建基础结构