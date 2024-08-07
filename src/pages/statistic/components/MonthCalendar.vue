<script setup lang='ts'>
import { onMounted, ref } from 'vue'
import {
  getLocalTimeZone,
  today,
} from '@internationalized/date'
import type { AppData, DailyLogModels } from '@@/type/types'

import { getMonthOptions } from './chartOptions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ChartTable from '@/components/ChartTable.vue'
import { Time } from '@/utils/timerEvent'
import getUsageTimeApi from '@/api/getUsageTime'
import { useAppDetail } from '@/hooks/useAppDetail'

defineOptions({
  name: 'MonthCalendar',
})

const activeMonth = ref()

onMounted(() => {
  // 获取当前月份
  const todayDate = today(getLocalTimeZone())
  activeMonth.value = todayDate.month.toString()
  updateChartData(activeMonth.value)
})

const monthList = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

function valueChange(month: string) {
  updateChartData(month)
}

const currentMonthInfo = ref<AppData[]>([])
const lastMonthInfo = ref<DailyLogModels[]>([])
const chartTableRef = ref<InstanceType<typeof ChartTable> | null>(null)

async function updateChartData(month: string) {
  currentMonthInfo.value = await getCurrentMonthData(month)
  lastMonthInfo.value = await getLastMonthData(month)
}

// 获取指定月份数据
async function getCurrentMonthData(month: string) {
  const { start, end } = Time.getMonthDate(+month)
  const monthData = await getUsageTimeApi.getDataInRange(start, end)
  const lastDay = getMonthDays(month)
  const xAxis = Array.from({ length: lastDay }, (_, index) => index + 1)
  calcChartData(xAxis, monthData)
  return useAppDetail(monthData)
}

async function getLastMonthData(month: string) {
  if (month === '1') {
    return []
  }
  else {
    const { start, end } = Time.getMonthDate(Number(month) - 1)
    return await getUsageTimeApi.getDataInRange(start, end)
  }
}

// 拿到一个月有多少天
function getMonthDays(month: string) {
  const date = new Date()
  date.setMonth(Number(month) - 1)
  date.setFullYear(date.getFullYear())
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function calcChartData(xAxis: number[], data: DailyLogModels[]) {
  const summary: Record<string, Record<number, number>> = {}
  xAxis.forEach((day) => {
    summary[day.toString().padStart(2, '0')] = {}
  })
  data.forEach((item) => {
    const day = item.dayTime.substring(8, 10)
    const appModelId = item.appModelId
    const time = item.time

    if (!summary[day][appModelId]) {
      summary[day][appModelId] = 0
    }
    summary[day][appModelId] += time
  })

  const daysArray: string[] = []
  const secondTotals: number[] = []

  for (const day in summary) {
    secondTotals[Number(day) - 1] = Object.values(summary[day]).reduce((acc, curr) => acc + curr, 0)
    daysArray[Number(day) - 1] = (secondTotals[Number(day) - 1] / 3600).toFixed(2)
  }

  chartTableRef.value && chartTableRef.value.initChart(getMonthOptions(xAxis, daysArray, secondTotals))
}
</script>

<template>
  <div class="week-calendar w-[100px]">
    <Select
      v-model="activeMonth"
      :default-value="activeMonth"
      @update:model-value="valueChange"
    >
      <SelectTrigger>
        <SelectValue placeholder="选择日期" />
      </SelectTrigger>
      <SelectContent class="max-h-[220px]">
        <SelectItem v-for="month in monthList" :key="month" :value="month ">
          {{ month }}月
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
  <ChartTable ref="chartTableRef" :current-app-info="currentMonthInfo" :last-app-info="lastMonthInfo" :selected-date="activeMonth" />
</template>
