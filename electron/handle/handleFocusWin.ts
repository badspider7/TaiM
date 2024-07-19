import { activeWindow } from 'get-windows'

// 配置选项
interface Config {
  debug: boolean // 是否启用调试日志
}

const config: Config = {
  debug: true, // 可以根据需要设置为true来启用调试日志
}

// 使用时间统计
const timeMap = new Map<string, number>()
let timerId = null

// 启动定时器
function startTimer() {
  if (timerId) {
    clearInterval(timerId)
  }
  timerId = setInterval(updateTime, 1000)
}

// 停止定时器
function stopTimer() {
  if (timerId) {
    clearInterval(timerId)
    timerId = undefined
  }
}

// 更新当前活动窗口的使用时间
async function updateTime() {
  try {
    const windowInfo = await activeWindow()
    if (windowInfo && windowInfo.owner && windowInfo.owner.name) {
      const appName = windowInfo.owner.name
      if (timeMap.has(appName)) {
        timeMap.set(appName, timeMap.get(appName) + 1)
      }
      else {
        timeMap.set(appName, 1)
      }
      if (config.debug) {
        console.log(`Current active window: ${appName}, Total time: ${timeMap.get(appName)}s`)
      }
    }
  }
  catch (error) {
    if (config.debug) {
      console.error('Error updating window time:', error)
    }
  }
}

// 公开的函数来管理时间统计
export const windowTimeTracker = {
  start: startTimer,
  stop: stopTimer,
  // 可以添加其他功能，如获取总时间、重置时间等
}

// 示例：如何使用
// windowTimeTracker.start();
// // ... 在应用的某个点停止时间统计
// windowTimeTracker.stop();
