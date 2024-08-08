import type { BrowserWindow } from 'electron'
import { isMaximized, setupTitleBarHandler } from './handleTitleBar'
import { setupTray } from './handleTray'
import { getAllYearData, getAppInfo, getDataInRange, getHoursUsageData, getOneHourUsageData, getTodayUsageData } from './handleUsageData'
// import '../../src/utils/timerEvent'

export function setupHandle(win: BrowserWindow) {
  setupTitleBarHandler(win)
  setupTray(win)
  isMaximized(win)
  getTodayUsageData()
  getDataInRange()
  getHoursUsageData()
  getOneHourUsageData()
  getAllYearData()
  getAppInfo()
}
