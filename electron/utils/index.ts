import { powerMonitor } from 'electron'
import tracker from './timeTracker'

export function startRecord() {
  tracker.start()
}
export function clearAllTimer() {
  tracker.clearAll()
}
export function isComputerSleep() {
  powerMonitor.on('suspend', () => tracker.sleep())
  powerMonitor.on('resume', () => tracker.wake())
  powerMonitor.on('lock-screen', () => tracker.sleep())
  powerMonitor.on('unlock-screen', () => tracker.wake())
}
