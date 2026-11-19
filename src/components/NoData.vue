<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

withDefaults(defineProps<{ title?: string, description?: string }>(), { title: '暂无数据' })
</script>

<template>
  <div class="surface no-data">
    <Inbox :size="24" aria-hidden="true" />
    <p class="font-medium text-foreground">
      {{ title }}
    </p>
    <p v-if="description">
      {{ description }}
    </p>
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  margin-block: 12px;
  padding: 24px 16px;
  text-align: center;
  color: hsl(var(--muted-foreground));
}
</style>
