# DocQA 文档问答系统

一个基于 FastAPI + LangChain + LangGraph + Next.js 构建的本地 PDF 文档问答系统。

---

## ✨ 功能亮点

- 📄 支持 PDF 预览 + 文本缩放
- 🧠 支持基于文档内容的向量检索问答（RAG）
- 💬 支持聊天式对话
- 💾 支持文档上传、历史记录管理
- ⚙️ 支持 API 密钥设置、自定义模型接入

---

## 🧱 技术栈

- 后端：FastAPI + LangChain + LangGraph
- 前端：Next.js (React + TailwindCSS)
- 向量库：FAISS / 本地存储

---

## 🚀 快速运行

### 1. 克隆项目

```bash
git clone https://github.com/1742/DocQA.git
cd DocQA
```

### 2. 安装依赖

```bash
cd backend
conda activate your_venv
pip install -r requirements.txt
```

### 3. 构建前端项目

```bash
cd frontend
npm install
npm run build
```

运行后端：
```bash
uvicorn main:app --reload
```

访问地址`http://127.0.0.1:8000/frontend`即可使用

---

## 📁 项目结构
<ul>
  <li><code>/backend</code>：FastAPI 接口服务、LangChain 逻辑</li>
  <li><code>/frontend</code>：前端界面（Next.js + Tailwind）</li>
  <li><code>/Temp</code>：PDF 缓存路径</li>
  <li><code>/vector_cache_path</code>：向量缓存路径</li>
  <li><code>/history</code>：历史文档聊天记录</li>
</ul>

---

## 后续计划

优化RAG效果
