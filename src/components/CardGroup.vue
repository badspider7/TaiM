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
const appCountDelta = computed(() => props.lastAppInfo.length
  ? currentAppCount.value - new Set(props.lastAppInfo.map(a => a.appModelId)).size
  : undefined)
const mostTimeUsageApp = computed(() => {
  const totals = new Map<number, AppData>()
  for (const a of props.currentAppInfo) {
    totals.set(a.id!, { ...a, totalTime: (totals.get(a.id!)?.totalTime ?? 0) + a.totalTime,
    })
  }
  return [...totals.values()].sort((a, b) => b.totalTime - a.totalTime)[0]
})
const timeDelta = computed(() => lastTotalTime.value > 0
  ? Math.round(currentTotalTime.value - lastTotalTime.value)
  : undefined)
const mostUsedAppName = computed(() => mostTimeUsageApp.value?.alias || mostTimeUsageApp.value?.name || '')
</script>

<template>
  <div class="overview-cards">
    <Card title="累计使用时间" :data="Time.toString(currentTotalTime, true)" :previous-delta="timeDelta" :previous-label="Time.toString(Math.abs(timeDelta ?? 0), true)">
      <template #iconSlot>
        <AccessTime20Regular class="w-5 h-5" />
      </template>
    </Card>
    <Card title="使用应用数" :data="currentAppCount" unit="个" :previous-delta="appCountDelta">
      <template #iconSlot>
        <StoreMicrosoft16Regular class="w-5 h-5" />
      </template>
    </Card>
    <Card title="使用最久的应用" :data="mostTimeUsageApp ? Time.toString(mostTimeUsageApp.totalTime, true) : '—'">
      <template #iconSlot>
        <ArrowTrendingLines20Regular class="w-5 h-5" />
      </template>
      <template #app>
        <span v-if="mostUsedAppName" class="flex min-w-0 items-center gap-1 text-sm text-muted-foreground" :title="mostUsedAppName">
          <img v-if="mostTimeUsageApp?.iconFile" :src="mostTimeUsageApp.iconFile" alt="" class="w-5 h-5 shrink-0">
          <span class="truncate">{{ mostUsedAppName }}</span>
        </span>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10.5rem), 1fr));
  gap: 12px;
  margin-top: 16px;
}
</style>
