import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { BrowserWindow, app, ipcMain, shell } from 'electron'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')

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

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    win?.show()
  })
}

const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

export async function createWindow() {
  win = new BrowserWindow({
    title: 'TaiM',
    icon: path.join(process.env.VITE_PUBLIC, '../../public/favicon.svg'),
    webPreferences: {
      preload,
      nodeIntegration: true,
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
  }

  win.once('ready-to-show', () => win?.show())
  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:'))
      shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin')
    app.quit()
})

app.whenReady().then(() => {
  void createWindow()
})

// 设置任务栏
// app.setUserTasks([])

// app.on('activate', () => {
//   const allWindows = BrowserWindow.getAllWindows()
//   if (allWindows.length) {
//     allWindows[0].focus()
//   }
//   else {
//     console.log('active')
//     createWindow()
//   }
// })
