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
import { getDayOptions } from './chartOptions'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import getUsageTimeApi from '@/api/getUsageTime'
import { useAppInfo } from '@/store/app'
import { useAppDetail } from '@/hooks/useAppDetail'
import CardGroup from '@/components/CardGroup.vue'
import { formatDate } from '@/utils/timerEvent'
import AppList from '@/pages/overview/FrequentApp.vue'
import AppDetail from '@/components/AppDetail.vue'

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
  refreshChart()
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
const isShowAppDetailPage = ref(false)
const activeIndex = ref<null | number>(null)
const appDetailInfo = ref<AppData[]>([])

function initChart(yAxis: number[], secondArr: number[]) {
  if (!chart.value) {
    chart.value = echarts.init(document.querySelector('.chart-element') as HTMLElement)
  }

  // TODO: 到时候优化一下
  chart.value && chart.value.setOption(getDayOptions(yAxis, secondArr))
  chart.value.resize()
  isShowAppDetailPage.value = false
  appDetailInfo.value = []
  activeIndex.value = null
  updateChartGraphic(chart.value, 0, 0, 0, 0, false) // 隐藏矩形
  chart.value.getZr().off('click')
  // listen bar click event
  chart.value.getZr().on('click', params => chartClickCallback(params, chart.value))
}

const RECT_ID = 2
const RECT_FILL_COLOR = '#FDECF0'
const selectedHours = ref('')

function updateChartGraphic(chart: any, x: number, y: number, width: number, height: number, show: boolean) {
  chart.setOption({
    graphic: {
      type: 'rect',
      id: RECT_ID,
      $action: 'merge',
      shape: {
        x,
        y,
        width,
        height: show ? height : 0, // 根据是否显示来调整高度
      },
      style: {
        fill: RECT_FILL_COLOR,
      },
      z: 10,
    },
  })
}

function chartClickCallback(params: any, chart: any): void {
  if (!params || !chart)
    return

  const pointInPixel = [params.offsetX, params.offsetY]
  if (chart.containPixel('grid', pointInPixel)) {
    const xIndex = chart.convertFromPixel({ seriesIndex: 0 }, pointInPixel)[0]
    if (xIndex === activeIndex.value) {
      isShowAppDetailPage.value = false
      updateChartGraphic(chart, 0, 0, 0, 0, false) // 隐藏矩形
      appDetailInfo.value = []
      activeIndex.value = null
    }
    else {
      isShowAppDetailPage.value = true
      getDataByHour(xIndex).then((res) => {
        appDetailInfo.value = res
      })
      // 假设 params.topTarget 是有效的，并且包含我们需要的 shape 属性
      if (params.topTarget && params.topTarget.shape) {
        updateChartGraphic(chart, params.topTarget.shape.x, params.topTarget.shape.y, params.topTarget.shape.width, params.topTarget.shape.height, true)
      }
      activeIndex.value = xIndex
    }
  }
}

async function getDataByHour(hour: number) {
  const hourDate = Math.abs(hour) === 0 ? '00' : hour
  selectedHours.value = `${selectedDate.value!.year}-${selectedDate.value!.month.toString().padStart(2, '0')}-${selectedDate.value!.day.toString().padStart(2, '0')} ${hourDate.toString().padStart(2, '0')}:00:00`
  const dailyData = await getUsageTimeApi.getHourData(selectedHours.value)
  return useAppDetail(dailyData, appInfo)
}

function refreshChart() {
  window.ipcRenderer.on('refresh-chart', (_event, value) => {
    chart.value && chart.value.resize()
  })
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
  <CardGroup :current-app-info="currentAppInfo" :last-app-info="lastAppInfo" />
  <div class="app-detail mt-5">
    <div class="chart-element" />
    <AppDetail v-if="isShowAppDetailPage" :app-data="appDetailInfo" :date="selectedHours" />
    <AppList v-else :app-data="currentAppInfo" />
  </div>
</template>

<style lang="scss" scoped>
.app-detail{
  flex: 1;
  overflow: hidden auto;
}

.chart-element{
  width: 100%;
  height: 250px;
  border-left: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  margin-top: 10px;
}
</style>
