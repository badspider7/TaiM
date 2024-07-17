<script setup lang='ts'>
import { ref } from 'vue'
</script>

<template>
  <div class="header-wrapper">
    <div class="header-left">
      <div class="header-logo" />
      <div class="header-title">
        TaiM
      </div>
    </div>
    <div class="header-right" />
  </div>
</template>

<style lang="scss" scoped>
.header-wrapper{
    width: 100%;
    height: 30px;
    background-color: #fff;
    border-bottom: 1px solid #eee;
    display: flex;
    -webkit-app-region: drag;
}
</style>
