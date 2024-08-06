<script setup lang="ts">
import type { Ref } from 'vue'
import { nextTick, onMounted, ref } from 'vue'
import {
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
  today,
} from '@internationalized/date'
import type { CalendarRootProps } from 'radix-vue'
import type { AppData, HoursLogModels } from '@@/type/types'

import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import getUsageTimeApi from '@/api/getUsageTime'
import { useAppInfo } from '@/store/app'
import { useAppDetail } from '@/hooks/useAppDetail'
import { formatDate } from '@/utils/timerEvent'
import ChartTable from '@/components/ChartTable.vue'

defineOptions({
  name: 'DayCalendar',
})

const df = new DateFormatter('zh-CN', {
  dateStyle: 'long',
})

const selectedDate = ref<DateValue>()
const chartTableRef = ref<InstanceType<typeof ChartTable> | null>(null)

onMounted(() => {
  selectedDate.value = today(getLocalTimeZone())
  selectedDateChange(selectedDate.value)
})

// control popover state
const isOpen = ref(false)

function selectedDateChange(date: DateValue | undefined) {
  if (date) {
    const time = `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`
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
const currentAppInfo: Ref<AppData[]> = ref([])
const lastAppInfo: Ref<AppData[]> = ref([])
const xAxis = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]

async function getDataByTime(time: string) {
  const dailyData = await getUsageTimeApi.getPerHourTimeOneDay(time)
  currentAppInfo.value = await getSelectAppData(time)
  lastAppInfo.value = await getLastAppData(time)
  appData.value = useAppDetail(dailyData, appInfo)
  calcChartData(dailyData)
}

async function getSelectAppData(time: string) {
  const selectDate = `${time} 00:00:00`
  const selectedList = await getUsageTimeApi.getDailyTime(selectDate)
  return useAppDetail(selectedList, appInfo)
}

async function getLastAppData(time: string) {
  const currentTime = new Date(`${time} 00:00:00`)
  const lastTime = new Date(currentTime)
  lastTime.setDate(currentTime.getDate() - 1)
  const lastDate = formatDate(lastTime)
  const lastDataList = await getUsageTimeApi.getDailyTime(lastDate)
  return lastDataList
}

async function calcChartData(data: HoursLogModels[]) {
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
  chartTableRef.value && chartTableRef.value.initChart(xAxis, hourlyTotals, secondTotals)
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
  <ChartTable ref="chartTableRef" :current-app-info="currentAppInfo" :last-app-info="lastAppInfo" :selected-date="selectedDate" />
</template>
