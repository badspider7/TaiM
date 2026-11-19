<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/timerEvent'

defineProps<{ busy: boolean, labelPrefix?: string }>()
const emit = defineEmits<{ apply: [] }>()
const start = defineModel<string>('start', { required: true })
const end = defineModel<string>('end', { required: true })
const presets = [{ label: '今天', days: 1 }, { label: '近 7 天', days: 7 }, { label: '近 30 天', days: 30 }]

function range(days: number) {
  const last = new Date()
  const first = new Date(last)
  first.setDate(last.getDate() - days + 1)
  return { start: formatDate(first).slice(0, 10), end: formatDate(last).slice(0, 10) }
}

function isSelected(days: number) {
  const dates = range(days)
  return start.value === dates.start && end.value === dates.end
}

function applyPreset(days: number) {
  const dates = range(days)
  start.value = dates.start
  end.value = dates.end
  emit('apply')
}
</script>

<template>
  <form class="date-filter" aria-label="日期范围" @submit.prevent="emit('apply')">
    <div class="date-presets">
      <CalendarDays :size="16" aria-hidden="true" class="text-muted-foreground mr-1" />
      <Button v-for="preset in presets" :key="preset.days" type="button" :variant="isSelected(preset.days) ? 'secondary' : 'ghost'" size="sm" :aria-pressed="isSelected(preset.days)" :disabled="busy" @click="applyPreset(preset.days)">
        {{ preset.label }}
      </Button>
    </div>
    <div class="date-inputs">
      <input v-model="start" type="date" :aria-label="`${labelPrefix ?? ''}开始日期`" :disabled="busy" required>
      <span class="text-muted-foreground" aria-hidden="true">至</span>
      <input v-model="end" type="date" :aria-label="`${labelPrefix ?? ''}结束日期`" :disabled="busy" required>
      <Button size="sm" :disabled="busy">
        {{ busy ? '加载中…' : '查询 / 刷新' }}
      </Button>
    </div>
  </form>
</template>

<style scoped>
.date-filter, .date-presets, .date-inputs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.date-filter { column-gap: 16px; row-gap: 10px; }
.date-presets { gap: 2px; }
.date-inputs input { width: 8.8rem; }
</style>
