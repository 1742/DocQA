from langchain_core.messages import HumanMessage
from schemas.DocQA_types import DocConfig, InvokeResponse


def qa_answer(doc_config: DocConfig, question: str):
    # 用 LangChain 进行 RAG 问答

    result = InvokeResponse(
        source=qa_answer.__name__,
        state=True,
        message="模型成功响应！"
    )

    try:
        if doc_config.graph is not None:
            response = doc_config.graph["graph"].invoke({"messages": [HumanMessage(content=question)]}, config=doc_config.graph["graph_config"])
            result.addition_args = {"response": response}
        else:
            result.state = False
            result.message = "请先创建graph!"
    except Exception as e:
        result.state = False
        result.message = f"模型响应失败！\n{e}"

    return result
