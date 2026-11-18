<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAppInfo } from '@/store/app'
import { Time } from '@/utils/timerEvent'
import AppSelect from '@/components/AppSelect.vue'

interface Category {
  id: number
  name: string
}
const store = useAppInfo()
const categories = ref<Category[]>([])
const categoryOptions = computed(() => [{ value: '0', label: '未分类' }, ...categories.value.map(c => ({ value: String(c.id), label: c.name }))])
const name = ref('')
const editing = ref<number | null>(null)
const error = ref('')
const busy = ref(false)
const query = ref('')
const apps = computed(() => store.appInfoList.filter(a => `${a.name} ${a.alias}`.toLowerCase().includes(query.value.toLowerCase())))
async function load() {
  categories.value = await window.ipcRenderer.invoke('categories:list')
  await store.getAppInfo()
}
onMounted(() => void action(load))
async function action(fn: () => Promise<unknown>) {
  if (busy.value)
    return
  busy.value = true
  error.value = ''
  try {
    await fn()
  }
  catch (e) {
    error.value = String(e)
  }
  finally {
    busy.value = false
  }
}
async function save() {
  await action(async () => {
    await window.ipcRenderer.invoke('categories:save', editing.value, name.value)
    name.value = ''
    editing.value = null
    await load()
  })
}
async function remove(c: Category) {
  // eslint-disable-next-line no-alert
  if (!window.confirm(`删除“${c.name}”？其中的应用将变为未分类。`))
    return
  await action(async () => {
    await window.ipcRenderer.invoke('categories:delete', c.id)
    await load()
  })
}
async function assign(id: number, alias: string, value: string) {
  const categoryId = Number(value)
  await action(async () => {
    await window.ipcRenderer.invoke('apps:update', id, alias, categoryId)
    await load()
  })
}
function total(id: number) {
  return Time.toString(store.appInfoList.filter(a => a.categoryId === id).reduce((sum, a) => sum + a.totalTime, 0))
}
</script>

<template>
  <div class="page-scroll">
    <h1 class="text-lg mb-5">
      分类
    </h1>
    <form class="toolbar" @submit.prevent="save">
      <input v-model="name" maxlength="40" placeholder="分类名称" aria-label="分类名称"><button class="action-button" :disabled="busy || !name.trim()">
        {{ editing === null ? '新建分类' : '保存名称' }}
      </button><button v-if="editing !== null" type="button" class="action-button" @click="editing = null; name = ''">
        取消
      </button>
    </form>
    <p v-if="error" role="alert" class="error-message">
      {{ error }}
    </p>
    <div class="option-row">
      <span>未分类</span><span>{{ total(0) }}</span>
    </div>
    <div v-for="c in categories" :key="c.id" class="option-row">
      <span>{{ c.name }} · {{ total(c.id) }}</span><div class="flex gap-2">
        <button class="action-button" :disabled="busy" @click="editing = c.id; name = c.name">
          重命名
        </button><button class="action-button" :disabled="busy" @click="remove(c)">
          删除
        </button>
      </div>
    </div>
    <h2 class="mt-6 mb-3">
      应用归类
    </h2>
    <input v-model="query" placeholder="搜索应用" aria-label="搜索应用">
    <p v-if="!apps.length" class="text-muted-foreground my-6">
      暂无匹配的应用，开始使用软件后会自动记录。
    </p>
    <div v-for="a in apps" :key="a.id" class="option-row">
      <span class="min-w-0 break-all">{{ a.alias || a.name }}</span>
      <AppSelect :model-value="String(a.categoryId)" :label="`${a.name}的分类`" :options="categoryOptions" :disabled="busy" class="w-[180px] shrink-0" @update:model-value="assign(a.id!, a.alias, $event)" />
    </div>
  </div>
</template>
