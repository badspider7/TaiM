<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="page-heading">
    <h1>{{ title }}</h1>
    <div v-if="$slots.actions" class="page-actions">
      <slot name="actions" />
    </div>
  </div>
</template>
