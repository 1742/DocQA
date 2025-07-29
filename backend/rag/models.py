from langchain_openai import ChatOpenAI
from langchain_deepseek import ChatDeepSeek
from langgraph.graph import MessagesState, StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, AIMessage, ToolMessage
from pydantic import SecretStr

from schemas.DocQA_types import InvokeResponse, DocConfig


def build_llm(model_name: str, api_key: SecretStr):
    result = InvokeResponse(
        source=build_llm.__name__,
        state=True,
        message=f"初始化{model_name}链接成功！",
        addition_args={"llm_name": model_name, "llm": None}
    )

    try:
        if model_name == "DeepSeek-V3":
            result.addition_args = {
                "llm_name": model_name, 
                "llm": ChatDeepSeek(
                    model="deepseek-chat",  # ds-V3
                    temperature=0,
                    max_retries=2,
                    api_key=api_key
                )
            }
            return result
        elif model_name == "gpt-3.5-turbo":
            result.addition_args = {
                "llm_name": model_name,
                "llm": ChatOpenAI(
                    model="gpt-3.5-turbo",
                    temperature=0,
                    max_retries=2,
                    api_key=api_key
                )
            }
            return result
        elif model_name == "gpt-4":
            result.addition_args = {
                "llm_name": model_name, 
                "llm": ChatOpenAI(
                    model="gpt-4",
                    temperature=0,
                    max_retries=2,
                    api_key=api_key
                )
            }
            return result
        else:
            result.state = False
            result.message = f"暂不支持{model_name}！"
            return result
    except Exception as e:
        result.state = False
        result.message = f"链接{model_name}出错！\n{e}"
        return result


def build_rag_graph(doc_config: DocConfig):
    result = InvokeResponse(
        source=build_rag_graph.__name__,
        state=True,
        message=f"构建Graph成功！"
    )

    if doc_config.llm_model is None:
        result.state = False
        result.message = "请先配置模型！"
        return result
    elif doc_config.vector_store is None:
        result.state = False
        result.message = "请先上传文件并构建向量库！"
        return result

    def retrieve_node(state: MessagesState):
        """检索文档中与query相关的信息"""

        print("ai.retrieve_node - 开始检索")

        # 获取最后一条HumanMessage
        query = None
        for message in state["messages"][::-1]:
            if message.type == "human":
                query = message.content

        if query is None:
            return {"messages": [AIMessage(content="我没有收到你的问题。")]}

        translate_prompt = [
            SystemMessage(
                content=(
                    f"你是一个语言助手，你的任务是将用户的中文问题翻译为适合英文学术文献检索的关键词。\n"
                    f"只返回关键词，不要回答其他内容。\n\n"
                    f"示例：\n"
                    f"用户：这篇论文主要讲了什么？\n"
                    f"输出：abstract, conclusion\n\n"
                    f"用户：这篇论文的研究目标是什么？\n"
                    f"输出：research objective\n\n"
                    f"用户：这篇综述是怎样挑选文献的？\n"
                    f"输出：筛选方法，调查方法\n\n"
                    f"用户：{query}\n"
                    f"输出："
                )
            )
        ]
        translate_query = doc_config.llm_model.invoke(translate_prompt).content

        print(f"ai.retrieve_node - 翻译的query: {translate_query}")

        retrieved_docs = doc_config.vector_store.similarity_search(translate_query, k=3)
        serialized = "\n\n".join(f"{doc.page_content}" for doc in retrieved_docs)

        print("ai.retrieve_node - 完成检索，检索内容：")
        for i, s in enumerate(serialized.split("\n\n")):
            print(f"{str(i)}. {s}")
        print("\n\n")

        tool_response = ToolMessage(
            tool_call_id="node_force_call",
            tool_name="retrieve",
            content=serialized
        )

        # 返回检索出的相关片段拼接的文本和原始数据列表
        return {"messages": [tool_response]}

    def generate_node(state: MessagesState):
        """根据检索的内容生成答复"""

        print("ai.generate_node - 开始生成回复")

        # 获得ToolMessages
        recent_tool_messages = []
        for message in reversed(state["messages"]):
            if message.type == "tool":
                recent_tool_messages.append(message)
            else:
                break
        tool_messages = recent_tool_messages[::-1]

        # 提示词
        docs_content = "\n\n".join(doc.content for doc in tool_messages)
        system_message_content = (
            "这是retrive返回的信息，参考下边从文档中检索的内容回答问题，如果你根据这些信息也无法回答的话就回答不知道。使用简洁清楚的语句回答。\n\n"
            f"{docs_content}"
        )
        conversation_messages = [message for message in state["messages"] if message.type in ("human", "system") or (message.type == "ai" and not message.tool_calls)]
        prompt = [SystemMessage(system_message_content)] + conversation_messages

        print("ai.generate_node - 提示词：")
        print(prompt[0].content)
        print("\n\n")

        # 向LLM问话
        response = doc_config.llm_model.invoke(prompt)

        print("ai.generate_node - 结束，回复：")
        print(response)
        print("="*40, "\n\n")

        return {"messages": [response]}
    
    
    # 初始角色设定
    initial_message = SystemMessage(
        content=(
            f"你是一个文档助手，用户可能会叫你{doc_config.llm_name}。"
            f"用户上传了一份{doc_config.lanuage}文档《{doc_config.file_name}》，当提到“文章”、“文档”或“论文”等时一般指的就是这个文档。"
            "每次用户提问时，系统会先为你检索一些相关的文档内容，请你根据这些内容认真作答。"
            "如果根据文档无法回答，就说不知道。"
        )
    )

    try:
        graph_builder = StateGraph(MessagesState)
        graph_builder.add_node(retrieve_node)
        graph_builder.add_node(generate_node)

        graph_builder.set_entry_point("retrieve_node")
        graph_builder.add_edge("retrieve_node", "generate_node")
        graph_builder.add_edge("generate_node", END)

        # 记录历史记录
        memory = MemorySaver()
        config = RunnableConfig({"configurable": {"thread_id": "1"}})
        graph = graph_builder.compile(checkpointer=memory)
    except Exception as e:
        result.state = False
        result.message = f"构建Graph失败！\n{e}"
        return result

    # 加入初始SystemMessage
    try:
        graph.invoke({"messages": [initial_message]}, config=config)
    except Exception as e:
        result.state = False
        result.message = f"构建Graph失败！\n{e}"
        return result

    result.addition_args = {
        "graph": graph,
        "graph_config": config
    }

    return result
