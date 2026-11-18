import { executeMethodsInOrder } from '../handle/handleFocusWin'
import logger from '../logger'
import { browserTracking } from '../browser/tracking'
import type { UsageRecord } from './usage'

class UsageCache {
  private records = new Map<string, UsageRecord>()
  private timer: NodeJS.Timeout | undefined
  add(record: UsageRecord) {
    const key = JSON.stringify([record.name, record.startTime])
    const previous = this.records.get(key)
    this.records.set(key, { ...record, duration: (previous?.duration ?? 0) + record.duration })
  }

  flush = (strict = false) => {
    try {
      browserTracking.flush()
    }
    catch (error) { logger.error('保存网站统计失败，将在下次重试', error) }
    for (const [key, record] of this.records) {
      try {
        executeMethodsInOrder(record)
        this.records.delete(key)
      }
      catch (error) { logger.error('保存统计失败，将在下次重试', error) }
    }
  }

  startSaveInterval() {
    if (!this.timer)
      this.timer = setInterval(this.flush, 15000)
  }

  stopSaveInterval() {
    clearInterval(this.timer)
    this.timer = undefined
    this.flush()
  }
}
export const cache = new UsageCache()
