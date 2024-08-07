export default {

  // select * from DailyLogModels where dayTime = '2024-08-06 00:00:00'
  getDailyTime: (time: string) => {
    return window.ipcRenderer.invoke('usageData:day', time)
  },

  // select * from HoursLogModels where strftime('%Y-%m-%d', hoursTime) = ?
  getPerHourTimeOneDay: (time: string) => {
    return window.ipcRenderer.invoke('usageData:hour', time)
  },

  // 拿到指定时间段的时间
  getDataInRange: (startTime: string, endTime: string) => {
    return window.ipcRenderer.invoke('usageData:range', startTime, endTime)
  },

  // select * from HoursLogModels where hoursTime = ?
  getHourData: (time: string) => {
    return window.ipcRenderer.invoke('usageData:OneHour', time)
  },

  getAllYearData: (year: string) => {
    return window.ipcRenderer.invoke('usageData:year', year)
  },
}
