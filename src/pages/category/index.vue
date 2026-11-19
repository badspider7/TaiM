<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { Search } from 'lucide-vue-next'
import { useAppInfo } from '@/store/app'
import { Time } from '@/utils/timerEvent'
import AppSelect from '@/components/AppSelect.vue'
import NoData from '@/components/NoData.vue'
import PageHeading from '@/components/layout/PageHeading.vue'
import { Button } from '@/components/ui/button'

interface Category {
  id: number
  name: string
}
const store = useAppInfo()
const categories = ref<Category[]>([])
const categoryOptions = computed(() => [{ value: '0', label: '未分类' }, ...categories.value.map(c => ({ value: String(c.id), label: c.name }))])
const name = ref('')
const editing = ref<number | null>(null)
const nameInput = ref<HTMLInputElement>()
const error = ref('')
const message = ref('')
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
  message.value = ''
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
    const wasEditing = editing.value !== null
    await window.ipcRenderer.invoke('categories:save', editing.value, name.value)
    name.value = ''
    editing.value = null
    await load()
    message.value = wasEditing ? '分类名称已更新' : '分类已创建'
  })
}
async function remove(c: Category) {
  // eslint-disable-next-line no-alert
  if (!window.confirm(`删除“${c.name}”？其中的应用将变为未分类。`))
    return
  await action(async () => {
    await window.ipcRenderer.invoke('categories:delete', c.id)
    await load()
    message.value = '分类已删除'
  })
}
async function assign(id: number, alias: string, value: string) {
  const categoryId = Number(value)
  await action(async () => {
    await window.ipcRenderer.invoke('apps:update', id, alias, categoryId)
    await load()
    message.value = '应用分类已更新'
  })
}
async function editCategory(category: Category) {
  editing.value = category.id
  name.value = category.name
  await nextTick()
  nameInput.value?.focus()
  nameInput.value?.select()
}
function total(id: number) {
  return Time.toString(store.appInfoList.filter(a => a.categoryId === id).reduce((sum, a) => sum + a.totalTime, 0))
}
</script>

<template>
  <div>
    <PageHeading title="分类" />
    <p v-if="error" role="alert" class="error-message">
      {{ error }}
    </p>
    <p v-if="message" role="status" class="mb-3 text-muted-foreground">
      {{ message }}
    </p>
    <div class="category-layout">
      <section class="surface p-4">
        <h2 class="section-title">
          管理分类
        </h2>
        <form class="toolbar" @submit.prevent="save">
          <input ref="nameInput" v-model="name" maxlength="40" placeholder="分类名称" aria-label="分类名称">
          <Button size="sm" :disabled="busy || !name.trim()">
            {{ editing === null ? '新建分类' : '保存名称' }}
          </Button>
          <Button v-if="editing !== null" type="button" size="sm" variant="ghost" @click="editing = null; name = ''">
            取消
          </Button>
        </form>
        <div class="option-row">
          <span>未分类</span><span class="text-sm text-muted-foreground">{{ total(0) }}</span>
        </div>
        <div v-for="c in categories" :key="c.id" class="option-row">
          <div class="min-w-0">
            <p class="break-words font-medium">
              {{ c.name }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ total(c.id) }}
            </p>
          </div>
          <div class="flex flex-wrap gap-1">
            <Button size="sm" variant="ghost" :disabled="busy" @click="editCategory(c)">
              重命名
            </Button>
            <Button size="sm" variant="ghost" class="text-[hsl(var(--danger-text))]" :disabled="busy" @click="remove(c)">
              删除
            </Button>
          </div>
        </div>
      </section>
      <section class="surface p-4">
        <h2 class="section-title mb-3">
          应用归类
        </h2>
        <div class="search-field">
          <Search :size="16" aria-hidden="true" />
          <input v-model="query" type="search" placeholder="搜索应用" aria-label="搜索应用">
        </div>
        <NoData v-if="!apps.length && !busy && !error" :title="query ? '没有匹配的应用' : '暂无应用记录'" />
        <div v-for="a in apps" :key="a.id" class="option-row">
          <span class="min-w-0 break-words">{{ a.alias || a.name }}</span>
          <AppSelect :model-value="String(a.categoryId)" :label="`${a.name}的分类`" :options="categoryOptions" :disabled="busy" class="w-36 shrink-0" @update:model-value="assign(a.id!, a.alias, $event)" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.category-layout { display: grid; align-items: start; gap: 14px; }
.category-layout .option-row:last-child { border-bottom: 0; padding-bottom: 0; }
@media (min-width: 1040px) {
  .category-layout { grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); }
}
</style>
