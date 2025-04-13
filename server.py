import os
import time
import aiofiles
import argparse

import uvicorn
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

from utils.dogs import re_build_project,observer

parser = argparse.ArgumentParser(description='前端服务器')
parser.add_argument('-p','--port', type=int,default=12580,help='服务器端口')
parser.add_argument('-s','--host', type=str,default='0.0.0.0', help='服务器地址')
parser.add_argument('-d','--debug', type=bool,default=True, help='是否开启debug模式')

args = parser.parse_args()
re_build_project()

if args.debug:
    observer.start()
app = FastAPI()

@app.get('/content/{html_name}/{route:path}')
async def static_pages(html_name:str,route:str):
    """支持静态路由，如 http://127.0.0.1:12580/content/go//route1/route2/route3..."""
    if not os.path.exists(f"static/{html_name}.html"):
        return HTMLResponse(content="404 Not found!")
    async with aiofiles.open(f"static/{html_name}.html", 'r', encoding='utf-8') as f:
        return HTMLResponse(content=await f.read())

if __name__ == '__main__':
    uvicorn.run(app, host=args.host, port=args.port)
