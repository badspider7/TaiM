<script setup lang="ts">
import { useSettings } from '@/store/settings'

const settings = useSettings()
</script>

<template>
  <div class="settings-panel">
    <h2>常规设置</h2>
    <label class="option-row"><span>开机自启动 <small v-if="!settings.autoLaunchAvailable">（安装版中可用）</small></span><input v-model="settings.config.common.autoLaunch" type="checkbox" :disabled="!settings.autoLaunchAvailable || settings.busy" @change="settings.save"></label>
    <label class="option-row"><span>记住窗口大小</span><input v-model="settings.config.common.keepWindowSize" type="checkbox" :disabled="settings.busy" @change="settings.save"></label>
    <label class="option-row"><span>主题</span><select v-model="settings.config.common.theme" :disabled="settings.busy" @change="settings.save"><option value="light">浅色</option><option value="dark">深色</option><option value="system">跟随系统</option></select></label>
    <p class="text-sm text-muted-foreground mt-4">
      设置自动保存。界面语言目前为简体中文。
    </p>
    <p v-if="settings.error" role="alert" class="error-message">
      {{ settings.error }}
    </p>
  </div>
</template>
