# 电力政策文件思维导图工具

面向电力行业从业者的政策文件快速理解工具。上传电力政策文件（PDF/Word/Markdown），自动生成结构化思维导图，支持对任意节点发起 AI 解释查询。

## 技术栈

- **前端**: React 19 + TypeScript + Vite + markmap + Zustand
- **后端**: Python FastAPI + PyMuPDF + python-docx
- **AI**: DeepSeek API（流式 SSE）

## 快速开始

### 一键启动（推荐）

```bash
./start.sh
```

脚本自动创建 Python venv、安装依赖、启动后端（:8000）和前端（:5173）。按 `Ctrl+C` 停止所有服务。

### 手动启动

**后端**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**前端**

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`，API 请求自动代理到后端 8000 端口。

## 功能

1. 上传 PDF/Word/Markdown 政策文件，自动提取文本
2. 调用 DeepSeek API 生成结构化思维导图（markmap 渲染）
3. 思维导图/Markdown 文本双视图切换
4. 选中节点或文本，一键获取 AI 解释（流式输出）
5. 对话式解释记录，支持 Markdown 渲染和重试
6. 多文件管理，每个文件独立保存思维导图和对话记录
7. 拖拽调整左右面板宽度
8. 思维导图缩放、适应屏幕、全屏查看、下载 MD
