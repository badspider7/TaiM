<script setup lang="ts">
import { ref } from 'vue'
import { useAppInfo } from '@/store/app'

const busy = ref(false)
const message = ref('')
async function run(channel: string, format?: string) {
  busy.value = true
  message.value = ''
  try {
    const result = await window.ipcRenderer.invoke(channel, format)
    if (result?.canceled)
      return
    message.value = result?.path ? `已导出：${result.path}` : result?.backupPath ? `恢复成功，原数据备份：${result.backupPath}` : '已打开数据目录'
    if (channel === 'data:import')
      await useAppInfo().getAppInfo()
  }
  catch (e) { message.value = `操作失败：${String(e)}` }
  finally { busy.value = false }
}
</script>

<template>
  <div class="settings-panel">
    <h2>备份与导出</h2>
    <p class="text-sm text-muted-foreground my-4">
      JSON 包含所有应用、分类、应用及网站小时记录，可用于恢复。CSV 可用 Excel 打开，用于分析；网站 CSV 在网站页面导出。备份不包含通用设置、忽略规则与浏览器配对密钥。
    </p>
    <div class="toolbar">
      <button class="action-button" :disabled="busy" @click="run('data:export', 'json')">
        导出 JSON 备份
      </button><button class="action-button" :disabled="busy" @click="run('data:export', 'csv')">
        导出 CSV
      </button>
    </div>
    <h2 class="mt-6">
      恢复统计数据
    </h2>
    <p class="text-sm text-muted-foreground my-4">
      恢复会替换当前统计数据。系统会先校验备份、请求确认，并自动保留替换前的数据库；失败时回滚。
    </p>
    <div class="toolbar">
      <button class="action-button" :disabled="busy" @click="run('data:import')">
        选择 JSON 备份
      </button><button class="action-button" :disabled="busy" @click="run('data:folder')">
        打开数据目录
      </button>
    </div>
    <p v-if="message" role="status" class="mt-4 text-sm break-all">
      {{ message }}
    </p>
  </div>
</template>
