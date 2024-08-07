<script setup lang='ts'>
import { onMounted, ref } from 'vue'
import {
  getLocalTimeZone,
  today,
} from '@internationalized/date'
import type { AppData, DailyLogModels } from '@@/type/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ChartTable from '@/components/ChartTable.vue'
import getUsageTimeApi from '@/api/getUsageTime'
import { useAppDetail } from '@/hooks/useAppDetail'

defineOptions({
  name: 'YearCalendar',
})

const currentYear = today(getLocalTimeZone())
const activeYear = ref()
const yearList = ref()

onMounted(() => {
  // 获取当前年份
  getYearRange()
  activeYear.value = currentYear.year.toString()
  updateChartData(activeYear.value)
})

function getYearRange() {
  const startYear = currentYear.year - 3
  const endYear = currentYear.year
  const yearRange = []
  for (let i = startYear; i <= endYear; i++) {
    yearRange.push(i.toString())
  }
  yearList.value = yearRange
}

function valueChange(year: string) {
  updateChartData(year)
}

const currentYearInfo = ref<AppData[]>([])
const lastYearInfo = ref<DailyLogModels[]>([])
const chartTableRef = ref<InstanceType<typeof ChartTable> | null>(null)

async function updateChartData(year: string) {
  currentYearInfo.value = await getCurrentYearData(year)
  lastYearInfo.value = await getLastYearData(year)
}

const xAxis = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// 获取指定年份的数据
async function getCurrentYearData(year: string) {
  const yearListData = await getUsageTimeApi.getAllYearData(year)
  calcChartData(yearListData)
  return useAppDetail(yearListData)
}

// 获取指定年份去年的数据
async function getLastYearData(year: string) {
  const lastYear = (+year - 1).toString()
  return await getUsageTimeApi.getAllYearData(lastYear)
}

function calcChartData(data: DailyLogModels[]) {
  console.log('data', data)
}
</script>

<template>
  <div class="year-calendar w-[100px]">
    <Select
      v-model="activeYear"
      :default-value="activeYear"
      @update:model-value="valueChange"
    >
      <SelectTrigger>
        <SelectValue placeholder="选择日期" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="year in yearList" :key="year" :value="year ">
          {{ year }}年
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
  <ChartTable ref="chartTableRef" :current-app-info="currentYearInfo" :last-app-info="lastYearInfo" :selected-date="activeYear" />
</template>

<style lang="scss" scoped>

</style>
