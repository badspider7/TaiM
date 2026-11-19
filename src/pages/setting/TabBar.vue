<script setup lang='ts'>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Data from './components/Data.vue'
import Common from './components/Common.vue'
import Behavior from './components/Behavior.vue'
import About from './components/About.vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const comMap = {
  data: Data,
  common: Common,
  behavior: Behavior,
  about: About,
}
const route = useRoute()
const router = useRouter()
type SettingsTab = keyof typeof comMap
function isTab(value: unknown): value is SettingsTab {
  return typeof value === 'string' && Object.hasOwn(comMap, value)
}
const activeTab = computed<SettingsTab>(() => isTab(route.query.tab) ? route.query.tab : 'common')

function tabChange(input: string | number) {
  if (isTab(input) && input !== activeTab.value)
    void router.replace({ query: { ...route.query, tab: input } })
}
</script>

<template>
  <Tabs :model-value="activeTab" @update:model-value="tabChange">
    <TabsList>
      <TabsTrigger value="common" @click="tabChange('common')">
        通用
      </TabsTrigger>
      <TabsTrigger value="behavior" @click="tabChange('behavior')">
        行为
      </TabsTrigger>
      <TabsTrigger value="data" @click="tabChange('data')">
        数据
      </TabsTrigger>
      <TabsTrigger value="about" @click="tabChange('about')">
        关于
      </TabsTrigger>
    </TabsList>
    <div class="mt-4">
      <component :is="comMap[activeTab]" />
    </div>
  </Tabs>
</template>
