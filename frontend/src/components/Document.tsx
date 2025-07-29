import React, { useState } from "react";

import { DocConfig, RequestMessage } from "@/types/common";
import { SendDataToBackend } from "@/types/api";


function DocsHistoryList(
    { currentDocConfig, historyFilesList, handleClickHistoryFile }: 
    { currentDocConfig: DocConfig, historyFilesList: File[], handleClickHistoryFile: (file_id: number) => Promise<void> }
) {
    if (historyFilesList.length === 0) return (<div>暂无历史记录</div>);

    return (
        <>
            {historyFilesList.map((item: File, index: number) => (
                <button
                    key={index}
                    type="button"
                    className={`w-full italic text-left overflow-ellipsis px-3 py-2 max-w-64 border rounded hover:bg-gray-100 transition ${currentDocConfig.file_name === item.name ? "bg-gray-200 cursor-not-allowed" : ""}`}
                    disabled={currentDocConfig.file_name === item.name}
                    onClick={() => handleClickHistoryFile(index)}
                >
                    {item.name}
                </button>
            ))}
        </>
    );
}


export function Document(
    {currentDocConfig, currentDocConfigOnUpdate, docsHistory, docsHistoryOnUpdate }: 
    { 
        currentDocConfig: DocConfig, currentDocConfigOnUpdate: React.Dispatch<React.SetStateAction<DocConfig>>,
        docsHistory: File[], docsHistoryOnUpdate: React.Dispatch<React.SetStateAction<File[]>>
    }
) {
    const [uploadingFlag, setUploadingFlag] = useState(false);
    const historyFilesList: File[] = docsHistory.slice();

    async function handleFileChange(files: FileList | null): Promise<void> {
        // 未选择文件
        if (!files || files.length === 0) return;
        
        // 更新标志位，用于控制上传按钮是否可用
        setUploadingFlag(true);
        // 调试信息
        console.log("/frontend/src/component/Document handleFileChange: 正在上传文件...");

        // 取出第一个文件（也只有一个。。。）
        const file: File = files[0];
        console.log("selectFile: ", file);

        // 创建表单
        const formData = new FormData();
        formData.append("file", file);
        
        // 向后端发送数据
        const response: RequestMessage = await SendDataToBackend(formData, "api/upload", 1000);
        if (response.state && typeof response.addition_args.file_name === "string" && typeof response.addition_args.tmp_file_path === "string") {
            currentDocConfigOnUpdate({
                ...currentDocConfig, 
                file_name: response.addition_args.file_name, 
                tmp_file_path: response.addition_args.tmp_file_path,
                lanuage: "",
                is_embedded: false,
                chat_history: []
            });
            // 检查是否是历史文件
            if (!(historyFilesList.some((f) => f.name === file.name))) {
                docsHistoryOnUpdate((prev: File[]) => [...prev, file]);
                historyFilesList.push(file);
            }
        }

        setUploadingFlag(false);

        console.log("/frontend/src/component/Document handleFileChange: 上传文件结束");
    }

    async function handleClickHistoryFile(file_id: number): Promise<void> {
        setUploadingFlag(true);
        console.log("/frontend/src/component/Document handleClickHistoryFile: 正在上传历史文件...");

        const file: File = historyFilesList[file_id];
        console.log("selectFile: ", file);

        // 创建表单
        const formData = new FormData();
        formData.append("file", file);
        
        // 向后端发送数据
        const response: RequestMessage = await SendDataToBackend(formData, "api/upload", 1000);
        if (response.state && typeof response.addition_args.file_name === "string" && typeof response.addition_args.tmp_file_path === "string") {
            currentDocConfigOnUpdate({...currentDocConfig, file_name: response.addition_args.file_name, tmp_file_path: response.addition_args.tmp_file_path});
        }
        
        setUploadingFlag(false);
        console.log("/frontend/src/component/Document handleClickHistoryFile: 上传文件结束");
    }

    return (
        <div className="flex flex-col w-full h-full overflow-auto bg-white p-4 rounded-md space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">历史文件</h2>
            <div className="flex flex-col space-y-2 overflow-y-auto max-h-80">
                <DocsHistoryList currentDocConfig={currentDocConfig} historyFilesList={historyFilesList} handleClickHistoryFile={handleClickHistoryFile} />
            </div>
            <div className="pt-4">
                <label
                    htmlFor="file_upload_input"
                    className={`w-full mb-auto text-center block bg-gray-800 text-white py-2 px-4 rounded hover:bg-gray-600 cursor-pointer transition ${uploadingFlag ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {uploadingFlag ? "正在上传..." : "上传"}
                </label>
                <input
                    id="file_upload_input"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    disabled={uploadingFlag}
                    onChange={(e) => handleFileChange(e.target.files)}
                />
            </div>
        </div>
    )
}



