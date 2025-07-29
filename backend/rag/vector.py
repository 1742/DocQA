import os
import shutil
from typing import Optional

from langchain_openai import OpenAIEmbeddings
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic import SecretStr

from schemas.DocQA_types import InvokeResponse
from config import vector_cache_path
from extension import current_doc_config


def build_embedding_model(embedding_model: str, api_key: Optional[SecretStr] = None):
    result = InvokeResponse(
        source=build_embedding_model.__name__,
        state=True,
        message=f"链接{embedding_model}成功！"
    )

    try:
        if embedding_model == "llama3":
            result.addition_args = {
                "embedding_model_name": embedding_model,
                "embedding_model": OllamaEmbeddings(model="llama3")
            }
            return result
        elif embedding_model == "OpenAIEmbeddings":
            if api_key is not None:
                result.addition_args = {
                    "embedding_model_name": embedding_model,
                    "embedding_model": OpenAIEmbeddings(api_key=api_key)
                }
            else:
                result.state = False
                result.message = f"请输入{embedding_model}的API Key！"
            return result
        else:
            result.state = False
            result.message = f"暂不支持{embedding_model}！"
            return result
    except Exception as e:
        result.state = False
        result.message = f"创建编码用模型失败！\n{e}"
        return result


def load_and_index_pdf(file_path: str):
    # 返回信息
    result = InvokeResponse(
        source=load_and_index_pdf.__name__,
        state=True,
        message="构建数据库成功"
    )

    # 文件名
    file_name = os.path.basename(file_path).split(".")[0]

    # 加载PDF
    try:
        loader = loader = PyPDFLoader(file_path)
        docs = loader.load()
    except Exception as e:
        result.state = False
        result.message = f"加载PDF失败！\n{e}"
        return result

    # 分割文本
    try:
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        all_splits = text_splitter.split_documents(docs)
    except Exception as e:
        result.state = False
        result.message = f"分割文本失败！\n{e}"
        return result

    # 编码用模型
    if current_doc_config.embedding_model is not None:
        embeddings = current_doc_config.embedding_model
    else:
        result.state = False
        result.message = f"请先配置embedding model!"
        return result

    # 向量库缓存路径
    vector_cache_path_ = os.path.join(vector_cache_path, file_name)
    if os.path.exists(vector_cache_path_):
        shutil.rmtree(vector_cache_path_)
    os.mkdir(vector_cache_path_)

    # 使用的向量库
    vector_store = Chroma(
        collection_name="example_collection",
        embedding_function=embeddings,
        persist_directory=vector_cache_path_,  # Where to save data locally, remove if not necessary
    )

    # 构建向量库
    try:
        _ = vector_store.add_documents(documents=all_splits)
    except Exception as e:
        result.state = False
        result.message = f"构建向量库失败\n{e}"
        return result
    
    result.addition_args = {
        "vector_store": vector_store,
        "vector_store_cache_path": vector_cache_path_
    }

    return result

