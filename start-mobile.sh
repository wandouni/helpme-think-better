#!/usr/bin/env bash
# 移动端（iPhone）局域网访问一键启动
# 构建前端 → 启动后端监听 0.0.0.0 → 打印访问地址
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── 1. 检测局域网 IP ─────────────────────────────────────────
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
if [ -z "$LAN_IP" ]; then
  echo "[警告] 未检测到局域网 IP，请确认 Mac 已连接 WiFi"
  LAN_IP="<你的Mac局域网IP>"
fi

# ── 2. 构建前端 ───────────────────────────────────────────────
echo "▶ 构建前端..."
cd "$ROOT/frontend"
if [ ! -d "node_modules" ]; then
  npm install --prefer-offline
fi
npm run build
echo "  ✓ 前端构建完成"

# ── 3. 将前端产物复制到后端静态目录 ──────────────────────────
echo "▶ 复制前端产物到后端..."
rm -rf "$ROOT/backend/static"
cp -r "$ROOT/frontend/dist" "$ROOT/backend/static"
echo "  ✓ 复制完成"

# ── 4. 启动后端（监听所有网卡）───────────────────────────────
echo "▶ 启动后端..."
cd "$ROOT/backend"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# ── 5. 打印访问信息 ───────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Lumio 已启动，iPhone 访问步骤："
echo ""
echo "  1. 确认 iPhone 和 Mac 连接同一个 WiFi"
echo "  2. 在 iPhone Safari 中打开："
echo ""
echo "       http://$LAN_IP:8000"
echo ""
echo "  3. 点击底部 分享按钮 → 「添加到主屏幕」"
echo "     即可像 App 一样从桌面打开 Lumio"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "按 Ctrl+C 停止服务"

cleanup() {
  echo ""
  echo "正在停止..."
  kill "$BACKEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  echo "已停止"
}
trap cleanup INT TERM
wait
