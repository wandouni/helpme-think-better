@echo off
:: ============================================================
::  电力政策思维导图 — Windows 桌面版构建脚本
::  需要: Python 3.11+  Node.js 18+  npm
:: ============================================================
setlocal EnableDelayedExpansion
set ROOT=%~dp0..
cd /d "%ROOT%"

echo ================================================================
echo  电力政策思维导图 — Windows 桌面版构建
echo ================================================================

:: ── Step 1: Build frontend ─────────────────────────────────
echo.
echo [1/4] 构建前端 (React + Vite)...
cd "%ROOT%\frontend"
call npm install --prefer-offline
if %ERRORLEVEL% neq 0 goto :error
call npm run build
if %ERRORLEVEL% neq 0 goto :error
echo    √ 前端构建完成 → frontend\dist\

:: ── Step 2: Copy frontend → backend\static ─────────────────
echo.
echo [2/4] 将前端产物复制到 backend\static\ ...
if exist "%ROOT%\backend\static" rmdir /s /q "%ROOT%\backend\static"
xcopy /e /i /y "%ROOT%\frontend\dist" "%ROOT%\backend\static" >nul
echo    √ 复制完成

:: ── Step 3: PyInstaller ────────────────────────────────────
echo.
echo [3/4] 打包 Python 后端 (PyInstaller)...
cd "%ROOT%\backend"
if not exist ".venv" (
  echo    创建虚拟环境...
  python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -q -r requirements.txt
if %ERRORLEVEL% neq 0 goto :error
pip install -q pyinstaller
if %ERRORLEVEL% neq 0 goto :error
pyinstaller server.spec --clean --noconfirm
if %ERRORLEVEL% neq 0 goto :error
echo    √ 后端打包完成 → backend\dist\server\

:: ── Step 4: Electron Forge ─────────────────────────────────
echo.
echo [4/4] 打包 Electron 桌面应用...
cd "%ROOT%\desktop"
:: npm.taobao.org is deprecated (invalid cert); override with npmmirror.com
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
call npm install --prefer-offline
if %ERRORLEVEL% neq 0 goto :error
call npm run make -- --platform win32
if %ERRORLEVEL% neq 0 goto :error

echo.
echo ================================================================
echo  √ 构建成功！
echo.
echo  安装包: %ROOT%\desktop\out\make\squirrel.windows\x64\
echo    Lumio-Setup.exe  — 双击安装
echo.
echo  提示: 首次运行 Windows SmartScreen 可能提示未知发布者，
echo        点击「更多信息」→「仍要运行」即可。
echo ================================================================
goto :eof

:error
echo.
echo [ERROR] 构建失败，错误代码: %ERRORLEVEL%
exit /b %ERRORLEVEL%
