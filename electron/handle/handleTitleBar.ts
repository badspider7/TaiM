import type { BrowserWindow } from 'electron'
import { app, ipcMain } from 'electron'

export function setupTitleBarHandler(win: BrowserWindow) {
  ipcMain.handle('titleBarControl:minimize', (event, args) => {
    win.minimize()
  })
  ipcMain.handle('titleBarControl:maximizeOrUnmaximize', () => {
    if (!win.isMaximized()) {
      win.maximize()
      return true
    }
    else {
      win.unmaximize()
      return false
    }
  })
  ipcMain.handle('titleBarControl:close', (event, type: string) => {
    if (type === 'hide') {
      win.hide()
    }
    else {
      app.quit()
    }
  })
}

// 判断窗口是不是最大化
export function isMaximized(win: BrowserWindow) {
  // 最大化
  win.on('maximize', () => {
    win.webContents.send('window.maximize', true)
  })
  // 退出最大化
  win.on('unmaximize', () => {
    win.webContents.send('window.maximize', false)
  })
}
