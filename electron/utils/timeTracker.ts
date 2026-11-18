import { activeWindow } from 'get-windows'
import { powerMonitor } from 'electron'
import { ignoreNameList } from '../const/const'
import { getConfig } from '../config'
import logger from '../logger'
import { cache } from './activeAppCache'
import { splitInterval } from './usage'
import { isSelfApp } from './selfApp'
import { getApplicationIcon } from './appIcons'

export class TimeTracker {
  private timer?: NodeJS.Timeout
  private current?: { name: string, file: string, iconFile: string, actionDes: string, since: number }
  private pending = false
  private suspended = false
  private generation = 0

  constructor(
    private readWindow = activeWindow,
    private idleTime = () => powerMonitor.getSystemIdleTime(),
    private now = () => Date.now(),
  ) {}

  start() {
    if (this.timer)
      return
    this.suspended = false
    cache.startSaveInterval()
    this.timer = setInterval(() => void this.poll(), 1000)
    void this.poll()
  }

  checkpoint(now = this.now()) {
    if (!this.current)
      return
    // Skip long unobserved gaps caused by suspend, a delayed poll, or a clock jump.
    if (now - this.current.since <= 5000) {
      for (const segment of splitInterval(this.current.since, now)) {
        cache.add({ ...this.current, ...segment,
        })
      }
    }
    this.current.since = now
  }

  sleep() {
    this.checkpoint()
    this.current = undefined
    this.suspended = true
    this.generation++
    cache.flush()
  }

  wake() {
    this.suspended = false
  }

  clearAll() {
    clearInterval(this.timer)
    this.timer = undefined
    this.sleep()
    cache.stopSaveInterval()
  }

  private async poll() {
    if (this.pending || this.suspended)
      return
    this.pending = true
    const generation = this.generation
    try {
      const info = await this.readWindow()
      if (generation !== this.generation || !this.timer)
        return
      this.checkpoint()
      this.current = undefined
      const settings = getConfig()
      if (!info?.owner?.name || isSelfApp(info.owner) || this.idleTime() >= settings.actions.idleMinutes * 60)
        return
      const { name, path: file } = info.owner
      const ignored = [...ignoreNameList, ...settings.actions.ignoredApps].map(n => n.toLowerCase())
      if (ignored.includes(name.toLowerCase()) || ignored.includes(file.toLowerCase())
        || (/explorer\.exe$/i.test(file) && !info.title)) {
        return
      }
      let iconFile = ''
      try {
        iconFile = await getApplicationIcon(file)
      }
      catch { /* Applications without icons still count toward usage. */ }
      if (generation !== this.generation || !this.timer)
        return
      this.current = { name, file, iconFile, actionDes: info.title, since: this.now(),
      }
    }
    catch (error) {
      this.current = undefined
      logger.warn('读取活动窗口失败', error)
    }
    finally {
      this.pending = false
    }
  }
}
export default new TimeTracker()
