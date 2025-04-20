"""软看门口，会在每次保存src目录的文件时，自动编译最新前端（server开在debug模式下）"""
import os
import time
from glob import glob

from tqdm import tqdm
from loguru import logger
from config import config
from jinja2 import Template
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler


def read_html(html):
    with open(html, "r",encoding="utf-8") as f:
        return f.read()

def write_html(html, content):
    with open("./static/" + html, "w",encoding="utf-8") as f:
        f.write(content)

def delete_htmls():
        """删除所有项目文件"""
        htmls = glob("./static/*.html")
        for html in htmls:
            os.remove(html)

def collect_and_build_htmls():
    """收集并编译html文件"""
    # 不读取任何template_开头的html文件
    htmls = [i for i in glob("./src/*.html", recursive=True) if "template_" not in i]
    # 收集模板html
    segments = [html for html in htmls if "seg_" in html ]
    normal = [html for html in htmls if "seg_" not in html]
    # 收集html片段
    seg_contents = {os.path.split(s)[1].replace(".html",""):read_html(s) for s in segments}
    # 收集普通html
    normal_contents = {os.path.split(s)[1]:read_html(s) for s in normal}
    for k,v in tqdm(normal_contents.items(),desc="编译html文件中"):
        content = Template(v)
        content.environment.variable_start_string = "{@"
        content.environment.variable_end_string = "@}"
        html_content = Template(v).render(html=seg_contents, config=config)
        write_html(k, html_content)

def re_build_project():
    delete_htmls()
    collect_and_build_htmls()


class HtmlFileHandler(FileSystemEventHandler):

    def on_any_event(self, _):
        """只要操作了html文件，就重新编译"""
        logger.info(f"html文件发生变化，重新编译项目...")
        time.sleep(0.5)
        try:
            re_build_project()
        except Exception as e:
            logger.error("重新编译项目失败: {}",e)


observer = Observer()
event_handler = HtmlFileHandler()
observer.schedule(event_handler, path="./src", recursive=True)

if __name__ == "__main__":
    re_build_project()