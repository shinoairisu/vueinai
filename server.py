import os
import time
import aiofiles
import argparse

import uvicorn
from loguru import logger
from fastapi.responses import HTMLResponse
from fastapi_socketio import SocketManager
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Cookie, Response, File, Form, UploadFile

from utils.dogs import re_build_project, observer

parser = argparse.ArgumentParser(description="前端服务器")
parser.add_argument("-p", "--port", type=int, default=12580, help="服务器端口")
parser.add_argument("-s", "--host", type=str, default="0.0.0.0", help="服务器地址")
parser.add_argument("-d", "--debug", type=bool, default=True, help="是否开启debug模式")

args = parser.parse_args()
re_build_project()  # 启动时会强制重构项目

if args.debug:
    observer.start()  # 监控前端文件改变

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
socket_manager = SocketManager(
    app=app, mount_location="/wsk", socketio_path="/wsk/socket.io"
)
# socketio默认挂载点(mount_location)是/ws。新版的fastapi(0.115.12)中socketio_path正确应当是 '/ws(挂载点)/socket.io'
# socketio_path必须是 挂载点mount_location加上具体自定义路径。比如此处的/wsk/socket.io,否则和前端对不齐。
# 因为fastapi的特殊,namesapce必须得写，否则找不到发送端点。


# 主路由
# html的页面路由由本函数实现，不可删除，只可以修改。
@app.get("/content/{html_name}/{route:path}")
async def static_pages(html_name: str, route: str):
    """支持静态路由，如 http://127.0.0.1:12580/content/go//route1/route2/route3..."""
    if not os.path.exists(f"static/{html_name}.html"):
        return HTMLResponse(content="404 Not found!")
    async with aiofiles.open(f"static/{html_name}.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=await f.read())


# connect是客户端事件。就是客户端发来的内置事件。也可以用自定义事件
# 前端要用的是服务端事件。也可以用自定义事件。
# 内置事件https://blog.csdn.net/tiantangyouzui/article/details/51791129
# socketio 模板，不用可以删除
@socket_manager.on("connect", namespace="/ws")
async def handle_connect(sid, message):
    logger.debug("前端连接成功，sid为{}", sid)
    # emit不需要手动指定sid,但是必须指定namespace,因为不同namespace下有一样的sid的。
    # 除非是用户1想给用户2发信息。
    await socket_manager.emit(
        "test", "你好，前端！", namespace="/ws"
    )  # 必须要写namespace


# axios的get请求模板，不用可以删除
@app.get("/api/getest")
async def getest(name: str):
    """一个前端的get请求支持系统"""
    logger.debug("前端发送测试请求，内容为{}", name)
    return "你好，前端！"


# axios的cookies获取模板，不用可以删除
@app.get("/api/cookiegetest")
async def cookieget(name: str | None = Cookie(default=None),value: str | None = Cookie(default=None)):
    """测试接收cookies"""
    logger.debug("前端发送带cookies请求，内容为{}:{}", name,value)
    return "后端收到"


# axios的cookies设置模板，不用可以删除
@app.get("/api/cookiesetest")
async def cookieset(response: Response):
    """测试设置cookies"""
    logger.debug("收到cookies设置请求")
    # cookies是禁止放中文的
    # 浏览器的cookies会变成 ： 2025-04-20T10:06:10.268Z  
    # T是分隔符，z指的是UTC。2025-04-20日 格林尼治时间 10:06:10.268 到期
    response.set_cookie(key="ads_id", value="998877665544", expires=60*2) # 2分钟过期
    return {"message": "cookie设置成功"}


# 可在一个路径操作中声明多个 File 与 Form 参数，
# 但不能同时声明要接收 JSON 的 Body 字段。
# 因为此时请求体的编码为 multipart/form-data，不是 application/json。
# axios的文件上传模板，不用可以删除
@app.post("/api/upload")
async def upload(file: bytes = File(..., max_length=20097152)):
    # 大于20M的不建议用这个方式，推荐用UploadFile。
    # 20,097,152 = 20M ,超了会报错
    # 在使用File模式下，这个参数名字必须叫file。不管表单里是什么。
    logger.debug("收到文件上传请求,文件大小为{}", len(file))


if __name__ == "__main__":
    uvicorn.run(app, host=args.host, port=args.port)
