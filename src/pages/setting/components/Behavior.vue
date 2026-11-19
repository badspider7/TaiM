<script setup lang="ts">
import { ref } from 'vue'
import { useSettings } from '@/store/settings'
import { useAppInfo } from '@/store/app'
import AppAutocomplete from '@/components/AppAutocomplete.vue'
import { Button } from '@/components/ui/button'

const settings = useSettings()
const apps = useAppInfo()
const ignored = ref('')
function add() {
  const name = ignored.value.trim()
  if (!name || settings.busy)
    return
  if (!settings.config.actions.ignoredApps.some(n => n.toLowerCase() === name.toLowerCase()))
    settings.config.actions.ignoredApps.push(name)
  ignored.value = ''
  void settings.save()
}
function remove(name: string) {
  settings.config.actions.ignoredApps = settings.config.actions.ignoredApps.filter(n => n !== name)
  void settings.save()
}
</script>

<template>
  <div class="settings-panel">
    <section class="surface settings-card">
      <h2>计时行为</h2>
      <label class="option-row"><span>空闲后暂停计时</span><span class="flex items-center gap-2"><input v-model.number="settings.config.actions.idleMinutes" type="number" min="1" max="60" aria-label="空闲分钟数" :disabled="settings.busy" @change="settings.save">分钟</span></label>
      <p class="text-sm text-muted-foreground mt-3">
        锁屏和系统休眠时也会暂停，恢复操作后自动继续。
      </p>
    </section>
    <section class="surface settings-card">
      <h2>忽略应用</h2>
      <p class="text-sm text-muted-foreground mt-2">
        按应用名称或完整路径匹配，已有记录会保留。
      </p>
      <form class="toolbar" @submit.prevent="add">
        <AppAutocomplete v-model="ignored" :options="apps.appInfoList.map(a => a.name)" :disabled="settings.busy" label="忽略应用" placeholder="输入应用名称或完整路径" maxlength="260" />
        <Button size="sm" :disabled="settings.busy || !ignored.trim()">
          添加
        </Button>
      </form>
      <div v-for="name in settings.config.actions.ignoredApps" :key="name" class="option-row">
        <span class="break-all">{{ name }}</span><Button size="sm" variant="ghost" :disabled="settings.busy" @click="remove(name)">
          移除
        </Button>
      </div>
      <p v-if="!settings.config.actions.ignoredApps.length" class="text-sm text-muted-foreground mt-4">
        尚未添加忽略应用
      </p>
    </section>
    <p v-if="settings.error" role="alert" class="error-message">
      {{ settings.error }}
    </p>
  </div>
</template>
