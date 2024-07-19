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
  margin-top: 5px;
}

.display-content{
  flex:1;
  margin-left: 20px;
  border: 1.5px solid #d9d9d9;
  border-radius: 8px;
  // box-shadow: 2px 2px 3px 2px #cdcccc;
  padding: 20px 10px 0 10px;
}
</style>
