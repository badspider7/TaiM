<script setup lang='ts'>
import type { AppData } from '@@/type/types'
import * as echarts from 'echarts'
import { onMounted, ref, shallowRef } from 'vue'
import CardGroup from '@/components/CardGroup.vue'
import AppList from '@/pages/overview/FrequentApp.vue'
import AppDetail from '@/components/AppDetail.vue'
import { useAppDetail } from '@/hooks/useAppDetail'
import { useAppInfo } from '@/store/app'
import { getDayOptions } from '@/pages/statistic/components/chartOptions'
import getUsageTimeApi from '@/api/getUsageTime'

const props = defineProps<{
  currentAppInfo: AppData[]
  lastAppInfo: AppData[]
  selectedDate: any
}>()

onMounted(() => {
  refreshChart()
})

const appStore = useAppInfo()
const appInfo = appStore.appInfoList
const chart = shallowRef<echarts.ECharts>()
const activeIndex = ref<null | number>(null)
const appDetailInfo = ref<AppData[]>([])
const isShowAppDetailPage = ref(false)

function initChart(xAxis: number[], yAxis: number[], secondArr: number[]) {
  if (!chart.value) {
    chart.value = echarts.init(document.querySelector('.chart-element') as HTMLElement)
  }

  // TODO: 到时候优化一下
  chart.value && chart.value.setOption(getDayOptions(xAxis, yAxis, secondArr))
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
  selectedHours.value = `${props.selectedDate.year}-${props.selectedDate.month.toString().padStart(2, '0')}-${props.selectedDate.day.toString().padStart(2, '0')} ${hourDate.toString().padStart(2, '0')}:00:00`
  const dailyData = await getUsageTimeApi.getHourData(selectedHours.value)
  return useAppDetail(dailyData, appInfo)
}

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
