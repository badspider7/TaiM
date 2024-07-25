<script setup lang='ts'>
import { ArrowDown20Regular, ArrowUp20Regular } from '@vicons/fluent'
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  data: {
    type: [String, Number],
    default: '',
  },
  previousDelta: {
    type: String,
    default: '',
  },
  unit: {
    type: String,
  },
  showAppIcon: {
    type: Boolean,
    default: false,
  },
})

// 判断是否大于0
const isPositive = computed(() => {
  return Number(props.previousDelta) >= 0
})
</script>

<template>
  <div class="card shadow-inner">
    <div class="total">
      <div class="title flex flex-row gap-y-1.5 ">
        <div class="icon">
          <slot name="iconSlot" />
        </div>
        <div>{{ title }}</div>
      </div>
      <div class="data flex flex-row justify-between" :class="[showAppIcon ? 'items-center' : 'items-end']">
        <div class="time">
          <span class="text-2xl ">{{ data }}</span>
          <span class=" text-sm text-gray-400">{{ unit }}</span>
        </div>
        <div v-if="!showAppIcon" class="rate flex flex-row items-center " :class="[isPositive ? 'text-green-500' : 'text-red-500']">
          <span>
            <ArrowDown20Regular v-if="!isPositive" class="w-4 h-4" />
            <ArrowUp20Regular v-else class="w-4 h-4" />
          </span>
          {{ previousDelta }}
        </div>
        <div v-else>
          <slot name="appIcon" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
    .card{
        width: 12.5rem;
        height: 4.375rem;
        background-color: #fff;
        border-radius: .5rem;
        padding: .625rem;
        border: .0625rem solid #ccc;
    }
</style>
