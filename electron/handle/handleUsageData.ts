import { app, ipcMain } from 'electron'
import dailyLogDb from '../db/dailyLogModels'
import hoursLogDb from '../db/hoursLogModels'
import appModelDb from '../db/appModels'

export function getTodayUsageData() {
  ipcMain.handle('usageData:day', (event, time: string) => {
    const todayUsageData = dailyLogDb.getDataByTime(time)
    return todayUsageData
  })
}

// 拿到一天中每小时的数据，用于图表展示
export function getHoursUsageData() {
  ipcMain.handle('usageData:hour', (event, date: string) => {
    const dailyUsageData = hoursLogDb.getDailyByDate(date)
    return dailyUsageData
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
