<script setup lang='ts'>
import { onMounted, ref } from 'vue'
import { AccessTime20Regular, ArrowTrendingLines20Regular, StoreMicrosoft16Regular } from '@vicons/fluent'
import type { AppData } from '@@/type/types'
import Card from './Card.vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Time } from '@/utils/timerEvent'

const props = defineProps({
  appData: {
    type: Array as () => AppData[],
    default: () => [],
    required: true,
  },
})

const activeTab = ref('today')

const totalTime = ref(0)
const totalApps = ref(0)

const longestApp = ref<AppData>({} as AppData)

onMounted(() => {
  totalTime.value = props.appData.reduce((acc, cur) => acc + cur.totalTime, 0)
  totalApps.value = props.appData.length
  longestApp.value = props.appData.reduce((acc, cur) => cur.totalTime > acc.totalTime ? cur : acc, props.appData[0])
  console.log('longestApp', totalTime)
})

function formatTime(second: number) {
  return Time.toHoursString(second)
}
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
    <div class="flex flex-row justify-between mt-4">
      <Card title="累计使用时间" :data="formatTime(totalTime)" unit="小时" previous-delta="-2.5%">
        <template #iconSlot>
          <AccessTime20Regular class="w-5 h-5" />
        </template>
      </Card>
      <Card title="应用量" :data="totalApps" unit="个" previous-delta="12">
        <template #iconSlot>
          <StoreMicrosoft16Regular class="w-5 h-5" />
        </template>
      </Card>
      <Card title="最长使用" :data="formatTime(longestApp.totalTime)" unit="小时" :show-app-icon="true">
        <template #iconSlot>
          <ArrowTrendingLines20Regular class="w-5 h-5" />
        </template>
        <template #appIcon>
          <img :src="longestApp.iconFile" class="w-5 h-5">
        </template>
      </Card>
    </div>
  </Tabs>
</template>

<style lang="scss" scoped>

</style>
