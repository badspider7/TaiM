<script setup lang='ts'>
const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  data: {
    type: Number,
    default: 0,
  },
  rate: {
    type: Number,
    default: 0,
  },
  unit: {
    type: String,
  },
  showAppIcon: {
    type: Boolean,
    default: false,
  },
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
        <div v-if="!showAppIcon" class="rate  text-red-500">
          {{ rate }}%
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
