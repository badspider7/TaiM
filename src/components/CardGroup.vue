<script setup lang="ts">
import { computed } from 'vue'
import { AccessTime20Regular, ArrowTrendingLines20Regular, StoreMicrosoft16Regular } from '@vicons/fluent'
import type { AppData, DailyLogModels } from '@@/type/types'
import Card from '@/components/Card.vue'
import { Time } from '@/utils/timerEvent'

const props = defineProps<{ currentAppInfo: AppData[], lastAppInfo: DailyLogModels[] }>()
const currentTotalTime = computed(() => props.currentAppInfo.reduce((s, a) => s + a.totalTime, 0))
const lastTotalTime = computed(() => props.lastAppInfo.reduce((s, a) => s + a.time, 0))
const currentAppCount = computed(() => new Set(props.currentAppInfo.map(a => a.id)).size)
const AppCountDelta = computed(() => currentAppCount.value - new Set(props.lastAppInfo.map(a => a.appModelId)).size)
const mostTimeUsageApp = computed(() => {
  const totals = new Map<number, AppData>()
  for (const a of props.currentAppInfo) {
    totals.set(a.id!, { ...a, totalTime: (totals.get(a.id!)?.totalTime ?? 0) + a.totalTime,
    })
  }
  return [...totals.values()].sort((a, b) => b.totalTime - a.totalTime)[0]
})
const TimeDelta = computed(() => lastTotalTime.value > 0 ? Number(((currentTotalTime.value / lastTotalTime.value - 1) * 100).toFixed(2)) : currentTotalTime.value > 0 ? 100 : 0)
function formatTime(seconds = 0) {
  return Time.toHoursString(seconds)
}
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
