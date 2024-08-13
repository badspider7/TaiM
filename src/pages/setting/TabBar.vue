<script setup lang='ts'>
import { onMounted, ref, watch } from 'vue'
import Data from './components/Data.vue'
import Common from './components/Common.vue'
import Behavior from './components/Behavior.vue'
import About from './components/About.vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

enum TabType {
  data = 'data',
  common = 'common',
  behavior = 'behavior',
  about = 'about',
}

const comMap = {
  data: Data,
  common: Common,
  behavior: Behavior,
  about: About,
}
const activeTab = ref('common')
const acitveCom = ref(Common)

function tabChange(value: keyof typeof TabType) {
  activeTab.value = value
  acitveCom.value = comMap[value]
}
</script>

<template>
  <Tabs default-value="common">
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
    <div class="setteing-container mt-5">
      <component :is="acitveCom" />
    </div>
  </Tabs>
</template>
