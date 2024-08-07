<script setup lang='ts'>
import type { AppData } from '@@/type/types'
import * as echarts from 'echarts'
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import CardGroup from '@/components/CardGroup.vue'
import AppList from '@/pages/overview/FrequentApp.vue'
import AppDetail from '@/components/AppDetail.vue'
import { useAppDetail } from '@/hooks/useAppDetail'

import getUsageTimeApi from '@/api/getUsageTime'
import { useActiveTab } from '@/store/app'
import { ACTIVE_TAB_TYPE } from '@/const'
import { Time, formatDate } from '@/utils/timerEvent'

const props = defineProps<{
  currentAppInfo: AppData[]
  lastAppInfo: AppData[]
  selectedDate: any
}>()

const store = useActiveTab()

onMounted(() => {
  refreshChart()
})

const chart = shallowRef<echarts.ECharts>()
const activeIndex = ref<null | number>(null)
const appDetailInfo = ref<AppData[]>([])
const isShowAppDetailPage = ref(false)

function initChart(options: echarts.EChartsCoreOption) {
  if (!chart.value) {
    chart.value = echarts.init(document.querySelector('.chart-element') as HTMLElement)
  }

  // TODO: 到时候优化一下
  chart.value && chart.value.setOption(options)
  chart.value.resize()
  isShowAppDetailPage.value = false
  appDetailInfo.value = []
  activeIndex.value = null
  updateChartGraphic(chart.value, 0, 0, 0, 0, false) // 隐藏矩形
  chart.value.getZr().off('click')
  chart.value.getZr().on('click', params => chartClickCallback(params, chart.value))
}

const RECT_ID = 2
const RECT_FILL_COLOR = '#FDECF0'
const selectedHours = ref('')
const selectedDay = ref('')

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
      getAppDetail(xIndex).then((res) => {
        if (res) {
          appDetailInfo.value = res
        }
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
  selectedHours.value = `${props.selectedDate.year}-${props.selectedDate.month.toString().padStart(2, '0')}-${props.selectedDate.day.toString().padStart(2, '0')} ${hourDate.toString().padStart(2, '0')}:00:00`
  const dailyData = await getUsageTimeApi.getHourData(selectedHours.value)
  return useAppDetail(dailyData)
}

async function getDataByDay(day: string) {
  const dailyData = await getUsageTimeApi.getDailyTime(day)
  selectedDay.value = day.split(' ')[0]
  return useAppDetail(dailyData)
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
      return getDataByHour(index)
    },
    [ACTIVE_TAB_TYPE.YEAR]: () => {
      return getDataByHour(index)
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
      return selectedHours.value
    },
    [ACTIVE_TAB_TYPE.YEAR]: () => {
      return selectedHours.value
    },
  }

  const strategy = strategies[store.activeTab]
  return strategy()
})

function refreshChart() {
  window.ipcRenderer.on('refresh-chart', (_event, value) => {
    chart.value && chart.value.resize()
  })
}

defineExpose({
  initChart,
})
</script>

<template>
  <CardGroup :current-app-info="currentAppInfo" :last-app-info="lastAppInfo" />
  <div class="app-detail mt-5">
    <div class="chart-element" />
    <AppDetail v-if="isShowAppDetailPage" :app-data="appDetailInfo" :date="displayTime" />
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
