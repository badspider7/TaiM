<script setup lang="ts">
import { onMounted } from 'vue'
import Header from '@/components/layout/Header.vue'
import SideBar from '@/components/layout/SideBar.vue'
import { useAppInfo } from '@/store/app'

onMounted(() => {
  const appInfo = useAppInfo()
  appInfo.getAppInfo()
})
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

// 修改全局的滚动条样式
body,
body * {
  &::-webkit-scrollbar-track-piece {
    background-color: #fff;
    -webkit-border-radius: 0;
  }

  &::-webkit-scrollbar {
    width: 10px;
    height: 8px;
  }

  &::-webkit-scrollbar-thumb:vertical {
    height: 50px;
    background-color: rgba(153, 153, 153, 0.5);
    -webkit-border-radius: 4px;
    outline: 2px solid #fff;
    outline-offset: -2px;
    border: 2px solid #fff;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(159, 159, 159, 0.3);
    -webkit-border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(159, 159, 159, 0.5);
    -webkit-border-radius: 4px;
  }
}
</style>
