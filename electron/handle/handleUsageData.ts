import { app, ipcMain } from 'electron'
import dailyLogDb from '../db/dailyLogModels'
import appModelDb from '../db/appModels'

export function getTodayUsageData() {
  ipcMain.handle('usageData:day', async (event, time: string) => {
    const todayUsageData = await dailyLogDb.getDataByTime(time)
    return todayUsageData
  })
}

export function getWeekUsageData() {

}

export function getAppInfo() {
  ipcMain.handle('getAppInfo', async (event) => {
    return appModelDb.getAllAppModel()
  })
}
