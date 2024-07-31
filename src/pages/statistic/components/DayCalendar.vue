<script setup lang="ts">
import type { Ref } from 'vue'
import { onMounted, ref } from 'vue'
import {
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
  today,
} from '@internationalized/date'
import type { CalendarRootProps } from 'radix-vue'
import type { AppData } from '@@/type/types'

import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import getUsageTimeApi from '@/api/getUsageTime'
import { useAppInfo } from '@/store/app'
import { useAppDetail } from '@/hooks/useAppDetail'

defineOptions({
  name: 'DayCalendar',
})

const df = new DateFormatter('zh-CN', {
  dateStyle: 'long',
})

const selectedDate = ref<DateValue>()

onMounted(() => {
  selectedDate.value = today(getLocalTimeZone())
})

function selectedDateChange(date: DateValue) {
  const time = `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`
  getDataByTime(time)
}

// 大于当前日期不可选
const isDateUnavailable: CalendarRootProps['isDateUnavailable'] = (date) => {
  const now = new Date()
  return date.year > now.getFullYear() || (date.year === now.getFullYear() && date.month > now.getMonth() + 1)
}

const appStore = useAppInfo()
const appData: Ref<AppData[]> = ref([])
const appInfo = appStore.appInfoList

async function getDataByTime(time: string) {
  const dailyData = await getUsageTimeApi.getPerHourTimeOneDay(time)
  appData.value = useAppDetail(dailyData, appInfo)
  console.log('time', appData.value)
}
</script>

<template>
  <Popover>
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
        @update:placeholder="selectedDateChange"
      />
    </PopoverContent>
  </Popover>
</template>
