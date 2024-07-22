import { windowTimeTracker } from '../handle/handleFocusWin'
import { Time } from '../utils/timerEvent'
import platform from '../const/getPlatform'
import { getWinIco } from './appIcon/win'

export function startRecord() {
  console.log('app is staring')
  windowTimeTracker.start()
}

export async function getIcon(app): Promise<string> {
  // 判断不同平台
  if (platform.windows()) {
    const icon = await getWinIco(app)
    return icon
  }
}
