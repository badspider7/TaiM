<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/layout/Header.vue'
import SideBar from '@/components/layout/SideBar.vue'
import { useAppInfo } from '@/store/app'
import { useSettings } from '@/store/settings'
import { useUpdates } from '@/store/updates'
import UpdateNotice from '@/components/UpdateNotice.vue'

const updates = useUpdates()
const route = useRoute()
const content = ref<HTMLElement>()
watch([() => route.path, () => route.query.tab, () => route.query.app], () => {
  if (content.value)
    content.value.scrollTop = 0
}, { flush: 'post' })

onMounted(() => {
  const appInfo = useAppInfo()
  appInfo.getAppInfo()
  useSettings().load()
  void updates.initialize()
})
onUnmounted(() => updates.dispose())
</script>

<template>
  <Header />
  <UpdateNotice />
  <div class="app-container">
    <SideBar />
    <main ref="content" class="display-content" aria-label="页面内容">
      <router-view />
    </main>
  </div>
</template>

<style lang="scss">
@font-face {
  font-family: 'Questrial';
  src: url('@/assets/font/Questrial-Regular.ttf') format('truetype');
}
#app {
  display: flex;
  flex-direction: column;
  height: 100%;
  font: 14px/1.5 "Segoe UI Variable", "Segoe UI", "Microsoft YaHei UI", sans-serif;
}
.app-container {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.display-content {
  min-width: 0;
  overflow: auto;
  background: color-mix(in srgb, hsl(var(--background)) 70%, hsl(var(--secondary)));
  padding: 26px clamp(16px, 3vw, 42px) 32px;
}
.display-content > * {
  max-width: 1400px;
  margin-inline: auto;
}

// 修改全局的滚动条样式
body,
body * {
  &::-webkit-scrollbar-track-piece {
    background-color: hsl(var(--background));
  }

  &::-webkit-scrollbar {
    width: 10px;
    height: 8px;
  }

  &::-webkit-scrollbar-thumb {
    border: 2px solid hsl(var(--background));
    border-radius: 6px;
    background-color: hsl(var(--muted-foreground) / 0.5);
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: hsl(var(--muted-foreground) / 0.75);
  }
}
</style>
