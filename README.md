# VueInAI 前端模板项目
## 项目介绍
- VueInAI 是一个基于 FastApi + Vue2的模板项目，旨在提供一套简洁、易用、可扩展的前端解决方案。
- 主要服务于AI算法开发人员，可以快速上手前端开发展示成果。
- 目的是替换streamlit，减少复杂前端时的开发成本。
- 该项目包含了丰富的组件库、工具函数、样式库等，可以帮助开发者快速搭建高质量的前端应用。
- 项目基于fastapi

## 快速启动
新建项目，就是直接git一个新的模板项目下来，直接在src或者static目录开发即可。
``` bash
git clone https://github.com/shinoairisu/vueinai.git
conda create -n vueinai python=3.10
conda activate vueinai
pip install -r requirements.txt

python server.py --host 0.0.0.0 --port 12580 --debug True
```

## 使用方法
### 情况1：项目较为简单
直接在static目录中创建html和vue进行编写即可。

前端服务器关掉看门狗编译，即--debug为False。

``` bash
python server.py --host 0.0.0.0 --port 12580 --debug False
```
访问地址为 

`http://127.0.0.0:12580/content/{html主文件名字，不带扩展名}`

或者

`http://127.0.0.0:12580/static/html文件名字.html`

### 情况2：项目较为复杂
比如需要使用tab进行页面切换，页面很长，需要分片编写页面，可以在src中创建html和html片段。

此时需要开启看门狗：

``` bash
python server.py --host 0.0.0.0 --port 12580 --debug True
```

所有xx.html都是主页面，所有seg_xx.html都是片段页面。片段页面会被插入进主页面中指定的位置。

主页面中引用片段页面的方法是：`{@ html.seg_xx @} `，是翻过来引用的。

主页面也可以引用config.py中的变量，方法为:`{@ config.xxx @}`

访问地址同样为 

`http://127.0.0.0:12580/content/{html主文件名字，不带扩展名}`

或者

`http://127.0.0.0:12580/static/html主文件名字.html`

**看门狗启动时，每次修改、保存、删除等都会重新编译所有src下面的html文件到static下面。**

### 其它文件
媒体文件、自己写的js、css、vue组件等可参考`static`目录，全写在这个目录下。


## 便利功能
### 基础库
携带可直接使用CDN引入的前端库，包括
``` js
vue // vue框架 生产版本和开发版本
vue-router // vue路由库
axios // 异步请求库
vue-echarts // vue版本的echarts
marked // 用于markdown解析
cookies // 用于前端直接操作cookie
httpVueloader // 用于动态加载vue组件
socketio // 用于websocket通信
lodash // 用于数组、对象、字符串等操作
holder // 用于临时占位的svg库，来不及找图先用这个库占位置
```
### UI库
element-ui // 基于vue的PC端UI库
mintui // 基于vue的移动端UI库
vant // 基于vue的移动端UI库

## 项目模板
`templates`目录下带有一些快速启动模板，可以开箱即用。

``` text
eg_tmp_1.html  # 一个网页片段模板
template_axios_cookies.html # 一个使用axios和cookies的模板
template_router_component.vue # 一个使用vue-router和vue-component的VUE组件模板
template_router_components.html # 一个使用vue-router和vue-components的html模板
template_socketio.html # 一个使用socketio的模板
template_ui_elementui_footer.html  # 一个使用elementui的模板,主要研究footer沉底
template_ui_elementui.html  # 一个使用elementui的模板
template_ui_mintui.html  # 一个使用mintui的模板
template_ui_vantui.html  # 一个使用vantui的模板
template_upload.html  # 一个上传文件的模板
template_vue_component.vue  # 一个使用vue-component的VUE组件模板
template_vue_components.html # 一个使用vue-components的html模板
```

## 其它自装工具
- conda 或 python 3.10+
- vscode
- vscode插件 Vetur、Vue、Vue 3 Snippets
- chrome插件 vue dev tool 5 (6、7在控制台不显示)

## 其它js库
内置的：

[state-machine](https://github.com/jakesgordon/javascript-state-machine) # 状态机

[fontawesome图标库](https://blog.csdn.net/qq_41061352/article/details/79414167)

其它关注库：
- nanoid
- sha1/sha256
- base64

## python库

requirements不仅列出了python包，还列出了重要的功能组件，比如httpx，rich，kombu等。
kombu是rabbitmq/redis的消息队列和缓存库。

## 更新日志
- 2023-04-13: 创建项目，使用bootstrap + vue
- 2024-05-01：改为elementui
- 2025-04-01: 新增fastapi，模板
- 2025-04-20: 新增模板，新增编译方式，新增CDN方式的router