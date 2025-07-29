'use client'

import React, { useState } from 'react';
import 'react-pdf/dist/Page/TextLayer.css';  //  PDF文本内容可选中
import 'react-pdf/dist/Page/AnnotationLayer.css';  // 可点击的PDF链接/注释

import { Document } from '@/components/Document';
import { PDFViewer } from '@/components/PDFViewer';
import { Chat } from '@/components/Chat';
import { DocConfig } from '@/types/common';
import { embedding_model_list, llm_list, test_ds_api_key } from '@/types/setting';


export default function HomePage() {
  const [currentDocConfig, setCurrentDocConfig] = useState<DocConfig>({
    file_name: "",
    tmp_file_path: "",
    lanuage: "",
    embedding_model_name: embedding_model_list[1],
    embedding_model_api_key: "",
    llm_name: llm_list[2],
    llm_api_key: test_ds_api_key,
    is_embedded: false,
    chat_history: []
  });
  const [docsHistory, setDocsHistory] = useState<File[]>([]);

  return (
    <div className='flex h-screen max-w-screen'>
      {/* 左侧文档历史栏 */}
      <div className="basis-[15%] w-full h-full min-w-0 shadow-lg shadow-gray-400">
        <Document currentDocConfig={currentDocConfig} currentDocConfigOnUpdate={setCurrentDocConfig} docsHistory={docsHistory} docsHistoryOnUpdate={setDocsHistory} />
      </div>
      {/* 
        中间 PDF 预览区域
        min-w-0 禁止flex子元素无限分配宽度
        overflow-auto 显示内容溢出时隐藏，用滑块移动
      */}
      <div className="basis-[60%] w-full h-full min-w-0">
        <PDFViewer currentDocConfig={currentDocConfig} currentDocConfigOnUpdate={setCurrentDocConfig} />
      </div>
      {/* 右侧聊天区域 */}
      <div className="basis-[25%] w-full h-full min-w-0 shadow-lg shadow-gray-400">
        <Chat currentDocConfig={currentDocConfig} currentDocConfigOnUpdate={setCurrentDocConfig} />
      </div>
    </div>
  )
}
