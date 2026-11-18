<script setup lang="ts">
import { ref } from 'vue'
import { useSettings } from '@/store/settings'
import { useAppInfo } from '@/store/app'
import AppAutocomplete from '@/components/AppAutocomplete.vue'

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
    <h2>计时行为</h2>
    <label class="option-row"><span>空闲多少分钟后停止计时</span><input v-model.number="settings.config.actions.idleMinutes" type="number" min="1" max="60" :disabled="settings.busy" @change="settings.save"></label>
    <p class="text-sm text-muted-foreground my-3">
      锁屏和系统休眠时暂停；恢复操作后自动继续。忽略规则按应用名称或完整程序路径匹配，不区分大小写，不删除历史数据。
    </p>
    <h2>忽略应用</h2>
    <form class="toolbar" @submit.prevent="add">
      <AppAutocomplete v-model="ignored" :options="apps.appInfoList.map(a => a.name)" :disabled="settings.busy" label="忽略应用" placeholder="输入应用名称或完整路径" maxlength="260" />
      <button class="action-button" :disabled="settings.busy || !ignored.trim()">
        添加
      </button>
    </form>
    <div v-for="name in settings.config.actions.ignoredApps" :key="name" class="option-row">
      <span class="break-all">{{ name }}</span><button class="action-button" :disabled="settings.busy" @click="remove(name)">
        移除
      </button>
    </div>
    <p v-if="!settings.config.actions.ignoredApps.length" class="text-muted-foreground mt-4">
      尚未添加忽略应用
    </p>
    <p v-if="settings.error" role="alert" class="error-message">
      {{ settings.error }}
    </p>
  </div>
</template>
