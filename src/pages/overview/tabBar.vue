<script setup lang='ts'>
import { ref } from 'vue'
import { AccessTime20Regular, ArrowTrendingLines20Regular, StoreMicrosoft16Regular } from '@vicons/fluent'
import Card from './Card.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const activeTab = ref('today')
</script>

<template>
  <Tabs default-value="today">
    <TabsList>
      <TabsTrigger value="today" @click="activeTab = 'today'">
        今日
      </TabsTrigger>
      <TabsTrigger value="week" @click="activeTab = 'week'">
        本周
      </TabsTrigger>
    </TabsList>
    <TabsContent value="today" class="flex flex-row justify-between">
      <Card title="累计使用时间" :data="12.6" unit="小时" :rate="-2.5">
        <template #iconSlot>
          <AccessTime20Regular class="w-5 h-5" />
        </template>
      </Card>
      <Card title="应用量" :data="12" unit="个" :rate="12">
        <template #iconSlot>
          <StoreMicrosoft16Regular class="w-5 h-5" />
        </template>
      </Card>
      <Card title="最长使用" :data="5.6" unit="小时" :show-app-icon="true">
        <template #iconSlot>
          <ArrowTrendingLines20Regular class="w-5 h-5" />
        </template>
        <template #appIcon>
          <img src="../../../AppIcons/Visual Studio Code.png" class="w-5 h-5">
        </template>
      </Card>
    </TabsContent>
    <TabsContent value="week">
      Change your password here.
    </TabsContent>
  </Tabs>
</template>

<style lang="scss" scoped>

</style>
