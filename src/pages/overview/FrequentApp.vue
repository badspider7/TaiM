<script setup lang='ts'>
import { computed, onMounted, ref } from 'vue'
import type { AppData } from '@@/type/types'
import { Progress } from '@/components/ui/progress'
import { Time } from '@/utils/timerEvent'

const props = defineProps({
  appData: {
    type: Array as () => AppData[],
    default: () => [],
    required: true,
  },
})
// 最为频繁的，默认是前五个
const frequentlyApp = computed(() => {
  const tempAppInfo = props.appData
  return tempAppInfo.sort((a, b) => b.totalTime - a.totalTime).slice(0, 5)
})

onMounted(() => {
  console.log(frequentlyApp)
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
</script>

<template>
  <div class="frequent-app-list-wrap">
    <div class="title text-gray-400 text-base">
      最为频繁
    </div>
    <div class="app-list">
      <div v-for="item in frequentlyApp" :key="item.id" class="app-info">
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
  </div>
</template>

<style lang="scss" scoped>
.frequent-app-list-wrap{
    display: flex;
    flex-direction: column;
    height: calc(100% - 145px);
    margin-top: 16px;
}

.app-list{
    flex: 1;
    overflow: hidden auto;
}
.app-info{
    display: flex;
    align-items:center;
    margin: 20px 0;
    .app-icon{
        width: 50px;
        height: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #f0f0f0;
        margin-right: 16px;
        border-radius: 4px;
    }
    .show-data{
        flex:1;
        .progress{
            height: 12px;
            // background-color: transparent;
        }
       :deep(.bg-primary){
            background-color: #cfcfcf !important;
        }
    }
    .usage-time{
        width: 125px;
        font-size: 14px;
        align-self: end;
        margin-left: 10px;
    }
}

.app-info:hover{
    cursor: pointer;
  .app-icon{
    box-shadow: 3px 2px 3px 0px #cccc;
    transition: all 0.5s ease-in-out;
  }
  .app-name{
    color:rgb(248, 20, 61)
  }
  :deep(.bg-primary){
    background-color: rgb(248, 20, 61) !important;
  }
   .usage-time{
    color: rgb(248, 20, 61)
   }
}
</style>
