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
  name: 'MonthCalendar',
})

const activeMonth = ref()

onMounted(() => {
  const todayDate = today(getLocalTimeZone())
  activeMonth.value = todayDate.month.toString()
})

const monthList = ref(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])

function valueChange(v: string) {
  console.log('vaavaa', v)
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
</template>

<style lang="scss" scoped>

</style>
