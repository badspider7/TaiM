<script setup lang='ts'>
import { computed } from 'vue'
import type { AppData } from '@@/type/types'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { Progress } from '@/components/ui/progress'
import { Time } from '@/utils/timerEvent'
import { Button } from '@/components/ui/button'
import NoData from '@/components/NoData.vue'

const props = defineProps({
  appData: {
    type: Array as () => AppData[],
    default: () => [],
    required: true,
  },
  date: {
    type: String,
    default: '',
    required: true,
  },
})

const frequentlyApp = computed(() => {
  const tempAppInfo = props.appData
  return tempAppInfo.sort((a, b) => b.totalTime - a.totalTime)
})

function formatTime(second: number) {
  return Time.toString(second)
}

// 计算宽度
function getProgressWidth(second: number) {
  const first = frequentlyApp.value[0].totalTime
  const rate = `${Math.floor((second / first) * 100)}%`
  return rate
}

function viewDetail() {
  console.log('查看详情')
}
</script>

<template>
  <div class="app-list-wrap">
    <div class="time-box">
      <Button
        variant="secondary"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{ date }}
      </Button>
    </div>
    <div class="title text-gray-400 text-base mt-4">
      <span>
        总计{{ frequentlyApp.length }}个应用，使用时间{{ formatTime(frequentlyApp.reduce((a, b) => a + b.totalTime, 0)) }}
      </span>
    </div>
    <div v-if="frequentlyApp.length > 0" class="app-list">
      <div v-for="item in frequentlyApp" :key="item.id" class="app-info" @click="viewDetail">
        <div class="app-icon">
          <img :src="item.iconFile" alt="" class="w-5 h-5">
        </div>
        <div class="show-data">
          <div class="app-name text-gray-600">
            {{ item.name }}
          </div>
          <Progress :model-value="100" class="progress " :style="{ width: getProgressWidth(item.totalTime) }" />
        </div>
        <div class="usage-time">
          {{ formatTime(item.totalTime) }}
        </div>
      </div>
    </div>
    <NoData v-else />
  </div>
</template>

<style lang="scss" scoped>
.app-list-wrap{
    display: flex;
    flex-direction: column;
    margin-top: 1rem;
}

.app-list{
    flex: 1;
    overflow: hidden auto;
}
.app-info{
    display: flex;
    align-items:center;
    margin: 1.25rem 0;
    .app-icon{
        width: 3.125rem;
        height: 3.125rem;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #f0f0f0;
        margin-right: 1rem;
        border-radius: .25rem;
        border: .125rem solid transparent;
    }
    .show-data{
        flex:1;
        .progress{
            height: .75rem;
            // background-color: transparent;
        }
       :deep(.bg-primary){
            background-color: #cfcfcf !important;
        }
    }
    .usage-time{
        width: 7.8125rem;
        font-size: .875rem;
        align-self: end;
        margin-left: .625rem;
    }
}

.app-info:hover{
    cursor: pointer;
  .app-icon{
    // box-shadow: .1875rem .125rem .1875rem 0rem #cccc;
    border: .125rem solid rgb(248, 20, 61);
    transition: all 1s ease-out;
  }
  .app-name{
    color:rgb(248, 20, 61)
  }
  :deep(.bg-primary){
    background-color: rgb(233, 56, 88) !important;
  }
   .usage-time{
    color: rgb(248, 20, 61)
   }
}
</style>
