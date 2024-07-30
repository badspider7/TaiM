import { activeWindow } from 'get-windows'
import { powerMonitor } from 'electron'
import { getIcon } from '../utils'
import { ignoreNameList } from '../const/const'
import logger from '../logger'
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

const SLEEP_TIME = 60 * 5// 5 分钟

class TimeTracker {
  private currentSession?: Session
  private timerId: NodeJS.Timeout | null = null
  private isSleeping: boolean = false
  private checkTimeId: NodeJS.Timeout | null = null

  start() {
    if (this.timerId)
      return
    this.timerId = setInterval(this.checkActiveWindow.bind(this), 1000)
    if (this.checkTimeId) {
      clearInterval(this.checkTimeId)
      this.checkTimeId = null
    }
    this.checkTimeId = setInterval(this.checkIsActive.bind(this), 1000)
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
      this.endCurrentSession()
    }
  }

  sleep() {
    logger.info('进入休眠')
    this.isSleeping = true
    this.stop()
    cache.stopSaveInterval()
  }

  wake() {
    logger.info('唤醒')
    this.isSleeping = false
    cache.startSaveInterval()
    this.start()
  }

  checkIsActive() {
    // 系统空闲时间
    const idleTime = powerMonitor.getSystemIdleTime()

    // 如果是活跃的话就唤醒
    if (this.isSleeping && idleTime === 0) {
      this.wake()
    }

    // 超过5 分钟没有操作就进入休眠
    if (!this.isSleeping && idleTime > SLEEP_TIME) {
      this.sleep()
    }
  }

  clearAll() {
    this.stop()
    this.isSleeping = false
    clearInterval(this.checkTimeId)
    this.checkTimeId = null
  }

  private async checkActiveWindow() {
    const windowInfo: windowInfo = await activeWindow()
    if (!windowInfo || !windowInfo.owner || !windowInfo.owner.name)
      return

    this.endCurrentSession()
    this.startNewSession(windowInfo)
  }

  private async startNewSession(windowInfo: windowInfo) {
    const { name, path } = windowInfo.owner
    // TODO: 优化：不必每次都去拿icon，如果已经拿过的可以直接拿本地的icon文件
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
    // 如果是切换到桌面的话就不记录（桌面也是windows 资源管理器 中的一部分）
    // TODO：要适配多语言或者多平台的话 ，这个会出问题
    if (name === 'Windows 资源管理器' && !actionDes || ignoreNameList.includes(name)) {
      logger.info('忽略记录', name)
    }
    else {
      const endFTime = getCurrentFTime()
      const endTime = new Date()

      let duration = (endTime.getTime() - startTime.getTime()) / 1000 // 转换为秒
      duration = this.isSleeping ? -SLEEP_TIME : Number(duration.toFixed(2))// 保留两位小数
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
      // 存在内存中
      if (cache.get(usageRecord.name)) {
        const lastDuration = (cache.get(usageRecord.name) as usageRecord).duration
        const duration = Number((lastDuration + usageRecord.duration).toFixed(2))
        usageRecord.duration = duration
        cache.set(usageRecord.name, usageRecord)
      }
      else {
        // 不在内存中，新加入进来的
        cache.set(usageRecord.name, usageRecord)
      }
      this.currentSession = null
    }
  }
}

export default new TimeTracker()
