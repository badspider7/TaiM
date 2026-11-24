<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { GripVertical, Search } from 'lucide-vue-next'
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
const selectedIds = ref<number[]>([])
const bulkCategory = ref('0')
const dragIds = ref<number[]>([])
const dropTarget = ref<number | null>(null)
const allVisibleSelected = computed(() => apps.value.length > 0 && apps.value.every(a => selectedIds.value.includes(a.id!)))
async function load() {
  categories.value = await window.ipcRenderer.invoke('categories:list')
  await store.getAppInfo()
  selectedIds.value = selectedIds.value.filter(id => store.appInfoList.some(a => a.id === id))
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
function toggleSelected(id: number) {
  selectedIds.value = selectedIds.value.includes(id) ? selectedIds.value.filter(value => value !== id) : [...selectedIds.value, id]
}
function toggleVisible() {
  const visible = apps.value.map(a => a.id!)
  selectedIds.value = allVisibleSelected.value ? selectedIds.value.filter(id => !visible.includes(id)) : [...new Set([...selectedIds.value, ...visible])]
}
async function assignMany(ids: number[], categoryId: number) {
  if (!ids.length)
    return
  const appIds = [...ids]
  await action(async () => {
    const result = await window.ipcRenderer.invoke('apps:batch-category', appIds, categoryId)
    await load()
    selectedIds.value = selectedIds.value.filter(id => !appIds.includes(id))
    message.value = `已将 ${result.updated} 个应用归类为${categoryOptions.value.find(option => Number(option.value) === categoryId)?.label}`
  })
}
function startDrag(event: DragEvent, id: number) {
  if (busy.value || !event.dataTransfer)
    return
  dragIds.value = selectedIds.value.includes(id) ? [...selectedIds.value] : [id]
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', `${dragIds.value.length} 个应用`)
}
function onDragOver(event: DragEvent, categoryId: number) {
  if (!dragIds.value.length || busy.value)
    return
  event.preventDefault()
  if (event.dataTransfer)
    event.dataTransfer.dropEffect = 'move'
  dropTarget.value = categoryId
}
function drop(event: DragEvent, categoryId: number) {
  event.preventDefault()
  const ids = [...dragIds.value]
  dragIds.value = []
  dropTarget.value = null
  void assignMany(ids, categoryId)
}
function endDrag() {
  dragIds.value = []
  dropTarget.value = null
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
        <div class="option-row category-target" :class="{ 'drop-target': dropTarget === 0 }" @dragover="onDragOver($event, 0)" @dragleave="dropTarget = null" @drop="drop($event, 0)">
          <span>未分类</span>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">{{ total(0) }}</span>
            <Button v-if="selectedIds.length" size="sm" variant="outline" :disabled="busy" @click="assignMany(selectedIds, 0)">
              归入
            </Button>
          </div>
        </div>
        <div v-for="c in categories" :key="c.id" class="option-row category-target" :class="{ 'drop-target': dropTarget === c.id }" @dragover="onDragOver($event, c.id)" @dragleave="dropTarget = null" @drop="drop($event, c.id)">
          <div class="min-w-0">
            <p class="break-words font-medium">
              {{ c.name }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ total(c.id) }}
            </p>
          </div>
          <div class="flex flex-wrap gap-1">
            <Button v-if="selectedIds.length" size="sm" variant="outline" :disabled="busy" @click="assignMany(selectedIds, c.id)">
              归入
            </Button>
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
        <div class="toolbar text-sm text-muted-foreground">
          <Button size="sm" variant="outline" :disabled="busy || !apps.length" @click="toggleVisible">
            {{ allVisibleSelected ? '取消选择搜索结果' : '选择搜索结果' }}
          </Button>
          <span v-if="selectedIds.length">已选 {{ selectedIds.length }} 个应用，可点击左侧“归入”或拖动应用到分类</span>
          <Button v-if="selectedIds.length" size="sm" variant="ghost" :disabled="busy" @click="selectedIds = []">
            清空选择
          </Button>
        </div>
        <div v-if="selectedIds.length" class="toolbar batch-toolbar">
          <AppSelect v-model="bulkCategory" label="批量目标分类" :options="categoryOptions" :disabled="busy" />
          <Button size="sm" :disabled="busy" @click="assignMany(selectedIds, Number(bulkCategory))">
            将 {{ selectedIds.length }} 个应用归入所选分类
          </Button>
        </div>
        <NoData v-if="!apps.length && !busy && !error" :title="query ? '没有匹配的应用' : '暂无应用记录'" />
        <div v-for="a in apps" :key="a.id" class="option-row app-choice" :class="{ 'selected-app': selectedIds.includes(a.id!) }" :draggable="!busy" @dragstart="startDrag($event, a.id!)" @dragend="endDrag">
          <div class="flex min-w-0 items-center gap-2">
            <GripVertical :size="16" class="shrink-0 text-muted-foreground" aria-hidden="true" />
            <input type="checkbox" :checked="selectedIds.includes(a.id!)" :aria-label="`选择${a.alias || a.name}`" :disabled="busy" @change="toggleSelected(a.id!)">
            <button type="button" class="min-w-0 break-words text-left" :disabled="busy" @click="toggleSelected(a.id!)">
              {{ a.alias || a.name }}
            </button>
          </div>
          <AppSelect :model-value="String(a.categoryId)" :label="`${a.name}的分类`" :options="categoryOptions" :disabled="busy" class="w-36 shrink-0" @update:model-value="assign(a.id!, a.alias, $event)" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.category-layout { display: grid; align-items: start; gap: 14px; }
.category-layout .option-row:last-child { border-bottom: 0; padding-bottom: 0; }
.category-target { border-radius: var(--radius); }
.drop-target, .selected-app { background: hsl(var(--accent)); }
.app-choice { cursor: grab; }
.app-choice:active { cursor: grabbing; }
.batch-toolbar { padding: 10px; border: 1px solid hsl(var(--border)); border-radius: var(--radius); }
@media (min-width: 1040px) {
  .category-layout { grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); }
}
</style>
