<script setup lang='ts'>
import { onMounted, ref } from 'vue'
import type { AppData, AppModel, DailyLogModels } from '@@/type/types'
import type { Ref } from 'vue'
import TapBar from './tabBar.vue'
import AppList from './FrequentApp.vue'
import getUsageTimeApi from '@/api/getUsageTime'
import { useAppInfo } from '@/store/app'
import { formatDateTime, handleTimeRangeData } from '@/utils'
import { Time } from '@/utils/timerEvent'

const appStore = useAppInfo()
const appData: Ref<AppData[]> = ref([])
const appInfo = appStore.appInfoList

onMounted(() => {
  getTodayAppData()
})

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

async function getTodayAppData() {
  const todayDate = formatDateTime(new Date().toLocaleString())
  const todayTimeList = await getUsageTimeApi.getDailyTime(todayDate)
  appData.value = getTodayUsageTimeInfo(todayTimeList, appInfo)
}

async function getWeekAppData() {
  const { start, end } = Time.getThisWeekDate()
  const weekData: DailyLogModels[] = await handleTimeRangeData(start, end)
  appData.value = getTodayUsageTimeInfo(weekData, appInfo)
  console.log(' appData.value', appData.value)
}

function tabChange(activeTab: string) {
  if (activeTab === 'today') {
    getTodayAppData()
  }
  else if (activeTab === 'week') {
    getWeekAppData()
  }
}
</script>

<template>
  <div class="overview-wrap">
    <div class="title font-middle text-lg">
      概览
    </div>
    <div class="choose-time mt-5">
      <TapBar :app-data="appData" @tab-change="tabChange" />
      <AppList :app-data="appData" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.choose-time{
  height:calc(100% - 50px);
}
</style>
