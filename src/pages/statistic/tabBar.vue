<script setup lang='ts'>
import { ref } from 'vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
</script>

<template>
  <div>
    <Tabs default-value="day">
      <TabsList>
        <TabsTrigger value="day">
          按天
        </TabsTrigger>
        <TabsTrigger value="week">
          按周
        </TabsTrigger>
        <TabsTrigger value="month">
          按月
        </TabsTrigger>
        <TabsTrigger value="year">
          按年
        </TabsTrigger>
      </TabsList>
    </Tabs>
  </div>
</template>

<style lang="scss" scoped>

</style>
