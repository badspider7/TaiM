<script setup lang='ts'>
import { computed, ref, watch } from 'vue'
import { AccessTime20Regular, ArrowTrendingLines20Regular, StoreMicrosoft16Regular } from '@vicons/fluent'
import type { AppData, DailyLogModels } from '@@/type/types'
import Card from '@/components/Card.vue'
import { Time } from '@/utils/timerEvent'

const props = defineProps(['currentAppInfo', 'lastAppInfo'])

function formatTime(second: number) {
  return Time.toHoursString(second)
}

// 当前的累计使用时间
const currentTotalTime = ref(0)
const currentAppCount = ref(0)
const mostTimeUsageApp = ref<AppData>({} as AppData)

// 上次的累计使用时间
const lastTotalTime = ref(0)
const lastAppCount = ref(0)

watch(() => props.currentAppInfo, (newVal) => {
  currentTotalTime.value = newVal.reduce((acc: number, cur: AppData) => acc + cur.totalTime, 0)
  currentAppCount.value = newVal.length
  const tempAppInfo = newVal.reduce((acc: Record<number, AppData>, item: AppData) => {
    if (acc[item.id!]) {
      acc[item.id!].totalTime += item.totalTime
    }
    else {
      acc[item.id!] = { ...item }
    }
    return acc
  }, {})
  mostTimeUsageApp.value = (Object.values(tempAppInfo) as AppData[]).reduce((acc: AppData, cur: AppData) => cur.totalTime > acc.totalTime ? cur : acc, newVal[0])
})

watch(() => props.lastAppInfo, (newVal) => {
  lastTotalTime.value = newVal.reduce((acc: number, cur: DailyLogModels) => acc + cur.time, 0)
  lastAppCount.value = newVal.length
})

const AppCountDelta = computed(() => {
  return currentAppCount.value - lastAppCount.value
})

const TimeDelta = computed(() => {
  if (lastTotalTime.value <= 0 && currentTotalTime.value > 0) {
    return 100
  }
  if (currentTotalTime.value <= 0) {
    return 0
  }

  const todayHour = Number((currentTotalTime.value / 3600).toFixed(2))
  const lastHour = Number((lastTotalTime.value / 3600).toFixed(2))

  let delta = 1 - Number((todayHour / lastHour).toFixed(2))
  delta = delta >= 1 ? delta : -delta
  return Number((delta * 100).toFixed(2))
})
</script>

<template>
  <div class="flex flex-row justify-between mt-4 gap-[5%]">
    <Card title="累计使用时间" :data="formatTime(currentTotalTime)" unit="小时" :previous-delta="TimeDelta" previous-unit="%">
      <template #iconSlot>
        <AccessTime20Regular class="w-5 h-5" />
      </template>
    </Card>
    <Card title="应用量" :data="currentAppCount" unit="个" :previous-delta="AppCountDelta">
      <template #iconSlot>
        <StoreMicrosoft16Regular class="w-5 h-5" />
      </template>
    </Card>
    <Card title="最长使用" :data="formatTime(mostTimeUsageApp?.totalTime)" unit="小时" :show-app-icon="true">
      <template #iconSlot>
        <ArrowTrendingLines20Regular class="w-5 h-5" />
      </template>
      <template #appIcon>
        <img v-show="mostTimeUsageApp?.iconFile" :src="mostTimeUsageApp?.iconFile" class="w-5 h-5">
      </template>
    </Card>
  </div>
</template>
