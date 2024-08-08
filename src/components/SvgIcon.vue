<script setup lang="ts">
import type { Component } from 'vue'
import { computed, getCurrentInstance, nextTick, ref, useAttrs, watch } from 'vue'

const props = withDefaults(defineProps<{ name: string }>(), {})

const modules = import.meta.glob('@/assets/icons/svg/*.svg', {
  as: 'component',
  eager: true,
})

const attrs = useAttrs()
const instance = getCurrentInstance()

const svgRef = ref()

const currentComponent = computed<Component | undefined>(() => {
  const fileName = `/${props.name}.svg`
  for (const path in modules) {
    const mod = modules[path]
    if (path.endsWith(fileName)) {
      return mod as Component
    }
  }
  console.log(`not found svg file:${fileName}`)
  return undefined
})

// data-v-hash
let scopeId = ''
if (instance?.type) {
  // __scopeId 存在的条件是 <style scoped>
  const __scopeId = (instance?.type as { __scopeId?: string })?.__scopeId
  if (__scopeId) {
    scopeId = __scopeId
  }
}

async function attachAttr() {
  await nextTick()
  // 取到 svg dom
  const cpt = svgRef.value
  if (!cpt)
    return
  const svg = cpt.$el as Element | undefined
  if (!(svg instanceof Element))
    return

  // 由于svg不在vue_template里,所以初始没有添加样式隔离,需要手动给svg和所有子dom添加 data-v-hash
  if (scopeId) {
    svg.setAttribute(scopeId, '')
    svg.querySelectorAll('*').forEach((element) => {
      element.setAttribute(scopeId, '')
    })
  }
}

watch(
  () => props.name,
  async () => {
    await nextTick()
    attachAttr()
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <component :is="currentComponent" v-if="currentComponent" ref="svgRef" v-bind="$attrs" class="svg-raw" :name="name" />
</template>

<style scoped>
svg,
path {
  transition: fill 250ms;
  width: 100%;
  height: 100%;
}
</style>
