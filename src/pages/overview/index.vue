<script setup lang='ts'>
import { onMounted, ref } from 'vue'
import type { AppData, AppModel, DailyLogModels } from '@@/type/types'
import type { Ref } from 'vue'
import TapBar from './tabBar.vue'
import AppList from './FrequentApp.vue'
import getUsageTimeApi from '@/api/getUsageTime'
import { formatDateTime, handleTimeRangeData } from '@/utils'
import { Time } from '@/utils/timerEvent'
import { useAppDetail } from '@/hooks/useAppDetail'

const appData: Ref<AppData[]> = ref([])

onMounted(() => {
  getTodayAppData()
})

async function getTodayAppData() {
  const todayDate = formatDateTime(new Date().toLocaleString())
  const todayTimeList = await getUsageTimeApi.getDailyTime(todayDate)
  appData.value = useAppDetail(todayTimeList)
}

async function getWeekAppData() {
  const { start, end } = Time.getThisWeekDate()
  const weekData: DailyLogModels[] = await handleTimeRangeData(start, end)
  appData.value = useAppDetail(weekData)
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
      <AppList :app-data="appData" style="height:calc(100% - 145px)" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.choose-time{
  height:calc(100% - 50px);
}
</style>
