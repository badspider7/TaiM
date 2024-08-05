export default {
  getDailyTime: (time: string) => {
    return window.ipcRenderer.invoke('usageData:day', time)
  },

  getPerHourTimeOneDay: (time: string) => {
    return window.ipcRenderer.invoke('usageData:hour', time)
  },

  getWeekTime: (startTime: string, endTime: string) => {
    return window.ipcRenderer.invoke('usageData:week', startTime, endTime)
  },

  getHourData: (time: string) => {
    return window.ipcRenderer.invoke('usageData:OneHour', time)
  },
}
