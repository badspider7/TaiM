import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { BrowserWindow, app, ipcMain, shell } from 'electron'
import { setupHandle } from '../handle'
import { clearAllTimer, isComputerSleep, startRecord } from '../utils'
import logger from '../logger'
import { initDb } from '../db'

const VUEJS3_DEVTOOLS = 'nhdogjmejiglipccpnnnanhbledajbpd'
const require = createRequire(import.meta.url)
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

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    win?.show()
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
      webSecurity: false,
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

  win.once('ready-to-show', () => {
    win?.show()
    win.setMinimumSize(800, 600)
  })

  win.webContents.on('did-finish-load', () => {
    win.on('resized', () => {
      win?.webContents.send('refresh-chart', '')
    })
    // 开始统计应用时间
    startRecord()
    isComputerSleep(win)
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
  console.log('====windows all close ===')
  clearAllTimer()
  win = null
  if (process.platform !== 'darwin')
    app.quit()
})

// 防止页面被冻结
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')

ipcMain.on('open-url', (e, args) => {
  void shell.openExternal(args)
})
app.whenReady().then(async () => {
  initDb()
  void createWindow()
  setupHandle(win)
  // if (process.env.VITE_DEV_SERVER_URL) {
  //   installExtension(VUEJS3_DEVTOOLS, { loadExtensionOptions: { allowFileAccess: true } })
  //     .then(name => logger.debug(`Added Extension:  ${name}`))
  //     .catch(err => logger.debug('An error occurred: ', err))
  // }
})
