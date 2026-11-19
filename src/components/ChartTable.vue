<script setup lang='ts'>
import type { AppData, DailyLogModels } from '@@/type/types'
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import * as echarts from '@/lib/charts'
import CardGroup from '@/components/CardGroup.vue'
import AppSelect from '@/components/AppSelect.vue'
import AppList from '@/pages/overview/FrequentApp.vue'
import AppDetail from '@/components/AppDetail.vue'
import { useAppDetail } from '@/hooks/useAppDetail'

import getUsageTimeApi from '@/api/getUsageTime'
import { useActiveTab } from '@/store/app'
import { ACTIVE_TAB_TYPE } from '@/const'
import { Time, formatDate } from '@/utils/timerEvent'

const props = defineProps<{
  currentAppInfo: AppData[]
  lastAppInfo: DailyLogModels[]
  selectedDate: any
}>()

const store = useActiveTab()

const chart = shallowRef<echarts.ECharts>()
const chartElement = ref<HTMLElement>()
let lastOptions: echarts.EChartsCoreOption | undefined
const activeIndex = ref<null | number>(null)
const periods = ref<{ value: string, label: string }[]>([])
const appDetailInfo = ref<AppData[]>([])
const isShowAppDetailPage = ref(false)
const detailLoading = ref(false)
const detailError = ref(false)
let detailRequest = 0

function applyChartTheme() {
  if (!chart.value || !chartElement.value || !lastOptions)
    return
  const styles = getComputedStyle(chartElement.value)
  const color = (token: string, opacity = 1) => `hsla(${styles.getPropertyValue(token).trim().split(/\s+/).join(', ')}, ${opacity})`
  const guides = Array.isArray(lastOptions.series) ? lastOptions.series[0]?.markLine?.data ?? [] : []
  chart.value.setOption({
    xAxis: [{ axisLabel: { color: color('--muted-foreground') } }],
    yAxis: [{ axisLabel: { color: color('--muted-foreground') } }],
    tooltip: {
      backgroundColor: color('--popover'),
      borderColor: color('--border'),
      textStyle: { color: color('--popover-foreground') },
      axisPointer: { shadowStyle: { color: color('--primary', 0.10) } },
    },
    series: [{
      itemStyle: { color: color('--primary', 0.74), borderRadius: [3, 3, 0, 0] },
      markLine: {
        data: guides.map((guide: { type?: string, label?: object, lineStyle?: object }) => ({
          ...guide,
          label: { ...guide.label, color: color(guide.type === 'average' ? '--danger-text' : '--muted-foreground') },
          lineStyle: { ...guide.lineStyle, color: color(guide.type === 'average' ? '--primary' : '--muted-foreground', 0.55) },
        })),
      },
    }],
  })
}

function initChart(options: echarts.EChartsCoreOption) {
  if (!chartElement.value)
    return
  chart.value ??= echarts.init(chartElement.value)
  lastOptions = options
  const labels = Array.isArray(options.xAxis) ? options.xAxis[0]?.data ?? [] : []
  periods.value = labels.map((label: string | number, index: number) => ({
    value: String(index),
    label: store.activeTab === ACTIVE_TAB_TYPE.DAY ? `${String(label).padStart(2, '0')}:00` : String(label),
  }))
  chart.value.setOption(options)
  applyChartTheme()
  chart.value.resize()
  clearSelection()
  chart.value.getZr().off('click')
  chart.value.getZr().on('click', (params) => {
    const point = [params.offsetX, params.offsetY]
    if (!chart.value?.containPixel('grid', point))
      return
    const bucket = chart.value.convertFromPixel({ seriesIndex: 0 }, point)
    const index = Number(Array.isArray(bucket) ? bucket[0] : bucket)
    if (index === activeIndex.value)
      clearSelection()
    else
      void selectPeriod(String(index))
  })
}

const selectedHours = ref('')
const selectedDay = ref('')
const selectedMonth = ref('')

function clearSelection() {
  detailRequest++
  detailLoading.value = false
  detailError.value = false
  isShowAppDetailPage.value = false
  appDetailInfo.value = []
  activeIndex.value = null
  chart.value?.dispatchAction({ type: 'downplay', seriesIndex: 0 })
}

async function selectPeriod(value: string) {
  if (!periods.value.some(period => period.value === value))
    return

  const index = Number(value)
  chart.value?.dispatchAction({ type: 'downplay', seriesIndex: 0 })
  chart.value?.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: index })
  isShowAppDetailPage.value = true
  activeIndex.value = index
  detailLoading.value = true
  detailError.value = false
  const request = ++detailRequest
  try {
    const apps = await getAppDetail(index)
    if (request === detailRequest)
      appDetailInfo.value = apps ?? []
  }
  catch {
    if (request === detailRequest)
      detailError.value = true
  }
  finally {
    if (request === detailRequest)
      detailLoading.value = false
  }
}

async function getDataByHour(hour: number) {
  const hourDate = Math.abs(hour) === 0 ? '00' : hour
  selectedHours.value = `${props.selectedDate.year}-${props.selectedDate.month.toString().padStart(2, '0')}-${props.selectedDate.day.toString().padStart(2, '0')} ${hourDate.toString().padStart(2, '0')}:00:00`
  const dailyData = await getUsageTimeApi.getHourData(selectedHours.value)
  return useAppDetail(dailyData)
}

async function getDataByDay(day: string) {
  const dailyData = await getUsageTimeApi.getDailyTime(day)
  selectedDay.value = day.split(' ')[0]
  return useAppDetail(dailyData)
}

async function getDateByMonth(year: string, month: number) {
  selectedMonth.value = `${year}年${month.toString().padStart(2, '0')}月`
  const { start, end } = Time.getMonthDate(+year, +month)
  const monthData = await getUsageTimeApi.getDataInRange(start, end)
  return useAppDetail(monthData)
}

async function getAppDetail(index: number) {
  const strategies = {
    [ACTIVE_TAB_TYPE.DAY]: () => {
      return getDataByHour(index)
    },
    [ACTIVE_TAB_TYPE.WEEK]: () => {
      let weekStart = null
      if (props.selectedDate === 'week') {
        weekStart = Time.getThisWeekDate().start
      }
      else {
        weekStart = Time.getLastWeekDate().start
      }
      const currentTime = new Date(weekStart).getTime()
      const currentDate = new Date(currentTime + index * 24 * 60 * 60 * 1000)
      return getDataByDay(formatDate(currentDate))
    },
    [ACTIVE_TAB_TYPE.MONTH]: () => {
      const currentYear = new Date().getFullYear()
      const month = props.selectedDate
      const day = index + 1
      const date = `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} 00:00:00`
      return getDataByDay(date)
    },
    [ACTIVE_TAB_TYPE.YEAR]: async () => {
      const monthData = await getDateByMonth(props.selectedDate, index + 1)
      const tempAppInfo = monthData.reduce((acc: Record<number, AppData>, item: AppData) => {
        if (acc[item.id!]) {
          acc[item.id!].totalTime += item.totalTime
        }
        else {
          acc[item.id!] = { ...item,
          }
        }
        return acc
      }, {})
      return Object.values(tempAppInfo)
    },

  }
  const strategy = strategies[store.activeTab]
  if (strategy) {
    return strategy()
  }
}

const displayTime = computed(() => {
  const strategies = {
    [ACTIVE_TAB_TYPE.DAY]: () => {
      return selectedHours.value.replace(/(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/, '$1年$2月$3日 $4点')
    },
    [ACTIVE_TAB_TYPE.WEEK]: () => {
      return selectedDay.value
    },
    [ACTIVE_TAB_TYPE.MONTH]: () => {
      return selectedDay.value
    },
    [ACTIVE_TAB_TYPE.YEAR]: () => {
      return selectedMonth.value
    },

  }

  const strategy = strategies[store.activeTab]
  return strategy()
})

const resize = () => chart.value?.resize()
const sizeObserver = new ResizeObserver(resize)
const themeObserver = new MutationObserver(applyChartTheme)
onMounted(() => {
  if (chartElement.value)
    sizeObserver.observe(chartElement.value)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})
onUnmounted(() => {
  detailRequest++
  sizeObserver.disconnect()
  themeObserver.disconnect()
  chart.value?.dispose()
})

defineExpose({
  initChart,
})
</script>

<template>
  <CardGroup :current-app-info="currentAppInfo" :last-app-info="lastAppInfo" />
  <section class="surface mt-4 p-4" aria-label="使用趋势">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="section-title">
        使用趋势
      </h2>
      <AppSelect v-if="periods.length" :model-value="activeIndex === null ? '' : String(activeIndex)" :options="periods" label="选择时段查看应用明细" placeholder="查看时段明细" @update:model-value="selectPeriod" />
    </div>
    <div ref="chartElement" class="chart-element" />
  </section>
  <div class="surface mt-4 p-4">
    <button v-if="isShowAppDetailPage" class="action-button" @click="clearSelection">
      返回使用时长排行
    </button>
    <p v-if="detailLoading" class="text-muted-foreground mt-3" role="status">
      正在读取时段明细…
    </p>
    <p v-else-if="detailError" class="error-message" role="alert">
      读取时段明细失败，请重新选择时段。
    </p>
    <AppDetail v-else-if="isShowAppDetailPage" :app-data="appDetailInfo" :date="displayTime" />
    <AppList v-else :app-data="currentAppInfo" />
  </div>
</template>

<style lang="scss" scoped>
.chart-element{
  width: 100%;
  height: clamp(230px, 34vh, 320px);
  margin-top: 10px;
}
</style>
