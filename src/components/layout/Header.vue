<script setup lang='ts'>
import { onMounted, onUnmounted, ref } from 'vue'
import {
  CopySelect20Regular,
  Dismiss16Regular,
  Maximize16Regular,
  Subtract16Regular,
} from '@vicons/fluent'

const isMaxmize = ref(false)

function onMaximize(_event: unknown, value: boolean) {
  isMaxmize.value = value
}
onMounted(() => window.ipcRenderer.on('window.maximize', onMaximize))
onUnmounted(() => window.ipcRenderer.off('window.maximize', onMaximize))
function minimizeHandler() {
  window.ipcRenderer.invoke('titleBarControl:minimize')
}
async function maxmizeHandler() {
  isMaxmize.value = await window.ipcRenderer.invoke('titleBarControl:maximizeOrUnmaximize')
}
function closeHandler() {
  window.ipcRenderer.invoke('titleBarControl:close', 'hide')
}
</script>

<template>
  <div class="header-wrapper">
    <div class="header-left">
      <div class="header-logo">
        <svg-icon name="plum-blossom" />
      </div>
      <div class="header-title ">
        TaiM
      </div>
    </div>
    <div class="header-right">
      <button type="button" class="window-control" aria-label="最小化" @click="minimizeHandler">
        <Subtract16Regular />
      </button>
      <button type="button" class="window-control" :aria-label="isMaxmize ? '还原窗口' : '最大化'" @click="maxmizeHandler">
        <Maximize16Regular v-if="!isMaxmize" />
        <CopySelect20Regular v-else />
      </button>
      <button type="button" class="window-control" aria-label="关闭窗口" @click="closeHandler">
        <Dismiss16Regular />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header-wrapper{
    display: flex;
    justify-content: space-between;
    position: relative;
    width: 100%;
    flex: 0 0 44px;
    padding-inline: 12px;
    border-bottom: 1px solid hsl(var(--border));
    background-color: hsl(var(--card));
    user-select: none;
    -webkit-app-region: drag;
    .header-left{
      display: flex;
      align-items: center;
      gap: 4px;
      .header-logo{
        width: 24px;
        height: 24px;
      }
      .header-title{
       font-family: Questrial, sans-serif;
       font-size: 16px;
      }
    }

    .header-right{
    display: flex;
    align-items: center;
    gap: 10px;
     z-index: 1;
     -webkit-app-region: no-drag;
    .window-control{
      width:30px;
      height: 30px;
      border-radius: calc(var(--radius) - 4px);
      &:hover {
        background-color: hsl(var(--accent));
        color: hsl(var(--accent-foreground));
      }
      &:focus-visible {
        outline-offset: -2px;
      }
      svg{
        width: 16px;
        height: 100%;
        margin: auto;
      }
    }
    }
}
</style>
