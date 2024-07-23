// import Database from '../db/Database'
import { activeWindow } from 'get-windows'
import { getIcon } from '../utils'
import { cache } from './activeAppCache'

interface Session {
  name: string
  startFTime: string
  startTime: Date
  file: string
  iconFile: string
  actionDes: string
}

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

interface usageRecord {
  name: string
  file: string
  iconFile: string
  actionDes: string
  startTime: string
  endTime: string
  duration: number
}

function getCurrentFTime() {
  //  yyyy-mm-dd hh:mm:ss
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hour = now.getHours().toString().padStart(2, '0')
  const minute = now.getMinutes().toString().padStart(2, '0')
  const second = now.getSeconds().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

class TimeTracker {
  private currentSession?: Session
  private timerId: NodeJS.Timeout | null = null

  start() {
    if (this.timerId)
      return
    this.timerId = setInterval(this.checkActiveWindow.bind(this), 1000)
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
      this.endCurrentSession()
    }
  }

  private async checkActiveWindow() {
    const windowInfo: windowInfo = await activeWindow()
    if (!windowInfo || !windowInfo.owner || !windowInfo.owner.name)
      return

    //  || this.currentSession.name !== windowInfo.owner.name
    // if (!this.currentSession) {
    this.endCurrentSession()
    this.startNewSession(windowInfo)
    // }
  }

  private async startNewSession(windowInfo: windowInfo) {
    const { name, path } = windowInfo.owner
    const iconFile = await getIcon({ path, name })
    this.currentSession = {
      name,
      startFTime: getCurrentFTime(),
      startTime: new Date(),
      file: path,
      iconFile,
      actionDes: windowInfo.title,
    }
  }

  private endCurrentSession() {
    if (!this.currentSession)
      return

    const { name, startTime, startFTime, file, iconFile, actionDes } = this.currentSession
    const endFTime = getCurrentFTime()
    const endTime = new Date()

    let duration = (endTime.getTime() - startTime.getTime()) / 1000 // 转换为秒
    duration = Number(duration.toFixed(2))// 保留两位小数
    // 创建并保存使用时间记录到内存缓存中去
    const usageRecord: usageRecord = {
      name,
      file,
      iconFile,
      actionDes,
      startTime: startFTime,
      endTime: endFTime,
      duration,
    }

    if (cache.get(usageRecord.name)) {
      const lastDuration = (cache.get(usageRecord.name) as usageRecord).duration
      const duration = Number((lastDuration + usageRecord.duration).toFixed(2))
      cache.set(usageRecord.name, { ...usageRecord, duration })
    }
    else {
      cache.set(usageRecord.name, usageRecord)
    }
    this.currentSession = undefined
    // console.log(cache.get(usageRecord.name))
  }
}

export default new TimeTracker()
