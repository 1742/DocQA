from typing import Optional
from pydantic import BaseModel, SecretStr
from fastapi import APIRouter

from rag.models import build_llm
from rag.vector import build_embedding_model
from schemas.DocQA_types import InvokeResponse
from extension import current_doc_config


router = APIRouter()


class LanuageConfig(BaseModel):
    lanuage: str


class ModelConfig(BaseModel):
    embedding_model_name: str
    embedding_model_api_key: Optional[SecretStr] = None
    llm_name: str
    llm_api_key: SecretStr


@router.post("/set_models")
def config_set_model(model_setting: ModelConfig):
    result = InvokeResponse(
        source=config_set_model.__name__,
        state=True,
        message="配置模型成功！"
    )

    if model_setting.llm_name != current_doc_config.llm_name or model_setting.llm_api_key != current_doc_config.llm_api_key:
        build_llm_result = build_llm(model_setting.llm_name, model_setting.llm_api_key)
        if build_llm_result.state and build_llm_result.addition_args is not None:
            current_doc_config.llm_name = build_llm_result.addition_args["llm_name"]
            current_doc_config.llm_model = build_llm_result.addition_args["llm"]
            current_doc_config.llm_api_key = model_setting.llm_api_key
        else:
            result.state = False
            result.message = build_llm_result.source+": "+build_llm_result.message
            return vars(result)

    if model_setting.embedding_model_name != current_doc_config.embedding_model_name or model_setting.embedding_model_api_key != current_doc_config.embedding_model_api_key:
        build_embedding_model_result = build_embedding_model(model_setting.embedding_model_name, model_setting.embedding_model_api_key)
        if build_embedding_model_result.state and build_embedding_model_result.addition_args is not None:
            current_doc_config.embedding_model_name = build_embedding_model_result.addition_args["embedding_model_name"]
            current_doc_config.embedding_model = build_embedding_model_result.addition_args["embedding_model"]
        else:
            result.state = False
            result.message = build_embedding_model_result.source+": "+build_embedding_model_result.message
            return vars(result)

    return vars(result)


@router.post("/set_lanuage")
def config_set_lanuage(lanuage_setting: LanuageConfig):
    result = InvokeResponse(
        source=config_set_lanuage.__name__,
        state=True,
        message=f"已设置为{lanuage_setting.lanuage}"
    )

    if len(lanuage_setting.lanuage) > 0:
        current_doc_config.lanuage = lanuage_setting.lanuage
    else:
        result.state = False
        result.message = "未设置语言！"

    return vars(result)
