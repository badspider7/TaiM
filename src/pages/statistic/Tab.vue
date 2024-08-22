<script setup lang='ts'>
import { ref, shallowRef } from 'vue'
import DayCalendar from './components/DayCalendar.vue'
import WeekCalendar from './components/WeekCalendar.vue'
import MonthCalendar from './components/MonthCalendar.vue'
import YearCalendar from './components/YearCalendar.vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useActiveTab } from '@/store/app'

enum TabType {
  day = 'day',
  week = 'week',
  month = 'month',
  year = 'year',
}

const activeTab = ref('day')
const acitveCom = shallowRef(DayCalendar)
const store = useActiveTab()
const comMap = {
  day: DayCalendar,
  week: WeekCalendar,
  month: MonthCalendar,
  year: YearCalendar,
}

function tabChange(type: keyof typeof TabType) {
  activeTab.value = type
  store.setActiveTab(type)
  acitveCom.value = comMap[type]
}
</script>

<template>
  <Tabs default-value="day" class="list-wrap">
    <TabsList>
      <TabsTrigger value="day" @click="tabChange('day')">
        按天
      </TabsTrigger>
      <TabsTrigger value="week" @click="tabChange('week')">
        按周
      </TabsTrigger>
      <TabsTrigger value="month" @click="tabChange('month')">
        按月
      </TabsTrigger>
      <TabsTrigger value="year" @click="tabChange('year')">
        按年
      </TabsTrigger>
    </TabsList>
    <div class="date-container mt-2">
      <div class="date-btn">
        <component :is="acitveCom" />
      </div>
    </div>
  </Tabs>
</template>

<style lang="scss" scoped>
.list-wrap{
  height: 100%
}
.date-container{
  height: calc(100% - 50px);
}
.date-btn{
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
