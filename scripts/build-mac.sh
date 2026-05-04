#!/usr/bin/env bash
# ============================================================
#  电力政策思维导图 — macOS 桌面版构建脚本
#  需要: Python 3.11+  Node.js 18+  npm  Xcode CLT
# ============================================================
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/desktop/out"

echo "================================================================"
echo " 电力政策思维导图 — macOS 桌面版构建"
echo "================================================================"

# ── Step 1: Build frontend ──────────────────────────────────
echo ""
echo "▶ [1/5] 构建前端 (React + Vite)..."
cd "$ROOT/frontend"
npm install --prefer-offline
npm run build
echo "   ✓ 前端构建完成 → frontend/dist/"

# ── Step 2: Copy frontend → backend/static ──────────────────
echo ""
echo "▶ [2/5] 将前端产物复制到 backend/static/ ..."
rm -rf "$ROOT/backend/static"
cp -r "$ROOT/frontend/dist" "$ROOT/backend/static"
echo "   ✓ 复制完成"

# ── Step 3: PyInstaller ─────────────────────────────────────
echo ""
echo "▶ [3/5] 打包 Python 后端 (PyInstaller)..."
cd "$ROOT/backend"
if [ ! -d ".venv" ]; then
  echo "   创建虚拟环境..."
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt
pip install -q pyinstaller
pyinstaller server.spec --clean --noconfirm
echo "   ✓ 后端打包完成 → backend/dist/server/"

# ── Step 4: Electron Forge package + make (zip) ─────────────
echo ""
echo "▶ [4/5] 打包 Electron 桌面应用..."
cd "$ROOT/desktop"
# npm.taobao.org is deprecated (invalid cert); use npmmirror.com instead
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install --prefer-offline
npm run make -- --platform darwin
echo "   ✓ Electron 打包完成"

# ── Step 5: Wrap .app into .dmg using built-in hdiutil ───────
echo ""
echo "▶ [5/5] 生成 DMG 安装包..."
APP_DIR="$OUT/PolicyMindmap-darwin-x64"
APP_PATH="$APP_DIR/PolicyMindmap.app"
DMG_PATH="$OUT/make/PolicyMindmap.dmg"
TMP_DMG="$OUT/make/tmp_rw.dmg"
mkdir -p "$OUT/make"

# Create a writable DMG, copy .app in, convert to read-only compressed DMG
hdiutil create -volname "PolicyMindmap" -srcfolder "$APP_PATH" \
  -ov -format UDZO -o "$DMG_PATH" >/dev/null
echo "   ✓ DMG 生成完成"

echo ""
echo "================================================================"
echo " ✅ 构建成功！"
echo ""
echo " 安装包: $OUT/make/"
echo "   • PolicyMindmap.dmg               — 拖拽安装到 Applications"
echo "   • zip/darwin/x64/PolicyMindmap-*  — 便携版，解压后直接运行"
echo ""
echo " ⚠  首次打开时如遇到安全提示（无法验证开发者），请在"
echo "    系统设置 → 隐私与安全性 中点击「仍要打开」"
echo "    或：右键点击 .app → 打开 → 仍要打开"
echo "================================================================"
