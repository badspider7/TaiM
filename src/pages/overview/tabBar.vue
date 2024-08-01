<script setup lang='ts'>
import { computed, onMounted, ref, watch } from 'vue'
import { AccessTime20Regular, ArrowTrendingLines20Regular, StoreMicrosoft16Regular } from '@vicons/fluent'
import type { AppData, DailyLogModels } from '@@/type/types'
import Card from './Card.vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Time } from '@/utils/timerEvent'
import getUsageTimeApi from '@/api/getUsageTime'
import { handleTimeRangeData } from '@/utils'

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
const totalTime = ref(0)
const totalApps = ref(0)
const longestApp = ref<AppData>({} as AppData)

watch(() => props.appData, (newVal) => {
  totalTime.value = newVal.reduce((acc, cur) => acc + cur.totalTime, 0)
  totalApps.value = newVal.length
  longestApp.value = newVal.reduce((acc, cur) => cur.totalTime > acc.totalTime ? cur : acc, newVal[0])
})

const yesterdayAppInfo = ref<DailyLogModels[]>([])
const yesterdayTotalTime = computed(() => yesterdayAppInfo.value.reduce((acc, cur) => acc + cur.time, 0))
const yesterdayTotalApps = computed(() => yesterdayAppInfo.value.length)

const lastWeekAppInfo = ref<DailyLogModels[]>([])
const lastWeekTotalTime = computed(() => lastWeekAppInfo.value.reduce((acc, cur) => acc + cur.time, 0))
const lastWeekTotalApps = computed(() => lastWeekAppInfo.value.length)

const lastAppCount = ref(0)
const lastTotalTime = ref(0)

onMounted(async () => {
  await getYesterdayData()
})

async function getYesterdayData() {
  const time = Time.getYesterdayDate()
  yesterdayAppInfo.value = await getUsageTimeApi.getDailyTime(time)
  lastAppCount.value = yesterdayTotalApps.value
  lastTotalTime.value = yesterdayTotalTime.value
}

async function getLastWeekData() {
  const { start, end } = Time.getLastWeekDate()
  lastWeekAppInfo.value = await handleTimeRangeData(start, end)
  lastAppCount.value = lastWeekTotalApps.value
  lastTotalTime.value = lastWeekTotalTime.value
}

function formatTime(second: number) {
  return Time.toHoursString(second)
}

const AppCountDelta = computed(() => totalApps.value - lastAppCount.value)

const TimeDelta = computed(() => {
  if (lastTotalTime.value <= 0) {
    return 100
  }
  const todayHour = Number((totalTime.value / 3600).toFixed(2))
  const lastHour = Number((lastTotalTime.value / 3600).toFixed(2))
  let delta = 1 - Number((todayHour / lastHour).toFixed(2))
  delta = delta >= 1 ? delta : -delta
  return Number((delta * 100).toFixed(2))
})

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
    <div class="flex flex-row justify-between mt-4">
      <Card title="累计使用时间" :data="formatTime(totalTime)" unit="小时" :previous-delta="TimeDelta" previous-unit="%">
        <template #iconSlot>
          <AccessTime20Regular class="w-5 h-5" />
        </template>
      </Card>
      <Card title="应用量" :data="totalApps" unit="个" :previous-delta="AppCountDelta">
        <template #iconSlot>
          <StoreMicrosoft16Regular class="w-5 h-5" />
        </template>
      </Card>
      <Card title="最长使用" :data="formatTime(longestApp?.totalTime)" unit="小时" :show-app-icon="true">
        <template #iconSlot>
          <ArrowTrendingLines20Regular class="w-5 h-5" />
        </template>
        <template #appIcon>
          <img v-show="longestApp?.iconFile" :src="longestApp?.iconFile" class="w-5 h-5">
        </template>
      </Card>
    </div>
  </Tabs>
</template>
