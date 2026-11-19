<script setup lang='ts'>
import { ArrowDown20Regular, ArrowUp20Regular } from '@vicons/fluent'
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  data: {
    type: [String, Number],
    default: '',
  },
  previousDelta: {
    type: Number,
    default: undefined,
  },
  previousLabel: {
    type: String,
    default: undefined,
  },
  unit: {
    type: String,
  },
})

const deltaColor = computed(() => {
  if (!props.previousDelta)
    return 'text-muted-foreground'
  return props.previousDelta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
})
</script>

<template>
  <div class="surface metric-card">
    <div class="total">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <span class="metric-icon" aria-hidden="true">
          <slot name="iconSlot" />
        </span>
        <span>{{ title }}</span>
      </div>
      <div class="mt-3 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <div class="time">
          <span class="text-2xl font-semibold tabular-nums">{{ data }}</span>
          <span v-if="unit" class="ml-1 text-sm text-muted-foreground">{{ unit }}</span>
        </div>
        <div v-if="previousDelta != null" class="flex items-center text-sm tabular-nums" :class="deltaColor">
          <ArrowDown20Regular v-if="previousDelta < 0" class="w-4 h-4" aria-label="减少" />
          <ArrowUp20Regular v-else-if="previousDelta > 0" class="w-4 h-4" aria-label="增加" />
          {{ previousLabel ?? Math.abs(previousDelta) }}
        </div>
        <slot name="app" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.metric-card { padding: 14px; }
.metric-icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex: none;
  place-items: center;
  border-radius: calc(var(--radius) - 2px);
  background: hsl(var(--primary) / 0.10);
  color: hsl(var(--danger-text));
}
</style>
