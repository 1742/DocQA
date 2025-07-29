import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

import { SettingPopover } from "./Settings";
import { DocConfig, RequestMessage } from "@/types/common";
import { ChatMessage } from "@/types/chat";
import { SendDataToBackend } from "@/types/api";


function ChatInput(
    { currentDocConfig, currentDocConfigOnUpdate, isThinking, onSend }: 
    { 
        currentDocConfig: DocConfig, currentDocConfigOnUpdate: React.Dispatch<React.SetStateAction<DocConfig>>, 
        isThinking: boolean, onSend: (sendMessage: string) => Promise<void> 
    }
) {
    const [inputText, setInputText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);  // 用于存放HTML中的TextArea组件

    // 动态调整文本输入框的高度
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [inputText]);

    function handleSend() {
        const sendMessage = inputText.trim();

        if (sendMessage.length === 0) return;

        onSend(sendMessage);
        setInputText("");
    }

    // 当用户在文本框按下enter且没有按住shift键时，执行发送操作
    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            // 阻止默认行为，即换行
            e.preventDefault();

            const sendMessage: string = inputText.trim();
            if (sendMessage.length === 0) return;
             
            // 执行发送
            onSend(sendMessage);
            setInputText("");
        }
    }

    return (
        <div className="flex flex-col w-full border border-gray-300 rounded-2xl shadow-sm p-3 bg-white items-center-safe gap-2">
            <div className="w-full">
                {/* 
                    resize-none 禁止用户拖拽大小
                    overflow-auto 超出部分隐藏
                    row={1} 初始1行
                    ref={textareaRef} 将该textarea绑定到容器textareRef，在渲染后使用textareRef.current.XXX即可读取其相应的属性
                */}
                <textarea
                    className="w-full flex-1 resize-none overflow-y-auto outline-none leading-relaxed max-h-48 text-base"
                    rows={1}
                    placeholder="请输入你的问题..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    ref={textareaRef}
                />
            </div>
            <div className="w-full flex items-center justify-between">
                {/* 左侧，设置按钮 */}
                <SettingPopover currentDocConfig={currentDocConfig} currentDocConfigOnUpdate={currentDocConfigOnUpdate} />
                <button
                    className={`text-white rounded-full p-2 transition-colors ${inputText.trim()? "bg-black hover:bg-gray-800":"bg-gray-300 cursor-not-allowed"}`}
                    onClick={handleSend}
                    disabled={!inputText.trim() || isThinking}
                    title="发送"
                >
                    {/* 使用 SVG 图标类似 ChatGPT 的发送图标 */}
                    <svg
                        className="w-5 h-5 rotate-45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                    >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}


function ChatHistory({ chat_history }: { chat_history: ChatMessage[] }) {
  if (chat_history.length === 0) return <div></div>;

  return (
    <div className="space-y-4 p-2">
      {chat_history.map((item, index) => (
        <div key={index} className={`flex ${item.role === "human" ? "justify-end" : "justify-start"}`}>
          <div className={`p-3 rounded-lg max-w-[90%] text-sm ${item.role === "human" ? "bg-blue-100" : "bg-gray-100"}`}>
            <ReactMarkdown>{item.message}</ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  );
}


export function Chat(
    { currentDocConfig, currentDocConfigOnUpdate }: 
    { currentDocConfig: DocConfig, currentDocConfigOnUpdate: React.Dispatch<React.SetStateAction<DocConfig>> }
) {
    const [isThinking, setIsThinking] = useState(false);
    const chat_history = currentDocConfig.chat_history.slice();

    async function handleSend(sendMessage: string): Promise<void> {
        console.log("发送键触发，发送信息：", sendMessage);

        if (!sendMessage || sendMessage.length === 0) return;

        setIsThinking(true);

        const send_message = sendMessage;

        // 记录历史信息
        let chat_message: ChatMessage = { role: "human", message: send_message }
        chat_history.push(chat_message);
        currentDocConfigOnUpdate({...currentDocConfig, chat_history: chat_history});

        // 向后端发送问题
        const response: RequestMessage = await SendDataToBackend({"question": sendMessage}, "api/chat", 60000);
        if (response.state && typeof response.addition_args.role === "string" && typeof response.addition_args.message === "string") {
            // 记录历史信息
            chat_message = { role: response.addition_args.role, message: response.addition_args.message }
            chat_history.push(chat_message);
            currentDocConfigOnUpdate({...currentDocConfig, chat_history: chat_history});
        }
        else {
            // TODO: 在对话区域显示错误
            alert(response.message);
        }

        setIsThinking(false);
    }


    return (
        <div className="flex flex-col w-full h-full rounded-md space-y-4 p-4">
            <div id="chat_history" className="basis-[88%] overflow-auto m-auto">
                <ChatHistory chat_history={chat_history}/>
            </div>
            <div id="question_area" className="basis-[12%] flex flex-row space-x-4">
                <ChatInput  currentDocConfig={currentDocConfig} currentDocConfigOnUpdate={currentDocConfigOnUpdate} isThinking={isThinking} onSend={handleSend} />
            </div>
        </div>
    )
}
