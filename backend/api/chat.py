from fastapi import APIRouter
from pydantic import BaseModel

from rag.models import build_rag_graph
from rag.qa import qa_answer
from schemas.DocQA_types import InvokeResponse
from extension import current_doc_config

router = APIRouter()

class ChatRequest(BaseModel):
    question: str


@router.post("/chat")
async def chat(request: ChatRequest):
    result = InvokeResponse(
        source=chat.__name__,
        state=True
    )

    if current_doc_config.graph is None:
        build_rag_graph_result = build_rag_graph(current_doc_config)
        if build_rag_graph_result.state:
            current_doc_config.graph = build_rag_graph_result.addition_args
        else:
            result.state = False
            result.message = build_rag_graph_result.source+": "+build_rag_graph_result.message
            return vars(result)

    qa_result = qa_answer(current_doc_config, request.question)

    if qa_result.state and qa_result.addition_args is not None:
        current_doc_config.chat_history = qa_result.addition_args["response"]["messages"]
        role = qa_result.addition_args["response"]["messages"][-1].type
        message = qa_result.addition_args["response"]["messages"][-1].content
        result.addition_args = {"role": role, "message": message}

    result.state = qa_result.state
    result.message = qa_result.source+": "+qa_result.message
    
    return vars(result)
