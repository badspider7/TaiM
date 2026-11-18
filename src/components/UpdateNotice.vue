<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUpdates } from '@/store/updates'

const updates = useUpdates()
const router = useRouter()
const dismissed = ref('')
const visible = computed(() => ['available', 'downloaded'].includes(updates.state.phase)
  && dismissed.value !== `${updates.state.availableVersion}/${updates.state.phase}`)
function dismiss() {
  dismissed.value = `${updates.state.availableVersion}/${updates.state.phase}`
}
</script>

<template>
  <aside v-if="visible" class="update-notice" role="status">
    <div>
      <strong>{{ updates.state.phase === 'downloaded' ? '更新已准备就绪' : '发现新版本' }}</strong>
      <p class="text-sm text-muted-foreground">
        TaiM {{ updates.state.availableVersion }}
      </p>
    </div>
    <button class="action-button" @click="router.push('/setting?tab=about')">
      查看更新
    </button>
    <button class="action-button" aria-label="暂时关闭更新提示" @click="dismiss">
      稍后
    </button>
  </aside>
</template>

<style scoped>
.update-notice {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  background: hsl(var(--card));
  box-shadow: 0 8px 32px #0002;
}
</style>
