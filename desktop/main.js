'use strict'

const { app, BrowserWindow, shell, Menu, dialog } = require('electron')
const { spawn } = require('child_process')
const net = require('net')
const http = require('http')
const path = require('path')
const fs = require('fs')

const DEFAULT_PORT = 8765
let backendProcess = null
let mainWindow = null

// ── Port helpers ──────────────────────────────────────────────────────────

function isPortFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer()
    s.once('error', () => resolve(false))
    s.once('listening', () => { s.close(); resolve(true) })
    s.listen(port, '127.0.0.1')
  })
}

async function findFreePort(start = DEFAULT_PORT) {
  for (let p = start; p < start + 30; p++) {
    if (await isPortFree(p)) return p
  }
  throw new Error('No available port found near ' + start)
}

// ── Backend lifecycle ─────────────────────────────────────────────────────

function getBackendExe() {
  if (!app.isPackaged) return null          // dev: use ./start.sh instead
  const bin = process.platform === 'win32' ? 'server.exe' : 'server'
  return path.join(process.resourcesPath, 'server', bin)
}

function waitForBackend(port, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    const attempt = () => {
      if (Date.now() > deadline) return reject(new Error('Backend startup timeout'))
      http.get(`http://127.0.0.1:${port}/health`, (res) => {
        res.statusCode === 200 ? resolve() : schedule()
      }).on('error', schedule)
    }
    const schedule = () => setTimeout(attempt, 400)
    attempt()
  })
}

async function startBackend(port) {
  const exe = getBackendExe()
  if (!exe) return   // dev mode — backend started externally

  if (process.platform !== 'win32') {
    try { fs.chmodSync(exe, 0o755) } catch (_) {}
  }

  backendProcess = spawn(exe, ['--port', String(port)], {
    stdio: 'ignore',
    detached: false,
  })
  backendProcess.on('error', (err) => console.error('[backend]', err))

  await waitForBackend(port)
}

function killBackend() {
  if (!backendProcess) return
  try {
    // Windows: taskkill; others: SIGTERM
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t'])
    } else {
      backendProcess.kill('SIGTERM')
    }
  } catch (_) {}
  backendProcess = null
}

// ── Window ────────────────────────────────────────────────────────────────

function buildMenu() {
  if (process.platform !== 'darwin') return null   // hide menu on Win/Linux

  return Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        { role: 'about', label: '关于' },
        { type: 'separator' },
        { role: 'services', label: '服务' },
        { type: 'separator' },
        { role: 'hide', label: '隐藏' },
        { role: 'hideOthers', label: '隐藏其他' },
        { role: 'unhide', label: '全部显示' },
        { type: 'separator' },
        { role: 'quit', label: '退出' },
      ],
    },
    {
      label: '编辑',
      role: 'editMenu',
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
      ],
    },
    {
      label: '窗口',
      role: 'windowMenu',
    },
  ])
}

function createWindow(port) {
  const menu = buildMenu()
  if (menu) Menu.setApplicationMenu(menu)
  else Menu.setApplicationMenu(null)

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    title: '电力政策思维导图',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#F8FAFC',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false,
  })

  // Packaged → FastAPI serves everything; dev → Vite dev server
  const url = app.isPackaged
    ? `http://127.0.0.1:${port}`
    : 'http://127.0.0.1:5173'

  mainWindow.loadURL(url)
  mainWindow.once('ready-to-show', () => mainWindow.show())

  // External links open in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url: u }) => {
    if (/^https?:/.test(u)) shell.openExternal(u)
    return { action: 'deny' }
  })
}

// ── App lifecycle ─────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  const port = app.isPackaged ? await findFreePort() : 8000

  if (app.isPackaged) {
    try {
      await startBackend(port)
    } catch (err) {
      dialog.showErrorBox(
        '启动失败',
        `后端服务无法启动，请重新打开应用。\n\n${err.message}`
      )
      app.quit()
      return
    }
  }

  createWindow(port)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(port)
  })
})

app.on('window-all-closed', () => {
  killBackend()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', killBackend)
app.on('will-quit', killBackend)
