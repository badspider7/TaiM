import type { BrowserWindow } from 'electron'
import { isMaximized, setupTitleBarHandler } from './handleTitleBar'
import { setupTray } from './handleTray'
import { handleUsageData } from './handleUsageData'
import { setupSettings } from './handleSettings'

export function setupHandle(win: BrowserWindow) {
  setupTitleBarHandler(win)
  setupTray(win)
  isMaximized(win)
  handleUsageData()
  setupSettings(win)
}
