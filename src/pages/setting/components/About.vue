<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { releaseHistory } from '@@/const/releaseHistory'
import { useUpdates } from '@/store/updates'
import { useSettings } from '@/store/settings'
import { Button } from '@/components/ui/button'

const logoUrl = `${import.meta.env.BASE_URL}logo.ico`
const updates = useUpdates()
const settings = useSettings()
const busy = computed(() => ['checking', 'downloading', 'installing'].includes(updates.state.phase))
const canCheck = computed(() => updates.state.enabled && !busy.value && updates.state.phase !== 'downloaded')
const canDownload = computed(() => updates.state.phase === 'available' || (updates.state.phase === 'error' && updates.state.failedStage === 'download'))
onMounted(() => void updates.initialize())
function goto(url: string) {
  window.ipcRenderer.send('open-url', url)
}
function size(bytes: number) {
  return `${(Math.max(0, bytes) / 1024 / 1024).toFixed(1)} MB`
}
function date(value: string) {
  const result = new Date(value)
  return Number.isFinite(result.getTime()) ? result.toLocaleString('zh-CN') : ''
}
</script>

<template>
  <div class="about-form">
    <div class="about-heading">
      <img :src="logoUrl" alt="" width="40" height="40">
      <div>
        <h2 class="text-xl font-semibold">
          TaiM
        </h2><p class="text-sm text-muted-foreground">
          当前版本 {{ updates.state.currentVersion || releaseHistory[0].version }}
        </p>
      </div>
    </div>
    <section class="update-panel" aria-labelledby="update-title">
      <h3 id="update-title" class="font-semibold">
        软件更新
      </h3>
      <label class="option-row"><span>启动后自动检查更新</span><input v-model="settings.config.common.autoCheckUpdates" type="checkbox" :disabled="settings.busy" @change="settings.save"></label>
      <p class="text-sm text-muted-foreground my-3">
        发现新版本后通知，由你决定何时下载和重启安装。
      </p>
      <p role="status" :class="updates.state.phase === 'error' ? 'error-message' : ''">
        {{ updates.state.message }}
      </p>
      <p v-if="updates.state.checkedAt" class="text-xs text-muted-foreground mt-2">
        上次检查：{{ date(updates.state.checkedAt) }}
      </p>
      <div v-if="updates.state.phase === 'downloading'" class="download-progress">
        <progress :value="updates.state.percent" max="100" aria-label="更新下载进度" />
        <p class="text-sm text-muted-foreground">
          {{ updates.state.percent.toFixed(1) }}% · {{ size(updates.state.transferred) }} / {{ size(updates.state.total) }} · {{ size(updates.state.bytesPerSecond) }}/s
        </p>
      </div>
      <div class="toolbar">
        <Button variant="outline" :disabled="!canCheck" @click="updates.command('updater:check')">
          <Loader2 v-if="updates.state.phase === 'checking'" class="w-4 h-4 mr-2 animate-spin" />检查更新
        </Button>
        <Button v-if="canDownload" @click="updates.command('updater:download')">
          {{ updates.state.failedStage === 'download' ? '重试下载' : '下载更新' }}
        </Button>
        <Button v-if="updates.state.phase === 'downloaded'" @click="updates.command('updater:install')">
          重启并安装
        </Button>
        <Button variant="link" @click="goto('https://github.com/badspider7/TaiM/releases')">
          打开发布页面
        </Button>
      </div>
      <p v-if="updates.state.phase === 'downloaded'" class="text-sm text-muted-foreground">
        点击安装会先保存统计数据并退出 TaiM，再启动安装程序。稍后安装可继续使用。
      </p>
      <p v-if="settings.error" role="alert" class="error-message">
        {{ settings.error }}
      </p>
    </section>
    <section v-if="updates.state.availableVersion" class="update-panel">
      <h3 class="font-semibold">
        新版本 {{ updates.state.availableVersion }} 更新说明
      </h3>
      <p v-if="updates.state.releaseDate" class="text-xs text-muted-foreground mt-2">
        {{ date(updates.state.releaseDate) }}
      </p>
      <pre class="release-notes">{{ updates.state.releaseNotes || '此版本未提供更新说明，可前往发布页面查看。' }}</pre>
    </section>
    <section class="update-panel" aria-labelledby="changelog-title">
      <h3 id="changelog-title" class="font-semibold mb-3">
        更新日志
      </h3>
      <details v-for="entry in releaseHistory" :key="entry.version" open>
        <summary class="cursor-pointer">
          {{ entry.version }} · {{ entry.date }} · {{ entry.title }}
        </summary>
        <ul class="list-disc pl-5 mt-3 space-y-2 text-sm">
          <li v-for="note in entry.notes" :key="note">
            {{ note }}
          </li>
        </ul>
      </details>
    </section>
    <div class="text-sm text-muted-foreground">
      <Button variant="link" @click="goto('https://github.com/badspider7/TaiM')">
        项目地址
      </Button>
      <Button variant="link" @click="goto('https://github.com/badspider7/TaiM/issues')">
        反馈问题
      </Button>
      <span>联系：1742969779@qq.com</span>
    </div>
  </div>
</template>

<style scoped>
.about-form { max-width: 900px; padding-bottom: 24px; }
.about-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.update-panel { border: 1px solid hsl(var(--border)); border-radius: 10px; padding: 16px; margin-bottom: 16px; }
.download-progress { margin: 16px 0; }
progress { width: 100%; height: 10px; accent-color: hsl(var(--primary)); }
.release-notes { white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; font-size: 14px; margin-top: 12px; user-select: text; }
</style>
