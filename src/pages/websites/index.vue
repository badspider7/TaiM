<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Time, formatDate } from '@/utils/timerEvent'

interface Row { browser: string, url: string, domain: string, title: string, time: number, pageCount: number }
const start = ref(formatDate(new Date()).slice(0, 10))
const end = ref(start.value)
const group = ref('url')
const selectedDomain = ref('')
const query = ref('')
const data = ref<Row[]>([])
const status = ref({ enabled: false, listening: false, connected: false, error: '', port: 17384 })
const busy = ref(false)
const message = ref('')
const error = ref('')
const rows = computed(() => data.value.filter(r => (!selectedDomain.value || r.domain === selectedDomain.value)
  && `${r.domain} ${r.url} ${r.title} ${r.browser}`.toLowerCase().includes(query.value.toLowerCase())))
const connection = computed(() => !status.value.enabled ? '未开启' : !status.value.listening ? '连接服务未启动' : status.value.connected ? '扩展已连接' : '等待扩展连接')
let timer: ReturnType<typeof setInterval> | undefined
async function refreshStatus() {
  status.value = await window.ipcRenderer.invoke('websites:status')
}
async function load() {
  data.value = await window.ipcRenderer.invoke('websites:range', start.value, end.value, group.value)
  await refreshStatus()
}
function changeGroup() {
  selectedDomain.value = ''
  void run('load')
}
function showDomain(domain: string) {
  group.value = 'url'
  selectedDomain.value = domain
  query.value = ''
  void run('load')
}
async function run(action: string) {
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
      const result = await window.ipcRenderer.invoke('websites:export', start.value, end.value)
      if (result.path)
        message.value = `已导出：${result.path}`
    }
    else if (action === 'clear') {
      await window.ipcRenderer.invoke('websites:clear')
    }
    await load()
  }
  catch (e) { error.value = String(e) }
  finally { busy.value = false }
}
onMounted(() => {
  void run('load')
  timer = setInterval(() => {
    void refreshStatus().catch(e => error.value = String(e))
  }, 3000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="page-scroll">
    <div class="website-heading">
      <h1 class="text-lg">
        网站停留时间
      </h1>
      <div class="website-controls text-sm">
        <span role="status" class="text-muted-foreground">{{ connection }}</span>
        <button class="action-button" :disabled="busy" @click="run('enable')">
          {{ status.enabled ? '暂停计时' : '开启计时' }}
        </button>
        <router-link to="/websites/help" class="text-muted-foreground underline">
          使用说明 / 扩展下载
        </router-link>
      </div>
    </div>
    <p v-if="status.error" role="alert" class="error-message mt-3">
      {{ status.error }}
    </p>
    <form class="toolbar mt-5" @submit.prevent="run('load')">
      <input v-model="start" type="date" aria-label="网站开始日期"><span>至</span>
      <input v-model="end" type="date" aria-label="网站结束日期">
      <select v-model="group" aria-label="网站汇总方式" :disabled="busy" @change="changeGroup">
        <option value="domain">
          按域名汇总
        </option>
        <option value="url">
          按具体网址
        </option>
      </select>
      <button class="action-button" :disabled="busy">
        {{ busy ? '加载中…' : '查询 / 刷新' }}
      </button>
    </form>
    <div class="toolbar">
      <input v-model="query" placeholder="搜索域名、网址或标题" aria-label="搜索网站">
      <button class="action-button" :disabled="busy" @click="run('export')">
        导出该日期范围 CSV
      </button>
      <button class="action-button" :disabled="busy" @click="run('clear')">
        清空全部网站记录
      </button>
    </div>
    <p v-if="error" role="alert" class="error-message">
      {{ error }}
    </p>
    <p v-if="message" role="status" class="text-sm break-all my-3">
      {{ message }}
    </p>
    <p class="text-sm text-muted-foreground my-4">
      {{ rows.length }} 项 · 总计 {{ Time.toString(rows.reduce((sum, r) => sum + r.time, 0)) }}
      <button v-if="selectedDomain" class="ml-3 underline" @click="selectedDomain = ''">
        {{ selectedDomain }} · 查看全部网站
      </button>
    </p>
    <table v-if="rows.length" class="data-table website-table">
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
          <td>{{ r.browser === 'edge' ? 'Edge' : 'Chrome' }}</td><td>{{ Time.toString(r.time) }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else-if="!busy" class="text-muted-foreground my-8">
      暂无匹配的网站记录。连接扩展后，在前台浏览普通网页，再查询 / 刷新。
      <router-link v-if="!status.connected" to="/websites/help" class="underline">
        查看连接方法
      </router-link>
    </p>
  </div>
</template>

<style scoped>
.website-heading, .website-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.website-heading { justify-content: space-between; }
.website-table { table-layout: fixed; }
.website-table th:first-child { width: 66%; }
</style>
