<script setup lang="ts">
import { computed } from 'vue'
import type { AppData } from '@@/type/types'
import AppUsageRow from '@/components/AppUsageRow.vue'
import NoData from '@/components/NoData.vue'

const props = defineProps<{ appData: AppData[] }>()

const topApps = computed(() => {
  const totals = new Map<number, AppData>()
  for (const app of props.appData) {
    const existing = totals.get(app.id!)
    if (existing)
      existing.totalTime += app.totalTime
    else
      totals.set(app.id!, { ...app })
  }
  return [...totals.values()].sort((a, b) => b.totalTime - a.totalTime).slice(0, 5)
})
</script>

<template>
  <section aria-label="使用时长排行">
    <h2 class="section-title mb-2">
      使用时长排行
    </h2>
    <ul v-if="topApps.length">
      <li v-for="app in topApps" :key="app.id">
        <AppUsageRow :app="app" :max-time="topApps[0].totalTime" />
      </li>
    </ul>
    <NoData v-else title="暂无使用记录" description="开始使用其他应用后，TaiM 会在后台记录活跃时间。" />
  </section>
</template>
