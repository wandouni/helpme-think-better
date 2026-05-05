#!/usr/bin/env bash
# 桌面端开发模式一键启动
# 依次启动：后端 → 前端 → 等待 Vite 就绪 → Electron
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── 1. 后端 ──────────────────────────────────────────────────
echo "▶ 启动后端..."
cd "$ROOT/backend"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

uvicorn app.main:app --port 8000 &
BACKEND_PID=$!
echo "  后端运行在 http://localhost:8000 (pid $BACKEND_PID)"

# ── 2. 前端（Vite）────────────────────────────────────────────
echo "▶ 启动前端..."
cd "$ROOT/frontend"
if [ ! -d "node_modules" ]; then
  npm install --prefer-offline
fi

npm run dev &
FRONTEND_PID=$!
echo "  前端运行在 http://localhost:5173 (pid $FRONTEND_PID)"

# ── 3. 等待 Vite 就绪（TCP 端口检测，比 curl 更可靠）─────────
echo "▶ 等待 Vite 就绪..."
for i in $(seq 1 30); do
  if bash -c ">/dev/tcp/localhost/5173" 2>/dev/null; then
    echo "  Vite 已就绪（${i}s）"
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    echo "  [警告] 等待超时，Electron 将在启动后自动重试"
  fi
done

# ── 4. Electron ───────────────────────────────────────────────
echo "▶ 启动 Electron..."
cd "$ROOT/desktop"
if [ ! -d "node_modules" ]; then
  ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" npm install --prefer-offline
fi

npx electron . &
ELECTRON_PID=$!
echo "  Electron 已启动 (pid $ELECTRON_PID)"

echo ""
echo "按 Ctrl+C 停止所有服务"

cleanup() {
  echo ""
  echo "正在停止..."
  kill "$ELECTRON_PID" "$FRONTEND_PID" "$BACKEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  echo "已停止"
}
trap cleanup INT TERM
wait
