import appModelDB from '../db/appModels'
import hoursLogModelDB from '../db/hoursLogModels'
import dailyLogModelDB from '../db/dailyLogModels'
import type { AppModel } from '../type/types'
import logger from '../logger'

export async function handleFocusWin(appInfo) {
  try {
    if (appInfo && appInfo.name) {
      const appName = appInfo.name
      const duration = Math.round(appInfo.duration)
      const existingApp = await appModelDB.getAppModel(appName)
      if (existingApp) {
        const currentTotalTime = existingApp.totalTime
        const newTotalTime = currentTotalTime + duration
        appModelDB.updateTotalTime(appName, newTotalTime)
      }
      else {
        const { file, name, iconFile, actionDes } = appInfo
        const appQuery: AppModel = {
          name,
          alias: '',
          description: actionDes,
          file,
          categoryId: 0,
          iconFile,
          totalTime: duration,
        }
        appModelDB.insertAppModel(appQuery)
      }
    }
  }
  catch (error) {
    logger.debug('Error updating total time:', error)
  }
}

export async function handleHoursLog(appInfo) {
  try {
    if (appInfo && appInfo.name) {
      const appModelID = await appModelDB.getAppModelIdByName(appInfo.name)
      const hours = new Date(appInfo.startTime).getHours()

      const day = appInfo.startTime.split(' ')[0]
      const time = `${day} ${hours}:00:00`
      // 判断 这个时间段的 app 是否已经存在
      const res = hoursLogModelDB.getData(time, appModelID)
      if (!res) {
        const hoursLogQuery = {
          appModelId: appModelID,
          hoursTime: time,
          time: Math.round(appInfo.duration),
        }
        hoursLogModelDB.insertData(hoursLogQuery)
      }
      else {
        // 存在就把 之前的time 加上
        const hourTotalTime = res.time + Math.round(appInfo.duration)
        hoursLogModelDB.updateData(hourTotalTime, res.id)
      }
    }
  }
  catch (error) {
    logger.debug('Error updating hours time:', error)
  }
}

export async function handleDailyLog(appInfo) {
  try {
    if (appInfo && appInfo.name) {
      const appModelID = await appModelDB.getAppModelIdByName(appInfo.name)
      const date = appInfo.startTime.split(' ')[0]
      const dayTime = `${date} 00:00:00`
      const res = dailyLogModelDB.getSingleData(dayTime, appModelID)
      const hoursList = dailyLogModelDB.getDataFromHoursDB(date, appModelID)
      if (!res) {
        // 插入一条新数据
        const dayLogQuery = { appModelId: appModelID, dayTime, time: hoursList[0].dayTime }
        dailyLogModelDB.insertData(dayLogQuery)
      }
      else {
        // 更新时间
        dailyLogModelDB.updateTime(hoursList[0].dayTime, res.id)
      }
    }
  }
  catch (error) {
    logger.debug('Error updating daily time:', error)
  }
}
