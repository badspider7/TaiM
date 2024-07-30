<script setup lang='ts'>
import { ref } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

defineOptions({
  name: 'WeekCalendar',
})

const weektype = ref('week')
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
</template>

<style lang="scss" scoped>

</style>
