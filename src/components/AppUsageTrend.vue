<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import type { AppData, HoursLogModels } from '@@/type/types'
import * as echarts from '@/lib/charts'
import { Time } from '@/utils/timerEvent'

const props = defineProps<{
  appId: number
  start: string
  end: string
  daily: AppData[]
  hourly: HoursLogModels[]
}>()

const element = ref<HTMLElement>()
const chart = shallowRef<echarts.ECharts>()
const singleDay = computed(() => props.start === props.end)
const rangeDays = computed(() => Math.round((Date.parse(`${props.end}T00:00:00Z`) - Date.parse(`${props.start}T00:00:00Z`)) / 86400000) + 1)
const unit = computed(() => singleDay.value ? '小时' : rangeDays.value <= 31 ? '天' : '月')
const buckets = computed(() => {
  if (singleDay.value) {
    const totals = Array.from({ length: 24 }, () => 0)
    for (const row of props.hourly) {
      if (row.appModelId === props.appId)
        totals[Number(row.hoursTime.slice(11, 13))] += row.time
    }
    return totals.map((time, hour) => ({ label: `${String(hour).padStart(2, '0')}:00`, time }))
  }
  const totals = new Map<string, number>()
  for (const row of props.daily) {
    if (row.id !== props.appId)
      continue
    const date = row.date.slice(0, unit.value === '天' ? 10 : 7)
    totals.set(date, (totals.get(date) ?? 0) + row.totalTime)
  }
  const points: { label: string, time: number }[] = []
  const date = new Date(`${props.start}T00:00:00Z`)
  const end = new Date(`${props.end}T00:00:00Z`)
  if (unit.value === '月')
    date.setUTCDate(1)
  let cursor = date.getTime()
  while (cursor <= end.getTime()) {
    const current = new Date(cursor)
    const label = current.toISOString().slice(0, unit.value === '天' ? 10 : 7)
    points.push({ label, time: totals.get(label) ?? 0 })
    if (unit.value === '天')
      cursor = current.setUTCDate(current.getUTCDate() + 1)
    else
      cursor = current.setUTCMonth(current.getUTCMonth() + 1)
  }
  return points
})

function draw() {
  if (!element.value)
    return
  chart.value ??= echarts.init(element.value)
  const styles = getComputedStyle(element.value)
  const color = (token: string, opacity = 1) => `hsla(${styles.getPropertyValue(token).trim().split(/\s+/).join(', ')}, ${opacity})`
  const points = buckets.value
  chart.value.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: color('--popover'),
      borderColor: color('--border'),
      textStyle: { color: color('--popover-foreground') },
      formatter: (items: { dataIndex: number }[]) => {
        const point = points[items[0].dataIndex]
        return `${point.label}<br/>${Time.toString(point.time)}`
      },
    },
    grid: { left: 12, right: 16, top: 16, bottom: 12, containLabel: true },
    xAxis: { type: 'category', data: points.map(point => point.label), axisLabel: { color: color('--muted-foreground'), hideOverlap: true }, axisLine: { lineStyle: { color: color('--border') } } },
    yAxis: { type: 'value', min: 0, axisLabel: { color: color('--muted-foreground'), formatter: (seconds: number) => Time.toString(seconds) }, splitLine: { lineStyle: { color: color('--border', 0.55) } } },
    series: [{ type: 'bar', data: points.map(point => point.time), barMaxWidth: 32, itemStyle: { color: color('--primary', 0.78), borderRadius: [3, 3, 0, 0] } }],
  }, { notMerge: true })
  chart.value.resize()
}

let sizeObserver: ResizeObserver | undefined
let themeObserver: MutationObserver | undefined
onMounted(() => {
  draw()
  sizeObserver = new ResizeObserver(() => chart.value?.resize())
  if (element.value)
    sizeObserver.observe(element.value)
  themeObserver = new MutationObserver(draw)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})
watch(buckets, draw)
onUnmounted(() => {
  sizeObserver?.disconnect()
  themeObserver?.disconnect()
  chart.value?.dispose()
})
</script>

<template>
  <section aria-label="应用使用趋势" class="mt-4">
    <h3 class="section-title">
      使用趋势 · 每{{ unit }}
    </h3>
    <div ref="element" class="trend-chart" role="img" :aria-label="`使用趋势，按${unit}统计`" />
  </section>
</template>

<style scoped>
.trend-chart { width: 100%; height: clamp(220px, 32vh, 300px); margin-top: 12px; }
</style>
