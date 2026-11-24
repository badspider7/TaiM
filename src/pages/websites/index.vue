<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Search } from 'lucide-vue-next'
import { Time, formatDate } from '@/utils/timerEvent'
import AppSelect from '@/components/AppSelect.vue'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import NoData from '@/components/NoData.vue'
import PageHeading from '@/components/layout/PageHeading.vue'
import { Button } from '@/components/ui/button'

interface Row { browser: string, url: string, domain: string, title: string, time: number, pageCount: number }
const start = ref(formatDate(new Date()).slice(0, 10))
const end = ref(start.value)
const group = ref('domain')
const selectedDomain = ref('')
const query = ref('')
const data = ref<Row[]>([])
const status = ref({ enabled: false, listening: false, connected: false, error: '', port: 17384 })
const busy = ref(false)
const message = ref('')
const error = ref('')
const applied = ref<{ start: string, end: string }>()
const rows = computed(() => data.value.filter(r => (!selectedDomain.value || r.domain === selectedDomain.value)
  && `${r.domain} ${r.url} ${r.title} ${r.browser}`.toLowerCase().includes(query.value.toLowerCase())))
const connection = computed(() => !status.value.enabled ? '未开启' : !status.value.listening ? '连接服务未启动' : status.value.connected ? '扩展已连接' : '等待扩展连接')
const total = computed(() => rows.value.reduce((sum, row) => sum + row.time, 0))
const dateLabel = computed(() => applied.value && (applied.value.start === applied.value.end ? applied.value.start : `${applied.value.start} 至 ${applied.value.end}`))
let timer: ReturnType<typeof setInterval> | undefined
async function refreshStatus() {
  status.value = await window.ipcRenderer.invoke('websites:status')
}
async function load(range: { start: string, end: string }) {
  if (!range.start || !range.end || range.start > range.end) {
    error.value = '请选择有效的起止日期'
    return
  }
  data.value = await window.ipcRenderer.invoke('websites:range', range.start, range.end, group.value)
  applied.value = range
}
function changeGroup() {
  selectedDomain.value = ''
  void run('regroup')
}
function showDomain(domain: string) {
  group.value = 'url'
  selectedDomain.value = domain
  query.value = ''
  void run('regroup')
}
async function run(action: 'load' | 'regroup' | 'enable' | 'export' | 'clear') {
  if (busy.value)
    return
  busy.value = true
  message.value = ''
  error.value = ''
  try {
    if (action === 'enable') {
      status.value = await window.ipcRenderer.invoke('websites:enable', !status.value.enabled)
    }
    else if (action === 'export') {
      if (!applied.value)
        return
      const result = await window.ipcRenderer.invoke('websites:export', applied.value.start, applied.value.end)
      if (result.path)
        message.value = `已导出：${result.path}`
    }
    else if (action === 'clear') {
      const result = await window.ipcRenderer.invoke('websites:clear')
      if (result.cleared) {
        data.value = []
        selectedDomain.value = ''
        message.value = '已清空网站记录'
      }
    }
    else {
      const range = action === 'regroup' && applied.value ? applied.value : { start: start.value, end: end.value }
      await load(range)
    }
  }
  catch (e) { error.value = String(e) }
  finally { busy.value = false }
}
onMounted(() => {
  void run('load')
  void refreshStatus().catch(e => error.value = String(e))
  timer = setInterval(() => {
    void refreshStatus().catch(e => error.value = String(e))
  }, 3000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div>
    <PageHeading title="网站停留时间">
      <template #actions>
        <span role="status" class="pill" :data-tone="status.error ? 'error' : status.connected ? 'connected' : undefined">
          <span class="pill-dot" aria-hidden="true" />{{ connection }}
        </span>
        <Button :variant="status.enabled ? 'outline' : 'default'" size="sm" :disabled="busy" @click="run('enable')">
          {{ status.enabled ? '暂停计时' : '开启计时' }}
        </Button>
        <router-link to="/websites/help" class="action-button">
          使用说明 / 扩展下载
        </router-link>
      </template>
    </PageHeading>
    <p v-if="status.error" role="alert" class="error-message mt-3">
      {{ status.error }}
    </p>
    <div class="surface filter-panel">
      <DateRangeFilter v-model:start="start" v-model:end="end" label-prefix="网站" :busy="busy" @apply="run('load')" />
      <div class="toolbar">
        <div class="search-field">
          <Search :size="16" aria-hidden="true" />
          <input v-model="query" type="search" placeholder="搜索域名、网址或标题" aria-label="搜索网站">
        </div>
        <AppSelect v-model="group" label="网站汇总方式" :options="[{ value: 'domain', label: '按网站汇总' }, { value: 'url', label: '按具体网址' }]" :disabled="busy" @change="changeGroup" />
      </div>
    </div>
    <p v-if="error" role="alert" class="error-message">
      {{ error }}
    </p>
    <p v-if="message" role="status" class="text-sm break-all my-3">
      {{ message }}
    </p>
    <div v-if="applied" class="toolbar justify-between">
      <div class="text-sm text-muted-foreground">
        <p aria-live="polite">
          {{ dateLabel }} · {{ rows.length }} 项 · 共 {{ Time.toString(total) }}
        </p>
        <button v-if="selectedDomain" class="mt-1 break-all text-left underline" @click="selectedDomain = ''">
          {{ selectedDomain }} · 查看全部网站
        </button>
      </div>
      <Button variant="outline" size="sm" :disabled="busy" @click="run('export')">
        导出日期范围 CSV
      </Button>
    </div>
    <div v-if="rows.length" class="surface table-surface">
      <table class="data-table website-table">
        <thead><tr><th>{{ group === 'url' ? '页面标题 / 网址' : '域名 / 主要页面' }}</th><th>浏览器</th><th>停留时间</th></tr></thead>
        <tbody>
          <tr v-for="r in rows" :key="`${r.browser}/${r.url || r.domain}`">
            <td>
              <span class="break-all">{{ group === 'url' ? r.title || '未命名页面' : r.domain }}</span>
              <p class="text-sm text-muted-foreground mt-1 break-all">
                {{ group === 'url' ? r.url : `主要页面：${r.title || '暂无标题'}` }}
              </p>
              <button v-if="group === 'domain'" class="text-sm text-muted-foreground underline mt-1" :disabled="busy" @click="showDomain(r.domain)">
                查看 {{ r.pageCount }} 个页面
              </button>
            </td>
            <td>{{ r.browser === 'edge' ? 'Edge' : 'Chrome' }}</td><td class="tabular-nums">
              {{ Time.toString(r.time) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <NoData v-else-if="!busy && !error" :title="query ? '暂无匹配的网站记录' : '该日期范围内暂无网站记录'" :description="query ? '试试其他关键词，或扩大日期范围。' : status.connected ? '在前台浏览普通网页后，点击查询 / 刷新。' : '连接浏览器扩展后即可记录前台网页。'">
      <Button v-if="query" size="sm" variant="outline" class="mt-2" @click="query = ''">
        清除搜索
      </Button>
      <router-link v-else-if="!status.connected" to="/websites/help" class="action-button mt-2">
        查看连接方法
      </router-link>
    </NoData>
    <details class="mt-4 surface p-4 text-sm">
      <summary class="cursor-pointer font-medium">
        管理网站记录
      </summary>
      <div class="toolbar mb-0">
        <Button variant="outline" size="sm" class="text-[hsl(var(--danger-text))]" :disabled="busy" @click="run('clear')">
          清空全部网站记录
        </Button>
        <p class="text-muted-foreground">
          清空后会保留应用使用记录。
        </p>
      </div>
    </details>
  </div>
</template>

<style scoped>
.website-table { table-layout: fixed; min-width: 430px; }
.website-table th:first-child { width: 66%; }
</style>
