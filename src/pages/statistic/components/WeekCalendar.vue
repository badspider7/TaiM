<script setup lang='ts'>
import { onMounted, ref, watch } from 'vue'
import type { AppData, DailyLogModels } from '@@/type/types'
import { getWeekOptions } from './chartOptions'
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
  name: 'WeekCalendar',
})

const weektype = ref('week')
const currentWeekInfo = ref<AppData[]>([])
const lastWeekInfo = ref<DailyLogModels[]>([])
const xAxis = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const chartTableRef = ref<InstanceType<typeof ChartTable> | null>(null)

watch(() => weektype.value, async (newVal) => {
  await updateChartData(newVal)
})

onMounted(async () => {
  await updateChartData(weektype.value)
})

async function updateChartData(weekType: string) {
  if (weekType === 'week') {
    currentWeekInfo.value = useAppDetail(await getThisWeekData())
    lastWeekInfo.value = await getLastWeekData()
  }
  else {
    currentWeekInfo.value = useAppDetail(await getLastWeekData())
    lastWeekInfo.value = await getBeforeLastWeekData()
  }
  calcChartData(currentWeekInfo.value)
}

// 拿到本周使用的数据
async function getThisWeekData() {
  const { start, end } = Time.getThisWeekDate()
  return await getUsageTimeApi.getDataInRange(start, end)
}

// 拿到上周使用的数据
async function getLastWeekData() {
  const { start, end } = Time.getLastWeekDate()
  return await getUsageTimeApi.getDataInRange(start, end)
}

// 拿到上上周数据
async function getBeforeLastWeekData() {
  const { start, end } = Time.getBoforeLastWeekDate()
  return await getUsageTimeApi.getDataInRange(start, end)
}

function calcChartData(data: AppData[]) {
  const weekDays: Record<string, number> = {
    周一: 0,
    周二: 0,
    周三: 0,
    周四: 0,
    周五: 0,
    周六: 0,
    周日: 0,
  }

  data.forEach((item) => {
    const day = new Date(item.date).getDay()
    const time = item.totalTime
    weekDays[xAxis[day]] += time
  })
  const dayHours: Record<string, string> = {}

  for (const key in weekDays) {
    dayHours[key] = (weekDays[key] / 3600).toFixed(2)
  }
  chartTableRef.value && chartTableRef.value.initChart(getWeekOptions(Object.keys(weekDays), Object.values(dayHours), weekDays))
}
</script>

<template>
  <div class="week-calendar w-[100px]">
    <Select v-model="weektype">
      <SelectTrigger>
        <SelectValue placeholder="选择日期" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="week">
          本周
        </SelectItem>
        <SelectItem value="lastWeek">
          上周
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
  <ChartTable ref="chartTableRef" :current-app-info="currentWeekInfo" :last-app-info="lastWeekInfo" :selected-date="weektype" />
</template>
