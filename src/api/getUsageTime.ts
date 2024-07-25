export default {
  getTodayTime: (time: string) => {
    return window.ipcRenderer.invoke('usageData:day', time)
  },
}
