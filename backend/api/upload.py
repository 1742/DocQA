import os
import shutil
import json

from fastapi import APIRouter, UploadFile, File

from schemas.DocQA_types import DocConfig, InvokeResponse
from config import temp_file_path, history_docs_path
from extension import current_doc_config, InitDocConfig


router = APIRouter()


# 将上传的文件保存在一个临时文件中
async def save_tmp_upload_file(file: UploadFile):
    result = InvokeResponse(
        source=save_tmp_upload_file.__name__,
        state=True,
        message="成功缓存文件！"
    )

    if file.filename is not None:
        tmp_path = os.path.join(temp_file_path, file.filename)
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        result.addition_args = { "tmp_file_path": tmp_path }
    else:
        result.state = False
        result.message = "上传的文件没有文件名！"

    return result


def save_current_doc(current_doc_content: DocConfig):
    result = InvokeResponse(
        source=save_current_doc.__name__,
        state=True,
        message="已保存上一文档记录！"
    )

    if current_doc_content.file_name is not None:
        try:
            save_history_path = os.path.join(history_docs_path, current_doc_content.file_name).replace("pdf", "json")
            save_data = {
                "file_name": current_doc_content.file_name,
                "tmp_file_path": current_doc_content.tmp_file_path,
                "lanuage": current_doc_content.lanuage,
                "embedding_model_name": current_doc_content.embedding_model_name,
                "llm_name": current_doc_content.llm_name,
                "vector_cache_path": current_doc_content.vector_cache_path
            }

            chat_history = []
            if current_doc_content.chat_history is not None and len(current_doc_content.chat_history):
                for message in current_doc_content.chat_history:
                    chat_history.append({"role": message.type, "message": message.content})
            save_data["chat_history"] = chat_history

            with open(save_history_path, "w", encoding="utf-8") as f:
                json.dump(save_data, f, indent=4, ensure_ascii=False)
            
            result.addition_args = { "save_path": f"成功保存聊天记录到{save_history_path}" }
        except Exception as e:
            result.state = False
            result.message = str(e)
            result.addition_args = { "error": e }
    else:
        result.message = "没有文件。"

    return result


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    result = InvokeResponse(
        source=upload.__name__,
        state=True,
        message="上传成功！"
    )

    if file.filename == current_doc_config.file_name:
        result.message = "上传文件与当前文件同名，视为相同，后端不再更新文件和向量库！"
        result.addition_args = {
            "file_name": current_doc_config.file_name,
            "tmp_file_path": current_doc_config.tmp_file_path
        }
        return vars(result)
    
    # 先保存当前文档的记录
    save_result = save_current_doc(current_doc_config)
        
    # 清空原来的文档配置
    InitDocConfig()

    # 等待保存临时文件
    tmp_result = await save_tmp_upload_file(file)
    if tmp_result.state and tmp_result.addition_args is not None:
        tmp_path = tmp_result.addition_args["tmp_file_path"]
    else:
        result.state = False
        result.message = tmp_result.source+": "+tmp_result.message
        return vars(result)

    # 关闭文件
    await file.close()

    # 记录文件名
    current_doc_config.file_name = file.filename
    current_doc_config.tmp_file_path = tmp_path

    result.addition_args = {
        "file_name": current_doc_config.file_name,
        "tmp_file_path": tmp_path,
        "save_last_file_result": save_result.state if save_result.state else save_result.source+": "+save_result.message
    }

    return vars(result)
