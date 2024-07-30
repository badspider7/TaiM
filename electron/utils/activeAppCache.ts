import { executeMethodsInOrder } from '../handle/handleFocusWin'
import logger from '../logger'

interface CacheItem<T> {
  value: T
}

class ExpiringCache<K, T> {
  private cache: Map<K, CacheItem<T>> = new Map()
  private readonly saveInterval: number // 定时保存的时间间隔，以毫秒为单位
  private saveTimerId: NodeJS.Timeout | null = null // 定时器的ID，用于取消定时器

  constructor(saveInterval: number) {
    this.saveInterval = saveInterval
    // 立即启动定时器以开始监控
    this.startSaveInterval()
  }

  set(key: K, value: T): void {
    this.cache.set(key, { value })
  }

  get(key: K): T | undefined {
    const item = this.cache.get(key)
    return item ? item.value : undefined
  }

  delete(key: K): void {
    this.cache.delete(key)
  }

  // 定时保存数据到数据库的方法
  private saveDataToDatabase = () => {
    this.cache.forEach((item, key) => {
      // 统计 totalTime
      executeMethodsInOrder(item.value)
    })
    this.clearCache()
  }

  // 启动定时保存间隔
  startSaveInterval = () => {
    if (this.saveTimerId !== null) {
      clearInterval(this.saveTimerId)
      this.clearCache()
    }
    this.saveTimerId = setInterval(this.saveDataToDatabase, this.saveInterval)
  }

  // 停止定时保存间隔
  stopSaveInterval = () => {
    if (this.saveTimerId !== null) {
      clearInterval(this.saveTimerId)
      this.saveTimerId = null
      this.saveDataToDatabase()
      this.clearCache()
    }
  }

  // 清理整个缓存
  clearCache = () => {
    this.cache.clear()
  }
}

export const cache = new ExpiringCache(1000 * 60) // 每1分钟把内存缓存数据存入到数据库
