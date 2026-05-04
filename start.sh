#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# ── Backend ──
echo "🔧 设置后端..."
cd "$BACKEND"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt
echo "✅ 后端依赖安装完成"

uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo "🚀 后端运行在 http://localhost:8000"

# ── Frontend ──
echo "🔧 设置前端..."
cd "$FRONTEND"
if [ ! -d "node_modules" ]; then
  npm install
fi
echo "✅ 前端依赖安装完成"

npm run dev &
FRONTEND_PID=$!
echo "🚀 前端运行在 http://localhost:5173"

echo ""
echo "按 Ctrl+C 停止所有服务"

cleanup() {
  echo "正在停止服务..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait
  echo "已停止"
}
trap cleanup INT TERM
wait
