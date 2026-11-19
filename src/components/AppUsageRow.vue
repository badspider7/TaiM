<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AppData } from '@@/type/types'
import { Progress } from '@/components/ui/progress'
import { Time } from '@/utils/timerEvent'

const props = defineProps<{ app: AppData, maxTime: number }>()
const failedIcon = ref<string>()
const name = computed(() => props.app.alias || props.app.name)
const usagePercent = computed(() => props.maxTime > 0
  ? Math.max(0, Math.min(100, props.app.totalTime / props.maxTime * 100))
  : 0)
</script>

<template>
  <RouterLink class="usage-app-row" :to="{ path: '/detail', query: { app: String(app.id) } }">
    <span class="usage-app-icon" aria-hidden="true">
      <img v-if="app.iconFile && failedIcon !== app.iconFile" :src="app.iconFile" alt="" class="size-6" @error="failedIcon = app.iconFile">
      <span v-else>{{ name.slice(0, 1) }}</span>
    </span>
    <div class="grid min-w-0 gap-1.5">
      <span class="truncate" :title="name">{{ name }}</span>
      <Progress :model-value="usagePercent" class="usage-app-progress h-2" aria-hidden="true" />
    </div>
    <span class="whitespace-nowrap text-right text-sm tabular-nums">{{ Time.toString(app.totalTime) }}</span>
  </RouterLink>
</template>

<style scoped>
.usage-app-row {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin-block: 8px;
  padding: 4px 8px 4px 4px;
  border-radius: var(--radius);
  color: hsl(var(--foreground));
}

.usage-app-icon {
  display: grid;
  height: 50px;
  place-items: center;
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) - 2px);
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
}

.usage-app-progress :deep(.bg-primary) {
  background-color: hsl(var(--muted-foreground));
}

.usage-app-row:is(:hover, :focus-visible) {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}

.usage-app-row:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: -2px;
}
</style>
