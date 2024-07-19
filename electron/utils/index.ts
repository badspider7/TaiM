import { Time } from '../utils/timerEvent'
import { windowTimeTracker } from '../handle/handleFocusWin'

export function startRecord() {
  console.log('app is staring')
  windowTimeTracker.start()
}
