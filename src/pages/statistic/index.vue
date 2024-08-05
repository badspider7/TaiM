<script setup lang='ts'>
import TabBar from './TabBar.vue'
</script>

<template>
  <div class="statistic-wrap">
    <div class="title font-middle text-lg">
      统计
    </div>
    <div class="app-body mt-5">
      <TabBar />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-body{
  height: calc(100% - 50px);
}
</style>
