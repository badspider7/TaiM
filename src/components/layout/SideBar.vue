<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DEFAULT_DISPLAY_SIDEBAR } from '@/const'

const sideBarList = DEFAULT_DISPLAY_SIDEBAR
const route = useRoute()
const activeMenuName = computed(() => route.name === 'website-help' ? 'websites' : route.name)
</script>

<template>
  <nav class="sidebar-wrap" aria-label="主导航">
    <ul class="sidebar-list">
      <li v-for="item in sideBarList" :key="item.path">
        <router-link :to="item.path" class="sidebar-link" :class="{ 'is-active': activeMenuName === item.name }">
          <svg-icon :name="item.icon" class="sidebar-icon" aria-hidden="true" />
          <span class="sidebar-title">{{ item.name === 'detail' ? '应用' : item.title }}</span>
        </router-link>
      </li>
    </ul>
    <router-link to="/setting" class="sidebar-link" :class="{ 'is-active': activeMenuName === 'setting' }">
      <svg-icon name="setting" class="sidebar-icon" aria-hidden="true" />
      <span class="sidebar-title">设置</span>
    </router-link>
  </nav>
</template>

<style scoped>
.sidebar-wrap,
.sidebar-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sidebar-wrap {
  justify-content: space-between;
  overflow-y: auto;
  padding: 14px 8px;
  border-right: 1px solid hsl(var(--border));
  background-color: hsl(var(--card));
}

.sidebar-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 52px;
  min-height: 48px;
  border-radius: var(--radius);
  color: hsl(var(--muted-foreground));
}

.sidebar-link:hover {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}

.sidebar-link.is-active {
  background-color: hsl(var(--primary) / 0.12);
  box-shadow: inset 3px 0 0 hsl(var(--primary));
  color: hsl(var(--foreground));
}

.sidebar-link:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: -2px;
}

.sidebar-icon {
  width: 20px;
  height: 20px;
}

.sidebar-icon:not([fill="none"]) {
  fill: currentColor;
}

.sidebar-title {
  font-size: 12px;
}

@media (min-width: 920px) {
  .sidebar-wrap { padding: 16px 12px; }
  .sidebar-link {
    flex-direction: row;
    justify-content: flex-start;
    gap: 10px;
    width: 120px;
    min-height: 40px;
    padding: 0 12px;
  }
  .sidebar-title { font-size: 14px; }
}
</style>
