<script setup lang="ts">
import { computed } from 'vue'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import type { AppData } from '@@/type/types'
import AppUsageRow from '@/components/AppUsageRow.vue'
import NoData from '@/components/NoData.vue'
import { Button } from '@/components/ui/button'
import { Time } from '@/utils/timerEvent'

const props = defineProps<{ appData: AppData[], date: string }>()

const sortedApps = computed(() => [...props.appData].sort((a, b) => b.totalTime - a.totalTime))
const totalTime = computed(() => props.appData.reduce((sum, app) => sum + app.totalTime, 0))
</script>

<template>
  <div class="mt-4">
    <Button variant="secondary">
      <CalendarIcon class="mr-2 h-4 w-4" />
      {{ date }}
    </Button>
    <p class="mt-4 text-base text-muted-foreground">
      总计{{ sortedApps.length }}个应用，使用时间{{ Time.toString(totalTime) }}
    </p>
    <ul v-if="sortedApps.length">
      <li v-for="app in sortedApps" :key="app.id">
        <AppUsageRow :app="app" :max-time="sortedApps[0].totalTime" />
      </li>
    </ul>
    <NoData v-else />
  </div>
</template>
