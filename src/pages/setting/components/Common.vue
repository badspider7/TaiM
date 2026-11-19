<script setup lang="ts">
import { useSettings } from '@/store/settings'
import AppSelect from '@/components/AppSelect.vue'
import { Switch } from '@/components/ui/switch'

const settings = useSettings()
</script>

<template>
  <div class="settings-panel">
    <section class="surface settings-card">
      <h2>外观</h2>
      <div class="option-row">
        <span>主题</span>
        <AppSelect v-model="settings.config.common.theme" label="主题" :options="[{ value: 'light', label: '浅色' }, { value: 'dark', label: '深色' }, { value: 'system', label: '跟随系统' }]" :disabled="settings.busy" @change="settings.save" />
      </div>
    </section>
    <section class="surface settings-card">
      <h2>启动与窗口</h2>
      <label class="option-row" for="auto-launch"><span>开机自启动 <small v-if="!settings.autoLaunchAvailable" class="text-muted-foreground">（安装版中可用）</small></span><Switch id="auto-launch" v-model:checked="settings.config.common.autoLaunch" :disabled="!settings.autoLaunchAvailable || settings.busy" @update:checked="settings.save" /></label>
      <label class="option-row" for="remember-window"><span>记住窗口大小</span><Switch id="remember-window" v-model:checked="settings.config.common.keepWindowSize" :disabled="settings.busy" @update:checked="settings.save" /></label>
    </section>
    <p v-if="settings.error" role="alert" class="error-message">
      {{ settings.error }}
    </p>
  </div>
</template>
