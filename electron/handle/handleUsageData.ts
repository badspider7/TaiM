import { ipcMain } from 'electron'
import dailyLogDb from '../db/dailyLogModels'
import hoursLogDb from '../db/hoursLogModels'
import appModelDb from '../db/appModels'
import { flushUsage } from './handleSettings'

export function getTodayUsageData() {
  ipcMain.handle('usageData:day', (event, time: string) => {
    flushUsage()
    const todayUsageData = dailyLogDb.getDataByTime(time)
    return todayUsageData
  })
}

// 拿到一天中每小时的数据，用于图表展示
export function getHoursUsageData() {
  ipcMain.handle('usageData:hour', (event, date: string) => {
    flushUsage()
    const dailyUsageData = hoursLogDb.getDailyByDate(date)
    return dailyUsageData
  })
}

export function getOneHourUsageData() {
  ipcMain.handle('usageData:OneHour', (event, date: string) => {
    flushUsage()
    const dailyUsageData = hoursLogDb.getHourData(date)
    return dailyUsageData
  })
}

export function getDataInRange() {
  ipcMain.handle('usageData:range', (event, timeStart, timeEnd) => {
    flushUsage()
    const todayUsageData = dailyLogDb.getDataByTimeRange(timeStart, timeEnd)
    return todayUsageData
  })
}

export function getAllYearData() {
  ipcMain.handle('usageData:year', (event, year) => {
    flushUsage()
    const dailyUsageData = dailyLogDb.getAllYearData(year)
    return dailyUsageData
  })
}

export function getAppInfo() {
  ipcMain.handle('getAppInfo', async (event) => {
    flushUsage()
    return appModelDb.getAllAppModel()
  })
}

export function handleUsageData() {
  getTodayUsageData()
  getHoursUsageData()
  getOneHourUsageData()
  getDataInRange()
  getAllYearData()
  getAppInfo()
}
