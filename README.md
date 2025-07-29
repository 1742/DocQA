# DocQA 文档问答系统

一个基于 FastAPI + LangChain + LangGraph + Next.js 构建的本地 PDF 文档问答系统。

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

目前只写了2、3个模型支持：
#### Embedding Model
<ul>
  <li>openai text-embedding-ada-002</li>
  <li>llama</li>
</ul>
其中llama需要在本地使用ollma部署，启动ollma后即可使用。

#### LLM
<ul>
  <li>gpt-3.5-turbo</li>
  <li>gpt-4</li>
  <li>DeepSeek-V3</li>
</ul>

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
