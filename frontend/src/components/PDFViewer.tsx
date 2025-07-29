import React, { useEffect, useState } from 'react';
import type { DocConfig, RequestMessage } from '@/types/common';
import { base_url, SendDataToBackend } from '@/types/api';
import { docs_lanuages_list } from '@/types/setting';


function SelectDocLanuage({ handleSelectLanuage }: { handleSelectLanuage: (selectLanuage: string) => Promise<void> }) {
    return (
        <select className='select-auto px-3 py-1.5 bg-gray-200 rounded hover:bg-gray-300' onChange={(e) => handleSelectLanuage(e.target.value)}>
            {docs_lanuages_list.map((item, index) => (
                <option key={index} value={item}>{item}</option>
            ))}
        </select>
    );
}


export function PDFViewer(
    { currentDocConfig, currentDocConfigOnUpdate }: 
    { currentDocConfig: DocConfig, currentDocConfigOnUpdate: React.Dispatch<React.SetStateAction<DocConfig>> }
) {
    const [isClient, setIsClient] = useState(false);  // 是否在客户端

    // 下面这行注释是在build时用来跳过下一行的@typescript-eslint/no-explicit-any检查，不能删
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [reactPdf, setReactPdf] = useState<any>(null);  // 用于动态导入react-pdf

    const [numPages, setNumPages] = useState(0);  // 总页码
    const [currentPage, setCurrentPage] = useState(1);  // 当前页码
    const [scale, setScale] = useState(1.5);  // 默认缩放倍数

    const [isEmbedding, setIsEmbedding] = useState(false);

    // 动态导入react-pdf和设置pdfjs-dist工作程序入口
    // 因为react-pdf会引用DOMMatrix、window、canvas等浏览器API；
    // 在React项目中，如果用服务端渲染（SSR）或 Next.js，会在“Node.js环境”加载这些库；
    // 这时DOMMatrix is not defined就会报错。
    // 所以用useEffect在服务器端渲染好后在导入这两个库
    useEffect(() => {
        setIsClient(true);
        // 动态加载 react-pdf 和配置workerSrc（只在浏览器中执行）
        import('react-pdf').then((mod) => {
            // PDF文件比较复杂，解析很耗性能。为了不让页面卡死，pdfjs-dist把PDF的解析逻辑放到「Web Worker」里异步执行。
            // 而Web Worker是浏览器提供的一种后台线程运行机制，用来处理耗时的任务，不会阻塞页面主线程（UI）。
            // pdf.worker.js就是那个专门处理PDF的“子线程脚本”。
            // 从v5开始，pdfjs-dist不再自动处理worker的路径问题，所以必须手动：
            // 1. 把pdf.worker.min.mjs拷贝到public目录并命名为pdf.worker.js；
            // 2. 设置pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.js"
            mod.pdfjs.GlobalWorkerOptions.workerSrc = '/frontend/pdf.worker.js';
            setReactPdf(mod);
        });
    }, []);  // 后边这个空数组是依赖项，当[]中的元素变化时会立刻触发重新渲染，而空数组代表这个useEffect只会触发1次，如果没有依赖项则每次渲染后都会执行
    // 另外，使用useState的setXXX会触发渲染，如果在useEffect中使用setXX修改依赖项就会陷入死循环

    // 加载成功后记录总页数并设置当前页码为1
    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void { 
        setNumPages(numPages);
        setCurrentPage(1);
    }

    // 上一页按钮
    function lastPage(e: React.FormEvent): void {
        e.preventDefault();
        const target = currentPage - 1;
        if (target >= 1 && target <= numPages) { setCurrentPage(target); }
    }

    // 下一页按钮
    function nextPage(e: React.FormEvent): void {
        e.preventDefault();
        const target = currentPage + 1;
        if (target >= 1 && target <= numPages) { setCurrentPage(target); }
    }

    // 设定跳转到的页码
    function goToPage(e: React.FormEvent): void {
        // 阻止页面刷新（即阻止重新渲染）
        e.preventDefault();

        // 下面这行注释是在build时用来跳过下一行的@typescript-eslint/no-explicit-any检查，不能删
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const input = (e.target as any).elements.pageNumber.value;
        
        const target = parseInt(input);
        if (target >= 1 && target <= numPages) { setCurrentPage(target); }
    }

    // 点击跳转页码
    function handleItemClick(paperPage: number): void { if (paperPage) setCurrentPage(paperPage); }

    // 点击跳转链接
    // 至于为什么是uri, 在react-pdf的封装里
    // uri是PDF外部链接，例如 "https://xxx.com"
    // url是PDF内部跳转目的地
    // 因为react-pdf的onLinkClick无法触发，所以直接用document强行劫持链接跳转事件
    useEffect(() => {
        function interceptPDFLinks(e: MouseEvent): void {
            // e.target是触发该事件的DOM元素，类型是EventTarget, 一般不能直接用
            // 强制转换为HTMLElement
            const target = e.target as HTMLElement;
            // 在其父级元素内向上检查离该元素最近的标签a, 没有就返回null
            const anchor = target.closest('a') as HTMLAnchorElement | null;

            if (anchor && anchor.href && (anchor.href.startsWith("http") || anchor.href.startsWith("https")) && !anchor.href.startsWith(window.location.origin + "/#")) {
                e.preventDefault();
                window.open(anchor.href, '_blank');
            }
        }

        // 用捕获阶段（true）监听，优先于浏览器默认跳转
        document.addEventListener('click', interceptPDFLinks, true);

        // 用完后移除监听
        // react的useEffect里的return只有在组件移除时才会触发
        return () => { document.removeEventListener('click', interceptPDFLinks, true); }
    }, []);

    // 构建向量库
    async function handleEmbed(): Promise<void> {
        if (currentDocConfig.is_embedded || currentDocConfig.tmp_file_path.length === 0) return;

        setIsEmbedding(true);
        // 调试信息
        console.log("/frontend/src/component/PDFViewer handleEmbed: 正在构建向量库...");

        // 请求后端根据当前文档构建
        const response: RequestMessage = await SendDataToBackend(new FormData(), "api/embedding", null);
        if (response.state) currentDocConfigOnUpdate({...currentDocConfig, is_embedded: true});
        else alert(response.message);

        // 调试信息
        console.log("/frontend/src/component/PDFViewer handleEmbed: 构建向量库操作结束");
        setIsEmbedding(false);
    }

    // 选择文档语言
    async function handleSelectLanuage(selectLanuage: string): Promise<void> {
        if (!selectLanuage || selectLanuage.length === 0) return;

        const response: RequestMessage = await SendDataToBackend({"lanuage": selectLanuage}, "api/set_lanuage", 1000);
        if (response.state) {
            currentDocConfigOnUpdate({...currentDocConfig, lanuage: selectLanuage});
            console.log("/frontend/src/component/PDFViewer handleSelectLanuage: 已设定语言：", selectLanuage);
        }
        else {
            console.log(response.message);
            alert(response.message);
        }
    }

    if (!isClient || !reactPdf) return <div className="w-full p-10 text-2xl text-gray-400 m-2">加载中</div>;

    const { Document, Page } = reactPdf;

    if (!currentDocConfig.tmp_file_path) return <div className="w-full p-10 text-2xl text-gray-400 m-2">请上传或选择一个PDF文件进行预览</div>;

    // 访问后端设定的静态工作路径
    const file_url = `${base_url}/${currentDocConfig.tmp_file_path}`;

    return (
        <div className="flex flex-col h-full w-full overflow-auto rounded-md p-4">
            {/* 文档标题 */}
            <h1 className='font-serif italic text-4xl indent-4 text-pretty space-y-1'>{currentDocConfig.file_name}</h1>
            {/* 控制条 */}
            <div className="flex max-w-full border-b-2 items-center space-x-4 p-6">
                <SelectDocLanuage handleSelectLanuage={handleSelectLanuage} />
                <button 
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100" 
                    disabled={isEmbedding || currentDocConfig.tmp_file_path.length === 0 || currentDocConfig.is_embedded} 
                    onClick={handleEmbed}
                >
                    {isEmbedding? "正在构建向量库...": currentDocConfig.is_embedded? "构建完成": "构建向量库"}
                </button>
                <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>缩小</button>
                <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setScale((s) => Math.min(3, s + 0.1))}>放大</button>

                <form onSubmit={(e) => goToPage(e)} className="flex items-center space-x-2">
                    <span>跳转至第</span>
                    <input
                        name="pageNumber"
                        type="number"
                        min="1"
                        max={numPages}
                        className="w-16 px-2 py-1 border rounded"
                        defaultValue={currentPage}
                    />
                    <span>页</span>
                    <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">跳转</button>

                </form>
                <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" onClick={(e) => lastPage(e)}>上一页</button>
                <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" onClick={(e) => nextPage(e)}>下一页</button>
                <div className="ml-auto text-gray-500">第 {currentPage} 页 / 共 {numPages} 页</div>
            </div>

            <div className="overflow-auto h-full w-full p-4">
                <Document 
                    file={file_url} 
                    onLoadSuccess={onDocumentLoadSuccess} 
                    onItemClick={({ pageNumber }: { pageNumber: number }) => handleItemClick(pageNumber)}
                >
                    {/* 显示的页码 */}
                    <Page pageNumber={currentPage} scale={scale} />
                    {/* “注册”所有页，但不显示，即除当前显示的页码外生成一些空白的页 */}
                    {Array.from({ length: numPages }, (_, i) =>
                        i + 1 === currentPage ? null : (
                            <Page
                                key={`invisible-${i + 1}`}
                                pageNumber={i + 1}
                                renderMode="none"
                                renderTextLayer={false}  // 该页内容是否可选
                                renderAnnotationLayer={false}  // 该页链接是否可点击
                            />
                        )
                    )}
                </Document>
            </div>
        </div>
    );
}
