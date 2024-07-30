<script setup lang='ts'>
import { ref } from 'vue'
import Calendar from './components/Calendar.vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
      <div class="container">
        <Calendar />
      </div>
    </Tabs>
  </div>
</template>

<style lang="scss" scoped>

</style>
