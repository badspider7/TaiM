import type { BrowserWindow } from 'electron'
import { isMaximized, setupTitleBarHandler } from './handleTitleBar'
import { setupTray } from './handleTray'
import { getAppInfo, getTodayUsageData, getWeekUsageData } from './handleUsageData'
import '../../src/utils/timerEvent'

export function setupHandle(win: BrowserWindow) {
  setupTitleBarHandler(win)
  setupTray(win)
  isMaximized(win)
  getTodayUsageData()
  getWeekUsageData()
  getAppInfo()
}
