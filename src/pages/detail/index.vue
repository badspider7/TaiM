<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { AppData } from '@@/type/types'
import { useAppDetail } from '@/hooks/useAppDetail'
import { Time, formatDate } from '@/utils/timerEvent'
import { useAppInfo } from '@/store/app'
import AppSelect from '@/components/AppSelect.vue'

const route = useRoute()
const start = ref(formatDate(new Date()).slice(0, 10))
const end = ref(start.value)
const query = ref('')
const category = ref('all')
const selectedApp = ref(String(route.query.app ?? ''))
const categories = ref<{ id: number, name: string }[]>([])
const categoryOptions = computed(() => [{ value: 'all', label: '全部分类' }, { value: '0', label: '未分类' }, ...categories.value.map(c => ({ value: String(c.id), label: c.name }))])
const data = ref<AppData[]>([])
const busy = ref(false)
const error = ref('')
const selected = computed(() => useAppInfo().appInfoList.find(a => String(a.id) === selectedApp.value))
const alias = ref('')
watch(selected, (a) => {
  alias.value = a?.alias ?? ''
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
async function load() {
  if (!start.value || !end.value || start.value > end.value) {
    error.value = '请选择有效的起止日期'
    return
  }
  busy.value = true
  error.value = ''
  try {
    const records = await window.ipcRenderer.invoke('usageData:range', `${start.value} 00:00:00`, `${end.value} 00:00:00`)
    data.value = await useAppDetail(records)
    categories.value = await window.ipcRenderer.invoke('categories:list')
  }
  catch (e) {
    error.value = String(e)
  }
  finally {
    busy.value = false
  }
}
async function saveAlias() {
  if (!selected.value)
    return
  try {
    await window.ipcRenderer.invoke('apps:update', selected.value.id, alias.value, selected.value.categoryId)
    await load()
  }
  catch (e) {
    error.value = String(e)
  }
}
onMounted(load)
</script>

<template>
  <div class="page-scroll">
    <h1 class="text-lg mb-5">
      应用详情
    </h1>
    <form class="toolbar" @submit.prevent="load">
      <input v-model="start" type="date" aria-label="开始日期"><span>至</span><input v-model="end" type="date" aria-label="结束日期"><button class="action-button" :disabled="busy">
        {{ busy ? '加载中…' : '查询 / 刷新' }}
      </button>
    </form>
    <div class="toolbar">
      <input v-model="query" placeholder="搜索应用或别名" aria-label="搜索应用或别名">
      <AppSelect v-model="category" label="筛选分类" :options="categoryOptions" />
      <button v-if="selectedApp" class="action-button" @click="selectedApp = ''">
        查看全部应用
      </button>
    </div>
    <p v-if="error" role="alert" class="error-message">
      {{ error }}
    </p>
    <p class="text-sm text-muted-foreground my-4">
      {{ rows.length }} 个应用 · 总计 {{ Time.toString(rows.reduce((s, a) => s + a.totalTime, 0)) }}
    </p>
    <table v-if="rows.length" class="data-table">
      <thead><tr><th>应用</th><th>分类</th><th>使用时间</th></tr></thead><tbody>
        <tr v-for="a in rows" :key="a.id" class="cursor-pointer" @click="selectedApp = String(a.id)">
          <td>
            <button class="text-left" @click.stop="selectedApp = String(a.id)">
              {{ a.alias || a.name }}
            </button>
          </td><td>{{ categories.find(c => c.id === a.categoryId)?.name || '未分类' }}</td><td>{{ Time.toString(a.totalTime) }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else-if="!busy" class="text-muted-foreground my-8">
      该日期范围内暂无匹配记录。
    </p>
    <div v-if="selected" class="mt-6">
      <h2>{{ selected.name }}</h2><p class="text-sm text-muted-foreground break-all my-2">
        {{ selected.file }}
      </p>
      <form class="toolbar" @submit.prevent="saveAlias">
        <input v-model="alias" maxlength="80" placeholder="应用别名" aria-label="应用别名"><button class="action-button" :disabled="busy">
          保存别名
        </button>
      </form>
      <table v-if="history.length" class="data-table">
        <thead><tr><th>日期</th><th>使用时间</th></tr></thead><tbody>
          <tr v-for="a in history" :key="a.date">
            <td>{{ a.date.slice(0, 10) }}</td><td>{{ Time.toString(a.totalTime) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
