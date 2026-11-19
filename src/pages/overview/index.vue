<script setup lang='ts'>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { AppData, DailyLogModels } from '@@/type/types'
import AppList from './FrequentApp.vue'
import CardGroup from '@/components/CardGroup.vue'
import PageHeading from '@/components/layout/PageHeading.vue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import getUsageTimeApi from '@/api/getUsageTime'
import { handleTimeRangeData } from '@/utils'
import { Time, formatDate } from '@/utils/timerEvent'
import { useAppDetail } from '@/hooks/useAppDetail'

const appData = ref<AppData[]>([])
const previousData = ref<DailyLogModels[]>([])

const selectedTab = ref('today')
const loadingPeriod = ref(true)
let requestId = 0
let refreshTimer: ReturnType<typeof setInterval>
const error = ref('')
async function refresh() {
  const request = ++requestId
  try {
    error.value = ''
    const today = selectedTab.value === 'today'
    const [data, previous] = await Promise.all([
      today ? getTodayAppData() : getWeekAppData(),
      getPreviousData(today).catch(() => []),
    ])
    if (request === requestId) {
      appData.value = data
      previousData.value = previous
    }
  }
  catch (e) {
    if (request === requestId)
      error.value = String(e)
  }
  finally {
    if (request === requestId)
      loadingPeriod.value = false
  }
}
watch(selectedTab, () => {
  loadingPeriod.value = true
  appData.value = []
  previousData.value = []
  void refresh()
})

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

async function getPreviousData(today: boolean) {
  if (today)
    return await getUsageTimeApi.getDailyTime(Time.getYesterdayDate())
  const { start, end } = Time.getLastWeekDate()
  return await handleTimeRangeData(start, end)
}
</script>

<template>
  <div>
    <PageHeading title="概览">
      <template #actions>
        <router-link to="/statistics" class="action-button">
          查看使用趋势
        </router-link>
      </template>
    </PageHeading>
    <p v-if="error" role="alert" class="error-message">
      读取使用记录失败。<Button variant="outline" size="sm" class="ml-2" @click="refresh">
        重试
      </Button>
    </p>
    <div>
      <Tabs v-model="selectedTab">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="today">
              今日
            </TabsTrigger>
            <TabsTrigger value="week">
              本周
            </TabsTrigger>
          </TabsList>
          <p class="text-sm text-muted-foreground">
            {{ selectedTab === 'today' ? '对比昨日全天' : '对比上周整周' }}
          </p>
        </div>
      </Tabs>
      <p v-if="loadingPeriod" class="surface p-6 mt-4 text-muted-foreground" role="status">
        正在加载使用记录…
      </p>
      <template v-else-if="!error || appData.length">
        <CardGroup :current-app-info="appData" :last-app-info="previousData" />
        <div class="surface p-4 mt-4">
          <AppList :app-data="appData" />
        </div>
      </template>
    </div>
  </div>
</template>
