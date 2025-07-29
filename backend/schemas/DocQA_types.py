from pydantic import BaseModel, SecretStr
from typing import List, Dict, Optional, Any


class DocConfig(BaseModel):
    file_name: Optional[str] = None
    tmp_file_path: Optional[str] = None
    lanuage: Optional[str] = None
    embedding_model_name: Optional[str] = None
    embedding_model: Any = None
    embedding_model_api_key: Optional[SecretStr] = None
    llm_name: Optional[str] = None
    llm_api_key: Optional[SecretStr] = None
    llm_model: Any = None
    graph: Optional[Dict[str, Any]] = None
    vector_store: Any = None
    vector_cache_path: Optional[str] = None
    chat_history: Optional[List] = []
    

class InvokeResponse(BaseModel):
    source: str
    state: bool
    message: str = ""
    addition_args: Optional[Dict[str, Any]] = None
