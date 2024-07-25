<script setup lang='ts'>
import { onMounted, ref } from 'vue'
import type { AppData, AppModel, DailyLogModels } from '@@/type/types'
import type { Ref } from 'vue'
import TapBar from './tabBar.vue'
import AppList from './FrequentApp.vue'
import getUsageTimeApi from '@/api/getUsageTime'
import { useAppInfo } from '@/store/app'

const appStore = useAppInfo()
const appData: Ref<AppData[]> = ref([])

onMounted(async () => {
  const todayDate = formatDateTime(new Date().toLocaleString())
  const todayTimeList = await getUsageTimeApi.getTodayTime(todayDate)
  const appInfo = appStore.appInfoList
  appData.value = getTodayUsageTimeInfo(todayTimeList, appInfo)
  console.log('appData===', appData)
})

function formatDateTime(dateTimeString: string) {
  return dateTimeString.replace(/^(\d{4})\/(\d{1,2})\/(\d{1,2}) (\d{2}):(\d{2}):(\d{2})$/, (match, year, month, day, hour, minute, second) => {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} 00:00:00`
  })
}

function getTodayUsageTimeInfo(TimeList: DailyLogModels[], appInfo: AppModel[]) {
  // 创建一个映射，以快速查找应用信息
  const appInfoMap = appInfo.reduce((map: Record<string | number, AppModel>, app) => {
    map[app.id!] = app
    return map
  }, {})
  const appDataList: Array<AppData> = []
  TimeList.forEach((item) => {
    let appModel = appInfoMap[item.appModelId]
    if (!appModel) {
      // 如果当前appModelId不在appInfoMap中，则尝试从appStore中获取
      const updatedAppInfo: any = appStore.getAppInfo()
      // 更新appInfoMap
      const updatedAppInfoMap = updatedAppInfo.reduce((map: Record<number, AppModel>, app: AppModel) => {
        map[app.id as number] = app
        return map
      }, {})
      // 再次尝试获取
      appModel = updatedAppInfoMap[item.appModelId]
    }

    if (appModel) {
      const tempObj: AppData = { ...appModel, totalTime: item.time, date: item.dayTime }
      appDataList.push(tempObj)
    }
    else {
      console.warn(`No app found for appModelId: ${item.appModelId}`)
    }
  })

  return appDataList
}
</script>

<template>
  <div class="overview-wrap">
    <div class="title font-middle text-lg">
      概览
    </div>
    <div class="choose-time mt-5">
      <TapBar :app-data="appData" />
      <AppList :app-data="appData" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.choose-time{
  height:calc(100% - 50px);
}
</style>
