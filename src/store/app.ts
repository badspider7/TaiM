import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Ref } from 'vue'
import type { AppModel } from '../../electron/type/types'

type AppInfoList = Ref<AppModel[]>

export const useAppInfo = defineStore('appInfo', () => {
  const appInfoList: AppInfoList = ref([])

  async function getAppInfo() {
    appInfoList.value = await window.ipcRenderer.invoke('getAppInfo')
    return appInfoList
  }
  return { appInfoList, getAppInfo }
})
