<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })
const props = defineProps<{
  label: string
  options: readonly { value: string, label: string, disabled?: boolean }[]
  disabled?: boolean
  placeholder?: string
  class?: HTMLAttributes['class']
}>()
const emit = defineEmits<{ change: [value: string] }>()
const model = defineModel<string>({ required: true })
function update(value: string) {
  model.value = value
  emit('change', value)
}
</script>

<template>
  <Select :model-value="model" :disabled="disabled" @update:model-value="update">
    <SelectTrigger v-bind="$attrs" :aria-label="label" :class="cn('w-[160px] max-w-full gap-3', props.class)">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">
        {{ option.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
