<script setup lang="ts">
import Header from '@/components/layout/Header.vue'
import SideBar from '@/components/layout/SideBar.vue'
</script>

<template>
  <Header />
  <div class="app-container">
    <SideBar />
    <router-view class="display-content" />
  </div>
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
.app-container{
  display: flex;
  overflow: hidden;
  height: calc(100% - 70px);
  margin-top: 15px;
}

.display-content{
  flex:1;
}
</style>
