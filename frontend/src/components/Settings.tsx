import { SendDataToBackend } from "@/types/api";
import { DocConfig, RequestMessage } from "@/types/common";
import { embedding_model_list, llm_list } from "@/types/setting";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Cog6ToothIcon } from "@heroicons/react/16/solid";  // 图标库
import { useState } from "react";


export function SettingPopover (
    { currentDocConfig, currentDocConfigOnUpdate }: 
    { currentDocConfig: DocConfig, currentDocConfigOnUpdate: React.Dispatch<React.SetStateAction<DocConfig>> }
) {
    const [selectEmbeddingModel, setSelectEmbeddingModel] = useState(currentDocConfig.embedding_model_name);
    const [embeddingModelAPIKey, setEmbeddingModelAPIKey] = useState(currentDocConfig.embedding_model_api_key);
    const [selectLLM, setSelectLLM] = useState(currentDocConfig.llm_name);
    const [LLMAPIKey, setLLMAPIKey] = useState(currentDocConfig.llm_api_key);

    async function handleClick() {
        const model_config = { 
            embedding_model_name: selectEmbeddingModel,
            EmbeddingModelAPIKey: embeddingModelAPIKey,
            llm_name: selectLLM,
            llm_api_key: LLMAPIKey
        }

        const response: RequestMessage = await SendDataToBackend(model_config, "api/set_models", 3000);
        if (response.state) {
            currentDocConfigOnUpdate({
                ...currentDocConfig,
                embedding_model_name: selectEmbeddingModel,
                embedding_model_api_key: embeddingModelAPIKey,
                llm_name: selectLLM,
                llm_api_key: LLMAPIKey
            })
        }
        alert(response.message);
    }

    return (
        <Popover className="relative">
            <PopoverButton className="rounded-full border p-2 bg-white hover:bg-gray-100 text-black shadow">
                <Cog6ToothIcon className="w-5 h-5" />
            </PopoverButton>

            {/* 
                absolute 让弹窗相对PopoverButton定位
                bottom-full 让弹窗底部与PopoverButton上方对其，类似的还有top-full、left-full等
                right-0 右对齐，即弹窗与PopoverButton右对齐
            */}
            <PopoverPanel className="absolute z-50 bottom-full 10 mt-2 w-72 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">选择编码模型</label>
                    <select 
                        className="w-full mt-1 px-3 py-1.5 border rounded-md text-base" 
                        defaultValue={currentDocConfig.embedding_model_name}
                        onChange={(e) => setSelectEmbeddingModel(e.target.value)}
                    >
                        {embedding_model_list.map((item, index) => (
                            <option key={index} value={item}>{item}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">API Key</label>
                    <input 
                        type="password"
                        className="w-full mt-1 px-3 py-1.5 border rounded-md text-sm"
                        placeholder="sk-..."
                        value={embeddingModelAPIKey}
                        defaultValue={currentDocConfig.embedding_model_api_key}
                        onChange={(e) => setEmbeddingModelAPIKey(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">选择模型</label>
                    <select 
                        className="w-full mt-1 px-3 py-1.5 border rounded-md text-base" 
                        defaultValue={currentDocConfig.llm_name}
                        onChange={(e) => setSelectLLM(e.target.value)}
                    >
                        {llm_list.map((item, index) => (
                            <option key={index} value={item}>{item}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">API Key</label>
                    <input 
                        type="password"
                        className="w-full mt-1 px-3 py-1.5 border rounded-md text-sm"
                        placeholder="sk-..."
                        value={LLMAPIKey}
                        defaultValue={currentDocConfig.llm_api_key}
                        onChange={(e) => setLLMAPIKey(e.target.value)}
                    />
                </div>
                <div className="text-right">
                    <button 
                        className="text-sm text-white bg-black hover:bg-gray-800 rounded-md px-4 py-1"
                        onClick={handleClick}
                    >
                        保存
                    </button>
                </div>
            </PopoverPanel>
        </Popover>
    )
}


