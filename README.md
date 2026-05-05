# Lumio

文档快速学习工具。上传 PDF / Word / Markdown 文件，AI 自动生成结构化思维导图，支持节点解释、学习进度追踪和个性化学习路径推荐。

## 技术栈

- **前端**: React 19 + TypeScript + Vite + markmap + Zustand
- **后端**: Python FastAPI + PyMuPDF + python-docx
- **AI**: 兼容 OpenAI 格式的接口（DeepSeek / Ollama 等，流式 SSE）
- **桌面版**: Electron + PyInstaller

## 功能

| 功能        | 说明                                           |
| ----------- | ---------------------------------------------- |
| 文件上传    | 支持 PDF、Word、Markdown，20MB 以内            |
| 思维导图    | AI 提炼核心框架，markmap 渲染，流式生成        |
| 双视图      | 思维导图 ↔ Markdown 文本切换                  |
| 浮动解释    | 选中节点或文字，浮动按钮一键获取 AI 解释       |
| 学习标记    | 节点标记为「已学习」或「重点」，进度条跟踪     |
| AI 学习路径 | 基于当前文档和标记状态生成个性化学习建议       |
| 多文件管理  | 文件列表搜索，每份文件独立保存思维导图和对话   |
| 解释对话    | 流式输出，支持 Markdown 渲染和重试，刷新后保留 |

---

## Web 版快速开始

### 一键启动（推荐）

```bash
./start.sh
```

自动创建 Python venv、安装依赖、启动后端（:8000）和前端（:5173）。`Ctrl+C` 停止。

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

## AI 接口配置

点击右上角 ⚙ 图标，填写：

| 字段         | 说明                         | 示例                                        |
| ------------ | ---------------------------- | ------------------------------------------- |
| API Key      | 对应服务的密钥               | `sk-...`                                  |
| API Base URL | 接口地址（兼容 OpenAI 格式） | `https://api.deepseek.com`                |
| 模型名称     | 要使用的模型                 | `deepseek-chat` / `gpt-4o` / `llama3` |

配置保存在本地，不上传到任何服务器。Web 版存于浏览器 localStorage，桌面版存于系统用户数据目录（macOS: `~/Library/Application Support/Lumio/`，Windows: `%APPDATA%\Lumio\`）。

---

## 桌面版（Mac / Windows）

### 开发模式启动

**一键启动（推荐）**

```bash
./dev-desktop.sh
```

脚本自动按顺序启动后端 → 前端（Vite）→ 等待 Vite 就绪 → Electron。`Ctrl+C` 同时停止所有进程。

**手动启动（三个终端）**

```bash
# 终端 1 — 后端
cd backend && source .venv/bin/activate
uvicorn app.main:app --port 8000

# 终端 2 — 前端（等出现 "Local: http://localhost:5173" 再开终端 3）
cd frontend && npm run dev

# 终端 3 — Electron
cd desktop && npm start
```

### 环境要求（打包）

| 工具     | 版本                       |
| -------- | -------------------------- |
| Python   | 3.11+                      |
| Node.js  | 18+                        |
| 操作系统 | macOS 11+ 或 Windows 10/11 |

> **注意**：Mac 包须在 Mac 上构建，Windows 包须在 Windows 上构建，不支持交叉编译。

### macOS 打包

```bash
./scripts/build-mac.sh
```

输出位于 `desktop/out/make/`：

| 文件                           | 说明                    |
| ------------------------------ | ----------------------- |
| `Lumio.dmg`                  | 拖拽安装到 Applications |
| `zip/darwin/x64/Lumio-*.zip` | 便携版，解压后直接运行  |

**首次打开提示「无法验证开发者」**：右键 → 打开 → 仍要打开；或前往「系统设置 → 隐私与安全性」点击「仍要打开」。

### Windows 打包

> **推荐方式：GitHub Actions 自动构建**（无需 Windows 本机环境）

#### 方式一：GitHub Actions（推荐）

工作流文件已配置在 `.github/workflows/build-windows.yml`，支持两种触发方式：

**手动触发**

1. 推送代码到 GitHub
2. 进入仓库 → **Actions** → 左侧选 **Build Windows Installer** → **Run workflow**
3. 等待约 10–15 分钟，在运行结果页面的 **Artifacts** 区域下载 `Lumio-Windows.zip`，解压得到 `Lumio-Setup.exe`

**发布版本时自动触发**

```bash
git tag v1.0.0
git push --tags
```

推送标签后自动构建，安装包会附到对应的 GitHub Release 页面。

#### 方式二：在 Windows 本机构建

```bat
scripts\build-win.bat
```

输出位于 `desktop\out\make\squirrel.windows\x64\`：

| 文件                | 说明                           |
| ------------------- | ------------------------------ |
| `Lumio-Setup.exe` | 双击安装，自动创建桌面快捷方式 |

**SmartScreen 提示「未知发布者」**：点击「更多信息」→「仍要运行」。

### 构建流程

```
[1] npm run build         前端构建  →  frontend/dist/
[2] cp dist → backend/static/        注入到 FastAPI 静态目录
[3] PyInstaller           后端打包  →  backend/dist/server/
[4] Electron Forge make   安装包    →  desktop/out/make/
```

### 桌面版工作原理

```
Lumio.app
└── Contents/Resources/
    ├── server/          ← PyInstaller 打包的 Python 后端
    │   ├── server       ← 可执行文件（FastAPI + 全部依赖）
    │   └── _internal/   ← 动态库、提示词文件
    └── app/             ← Electron 主进程代码
```

启动流程：自动寻找空闲端口（从 8765 起）→ 启动内置后端 → 等待就绪 → 加载页面。FastAPI 同时提供 API 接口和前端静态文件，无需额外部署。

---

## 数据存储

所有数据通过 `localStorage` 持久化（键名 `policy_mindmap_state`），包括：

- 已上传文件列表（文件名、时间）
- 思维导图 Markdown 内容
- AI 解释对话记录
- 已学习 / 重点标记节点
- AI 学习路径内容

| 版本           | 存储位置                                  |
| -------------- | ----------------------------------------- |
| Web 版         | 浏览器 localStorage，清除浏览器数据后丢失 |
| 桌面版 macOS   | `~/Library/Application Support/Lumio/`  |
| 桌面版 Windows | `%APPDATA%\Lumio\`                      |

桌面版开发模式与打包版共用同一目录，数据不会因切换模式而丢失。原始文件在后端解析后立即删除，不落盘存储。

---

## 产品落地页（GitHub Pages）

落地页位于 `docs/index.html`，可直接部署到 GitHub Pages。

### 部署步骤

1. **推送代码到 GitHub**

   ```bash
   git add docs/index.html
   git commit -m "docs: add product landing page"
   git push
   ```
2. **开启 GitHub Pages**

   进入仓库 → **Settings** → **Pages**：

   - Source 选择 **Deploy from a branch**
   - Branch 选 `main`，目录选 `/docs`
   - 点击 **Save**
3. **访问落地页**

   约 1–2 分钟后，页面可通过以下地址访问：

   ```
   https://<你的GitHub用户名>.github.io/<仓库名>/
   ```
4. **更新落地页**

   直接编辑 `docs/index.html` 并推送，GitHub Pages 自动重新部署，无需额外操作。

> **提示**：落地页中的 GitHub 链接默认指向 `wandouni/helpme-think-better`，请在 `docs/index.html` 中搜索替换为你自己的仓库路径。

---

## 项目结构

```
helpme-think-better/
├── docs/                      # GitHub Pages 落地页
│   └── index.html
├── frontend/                  # React 前端
│   └── src/
│       ├── components/        # UI 组件
│       ├── store/             # Zustand 状态管理
│       ├── hooks/             # 自定义 Hooks
│       ├── services/          # API 调用层
│       └── utils/
├── backend/                   # FastAPI 后端
│   ├── app/
│   │   ├── routers/           # API 路由（upload/mindmap/explain）
│   │   ├── services/          # 文件解析（file_parser.py）& AI 接口调用（deepseek.py）
│   │   └── prompts/           # System prompts
│   └── server.spec            # PyInstaller 配置
├── desktop/                   # Electron 桌面壳
│   ├── main.js                # 主进程
│   ├── forge.config.js        # 打包配置
│   └── .npmrc                 # electron 镜像（npmmirror）
├── scripts/
│   ├── build-mac.sh           # macOS 一键打包
│   └── build-win.bat          # Windows 一键打包
└── start.sh                   # Web 版一键启动
```
