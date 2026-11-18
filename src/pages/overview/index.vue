<script setup lang='ts'>
import { onMounted, onUnmounted, ref } from 'vue'
import type { AppData, DailyLogModels } from '@@/type/types'
import type { Ref } from 'vue'
import Tab from './Tab.vue'
import AppList from './FrequentApp.vue'
import getUsageTimeApi from '@/api/getUsageTime'
import { formatDateTime, handleTimeRangeData } from '@/utils'
import { Time, formatDate } from '@/utils/timerEvent'
import { useAppDetail } from '@/hooks/useAppDetail'

const appData: Ref<AppData[]> = ref([])

const selectedTab = ref('today')
let requestId = 0
let refreshTimer: ReturnType<typeof setInterval>
const error = ref('')
async function refresh() {
  const request = ++requestId
  try {
    error.value = ''
    const data = selectedTab.value === 'today' ? await getTodayAppData() : await getWeekAppData()
    if (request === requestId)
      appData.value = data
  }
  catch (e) {
    if (request === requestId)
      error.value = String(e)
  }
}
onMounted(() => {
  void refresh()
  refreshTimer = setInterval(() => void refresh(), 15000)
  window.addEventListener('focus', refresh)
})
onUnmounted(() => {
  clearInterval(refreshTimer)
  window.removeEventListener('focus', refresh)
})

async function getTodayAppData() {
  const todayDate = formatDate(new Date())
  const todayTimeList = await getUsageTimeApi.getDailyTime(todayDate)
  return await useAppDetail(todayTimeList)
}

async function getWeekAppData() {
  const { start, end } = Time.getThisWeekDate()
  const weekData: DailyLogModels[] = await handleTimeRangeData(start, end)
  return await useAppDetail(weekData)
}

function tabChange(activeTab: string) {
  selectedTab.value = activeTab
  void refresh()
}
</script>

<template>
  <div class="overview-wrap">
    <div class="title font-middle text-lg">
      概览
    </div>
    <p v-if="error" role="alert" class="error-message">
      {{ error }}
    </p>
    <div class="choose-time mt-5">
      <Tab :app-data="appData" @tab-change="tabChange" />
      <AppList :app-data="appData" style="height:calc(100% - 145px)" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.choose-time{
  height:calc(100% - 50px);
}
</style>
