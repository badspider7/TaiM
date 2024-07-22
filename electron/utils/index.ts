import { windowTimeTracker } from '../handle/handleFocusWin'
import { Time } from '../utils/timerEvent'
import platform from '../const/getPlatform'
import { getWinIco } from './appIcon/win'

export function startRecord() {
  console.log('app is staring')
  windowTimeTracker.start()
}

// export function getIcon(appPath: string) {
//   // 判断不同平台
//   if (platform.windows()) {
//     fileDisplay(appPath)
//   }
// }

export function getIcon(app) {
  // 判断不同平台
  if (platform.windows()) {
    getWinIco(app)
  }
}
