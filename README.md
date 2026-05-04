# 电力政策文件思维导图工具

面向电力行业从业者的政策文件快速理解工具。上传电力政策文件（PDF/Word/Markdown），自动生成结构化思维导图，支持对任意节点发起 AI 解释查询。

## 技术栈

- **前端**: React 19 + TypeScript + Vite + markmap + Zustand
- **后端**: Python FastAPI + PyMuPDF + python-docx
- **AI**: DeepSeek API（流式 SSE）
- **桌面版**: Electron + PyInstaller

## 功能

1. 上传 PDF/Word/Markdown 政策文件，自动提取文本
2. 调用 DeepSeek API 生成结构化思维导图（markmap 渲染）
3. 思维导图 / Markdown 文本双视图切换
4. 选中节点或文本，浮动解释按钮一键获取 AI 解释（流式输出）
5. 对话式解释记录，支持 Markdown 渲染和重试，刷新后保留
6. 多文件管理，每个文件独立保存思维导图和对话记录
7. 拖拽调整左右面板宽度
8. 思维导图缩放、适应屏幕、全屏查看、下载 MD

---

## Web 版快速开始

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

---

## 桌面版（Mac / Windows）

### 环境要求

| 工具 | 版本 |
|------|------|
| Python | 3.11+ |
| Node.js | 18+ |
| 操作系统 | macOS 11+ 或 Windows 10/11 |

> **注意**：Mac 包必须在 Mac 上构建，Windows 包必须在 Windows 上构建，不支持交叉编译。

---

### macOS 打包

```bash
./scripts/build-mac.sh
```

构建完成后，安装包位于 `desktop/out/make/`：

| 文件 | 说明 |
|------|------|
| `PolicyMindmap.dmg` | 标准安装包，拖拽到 Applications 即完成安装 |
| `PolicyMindmap.zip` | 便携版，解压后直接双击运行 |

**首次打开提示"无法验证开发者"**：右键点击应用 → 打开 → 仍要打开；或前往「系统设置 → 隐私与安全性」点击「仍要打开」。

---

### Windows 打包

```bat
scripts\build-win.bat
```

构建完成后，安装包位于 `desktop\out\make\squirrel.windows\x64\`：

| 文件 | 说明 |
|------|------|
| `PolicyMindmap-Setup.exe` | 双击安装，自动创建桌面快捷方式 |

**首次运行 SmartScreen 提示"未知发布者"**：点击「更多信息」→「仍要运行」。

---

### 构建流程说明

脚本依次自动执行以下四步：

```
[1] 构建前端       npm run build  →  frontend/dist/
[2] 注入静态文件   复制 dist/    →  backend/static/
[3] 打包后端       PyInstaller   →  backend/dist/server/
[4] 打包桌面应用   Electron Forge →  desktop/out/make/
```

### 桌面版工作原理

```
PolicyMindmap.app (或 .exe)
└── Resources/
    ├── server/          ← PyInstaller 打包的 Python 后端
    │   ├── server       ← 可执行文件（含 FastAPI + 全部依赖）
    │   └── _internal/   ← 动态库、提示词等资源
    └── app.asar         ← Electron 主进程代码
```

启动时，Electron 自动寻找空闲端口（从 8765 开始）→ 启动内置后端进程 → 等待服务就绪 → 打开窗口加载本地服务。FastAPI 同时提供 API 接口和前端页面，无需单独部署。

---

## 项目结构

```
helpme-think-better/
├── frontend/          # React 前端
├── backend/           # FastAPI 后端
│   ├── app/
│   │   ├── routers/   # API 路由
│   │   ├── services/  # 文件解析 & DeepSeek 调用
│   │   └── prompts/   # System prompts
│   └── server.spec    # PyInstaller 打包配置
├── desktop/           # Electron 桌面壳
│   ├── main.js        # 主进程
│   └── forge.config.js
├── scripts/
│   ├── build-mac.sh   # macOS 一键打包
│   └── build-win.bat  # Windows 一键打包
└── start.sh           # Web 版一键启动
```
