<script setup lang='ts'>
import { onMounted, ref, watch } from 'vue'
import type { AppData, DailyLogModels } from '@@/type/types'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Time } from '@/utils/timerEvent'
import getUsageTimeApi from '@/api/getUsageTime'
import { handleTimeRangeData } from '@/utils'
import CardGroup from '@/components/CardGroup.vue'

// update file
const props = defineProps({
  appData: {
    type: Array as () => AppData[],
    default: () => [],
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'tabChange', tab: string): void
}>()

const currentTab = ref('today')

const currentAppInfo = ref<AppData[]>([])
const lastAppInfo = ref<DailyLogModels[]>([])

watch(() => props.appData, (newVal) => {
  currentAppInfo.value = newVal
})

onMounted(async () => {
  await getYesterdayData()
})

async function getYesterdayData() {
  const time = Time.getYesterdayDate()
  lastAppInfo.value = await getUsageTimeApi.getDailyTime(time)
}

async function getLastWeekData() {
  const { start, end } = Time.getLastWeekDate()
  lastAppInfo.value = await handleTimeRangeData(start, end)
}

function tabChange(activeTab: string) {
  currentTab.value = activeTab
  emit('tabChange', activeTab)
  if (activeTab === 'today') {
    getYesterdayData()
  }
  else if (activeTab === 'week') {
    getLastWeekData()
  }
}
</script>

<template>
  <Tabs default-value="today">
    <TabsList>
      <TabsTrigger value="today" @click="tabChange('today')">
        今日
      </TabsTrigger>
      <TabsTrigger value="week" @click="tabChange('week')">
        本周
      </TabsTrigger>
    </TabsList>
    <CardGroup :current-app-info="currentAppInfo" :last-app-info="lastAppInfo" />
  </Tabs>
</template>
