import { windowTimeTracker } from '../handle/handleFocusWin'
import { Time } from '../utils/timerEvent'
import platform from '../const/getPlatform'
import getFileIcon from './getWinIcon'

export function startRecord() {
  console.log('app is staring')
  windowTimeTracker.start()
}

export function getIcon() {
  // 判断不同平台
  if (platform.windows()) {
    getFileIcon()
  }
}
