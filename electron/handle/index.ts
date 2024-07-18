import type { BrowserWindow } from 'electron'
import { app, ipcMain } from 'electron'
import { isMaximized, setupTitleBarHandler } from './handleTitleBar'

export function setupHandle(win: BrowserWindow) {
  setupTitleBarHandler(win)
  isMaximized(win)
}
