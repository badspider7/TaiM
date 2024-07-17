<script setup lang="ts">
import Header from '@/components/layout/Header.vue'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Header />
  <router-view />
  <Button>Click me</Button>
</template>

<style lang="scss" scoped></style>
