import { app, ipcMain } from 'electron'
import dailyLogDb from '../db/dailyLogModels'
import appModelDb from '../db/appModels'

export function getTodayUsageData() {
  ipcMain.handle('usageData:day', (event, time: string) => {
    const todayUsageData = dailyLogDb.getDataByTime(time)
    return todayUsageData
  })
}

export function getWeekUsageData() {
  ipcMain.handle('usageData:week', (event, timeStart, timeEnd) => {
    const todayUsageData = dailyLogDb.getDataByTimeRange(timeStart, timeEnd)
    return todayUsageData
  })
}

export function getAppInfo() {
  ipcMain.handle('getAppInfo', async (event) => {
    return appModelDb.getAllAppModel()
  })
}
