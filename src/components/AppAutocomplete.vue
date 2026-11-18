<script setup lang="ts">
import { ComboboxAnchor, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport } from 'radix-vue'

defineOptions({ inheritAttrs: false })
defineProps<{ label: string, options: string[], disabled?: boolean, placeholder?: string }>()
const model = defineModel<string>({ required: true })
function choose(value: unknown) {
  if (typeof value === 'string')
    model.value = value
}
</script>

<template>
  <ComboboxRoot v-model:search-term="model" :disabled="disabled" :reset-search-term-on-blur="false" @update:model-value="choose">
    <ComboboxAnchor>
      <ComboboxInput v-bind="$attrs" :aria-label="label" :placeholder="placeholder" :disabled="disabled" autocomplete="off" class="w-[280px] max-w-full" />
    </ComboboxAnchor>
    <ComboboxPortal>
      <ComboboxContent position="popper" :side-offset="4" class="z-50 w-[--radix-combobox-trigger-width] max-w-[calc(100vw-32px)] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md">
        <ComboboxViewport class="max-h-60 overflow-y-auto p-1">
          <ComboboxItem v-for="option in options" :key="option" :value="option" class="cursor-default select-none rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
            {{ option }}
          </ComboboxItem>
          <ComboboxEmpty class="px-3 py-2 text-sm text-muted-foreground">
            可直接输入应用名称或完整路径
          </ComboboxEmpty>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
