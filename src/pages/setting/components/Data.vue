<script setup lang="ts">
import { ref } from 'vue'
import { useAppInfo } from '@/store/app'
import { Button } from '@/components/ui/button'

const busy = ref(false)
const message = ref('')
const error = ref('')
async function run(channel: string, format?: string) {
  busy.value = true
  message.value = ''
  error.value = ''
  try {
    const result = await window.ipcRenderer.invoke(channel, format)
    if (result?.canceled)
      return
    message.value = result?.path ? `已导出：${result.path}` : result?.backupPath ? `恢复成功，原数据备份：${result.backupPath}` : '已打开数据目录'
    if (channel === 'data:import')
      await useAppInfo().getAppInfo()
  }
  catch (e) { error.value = `操作失败：${String(e)}` }
  finally { busy.value = false }
}
</script>

<template>
  <div class="settings-panel">
    <section class="surface settings-card">
      <h2>备份与导出</h2>
      <p class="text-sm text-muted-foreground my-4">
        JSON 用于恢复应用、分类和网站记录。CSV 用于分析应用记录，网站 CSV 可在网站页导出。
      </p>
      <div class="toolbar">
        <Button size="sm" :disabled="busy" @click="run('data:export', 'json')">
          导出 JSON 备份
        </Button><Button size="sm" variant="outline" :disabled="busy" @click="run('data:export', 'csv')">
          导出 CSV
        </Button>
      </div>
      <p class="text-sm text-muted-foreground">
        备份范围为统计记录与分类。主题、忽略规则和浏览器配对码各自保存在本机设置中。
      </p>
    </section>
    <section class="surface settings-card">
      <h2>
        恢复统计数据
      </h2>
      <p class="text-sm text-muted-foreground my-4">
        恢复会替换当前统计数据。确认后，TaiM 会先保留替换前的数据库。
      </p>
      <div class="toolbar">
        <Button size="sm" variant="outline" :disabled="busy" @click="run('data:import')">
          选择 JSON 备份
        </Button><Button size="sm" variant="ghost" :disabled="busy" @click="run('data:folder')">
          打开数据目录
        </Button>
      </div>
    </section>
    <p v-if="error" role="alert" class="error-message break-all">
      {{ error }}
    </p>
    <p v-if="message" role="status" class="mt-4 text-sm break-all">
      {{ message }}
    </p>
  </div>
</template>
