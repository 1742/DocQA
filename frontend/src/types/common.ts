import { ChatMessage } from "./chat"


// 缓存文件路径
export const temp_file_path: string = "files/Temp"

// 文档配置
export interface DocConfig {
    file_name: string,
    tmp_file_path: string
    lanuage: string,
    embedding_model_name: string,
    embedding_model_api_key: string,
    llm_name: string,
    llm_api_key: string,
    is_embedded: boolean,
    chat_history: Array<ChatMessage>
}

// 后端返回消息
export interface RequestMessage {
    source: string,
    state: boolean,
    message: string,
    addition_args: Record<string, string | boolean | number | null>
}
