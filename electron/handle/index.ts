import type { BrowserWindow } from 'electron'
import { isMaximized, setupTitleBarHandler } from './handleTitleBar'
import { setupTray } from './handleTray'
import '../utils/timerEvent'

export function setupHandle(win: BrowserWindow) {
  setupTitleBarHandler(win)
  setupTray(win)
  isMaximized(win)
}
