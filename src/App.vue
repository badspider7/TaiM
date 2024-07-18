<script setup lang="ts">
import Header from '@/components/layout/Header.vue'
</script>

<template>
  <Header />
  <router-view />
</template>

<style lang="scss">
@font-face {
  font-family: 'Questrial';
  src: url('@/assets/font/Questrial-Regular.ttf') format('truetype');
}
#app{
  width: 100%;
  height: 100%;
  padding: 0 15px;
  font-family: Questrial,sans-serif;
}
</style>
