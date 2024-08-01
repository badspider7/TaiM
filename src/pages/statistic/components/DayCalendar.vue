<script setup lang="ts">
import type { Ref } from 'vue'
import { onMounted, ref, shallowRef } from 'vue'
import {
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
  today,
} from '@internationalized/date'
import type { CalendarRootProps } from 'radix-vue'
import type { AppData, HoursLogModels } from '@@/type/types'

import { Calendar as CalendarIcon } from 'lucide-vue-next'
import * as echarts from 'echarts'
import { getOptions } from './chartOptions'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import getUsageTimeApi from '@/api/getUsageTime'
import { useAppInfo } from '@/store/app'
import { useAppDetail } from '@/hooks/useAppDetail'

defineOptions({
  name: 'DayCalendar',
})

const df = new DateFormatter('zh-CN', {
  dateStyle: 'long',
})

const selectedDate = ref<DateValue>()

onMounted(() => {
  selectedDate.value = today(getLocalTimeZone())
  selectedDateChange(selectedDate.value)
})

// control popover state
const isOpen = ref(false)

function selectedDateChange(date: DateValue | undefined) {
  if (date) {
    const time = `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`
    console.log('time', time)
    getDataByTime(time)
    isOpen.value = false
  }
}

// 大于当前日期不可选
const isDateUnavailable: CalendarRootProps['isDateUnavailable'] = (date) => {
  const now = new Date()
  return date.year > now.getFullYear() || (date.year === now.getFullYear() && date.month > now.getMonth() + 1) || (date.year === now.getFullYear() && date.month === now.getMonth() + 1 && date.day > now.getDate())
}

const appStore = useAppInfo()
const appData: Ref<AppData[]> = ref([])
const appInfo = appStore.appInfoList

async function getDataByTime(time: string) {
  const dailyData = await getUsageTimeApi.getPerHourTimeOneDay(time)
  appData.value = useAppDetail(dailyData, appInfo)
  calcChartData(dailyData)
}

function calcChartData(data: HoursLogModels[]) {
  const summary: Record<string, Record<number, number>> = {}
  for (let i = 0; i <= 23; i++) {
    summary[i.toString().padStart(2, '0')] = {}
  }
  data.forEach((item) => {
    const hour = item.hoursTime.substring(11, 13) // 只取小时部分
    const appModelId = item.appModelId
    const time = item.time

    if (!summary[hour][appModelId]) {
      summary[hour][appModelId] = 0
    }
    summary[hour][appModelId] += time
  })

  const hourlyTotals: number[] = []
  const secondTotals: number[] = []
  for (const hour in summary) {
    secondTotals[Number(hour)] = Object.values(summary[hour]).reduce((acc, curr) => acc + curr, 0)
    hourlyTotals[Number(hour)] = Math.floor(secondTotals[Number(hour)] / 60)
  }
  initChart(hourlyTotals, secondTotals)
}

const chart = shallowRef<echarts.ECharts>()

function initChart(yAxis: number[], secondArr: number[]) {
  if (!chart.value) {
    chart.value = echarts.init(document.querySelector('.chart-element') as HTMLElement)
  }
  chart.value && chart.value.setOption(getOptions(yAxis, secondArr), { notMerge: true })
  chart.value.resize()
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="cn(
          'w-[180px] justify-start text-left font-normal',
          !selectedDate && 'text-muted-foreground',
        )"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{ selectedDate ? df.format(selectedDate.toDate(getLocalTimeZone())) : "选择日期" }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <Calendar
        v-model="selectedDate" initial-focus :is-date-unavailable="isDateUnavailable" locale="zh-CN"
        @update:model-value="selectedDateChange"
      />
    </PopoverContent>
  </Popover>
  <div class="chart-element" />
</template>

<style lang="scss" scoped>
.chart-element{
  width: 100%;
  height: 300px;
  border-left: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  margin-top: 10px;
}
</style>
