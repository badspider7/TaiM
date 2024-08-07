export default {

  // select * from DailyLogModels where dayTime = '2024-08-06 00:00:00'
  getDailyTime: (time: string) => {
    return window.ipcRenderer.invoke('usageData:day', time)
  },

  // select * from HoursLogModels where strftime('%Y-%m-%d', hoursTime) = ?
  getPerHourTimeOneDay: (time: string) => {
    return window.ipcRenderer.invoke('usageData:hour', time)
  },

  // 拿到规定时间段的每日使用时间
  getWeekTime: (startTime: string, endTime: string) => {
    return window.ipcRenderer.invoke('usageData:week', startTime, endTime)
  },

  // select * from HoursLogModels where hoursTime = ?
  getHourData: (time: string) => {
    return window.ipcRenderer.invoke('usageData:OneHour', time)
  },
}
