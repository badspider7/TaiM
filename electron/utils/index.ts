import type { BrowserWindow } from 'electron'
import { powerMonitor } from 'electron'
import platform from '../const/getPlatform'
import TimerListener from './timeTracker'
import { getWinIco } from './appIcon/win'
import { cache } from './activeAppCache'

export function startRecord() {
  TimerListener.start()
}

export async function getIcon(app): Promise<string> {
  // 判断不同平台
  if (platform.windows()) {
    const icon = await getWinIco(app)
    return icon
  }
}

export function clearAllTimer() {
  TimerListener.clearAll()
  cache.stopSaveInterval()
}

export function isComputerSleep(win: BrowserWindow) {
  powerMonitor.on('suspend', () => {
    TimerListener.sleep()
    console.log('系统即将进入休眠状态')
  })

  powerMonitor.on('resume', () => {
    TimerListener.wake()
    console.log('系统已从休眠状态恢复')
  })
}
