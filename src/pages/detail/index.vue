<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, Search } from 'lucide-vue-next'
import type { AppData, HoursLogModels } from '@@/type/types'
import { useAppDetail } from '@/hooks/useAppDetail'
import { Time, formatDate } from '@/utils/timerEvent'
import { useAppInfo } from '@/store/app'
import AppSelect from '@/components/AppSelect.vue'
import AppUsageTrend from '@/components/AppUsageTrend.vue'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import NoData from '@/components/NoData.vue'
import PageHeading from '@/components/layout/PageHeading.vue'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()
const start = ref(formatDate(new Date()).slice(0, 10))
const end = ref(start.value)
const query = ref('')
const category = ref('all')
const selectedApp = ref(String(route.query.app ?? ''))
const categories = ref<{ id: number, name: string }[]>([])
const categoryOptions = computed(() => [{ value: 'all', label: '全部分类' }, { value: '0', label: '未分类' }, ...categories.value.map(c => ({ value: String(c.id), label: c.name }))])
const data = ref<AppData[]>([])
const hourly = ref<HoursLogModels[]>([])
const busy = ref(false)
const savingAlias = ref(false)
const error = ref('')
const message = ref('')
const appliedRange = ref('')
const appliedStart = ref('')
const appliedEnd = ref('')
const selected = computed(() => useAppInfo().appInfoList.find(a => String(a.id) === selectedApp.value))
const alias = ref('')
watch(selected, (a) => {
  alias.value = a?.alias ?? ''
  message.value = ''
}, { immediate: true,
})
watch(() => route.query.app, (value) => {
  selectedApp.value = String(value ?? '')
})
const rows = computed(() => {
  const merged = new Map<number, AppData>()
  for (const row of data.value) {
    if ((selectedApp.value && String(row.id) !== selectedApp.value) || (category.value !== 'all' && String(row.categoryId) !== category.value) || !`${row.name} ${row.alias}`.toLowerCase().includes(query.value.toLowerCase()))
      continue
    const old = merged.get(row.id!)
    merged.set(row.id!, { ...row, totalTime: (old?.totalTime ?? 0) + row.totalTime,
    })
  }
  return [...merged.values()].sort((a, b) => b.totalTime - a.totalTime)
})
const history = computed(() => selectedApp.value ? data.value.filter(a => String(a.id) === selectedApp.value).sort((a, b) => b.date.localeCompare(a.date)) : [])
const total = computed(() => rows.value.reduce((sum, app) => sum + app.totalTime, 0))
function selectApp(id = '') {
  if (id) {
    query.value = ''
    category.value = 'all'
  }
  void router.replace({ query: { ...route.query, app: id || undefined } })
}

async function load() {
  if (busy.value)
    return
  if (!start.value || !end.value || start.value > end.value) {
    error.value = '请选择有效的起止日期'
    return
  }
  busy.value = true
  error.value = ''
  try {
    const first = start.value
    const last = end.value
    const [records, hours, categoryList] = await Promise.all([
      window.ipcRenderer.invoke('usageData:range', `${first} 00:00:00`, `${last} 00:00:00`),
      first === last ? window.ipcRenderer.invoke('usageData:hour', first) : Promise.resolve([]),
      window.ipcRenderer.invoke('categories:list'),
    ])
    data.value = await useAppDetail(records)
    hourly.value = hours
    categories.value = categoryList
    appliedStart.value = first
    appliedEnd.value = last
    appliedRange.value = first === last ? first : `${first} 至 ${last}`
  }
  catch (e) {
    error.value = String(e)
  }
  finally {
    busy.value = false
  }
}
async function saveAlias() {
  if (!selected.value || savingAlias.value)
    return
  savingAlias.value = true
  message.value = ''
  error.value = ''
  try {
    await window.ipcRenderer.invoke('apps:update', selected.value.id, alias.value, selected.value.categoryId)
    await load()
    if (!error.value)
      message.value = '别名已保存'
  }
  catch (e) {
    error.value = String(e)
  }
  finally {
    savingAlias.value = false
  }
}
onMounted(load)
</script>

<template>
  <div>
    <PageHeading title="应用详情">
      <template v-if="selectedApp" #actions>
        <Button variant="outline" @click="selectApp()">
          查看全部应用
        </Button>
      </template>
    </PageHeading>
    <div class="surface filter-panel">
      <DateRangeFilter v-model:start="start" v-model:end="end" :busy="busy || savingAlias" @apply="load" />
      <div v-if="!selectedApp" class="toolbar">
        <div class="search-field">
          <Search :size="16" aria-hidden="true" />
          <input v-model="query" type="search" placeholder="搜索应用或别名" aria-label="搜索应用或别名">
        </div>
        <AppSelect v-model="category" label="筛选分类" :options="categoryOptions" />
      </div>
    </div>
    <p v-if="error" role="alert" class="error-message">
      {{ error }}
    </p>
    <p v-if="appliedRange" class="text-sm text-muted-foreground my-4" aria-live="polite">
      {{ appliedRange }} · {{ rows.length }} 个应用 · 共 {{ Time.toString(total) }}
    </p>
    <div v-if="rows.length && !selectedApp" class="surface table-surface">
      <table class="data-table">
        <thead><tr><th>应用</th><th>分类</th><th>使用时间</th><th aria-label="打开应用详情" /></tr></thead><tbody>
          <tr v-for="a in rows" :key="a.id" class="cursor-pointer" @click="selectApp(String(a.id))">
            <td>
              <button class="text-left font-medium hover:underline" @click.stop="selectApp(String(a.id))">
                {{ a.alias || a.name }}
              </button>
            </td><td>{{ categories.find(c => c.id === a.categoryId)?.name || '未分类' }}</td><td class="whitespace-nowrap tabular-nums">
              {{ Time.toString(a.totalTime) }}
            </td>
            <td class="w-8" aria-hidden="true">
              <ChevronRight :size="14" class="text-muted-foreground" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <NoData v-else-if="!selectedApp && !busy && !error" title="暂无匹配的应用记录" description="可以扩大日期范围，或清除关键词和分类筛选。">
      <Button v-if="query || category !== 'all'" size="sm" variant="outline" class="mt-2" @click="query = ''; category = 'all'">
        清除筛选
      </Button>
    </NoData>
    <div v-if="selected" class="surface mt-4 p-4">
      <h2 class="section-title">
        {{ selected.alias || selected.name }}
      </h2>
      <p class="text-sm text-muted-foreground break-all my-2">
        {{ selected.file }}
      </p>
      <form class="toolbar" @submit.prevent="saveAlias">
        <input v-model="alias" maxlength="80" placeholder="应用别名" aria-label="应用别名"><Button size="sm" :disabled="busy || savingAlias || alias.trim() === (selected.alias || '')">
          保存别名
        </Button>
      </form>
      <p v-if="message" role="status" class="text-sm text-muted-foreground mb-3">
        {{ message }}
      </p>
      <AppUsageTrend v-if="history.length" :app-id="selected.id!" :start="appliedStart" :end="appliedEnd" :daily="data" :hourly="hourly" />
      <div v-if="history.length" class="surface table-surface">
        <table class="data-table">
          <thead><tr><th>日期</th><th>使用时间</th></tr></thead><tbody>
            <tr v-for="a in history" :key="a.date">
              <td>{{ a.date.slice(0, 10) }}</td><td>{{ Time.toString(a.totalTime) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <NoData v-else-if="!busy && !error" title="该日期范围内暂无使用记录" />
    </div>
    <NoData v-else-if="selectedApp && !busy && !error" title="找不到这个应用" />
  </div>
</template>
