<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { releaseHistory } from '@@/const/releaseHistory'
import { useUpdates } from '@/store/updates'
import { useSettings } from '@/store/settings'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

const logoUrl = `${import.meta.env.BASE_URL}logo.ico`
const updates = useUpdates()
const settings = useSettings()
const latestLocalRelease = releaseHistory[0]
const busy = computed(() => ['checking', 'available', 'downloading', 'installing'].includes(updates.state.phase))
const canCheck = computed(() => updates.state.enabled && !busy.value && updates.state.phase !== 'downloaded')
const canRetryDownload = computed(() => updates.state.phase === 'error' && updates.state.failedStage === 'download')
const canRetryInstall = computed(() => updates.state.phase === 'error' && updates.state.failedStage === 'install')
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
          当前版本 {{ updates.state.currentVersion || latestLocalRelease.version }}
        </p>
      </div>
    </div>
    <section class="update-panel" aria-labelledby="update-title">
      <h3 id="update-title" class="font-semibold">
        软件更新
      </h3>
      <label class="option-row" for="auto-update"><span>启动后自动检查并下载更新</span><Switch id="auto-update" v-model:checked="settings.config.common.autoCheckUpdates" :disabled="settings.busy" @update:checked="settings.save" /></label>
      <p class="text-sm text-muted-foreground my-3">
        发现新版本后会在后台下载，完成后由你决定何时重启安装。
      </p>
      <p role="status" :class="updates.state.phase === 'error' ? 'error-message' : ''">
        {{ updates.state.message }}
      </p>
      <p v-if="updates.state.checkedAt" class="text-xs text-muted-foreground mt-2">
        上次检查：{{ date(updates.state.checkedAt) }}
      </p>
      <div v-if="updates.state.phase === 'downloading'" class="download-progress">
        <progress :value="updates.state.total > 0 ? updates.state.percent : undefined" max="100" aria-label="更新下载进度" />
        <p v-if="updates.state.total > 0" class="text-sm text-muted-foreground">
          {{ updates.state.percent.toFixed(1) }}% · {{ size(updates.state.transferred) }} / {{ size(updates.state.total) }} · {{ size(updates.state.bytesPerSecond) }}/s
        </p>
      </div>
      <div class="toolbar">
        <Button variant="outline" :disabled="!canCheck" @click="updates.command('updater:check')">
          <Loader2 v-if="updates.state.phase === 'checking'" class="w-4 h-4 mr-2 animate-spin" />检查更新
        </Button>
        <Button v-if="canRetryDownload" @click="updates.command('updater:download')">
          重试下载
        </Button>
        <Button v-if="updates.state.phase === 'downloaded' || canRetryInstall" @click="updates.command('updater:install')">
          {{ canRetryInstall ? '重试安装' : '重启并安装' }}
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
    <section class="update-panel" aria-labelledby="changelog-title">
      <h3 id="changelog-title" class="font-semibold mb-3">
        更新日志
      </h3>
      <template v-if="updates.state.availableVersion">
        <p>
          {{ updates.state.availableVersion }}<span v-if="updates.state.releaseDate"> · {{ date(updates.state.releaseDate) }}</span>
        </p>
        <pre class="release-notes">{{ updates.state.releaseNotes || '此版本未提供更新说明，可前往发布页面查看。' }}</pre>
      </template>
      <template v-else>
        <p>
          {{ latestLocalRelease.version }} · {{ latestLocalRelease.date }} · {{ latestLocalRelease.title }}
        </p>
        <ul class="list-disc pl-5 mt-3 space-y-2 text-sm">
          <li v-for="note in latestLocalRelease.notes" :key="note">
            {{ note }}
          </li>
        </ul>
      </template>
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
.update-panel { border: 1px solid hsl(var(--border)); border-radius: var(--radius); background: hsl(var(--card)); padding: 16px; margin-bottom: 12px; }
.download-progress { margin: 16px 0; }
progress { width: 100%; height: 10px; accent-color: hsl(var(--primary)); }
.release-notes { white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; font-size: 14px; margin-top: 12px; user-select: text; }
</style>
