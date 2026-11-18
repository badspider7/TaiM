import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { BrowserWindow, app, ipcMain, shell } from 'electron'
import { setupHandle } from '../handle'
import { clearAllTimer, isComputerSleep, startRecord } from '../utils'
import logger from '../logger'
import { initDb } from '../db'
import { getConfig } from '../config'
import { setupUpdates } from '../update'
import { cache } from '../utils/activeAppCache'
import { refreshApplicationIcons } from '../utils/appIcons'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')
process.env.VITE_IMAGE_PATH = path.join(process.env.APP_ROOT, 'src/assets/images')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1'))
  app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32')
  app.setAppUserModelId(app.getName())

let win: BrowserWindow | null = null
let quitting = false

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (win?.isMinimized())
      win.restore()
    win?.show()
    win?.focus()
  })
}

process
  .on('unhandledRejection', (reason, p) => {
    logger.error('Unhandled Rejection at Promise', reason, p)
  })
  .on('uncaughtException', (err) => {
    logger.error(err)
    throw err
  })

const preload = path.join(__dirname, '../preload/index.cjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

export async function createWindow() {
  let size = { width: 1000, height: 720 }
  if (getConfig().common.keepWindowSize) {
    try {
      const saved = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'window.json'), 'utf8'))
      if (Number.isFinite(saved.width) && Number.isFinite(saved.height))
        size = { width: Math.max(800, Math.min(2560, saved.width)), height: Math.max(600, Math.min(1440, saved.height)) }
    }
    catch { /* First launch has no saved window size. */ }
  }
  win = new BrowserWindow({
    ...size,
    title: 'TaiM',
    icon: path.join(process.env.VITE_PUBLIC, 'logo.ico'),
    webPreferences: {
      preload,
      nodeIntegration: false,
      sandbox: true,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    show: false,
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    // win.webContents.openDevTools()
  }
  else {
    win.loadFile(indexHtml)
    // 拦截快捷键Control+R
    win.webContents.on('before-input-event', (event: Electron.Event, input: Electron.Input) => {
      if (input.control && input.key.toLowerCase() === 'r') {
        event.preventDefault()
      }
    })
  }

  win.on('close', (event) => {
    if (!quitting) {
      event.preventDefault()
      win?.hide()
    }
  })

  win.once('ready-to-show', () => {
    if (!process.argv.includes('--hidden'))
      win?.show()
    win?.setMinimumSize(800, 600)
  })

  win.on('resized', () => {
    win?.webContents.send('refresh-chart', '')
    if (getConfig().common.keepWindowSize && !win?.isMaximized())
      fs.writeFileSync(path.join(app.getPath('userData'), 'window.json'), JSON.stringify(win?.getBounds()))
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:'))
      shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win?.webContents.getURL())
      event.preventDefault()
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.on('window-all-closed', () => {
  clearAllTimer()
  win = null
  if (process.platform !== 'darwin')
    app.quit()
})
app.on('before-quit', () => {
  quitting = true
  clearAllTimer()
})

// 防止页面被冻结
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')

ipcMain.on('open-url', (e, args) => {
  if (typeof args === 'string' && /^https:\/\//.test(args))
    void shell.openExternal(args)
})
app.whenReady().then(async () => {
  initDb()
  await refreshApplicationIcons()
  await createWindow()
  setupHandle(win!)
  setupUpdates(win!, () => {
    clearAllTimer()
    cache.flush(true)
    quitting = true
  }, () => {
    quitting = false
    startRecord()
  })
  startRecord()
  isComputerSleep()
})
