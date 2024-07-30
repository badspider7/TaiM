<script setup lang='ts'>
import { ref } from 'vue'
import Calendar from './components/Calendar.vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const activeTab = ref('day')

function tabChange(type: string) {
  activeTab.value = type
}
</script>

<template>
  <div>
    <Tabs default-value="day">
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
          <Popover>
            <PopoverTrigger>
              <Button>今天</Button>
              <span class="week-range ml-3 text-sm">2024年7月21号 到 2024年7月30号</span>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </Tabs>
  </div>
</template>

<style lang="scss" scoped>

</style>
