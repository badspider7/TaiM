export default {
  getDailyTime: (time: string) => {
    return window.ipcRenderer.invoke('usageData:day', time)
  },

  getWeekTime: (startTime: string, endTime: string) => {
    return window.ipcRenderer.invoke('usageData:week', startTime, endTime)
  },
}
