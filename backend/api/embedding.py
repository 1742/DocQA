from fastapi import APIRouter
from rag.vector import load_and_index_pdf

from schemas.DocQA_types import InvokeResponse
from extension import current_doc_config


router = APIRouter()


@router.post("/embedding")
async def embed_file():
    result = InvokeResponse(
        source=embed_file.__name__,
        state=True,
        message="构建向量库成功！"
    )

    # 未上传文件
    if current_doc_config.tmp_file_path is None:
        result.state = False
        result.message = "请先上传文件！"
        return vars(result)

    # 构建向量库
    index_result = load_and_index_pdf(current_doc_config.tmp_file_path)

    if index_result.state and index_result.addition_args is not None:
        current_doc_config.vector_store = index_result.addition_args["vector_store"]
        current_doc_config.vector_cache_path = index_result.addition_args["vector_store_cache_path"]
        result.addition_args = { "vector_store_cache_path": current_doc_config.vector_cache_path }
    else:
        result.state = False
        result.message = index_result.source+": "+index_result.message
        return vars(result)

    result.state = index_result.state
    result.message = index_result.source+": "+index_result.message

    return vars(result)
