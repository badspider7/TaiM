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
