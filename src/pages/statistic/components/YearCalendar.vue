<script setup lang='ts'>
import { onMounted, ref } from 'vue'
import {
  getLocalTimeZone,
  today,
} from '@internationalized/date'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

defineOptions({
  name: 'YearCalendar',
})

const currentYear = today(getLocalTimeZone())
const activeYear = ref()
const yearList = ref()

onMounted(() => {
  getYearRange()
  activeYear.value = currentYear.year.toString()
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

function valueChange(v: string) {
  console.log('vaavaa', v)
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
</template>

<style lang="scss" scoped>

</style>
