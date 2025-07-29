import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api import chat, upload, embedding, setting
from config import *


# 创建路径
if not os.path.exists(temp_file_path):
    os.mkdir(temp_file_path)
if not os.path.exists(vector_cache_path):
    os.mkdir(vector_cache_path)
if not os.path.exists(history_docs_path):
    os.mkdir(history_docs_path)


app = FastAPI()

# 前端文件
app.mount("/frontend", StaticFiles(directory=frontend_file_path, html=True), name="frontend")
# 将files挂载为静态路径
app.mount("/Temp", StaticFiles(directory=temp_file_path), name="TempFilePath")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(chat.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(embedding.router, prefix="/api")
app.include_router(setting.router, prefix="/api")
