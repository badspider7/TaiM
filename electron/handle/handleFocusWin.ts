import { activeWindow } from 'get-windows'
import logger from '../logger'
import { getIcon } from '../utils'
import appModelDB from '../db/appModels'
import type { AppModel } from '../type/types'

interface bounds { x: number, y: number, width: number, height: number }

interface windowInfo {
  title: string
  platform: string
  id: number
  owner: { name: string, processId: number, path: string }
  bounds: bounds
  memoryUsage: number
  url?: string
}

// 使用时间统计
let timerId = null

// 启动定时器
function startTimer() {
  if (timerId) {
    clearInterval(timerId)
  }
  timerId = setInterval(updateTime, 1000)
}

// 停止定时器
function stopTimer() {
  if (timerId) {
    clearInterval(timerId)
    timerId = undefined
  }
}

// 更新当前活动窗口的使用时间
export async function updateTime() {
  try {
    const windowInfo: windowInfo = await activeWindow()
    if (windowInfo && windowInfo.owner && windowInfo.owner.name) {
      const appName = windowInfo.owner.name

      let currentTotalTime = 0
      const existingApp = await appModelDB.getAppModel(appName)
      if (existingApp) {
        currentTotalTime = existingApp.totalTime
        const newTotalTime = currentTotalTime + 1
        appModelDB.updateTotalTime(appName, newTotalTime)
      }
      else {
        const { path, name } = windowInfo.owner
        const iconFile = await getIcon({ path, name })
        const appQuery: AppModel = {
          name,
          alias: '',
          description: '',
          file: path,
          categoryId: 0,
          iconFile,
          totalTime: 1,
        }
        appModelDB.insertAppModel(appQuery)
      }
    }
  }
  catch (error) {
    console.log('error===')
    logger.debug('Error updating window time:', error)
  }
}

// 公开的函数来管理时间统计
export const windowTimeTracker = {
  start: startTimer,
  stop: stopTimer,
  // 可以添加其他功能，如获取总时间、重置时间等
}

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
    console.log('error===')
    logger.debug('Error updating window time:', error)
  }
}
