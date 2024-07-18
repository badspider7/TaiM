<script setup lang='ts'>
import { ref } from 'vue'
import {
  CopySelect20Regular,
  Dismiss16Regular,
  Maximize16Regular,
  Subtract16Regular,
} from '@vicons/fluent'

const isMaxmize = ref(false)

function isWinMaxmize() {
  window.ipcRenderer.on('window.maximize', (event, value) => {
    isMaxmize.value = value
  })
}
function minimizeHandler() {
  window.ipcRenderer.invoke('titleBarControl:minimize')
  isWinMaxmize()
}
async function maxmizeHandler() {
  isMaxmize.value = await window.ipcRenderer.invoke('titleBarControl:maximizeOrUnmaximize')
  isWinMaxmize()
}
function closeHandler() {
  window.ipcRenderer.invoke('titleBarControl:close', 'hide')
  isWinMaxmize()
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
      <div class="minimize  hover:bg-shallow-gray rounded" @click="minimizeHandler">
        <Subtract16Regular />
      </div>
      <div class="maxmzie  hover:bg-shallow-gray rounded" @click="maxmizeHandler">
        <Maximize16Regular v-if="!isMaxmize" />
        <CopySelect20Regular v-else />
      </div>
      <div class="hide-window  hover:bg-shallow-gray rounded" @click="closeHandler">
        <Dismiss16Regular />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header-wrapper{
    display: flex;
    justify-content: space-between;
    position: relative;
    width: 100%;
    height: 40px;
    background-color: #fff;
    border-bottom: 1px solid #eee;
    -webkit-app-region: drag;
    .header-left{
      display: flex;
      align-items: flex-end;
      color: var(--font-color);
      padding: 5px;
      .header-logo{
        width: 24px;
        height: 24px;
      }
      .header-title{
       font-size: var(--font-14);
      }
    }

    .header-right{
    display: flex;
    align-items: center;
    gap: 10px;
     z-index: 1;
     -webkit-app-region: no-drag;
    .minimize,.maxmzie,.hide-window{
      width:30px;
      height: 30px;
      svg{
        width: 16px;
        height: 100%;
        margin: auto;
      }
    }
    }
}
</style>
